const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");
const { exec } = require("child_process");
const { createClient } = require("@supabase/supabase-js");

const app  = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(morgan("tiny"));
app.use(express.json());

app.post("/exec", (req, res) => {
  const { cmd } = req.body;
  if (!cmd) return res.status(400).json({ error: "cmd required" });
  exec(cmd, { timeout: 30000 }, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr || String(err) });
    res.json({ output: stdout });
  });
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.post("/supabase-tool", async (req, res) => {
  try {
    const { bucket, prefix = "" } = req.body;
    if (!bucket) return res.status(400).json({ error: "bucket required" });
    const { data, error } = await supabase
      .storage.from(bucket)
      .list(prefix, { limit: 500, offset: 0, sortBy: { column: "name", order: "asc" } });
    if (error) throw error;
    res.json({ success: true, objects: data });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.listen(PORT, () => console.log(`🌐 listening on :${PORT}`));
