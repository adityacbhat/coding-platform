import { prisma } from './db';
import type { Problem, ProblemListItem, Concept, Company, SubConcept } from './types';

export async function getProblems(): Promise<ProblemListItem[]> {
  const problems = await prisma.problem.findMany({
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
    orderBy: { id: 'asc' },
  });

  return problems.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty as 'Easy' | 'Medium' | 'Hard',
    concepts: p.concepts.map((pc) => pc.concept),
    companies: p.companies.map((pc) => pc.company),
  }));
}

export async function getProblemBySlug(slug: string): Promise<Problem | null> {
  const problem = await prisma.problem.findUnique({
    where: { slug },
    include: {
      testCases: {
        where: { isHidden: false },
        orderBy: { orderIndex: 'asc' },
      },
      concepts: {
        include: {
          concept: {
            select: { id: true, slug: true, title: true },
          },
        },
      },
      companies: {
        include: {
          company: {
            select: { id: true, slug: true, name: true },
          },
        },
      },
    },
  });

  if (!problem) return null;

  return {
    id: problem.id,
    title: problem.title,
    slug: problem.slug,
    difficulty: problem.difficulty as 'Easy' | 'Medium' | 'Hard',
    description: problem.description,
    starterCodePython: problem.starterCodePython,
    starterCodeJs: problem.starterCodeJs,
    constraints: problem.constraints as string[] | null,
    hints: problem.hints as string[] | null,
    concepts: problem.concepts.map((pc) => pc.concept),
    companies: problem.companies.map((pc) => pc.company),
    testCases: problem.testCases.map((tc) => ({
      id: tc.id,
      input: tc.input as Record<string, unknown>,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden,
      orderIndex: tc.orderIndex,
    })),
  };
}

export async function getProblemSlugs(): Promise<string[]> {
  const problems = await prisma.problem.findMany({
    select: { slug: true },
  });
  return problems.map((p) => p.slug);
}

export async function getConcepts(): Promise<Concept[]> {
  const concepts = await prisma.concept.findMany({
    include: {
      _count: {
        select: { problems: true },
      },
    },
    orderBy: { title: 'asc' },
  });

  return concepts.map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    rationale: c.rationale,
    subConcepts: c.subConcepts as SubConcept[] | null,
    problemCount: c._count.problems,
  }));
}

export async function getConceptBySlug(slug: string): Promise<Concept | null> {
  const concept = await prisma.concept.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { problems: true },
      },
    },
  });

  if (!concept) return null;

  return {
    id: concept.id,
    slug: concept.slug,
    title: concept.title,
    description: concept.description,
    rationale: concept.rationale,
    subConcepts: concept.subConcepts as SubConcept[] | null,
    problemCount: concept._count.problems,
  };
}

export async function getConceptSlugs(): Promise<string[]> {
  const concepts = await prisma.concept.findMany({
    select: { slug: true },
  });
  return concepts.map((c) => c.slug);
}

export async function getProblemsByConcept(conceptSlug: string): Promise<ProblemListItem[]> {
  const problems = await prisma.problem.findMany({
    where: {
      concepts: {
        some: {
          concept: { slug: conceptSlug },
        },
      },
    },
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
    orderBy: { id: 'asc' },
  });

  return problems.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty as 'Easy' | 'Medium' | 'Hard',
    concepts: p.concepts.map((pc) => pc.concept),
    companies: p.companies.map((pc) => pc.company),
  }));
}

export async function getCompanies(): Promise<Company[]> {
  const companies = await prisma.company.findMany({
    include: {
      _count: {
        select: { problems: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return companies.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    logoUrl: c.logoUrl,
    problemCount: c._count.problems,
  }));
}

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
  const company = await prisma.company.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { problems: true },
      },
    },
  });

  if (!company) return null;

  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    logoUrl: company.logoUrl,
    problemCount: company._count.problems,
  };
}

export async function getCompanySlugs(): Promise<string[]> {
  const companies = await prisma.company.findMany({
    select: { slug: true },
  });
  return companies.map((c) => c.slug);
}

export async function getProblemsByCompany(companySlug: string): Promise<ProblemListItem[]> {
  const problems = await prisma.problem.findMany({
    where: {
      companies: {
        some: {
          company: { slug: companySlug },
        },
      },
    },
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
    orderBy: { id: 'asc' },
  });

  return problems.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    difficulty: p.difficulty as 'Easy' | 'Medium' | 'Hard',
    concepts: p.concepts.map((pc) => pc.concept),
    companies: p.companies.map((pc) => pc.company),
  }));
}

export async function getStats() {
  const [problemCount, conceptCount, companyCount] = await Promise.all([
    prisma.problem.count(),
    prisma.concept.count(),
    prisma.company.count(),
  ]);

  const difficultyStats = await prisma.problem.groupBy({
    by: ['difficulty'],
    _count: true,
  });

  return {
    totalProblems: problemCount,
    totalConcepts: conceptCount,
    totalCompanies: companyCount,
    byDifficulty: {
      Easy: difficultyStats.find((d) => d.difficulty === 'Easy')?._count ?? 0,
      Medium: difficultyStats.find((d) => d.difficulty === 'Medium')?._count ?? 0,
      Hard: difficultyStats.find((d) => d.difficulty === 'Hard')?._count ?? 0,
    },
  };
}
