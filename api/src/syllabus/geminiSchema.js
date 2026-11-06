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
    chapters: {
      type: Type.ARRAY,
      description: 'Ordered list of chapters or lecture modules in the course. Each chapter contains key subtopics.',
      items: {
        type: Type.OBJECT,
        properties: {
          order: { type: Type.INTEGER, description: '1-based position of the chapter' },
          title: { type: Type.STRING, description: 'Chapter title (e.g. "Chương 1: Tổng quan" or "Chapter 1: Intro")' },
          description: { type: Type.STRING, description: 'Brief summary of the chapter' },
          source_file: { type: Type.STRING, description: 'Original file name if provided, else empty string' },
          subtopics: {
            type: Type.ARRAY,
            description: 'Key sections, concepts, or subtopics within this chapter (3 to 6 items)',
            items: {
              type: Type.OBJECT,
              properties: {
                order: { type: Type.INTEGER, description: '1-based position within the chapter' },
                title: { type: Type.STRING, description: 'Subtopic title or section name' },
                description: { type: Type.STRING, description: 'Short detail of what this subtopic covers' },
              },
              required: ['order', 'title'],
              propertyOrdering: ['order', 'title', 'description'],
            },
          },
        },
        required: ['order', 'title', 'subtopics'],
        propertyOrdering: ['order', 'title', 'description', 'source_file', 'subtopics'],
      },
    },
  },
  required: ['chapters'],
  propertyOrdering: ['course_code', 'chapters'],
};

const LIMITS = Object.freeze({ maxChapters: 100, maxSubtopics: 50, titleMax: 255, descriptionMax: 1000 });

const text = (max) => z.string().trim().max(max);

const subtopicSchema = z.object({
  order: z.int().nonnegative().optional(),
  title: text(LIMITS.titleMax).min(1),
  description: text(LIMITS.descriptionMax).optional().nullable(),
});

const chapterSchema = z.object({
  order: z.int().nonnegative().optional(),
  title: text(LIMITS.titleMax).min(1),
  description: text(LIMITS.descriptionMax).optional().nullable(),
  source_file: text(LIMITS.titleMax).optional().nullable(),
  subtopics: z.array(subtopicSchema).max(LIMITS.maxSubtopics).default([]),
});

const syllabusOutputSchema = z.preprocess(
  (val) => {
    if (val && typeof val === 'object' && !val.chapters && Array.isArray(val.topics)) {
      return {
        ...val,
        chapters: val.topics.map((t) => ({
          order: t.order,
          title: t.title,
          description: t.description,
          source_file: null,
          subtopics: [],
        })),
      };
    }
    return val;
  },
  z
    .object({
      course_code: z.string().trim().optional().nullable(),
      chapters: z.array(chapterSchema).max(LIMITS.maxChapters),
    })
    .passthrough(),
);

module.exports = { responseSchema, syllabusOutputSchema, LIMITS };
