const fs = require("fs");
const fetch = require("node-fetch");
const { createClient } = require("@supabase/supabase-js");
const pdfParse = require("pdf-parse");
const { Pinecone } = require("@pinecone-database/pinecone");
const cohere = require("cohere-ai");

// Load environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const COHERE_API_KEY = process.env.COHERE_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX;
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT;

// Check that all required env vars are present
if (!SUPABASE_URL || !SUPABASE_KEY || !COHERE_API_KEY || !PINECONE_API_KEY || !PINECONE_INDEX || !PINECONE_ENVIRONMENT) {
  console.error("❌ Missing one or more required environment variables.");
  process.exit(1);
}

// Init clients
cohere.init(COHERE_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
  environment: PINECONE_ENVIRONMENT
});
const index = pinecone.Index(PINECONE_INDEX);

// Get filename
const FILENAME = process.argv[2];
const LOCAL_PATH = `/tmp/${FILENAME}`;

async function downloadFromSupabase() {
  const { data, error } = await supabase.storage.from("uploads").download(FILENAME);
  if (error) throw new Error("Supabase download failed: " + error.message);

  const buffer = Buffer.from(await data.arrayBuffer());
  fs.writeFileSync(LOCAL_PATH, buffer);
  return LOCAL_PATH;
}

function chunkText(text, maxLen = 1000) {
  const chunks = [];
  let remaining = text.trim();
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, maxLen));
    remaining = remaining.slice(maxLen);
  }
  return chunks;
}

async function embedChunks(chunks) {
  try {
    const result = await cohere.embed({
      texts: chunks,
      model: "embed-english-v3.0",
      input_type: "search_document"
    });
    console.log("🧠 Cohere raw response:", result.body);
    return result.body.embeddings;
  } catch (err) {
    console.error("❌ Cohere embed error:", err.stack || err.message);
    throw err;
  }
}

async function upsertToPinecone(chunks, embeddings) {
  const namespace = FILENAME.replace(/\.[^/.]+$/, "").replace(/[^a-z0-9]/gi, "_");
  const vectors = embeddings.map((embedding, i) => ({
    id: `${FILENAME}-${i}`,
    values: embedding,
    metadata: { text: chunks[i], filename: FILENAME }
  }));
  await index.upsert(vectors, namespace);
}

(async () => {
  try {
    const path = await downloadFromSupabase();
    const data = fs.readFileSync(path);
    const pdf = await pdfParse(data);
    const chunks = chunkText(pdf.text);
    const embeddings = await embedChunks(chunks);
    await upsertToPinecone(chunks, embeddings);
    console.log(`✅ Ingestion complete for ${FILENAME}`);
  } catch (err) {
    console.error("❌ Ingestion failed:", err.stack || err.message);
    process.exit(1);
  }
})();
