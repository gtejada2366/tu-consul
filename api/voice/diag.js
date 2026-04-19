import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export default async function handler(req, res) {
  const results = {
    env: {
      OPEN_AI_present: !!process.env.OPEN_AI,
      OPENAI_API_KEY_present: !!process.env.OPENAI_API_KEY,
      Anthropic_present: !!process.env.Anthropic,
      ANTHROPIC_API_KEY_present: !!process.env.ANTHROPIC_API_KEY,
    },
    openai: { ok: false, error: null },
    anthropic: { ok: false, error: null },
  };

  const openaiKey = process.env.OPEN_AI || process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const openai = new OpenAI({ apiKey: openaiKey });
      const resp = await openai.models.list();
      results.openai.ok = true;
      results.openai.model_count = resp.data.length;
    } catch (e) {
      results.openai.error = String(e.status || "") + " " + (e.message || e);
    }
  } else {
    results.openai.error = "No key found";
  }

  const anthropicKey = process.env.Anthropic || process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const resp = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 5,
        messages: [{ role: "user", content: "hola" }],
      });
      results.anthropic.ok = true;
      results.anthropic.sample_response = resp.content[0]?.text?.slice(0, 50);
    } catch (e) {
      results.anthropic.error = String(e.status || "") + " " + (e.message || e);
    }
  } else {
    results.anthropic.error = "No key found";
  }

  return res.status(200).json(results);
}
