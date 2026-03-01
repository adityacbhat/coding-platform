import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const difficulty = searchParams.getAll('difficulty');
  const concepts = searchParams.getAll('concept');
  const companies = searchParams.getAll('company');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sortBy') || 'id';
  const sortOrder = searchParams.get('sortOrder') || 'asc';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  const where: Record<string, unknown> = {};

  if (difficulty.length > 0) {
    where.difficulty = { in: difficulty };
  }

  if (concepts.length > 0) {
    where.concepts = {
      some: {
        concept: {
          slug: { in: concepts },
        },
      },
    };
  }

  if (companies.length > 0) {
    where.companies = {
      some: {
        company: {
          slug: { in: companies },
        },
      },
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy: Record<string, string> = {};
  if (sortBy === 'title') {
    orderBy.title = sortOrder;
  } else if (sortBy === 'difficulty') {
    orderBy.difficulty = sortOrder;
  } else {
    orderBy.id = sortOrder;
  }

  const [problems, total] = await Promise.all([
    prisma.problem.findMany({
      where,
      include: {
        concepts: {
          include: {
            concept: {
              select: { slug: true, title: true },
            },
          },
        },
        companies: {
          include: {
            company: {
              select: { slug: true, name: true },
            },
          },
        },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.problem.count({ where }),
  ]);

  const formattedProblems = problems.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty,
    concepts: p.concepts.map((pc) => pc.concept),
    companies: p.companies.map((pc) => pc.company),
  }));

  return NextResponse.json({
    problems: formattedProblems,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
