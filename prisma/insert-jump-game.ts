/**
 * Safe one-off script — inserts / upserts Jump Game without clearing any existing data.
 * Run with:  npx tsx prisma/insert-jump-game.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('supabase') ? { rejectUnauthorized: false } : false,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Upsert greedy concept ──────────────────────────────────────────────────
  const greedy = await prisma.concept.upsert({
    where:  { slug: 'greedy' },
    update: {},
    create: {
      slug:        'greedy',
      title:       'Greedy',
      description: 'Making the locally optimal choice at each step to arrive at the globally optimal solution.',
      rationale:   'Use when a locally optimal choice at each step leads to a globally optimal solution — common in interval scheduling, jump games, and activity selection.',
      subConcepts: [
        {
          title:       'Forward Greedy',
          description: 'Iterate forward, maintaining a running "best reachable" value that grows as you process each element.',
          example:     'Jump Game (LC 55)',
        },
        {
          title:       'Interval Greedy',
          description: 'Sort intervals by end time and greedily pick the earliest-ending non-overlapping interval.',
          example:     'Non-overlapping Intervals (LC 435)',
        },
      ],
    },
  });

  const dp = await prisma.concept.findUnique({ where: { slug: 'dynamic-programming' } });

  // ── Upsert the problem ─────────────────────────────────────────────────────
  const problem = await prisma.problem.upsert({
    where:  { slug: 'jump-game' },
    update: {},
    create: {
      title:      'Jump Game',
      slug:       'jump-game',
      difficulty: 'Medium',
      description: `You are given an integer array nums. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position.\n\nReturn true if you can reach the last index, or false otherwise.`,
      starterCodePython: `class Solution:
    def canJump(self, nums: List[int]) -> bool:
        # Your code here
        pass`,
      starterCodeJs: `/**
 * @param {number[]} nums
 * @return {boolean}
 */
var canJump = function(nums) {
    // Your code here
};`,
    },
  });

  // ── Upsert test cases (delete existing ones first to avoid dupes) ──────────
  await prisma.testCase.deleteMany({ where: { problemId: problem.id } });

  const testCases = [
    { input: { nums: [2, 3, 1, 1, 4] }, expectedOutput: true,  isHidden: false },
    { input: { nums: [3, 2, 1, 0, 4] }, expectedOutput: false, isHidden: false },
    { input: { nums: [1, 0] },           expectedOutput: true,  isHidden: false },
    { input: { nums: [0] },              expectedOutput: true,  isHidden: false },
    { input: { nums: [0, 1] },           expectedOutput: false, isHidden: true },
    { input: { nums: [1, 1, 0, 1] },     expectedOutput: false, isHidden: true },
    { input: { nums: [2, 0, 0] },        expectedOutput: true,  isHidden: true },
    { input: { nums: [1, 2, 3, 0, 0] },  expectedOutput: true,  isHidden: true },
    { input: { nums: [5, 0, 0, 0, 0] },  expectedOutput: true,  isHidden: true },
    { input: { nums: [1, 0, 0, 0] },     expectedOutput: false, isHidden: true },
  ];

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    await prisma.testCase.create({
      data: {
        problemId:      problem.id,
        input:          tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden:       tc.isHidden,
        orderIndex:     i,
      },
    });
  }

  // ── Link concepts ──────────────────────────────────────────────────────────
  for (const concept of [greedy, dp]) {
    if (!concept) continue;
    await prisma.problemConcept.upsert({
      where:  { problemId_conceptId: { problemId: problem.id, conceptId: concept.id } },
      update: {},
      create: { problemId: problem.id, conceptId: concept.id },
    });
  }

  // ── Link companies ─────────────────────────────────────────────────────────
  for (const slug of ['amazon', 'microsoft', 'google']) {
    const company = await prisma.company.findUnique({ where: { slug } });
    if (!company) continue;
    await prisma.problemCompany.upsert({
      where:  { problemId_companyId: { problemId: problem.id, companyId: company.id } },
      update: {},
      create: { problemId: problem.id, companyId: company.id },
    });
  }

  console.log(`✓ Jump Game inserted (id: ${problem.id})`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
