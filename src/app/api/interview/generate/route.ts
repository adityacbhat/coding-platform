import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const company = searchParams.get('company');
  const limit = parseInt(searchParams.get('limit') || '5');
  const easyPercent = parseInt(searchParams.get('easy') || '20');
  const mediumPercent = parseInt(searchParams.get('medium') || '60');
  const hardPercent = parseInt(searchParams.get('hard') || '20');

  const where: Prisma.ProblemWhereInput = {};

  if (company) {
    where.companies = {
      some: {
        company: { slug: company },
      },
    };
  }

  const totalPercent = easyPercent + mediumPercent + hardPercent;
  const easyCount = Math.round((easyPercent / totalPercent) * limit);
  const mediumCount = Math.round((mediumPercent / totalPercent) * limit);
  const hardCount = limit - easyCount - mediumCount;

  const [easyProblems, mediumProblems, hardProblems] = await Promise.all([
    prisma.problem.findMany({
      where: { ...where, difficulty: 'Easy' },
      include: {
        concepts: {
          include: {
            concept: { select: { slug: true, title: true } },
          },
        },
        companies: {
          include: {
            company: { select: { slug: true, name: true } },
          },
        },
      },
    }),
    prisma.problem.findMany({
      where: { ...where, difficulty: 'Medium' },
      include: {
        concepts: {
          include: {
            concept: { select: { slug: true, title: true } },
          },
        },
        companies: {
          include: {
            company: { select: { slug: true, name: true } },
          },
        },
      },
    }),
    prisma.problem.findMany({
      where: { ...where, difficulty: 'Hard' },
      include: {
        concepts: {
          include: {
            concept: { select: { slug: true, title: true } },
          },
        },
        companies: {
          include: {
            company: { select: { slug: true, name: true } },
          },
        },
      },
    }),
  ]);

  const shuffle = <T>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const selectedEasy = shuffle(easyProblems).slice(0, easyCount);
  const selectedMedium = shuffle(mediumProblems).slice(0, mediumCount);
  const selectedHard = shuffle(hardProblems).slice(0, hardCount);

  const allProblems = shuffle([...selectedEasy, ...selectedMedium, ...selectedHard]);

  const formattedProblems = allProblems.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty,
    concepts: p.concepts.map((pc) => pc.concept),
    companies: p.companies.map((pc) => pc.company),
  }));

  return NextResponse.json({
    problems: formattedProblems,
    count: formattedProblems.length,
    distribution: {
      easy: selectedEasy.length,
      medium: selectedMedium.length,
      hard: selectedHard.length,
    },
  });
}
