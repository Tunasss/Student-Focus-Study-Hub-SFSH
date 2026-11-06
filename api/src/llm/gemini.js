// Google Gen AI SDK client.
//   LLM_MOCK=true        -> fixed 5-chapter sample, no network, no quota (src/llm/mockGemini.js)
//   GEMINI_API_KEY set   -> real client
//   otherwise            -> null, the API still boots and syllabus analysis answers 503 LLM_NOT_CONFIGURED
const { GoogleGenAI } = require('@google/genai');
const { createMockGemini } = require('./mockGemini');

function createGeminiClient({ llmMock, geminiApiKey, geminiTimeoutMs }) {
  if (llmMock) return createMockGemini();
  if (!geminiApiKey) return null;
  return new GoogleGenAI({
    apiKey: geminiApiKey,
    apiVersion: 'v1beta',
    httpOptions: { timeout: geminiTimeoutMs },
  });
}

module.exports = { createGeminiClient };
