import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

const OPENAI_KEY = process.env.OPENAI_API_KEY;

app.post("/run-shell-tool", async (req, res) => {
  try {
    const { run_id, thread_id, tool_outputs } = req.body;

    const { cmd } = JSON.parse(tool_outputs[0].function.arguments);
    console.log("🔁 Received command from OpenAI:", cmd);

    const execRes = await fetch("https://mvpcai-cloud.onrender.com/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cmd })
    });

    const { output } = await execRes.json();
    console.log("✅ Shell result:", output);

    const tool_call_id = tool_outputs[0].id;

    const submitRes = await fetch(`https://api.openai.com/v1/threads/${thread_id}/runs/${run_id}/submit_tool_outputs`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2"
      },
      body: JSON.stringify({
        tool_outputs: [
          {
            tool_call_id,
            output
          }
        ]
      })
    });

    const data = await submitRes.json();
    console.log("📤 Submitted tool output:", data);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Tool relay error:", err);
    res.status(500).json({ error: "Execution failed", detail: err.message });
  }
});

// ✅ Proper Render port binding
const PORT = parseInt(process.env.PORT || "3000", 10);
console.log("🌐 Using port:", PORT);
app.listen(PORT, () => {
  console.log(`🚀 Tool relay server listening on port ${PORT}`);
});
