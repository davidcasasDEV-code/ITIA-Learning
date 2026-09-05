import { z } from "zod";
import { getContext } from "@/lib/context";
import { jsonError, parseJson } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const LEVEL_ORDER = ["BASIC", "MEDIUM", "ADVANCED"];

export async function GET(req) {
  try {
    await getContext(req);
    const questions = await prisma.placementQuestion.findMany({ orderBy: { order: "asc" } });

    // No se manda `correctIndex` al cliente para que no se pueda hacer trampa
    // leyendo la respuesta de red antes de contestar.
    return Response.json(
      questions.map((q) => ({ id: q.id, prompt: q.prompt, choices: q.choices }))
    );
  } catch (error) {
    return jsonError(error, error.status || 500);
  }
}

const submitSchema = z.object({
  answers: z.array(z.object({ questionId: z.string(), selectedIndex: z.number().int().min(0) })).min(1),
});

export async function POST(req) {
  try {
    const ctx = await getContext(req);
    const body = await parseJson(req, submitSchema);

    const questions = await prisma.placementQuestion.findMany({
      where: { id: { in: body.answers.map((a) => a.questionId) } },
    });
    const questionById = Object.fromEntries(questions.map((q) => [q.id, q]));

    // El nivel recomendado es el más alto en el que el usuario acertó al
    // menos una pregunta (progresivo: si acierta una de Advanced, se le
    // recomienda Advanced aunque falle alguna de Basic).
    let highestCorrectLevelIndex = -1;
    const gradedAnswers = body.answers.map((answer) => {
      const question = questionById[answer.questionId];
      const correct = question ? question.correctIndex === answer.selectedIndex : false;
      if (correct && question) {
        highestCorrectLevelIndex = Math.max(highestCorrectLevelIndex, LEVEL_ORDER.indexOf(question.weight));
      }
      return { ...answer, correct };
    });

    const recommendedLevel = LEVEL_ORDER[Math.max(highestCorrectLevelIndex, 0)];

    const attempt = await prisma.placementTestAttempt.create({
      data: {
        userId: ctx.userId,
        answers: gradedAnswers,
        recommendedLevel,
      },
    });

    return Response.json(attempt);
  } catch (error) {
    return jsonError(error, error.status || 500);
  }
}
