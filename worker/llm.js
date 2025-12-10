require("dotenv").config();
const axios = require("axios");

async function callLLM(prompt) {
  const model = process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct";
  const token = process.env.HF_TOKEN;
  const url = `https://api-inference.huggingface.co/models/${model}`;

  const headers = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  const data = {
    inputs: prompt,
    parameters: { // -------------- precisa ajustar dependendo do modelo --------------
      max_new_tokens: process.env.HF_MAX_NEW_TOKENS ? parseInt(process.env.HF_MAX_NEW_TOKENS) : 128,
      temperature: process.env.HF_TEMPERATURE ? parseFloat(process.env.HF_TEMPERATURE) : 0.7,
      do_sample: true
    }
  };

  const resp = await axios.post(url, data, { headers, timeout: 120000 });
  const result = resp.data;

  if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
    return result[0].generated_text;
  } else if (typeof result === "object" && result.generated_text) {
    return result.generated_text;
  } else {
    throw new Error("Unexpected response from Hugging Face Inference API: " + JSON.stringify(result));
  }
}

module.exports = { callLLM };
