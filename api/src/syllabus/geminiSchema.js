// WBS 2.2.2 — the fixed JSON contract between Gemini and the API.
//
// 1. `responseSchema` is sent to Gemini together with responseMimeType = "application/json"
//    (Gemini's OpenAPI-style schema; `Type` values are upper-case, otherwise identical to the PRD sample).
// 2. `syllabusOutputSchema` (zod) re-checks what comes back before anything reaches the client:
//    the model is told the schema, but the API never trusts it.

const { Type } = require('@google/genai');
const { z } = require('zod');

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    course_code: {
      type: Type.STRING,
      description: 'Course code as printed in the syllabus, e.g. CS101 or MATH 201. Empty string if none.',
    },
    topics: {
      type: Type.ARRAY,
      description: 'Chapters / units / topics of the course in syllabus order. Skip grading, policies, staff and schedule.',
      items: {
        type: Type.OBJECT,
        properties: {
          order: { type: Type.INTEGER, description: '1-based position in the syllabus' },
          title: { type: Type.STRING, description: 'Short topic title, as written in the syllabus' },
          description: { type: Type.STRING, description: 'One sentence on what the topic covers (optional)' },
        },
        required: ['order', 'title'],
        propertyOrdering: ['order', 'title', 'description'],
      },
    },
  },
  required: ['topics'],
  propertyOrdering: ['course_code', 'topics'],
};

const LIMITS = Object.freeze({ maxTopics: 100, titleMax: 255, descriptionMax: 1000 });

const text = (max) => z.string().trim().max(max);

// Raw model output. Mirrors responseSchema; `description` may be missing or empty.
const syllabusOutputSchema = z
  .object({
    course_code: z.string().trim().optional(),
    topics: z
      .array(
        z.object({
          order: z.int().nonnegative(),
          title: text(LIMITS.titleMax).min(1),
          description: text(LIMITS.descriptionMax).optional(),
        }),
      )
      .max(LIMITS.maxTopics),
  })
  .passthrough();

module.exports = { responseSchema, syllabusOutputSchema, LIMITS };
