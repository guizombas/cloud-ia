require("dotenv").config();
const { OpenAI } = require("openai");

const apiKey = process.env.HF_TOKEN;
const model = process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct";
const baseURL = process.env.HF_URL || 'https://router.huggingface.co/v1';

const client = new OpenAI({
	baseURL,
	apiKey,
});

async function callLLM(history, prompt) {
 const response = await client.chat.completions.create({
  model,
  messages: [...history, { role: "user", content: prompt }],
  max_tokens: parseInt(process.env.HF_MAX_NEW_TOKENS) || 256,
  temperature: parseFloat(process.env.HF_TEMPERATURE) || 0.7,
 });

  return response.choices[0].message.content;
}

module.exports = { callLLM };
