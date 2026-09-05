import { z } from "zod";

// Los 5 tipos de contenido "de banco" (una fila por tarjeta/ejercicio) que el
// CMS del Admin puede editar. Todos comparten la misma forma de CRUD, así que
// un solo par de rutas dinámicas (`app/api/admin/content/[type]`) los sirve a
// todos en vez de duplicar 5 handlers casi idénticos.
export const CONTENT_TYPES = {
  vocabulary: {
    prismaModel: "vocabularyCard",
    createSchema: z.object({
      sectionId: z.string().min(1),
      term: z.string().min(1),
      definition: z.string().min(1),
      audioKey: z.string().optional().nullable(),
      imageKey: z.string().optional().nullable(),
      order: z.number().int().optional(),
    }),
  },
  exercise: {
    prismaModel: "exerciseItem",
    createSchema: z.object({
      sectionId: z.string().min(1),
      type: z.enum(["SENTENCE_BUILD", "MULTIPLE_CHOICE", "FILL_BLANK", "LISTENING", "MATCHING"]),
      prompt: z.any(),
      choices: z.any(),
      correctIndex: z.number().int().min(0),
      explanation: z.string().optional().nullable(),
      order: z.number().int().optional(),
    }),
  },
  dialog: {
    prismaModel: "dialogItem",
    createSchema: z.object({
      sectionId: z.string().min(1),
      speaker: z.string().min(1),
      line: z.string().min(1),
      audioKey: z.string().optional().nullable(),
      order: z.number().int().optional(),
    }),
  },
  intonation: {
    prismaModel: "intonationItem",
    createSchema: z.object({
      sectionId: z.string().min(1),
      phrase: z.string().min(1),
      pattern: z.enum(["rising", "falling"]),
      audioKey: z.string().optional().nullable(),
      order: z.number().int().optional(),
    }),
  },
  pronunciation: {
    prismaModel: "pronunciationItem",
    createSchema: z.object({
      sectionId: z.string().min(1),
      word: z.string().min(1),
      ipa: z.string().min(1),
      audioKey: z.string().optional().nullable(),
      order: z.number().int().optional(),
    }),
  },
  comprehension: {
    prismaModel: "comprehensionItem",
    createSchema: z.object({
      sectionId: z.string().min(1),
      audioKey: z.string().optional().nullable(),
      question: z.string().min(1),
      choices: z.any(),
      correctIndex: z.number().int().min(0),
      order: z.number().int().optional(),
    }),
  },
};

export function getContentTypeConfig(type) {
  const config = CONTENT_TYPES[type];
  if (!config) {
    const error = new Error(`Tipo de contenido desconocido: ${type}`);
    error.status = 404;
    throw error;
  }
  return config;
}
