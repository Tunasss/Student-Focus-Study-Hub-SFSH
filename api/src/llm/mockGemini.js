// WBS 2.2.3 — LLM mock mode (LLM_MOCK=true).
//
// A drop-in for the @google/genai client that answers every generateContent call at once with a fixed
// syllabus of 5 chapters, so the UI can be developed and tested offline without spending Gemini quota.
// It goes through the same JSON parsing + zod validation as a real reply.

const MOCK_SYLLABUS = Object.freeze({
  course_code: 'CS101',
  chapters: [
    {
      order: 1,
      title: 'Chapter 1: Introduction to Programming',
      description: 'What programs are, the development cycle, first program.',
      source_file: 'Chapter_01.pdf',
      subtopics: [
        { order: 1, title: 'What is Programming?', description: 'Concept of code and machine execution.' },
        { order: 2, title: 'The Compilation & Execution Cycle', description: 'Compilers, interpreters, and runtime.' },
        { order: 3, title: 'Writing Your First Hello World', description: 'Basic syntax and running the first application.' },
      ],
    },
    {
      order: 2,
      title: 'Chapter 2: Variables, Types and Expressions',
      description: 'Primitive types, declarations, operators and type conversion.',
      source_file: 'Chapter_02.pdf',
      subtopics: [
        { order: 1, title: 'Primitive Data Types', description: 'Integers, floats, booleans, and strings.' },
        { order: 2, title: 'Variable Declarations & Scope', description: 'Constants vs variables and lifetimes.' },
        { order: 3, title: 'Arithmetic & Logical Operators', description: 'Expressions and precedence rules.' },
      ],
    },
    {
      order: 3,
      title: 'Chapter 3: Control Flow',
      description: 'Conditionals, loops, and structured problem solving.',
      source_file: 'Chapter_03.pdf',
      subtopics: [
        { order: 1, title: 'If-Else Conditionals', description: 'Branching logic and switch statements.' },
        { order: 2, title: 'While & For Loops', description: 'Iteration patterns and loop boundaries.' },
        { order: 3, title: 'Break, Continue & Return', description: 'Exiting loop structures safely.' },
      ],
    },
    {
      order: 4,
      title: 'Chapter 4: Functions and Recursion',
      description: 'Defining and calling functions, scope, recursion basics.',
      source_file: 'Chapter_04.pdf',
      subtopics: [
        { order: 1, title: 'Function Definitions & Parameters', description: 'Arguments, return values, and purity.' },
        { order: 2, title: 'Call Stack & Variable Lifetime', description: 'Stack frames and local scope.' },
        { order: 3, title: 'Recursion Fundamentals', description: 'Base cases and recursive formulation.' },
      ],
    },
    {
      order: 5,
      title: 'Chapter 5: Arrays and Collections',
      description: 'Arrays, lists, dictionaries and common algorithms.',
      source_file: 'Chapter_05.pdf',
      subtopics: [
        { order: 1, title: 'Fixed Arrays & Dynamic Lists', description: 'Memory layout and index access.' },
        { order: 2, title: 'Hash Tables & Key-Value Maps', description: 'Dictionary lookups and collisions.' },
        { order: 3, title: 'Linear Search & Binary Search', description: 'Searching algorithms and complexity.' },
      ],
    },
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
