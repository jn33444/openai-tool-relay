import express from "express";
import cors    from "cors";
import morgan  from "morgan";
import { exec } from "child_process";
import dotenv  from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("tiny"));

app.get("/", (_, res) => res.send("OK"));

app.post("/exec", (req, res) => {
  const { cmd } = req.body || {};
  if (!cmd) return res.status(400).json({ error: "cmd required" });

  exec(cmd, { shell: "/bin/bash" }, (err, stdout, stderr) => {
    if (err) return res.status(500).json({ error: stderr || err.message });
    res.json({ output: stdout });
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Relay listening on ${PORT}`));
