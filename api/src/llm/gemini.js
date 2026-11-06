// Google Gen AI SDK client. Returns null when GEMINI_API_KEY is not set, so the API still boots
// (syllabus analysis then answers 503 LLM_NOT_CONFIGURED).
const { GoogleGenAI } = require('@google/genai');

function createGeminiClient({ geminiApiKey, geminiTimeoutMs }) {
  if (!geminiApiKey) return null;
  return new GoogleGenAI({ apiKey: geminiApiKey, httpOptions: { timeout: geminiTimeoutMs } });
}

module.exports = { createGeminiClient };
