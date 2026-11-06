// WBS 2.2.3 — LLM mock mode (LLM_MOCK=true).
//
// A drop-in for the @google/genai client that answers every generateContent call at once with a fixed
// syllabus of 5 chapters, so the UI can be developed and tested offline without spending Gemini quota.
// It goes through the same JSON parsing + zod validation as a real reply.

const MOCK_SYLLABUS = Object.freeze({
  course_code: 'CS101',
  topics: [
    { order: 1, title: 'Chapter 1: Introduction to Programming', description: 'What programs are, the development cycle, first program.' },
    { order: 2, title: 'Chapter 2: Variables, Types and Expressions', description: 'Primitive types, declarations, operators and type conversion.' },
    { order: 3, title: 'Chapter 3: Control Flow', description: 'Conditionals, loops, and structured problem solving.' },
    { order: 4, title: 'Chapter 4: Functions and Recursion', description: 'Defining and calling functions, scope, recursion basics.' },
    { order: 5, title: 'Chapter 5: Arrays and Collections', description: 'Arrays, lists, dictionaries and common algorithms.' },
  ],
});

function createMockGemini() {
  const calls = [];
  return {
    isMock: true,
    calls,
    models: {
      async generateContent(request) {
        calls.push(request);
        return { text: JSON.stringify(MOCK_SYLLABUS) };
      },
    },
  };
}

module.exports = { MOCK_SYLLABUS, createMockGemini };
