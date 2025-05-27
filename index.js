import express from "express";
import cors     from "cors";
import morgan   from "morgan";
import dotenv   from "dotenv";
import fetch    from "node-fetch";

dotenv.config();

const {
  SUPABASE_URL,
  SUPABASE_KEY,
  COHERE_API_KEY,
  PINECONE_API_KEY,
  PINECONE_ENVIRONMENT,
  PINECONE_INDEX,
  OPENAI_API_KEY,
  ASSISTANT_ID
} = process.env;

const app = express();
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));

app.post("/chat", async (req, res) => {
  try {
    const userText = req.body.message ?? "";

    /* ---------- add RAG context here later ---------- */

    const ai = await fetch(
      `https://api.openai.com/v1/assistants/${ASSISTANT_ID}/completions`,
      {
        method : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization : `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model : "gpt-4o",
          prompt: userText
        })
      }
    ).then(r => r.json());

    res.json({ reply: ai.choices?.[0]?.message?.content ?? "" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "relay-error" });
  }
});

const PORT = process.env.PORT || 10000;
app.get("/", (_, res) => res.send("OK"));
app.listen(PORT, () => console.log("Relay listening on", PORT));
