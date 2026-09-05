import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LEVELS = [
  { slug: "BASIC", name: "Basic", order: 0 },
  { slug: "MEDIUM", name: "Medium", order: 1 },
  { slug: "ADVANCED", name: "Advanced", order: 2 },
];

const SECTION_TYPES = ["DIALOGS", "VOCABULARY", "EXERCISES", "INTONATION", "PRONUNCIATION", "COMPREHENSION"];

const UNITS_PER_LEVEL = 9;

// Contenido real de Basic / Unidad 1, tomado de las capturas que David
// compartió (vocabulario "Listen and Imitate", profesiones, y el ejercicio de
// construir oraciones con pronombre + nombre + ciudad). El resto de las ~27
// unidades queda como esqueleto (6 secciones vacías) listo para cargarse
// desde el CMS del Admin o en una siguiente sesión de procesamiento de PDF.
const BASIC_UNIT_1_VOCABULARY = [
  { term: "Above", definition: "Opposite of below." },
  { term: "Anyway", definition: "Idiom used for returning or exchanging the subject in a conversation." },
  { term: "Born", definition: "To come into the world by birth." },
  { term: "Financial department", definition: "In a company, the department that controls the money of the company." },
  { term: "Business administration", definition: "Profession: manages ideas, resources and money for a company." },
  { term: "Business man", definition: "Profession: works in business, usually carrying a briefcase to meetings." },
  { term: "Secretary", definition: "Profession: manages calls, calendars and correspondence at a desk." },
  { term: "Sales clerk", definition: "Profession: attends customers and sells products at a store counter." },
  { term: "Sales representative", definition: "Profession: presents products and results to a group of clients." },
  { term: "Physician", definition: "Profession: examines and treats patients." },
  { term: "Accountant", definition: "Profession: keeps track of a company's income and expenses." },
  { term: "Civil engineer", definition: "Profession: plans and supervises construction projects." },
];

const BASIC_UNIT_1_EXERCISES = [
  {
    prompt: {
      examples: [
        { input: "I/Mary/New York", answer: "I'm Mary. I'm from New York." },
        { input: "He/John/Melbourne", answer: "He's John. He's from Melbourne." },
      ],
      question: "I/James/Belfast",
    },
    choices: ["I'm James. He's from Belfast.", "I'm James. I'm from Belfast.", "I'm James. I'm from Mexico."],
    correctIndex: 1,
  },
  {
    prompt: {
      examples: [
        { input: "I/Mary/New York", answer: "I'm Mary. I'm from New York." },
        { input: "He/John/Melbourne", answer: "He's John. He's from Melbourne." },
      ],
      question: "You/Armando/Lima",
    },
    choices: ["He's Armando. You're from Lima.", "You're Armando. You're from Lima.", "You're Armando. He's from Lima."],
    correctIndex: 1,
  },
  {
    prompt: {
      examples: [
        { input: "I/Mary/New York", answer: "I'm Mary. I'm from New York." },
        { input: "He/John/Melbourne", answer: "He's John. He's from Melbourne." },
      ],
      question: "She/Marta/Bogota",
    },
    choices: ["She's Marta. She's from Bogota.", "I'm Marta. She's from Bogota.", "She's Marta. You're from Bogota."],
    correctIndex: 0,
  },
  {
    prompt: {
      examples: [
        { input: "I/Mary/New York", answer: "I'm Mary. I'm from New York." },
        { input: "He/John/Melbourne", answer: "He's John. He's from Melbourne." },
      ],
      question: "We/Carlos and Ana/Toronto",
    },
    choices: [
      "We're Carlos and Ana. We're from Toronto.",
      "They're Carlos and Ana. We're from Toronto.",
      "We're Carlos and Ana. They're from Toronto.",
    ],
    correctIndex: 0,
  },
];

const BASIC_UNIT_1_DIALOG = [
  { speaker: "Recruiter", line: "Hi! What's your name and where are you from?" },
  { speaker: "James", line: "I'm James. I'm from Belfast." },
  { speaker: "Recruiter", line: "Nice to meet you, James. What do you do?" },
  { speaker: "James", line: "I'm a civil engineer." },
];

const BASIC_UNIT_1_INTONATION = [
  { phrase: "Where are you from?", pattern: "rising" },
  { phrase: "I'm from Belfast.", pattern: "falling" },
];

const BASIC_UNIT_1_PRONUNCIATION = [
  { word: "Above", ipa: "/ə.ˈbʌv/" },
  { word: "Anyway", ipa: "/ˈɛn.i.weɪ/" },
  { word: "Born", ipa: "/bɔːrn/" },
];

const BASIC_UNIT_1_COMPREHENSION = [
  {
    question: "Where is James from?",
    choices: ["New York", "Melbourne", "Belfast"],
    correctIndex: 2,
  },
  {
    question: "What is James's profession?",
    choices: ["Civil engineer", "Physician", "Accountant"],
    correctIndex: 0,
  },
];

const PLACEMENT_QUESTIONS = [
  { prompt: "I ___ a teacher.", choices: ["am", "is", "are"], correctIndex: 0, weight: "BASIC", order: 0 },
  { prompt: "What's the plural of 'child'?", choices: ["childs", "children", "childes"], correctIndex: 1, weight: "BASIC", order: 1 },
  { prompt: "She has been living here ___ 2010.", choices: ["since", "for", "from"], correctIndex: 0, weight: "MEDIUM", order: 2 },
  { prompt: "Choose the phrasal verb that means 'to postpone':", choices: ["put off", "put up", "put on"], correctIndex: 0, weight: "MEDIUM", order: 3 },
  { prompt: "If I ___ known, I would have called you.", choices: ["have", "had", "has"], correctIndex: 1, weight: "ADVANCED", order: 4 },
  { prompt: "Were I you, I ___ accept.", choices: ["will", "would", "would have"], correctIndex: 1, weight: "ADVANCED", order: 5 },
];

async function seedPlacementQuestions() {
  const existing = await prisma.placementQuestion.count();
  if (existing > 0) return;

  await prisma.placementQuestion.createMany({ data: PLACEMENT_QUESTIONS });
}

async function seedPlans() {
  await prisma.plan.upsert({
    where: { slug: "basic" },
    update: {},
    create: {
      slug: "basic",
      name: "Plan Basic",
      description: "Curso completo: unidades, exámenes, medallas y minijuegos.",
      priceAmount: 900,
      currency: "usd",
      trialDays: 7,
      includesCinema: false,
      includesTeachers: false,
    },
  });

  await prisma.plan.upsert({
    where: { slug: "pro" },
    update: {},
    create: {
      slug: "pro",
      name: "Plan Pro",
      description: "Todo lo de Basic + Cine con transcripción y citas con maestros.",
      priceAmount: 1900,
      currency: "usd",
      trialDays: 7,
      includesCinema: true,
      includesTeachers: true,
    },
  });
}

async function seedSectionContent(section, unitOrder, levelSlug) {
  const isFlagshipUnit = levelSlug === "BASIC" && unitOrder === 1;
  if (!isFlagshipUnit) return;

  if (section.type === "VOCABULARY") {
    await prisma.vocabularyCard.createMany({
      data: BASIC_UNIT_1_VOCABULARY.map((card, index) => ({
        sectionId: section.id,
        term: card.term,
        definition: card.definition,
        order: index,
      })),
    });
  }

  if (section.type === "EXERCISES") {
    await prisma.exerciseItem.createMany({
      data: BASIC_UNIT_1_EXERCISES.map((exercise, index) => ({
        sectionId: section.id,
        type: "SENTENCE_BUILD",
        prompt: exercise.prompt,
        choices: exercise.choices,
        correctIndex: exercise.correctIndex,
        order: index,
      })),
    });
  }

  if (section.type === "DIALOGS") {
    await prisma.dialogItem.createMany({
      data: BASIC_UNIT_1_DIALOG.map((line, index) => ({ sectionId: section.id, ...line, order: index })),
    });
  }

  if (section.type === "INTONATION") {
    await prisma.intonationItem.createMany({
      data: BASIC_UNIT_1_INTONATION.map((item, index) => ({ sectionId: section.id, ...item, order: index })),
    });
  }

  if (section.type === "PRONUNCIATION") {
    await prisma.pronunciationItem.createMany({
      data: BASIC_UNIT_1_PRONUNCIATION.map((item, index) => ({ sectionId: section.id, ...item, order: index })),
    });
  }

  if (section.type === "COMPREHENSION") {
    await prisma.comprehensionItem.createMany({
      data: BASIC_UNIT_1_COMPREHENSION.map((item, index) => ({
        sectionId: section.id,
        question: item.question,
        choices: item.choices,
        correctIndex: item.correctIndex,
        order: index,
      })),
    });
  }
}

async function seedCurriculum() {
  for (const levelData of LEVELS) {
    const level = await prisma.level.upsert({
      where: { slug: levelData.slug },
      update: { name: levelData.name, order: levelData.order },
      create: levelData,
    });

    for (let unitOrder = 1; unitOrder <= UNITS_PER_LEVEL; unitOrder += 1) {
      const title =
        levelData.slug === "BASIC" && unitOrder === 1
          ? "Unit 1 - Introducing Yourself"
          : `Unit ${unitOrder}`;

      const unit = await prisma.unit.upsert({
        where: { levelId_order: { levelId: level.id, order: unitOrder } },
        update: { title },
        create: { levelId: level.id, title, order: unitOrder },
      });

      for (const type of SECTION_TYPES) {
        const existing = await prisma.section.findUnique({
          where: { unitId_type: { unitId: unit.id, type } },
        });

        if (existing) continue;

        const section = await prisma.section.create({ data: { unitId: unit.id, type } });
        await seedSectionContent(section, unitOrder, levelData.slug);
      }
    }
  }
}

async function main() {
  await seedPlans();
  await seedPlacementQuestions();
  await seedCurriculum();
  console.log("Seed completo: planes + currículo (Basic/Unidad 1 con contenido real) + prueba de nivel.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
