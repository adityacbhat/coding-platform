/**
 * Problem Import Script
 * 
 * This script imports problems from JSON or CSV files into the database.
 * 
 * Usage:
 *   npx tsx scripts/import-problems.ts <file-path> [options]
 * 
 * Options:
 *   --format=json|csv  Specify input format (default: auto-detect from extension)
 *   --dry-run          Preview changes without saving to database
 *   --update           Update existing problems instead of skipping
 * 
 * JSON Format:
 * [
 *   {
 *     "title": "Two Sum",
 *     "slug": "two-sum",
 *     "difficulty": "Easy",
 *     "description": "Given an array of integers...",
 *     "starterCodePython": "class Solution:\n    def twoSum(self, nums, target):\n        pass",
 *     "starterCodeJs": "var twoSum = function(nums, target) {\n};",
 *     "concepts": ["hashing", "arrays"],
 *     "companies": ["google", "amazon"],
 *     "testCases": [
 *       { "input": { "nums": [2,7,11,15], "target": 9 }, "expectedOutput": [0,1], "isHidden": false }
 *     ],
 *     "constraints": ["2 <= nums.length <= 10^4"],
 *     "hints": ["Try using a hash map"]
 *   }
 * ]
 * 
 * CSV Format:
 * title,slug,difficulty,description,concepts,companies
 * "Two Sum","two-sum","Easy","Given an array...","hashing,arrays","google,amazon"
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type ProblemInput = {
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  starterCodePython: string;
  starterCodeJs?: string;
  concepts?: string[];
  companies?: string[];
  testCases?: {
    input: Record<string, unknown>;
    expectedOutput: unknown;
    isHidden?: boolean;
  }[];
  constraints?: string[];
  hints?: string[];
  frequency?: number;
  acceptance?: number;
};

async function importFromJson(filePath: string): Promise<ProblemInput[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

async function importFromCsv(filePath: string): Promise<ProblemInput[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return [];
  }

  const headers = parseCSVLine(lines[0]);
  const problems: ProblemInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() || '';
    });

    if (row.title && row.slug && row.difficulty) {
      problems.push({
        title: row.title,
        slug: row.slug,
        difficulty: row.difficulty as 'Easy' | 'Medium' | 'Hard',
        description: row.description || '',
        starterCodePython: row.starterCodePython || generateDefaultStarterCode(row.slug, 'python'),
        starterCodeJs: row.starterCodeJs || undefined,
        concepts: row.concepts ? row.concepts.split(',').map(c => c.trim()) : [],
        companies: row.companies ? row.companies.split(',').map(c => c.trim()) : [],
      });
    }
  }

  return problems;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

function generateDefaultStarterCode(slug: string, language: 'python' | 'javascript'): string {
  const functionName = slug.replace(/-/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  
  if (language === 'python') {
    return `class Solution:
    def ${functionName}(self):
        # Your code here
        pass`;
  }
  
  return `/**
 * @return {any}
 */
var ${functionName} = function() {
    // Your code here
};`;
}

async function ensureConceptExists(slug: string): Promise<number> {
  let concept = await prisma.concept.findUnique({ where: { slug } });
  
  if (!concept) {
    const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    concept = await prisma.concept.create({
      data: {
        slug,
        title,
        description: `Problems related to ${title}`,
      },
    });
    console.log(`  Created new concept: ${title}`);
  }
  
  return concept.id;
}

async function ensureCompanyExists(slug: string): Promise<number> {
  let company = await prisma.company.findUnique({ where: { slug } });
  
  if (!company) {
    const name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    company = await prisma.company.create({
      data: {
        slug,
        name,
      },
    });
    console.log(`  Created new company: ${name}`);
  }
  
  return company.id;
}

async function importProblems(
  problems: ProblemInput[], 
  options: { dryRun: boolean; update: boolean }
) {
  console.log(`\nImporting ${problems.length} problems...`);
  
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const problem of problems) {
    const existing = await prisma.problem.findUnique({ where: { slug: problem.slug } });

    if (existing && !options.update) {
      console.log(`  Skipping existing: ${problem.title}`);
      skipped++;
      continue;
    }

    if (options.dryRun) {
      console.log(`  [DRY RUN] Would ${existing ? 'update' : 'create'}: ${problem.title}`);
      if (existing) updated++;
      else created++;
      continue;
    }

    if (existing) {
      await prisma.problem.update({
        where: { slug: problem.slug },
        data: {
          title: problem.title,
          difficulty: problem.difficulty,
          description: problem.description,
          starterCodePython: problem.starterCodePython,
          starterCodeJs: problem.starterCodeJs,
          constraints: problem.constraints,
          hints: problem.hints,
          frequency: problem.frequency,
          acceptance: problem.acceptance,
        },
      });

      if (problem.testCases && problem.testCases.length > 0) {
        await prisma.testCase.deleteMany({ where: { problemId: existing.id } });
        for (let i = 0; i < problem.testCases.length; i++) {
          const tc = problem.testCases[i];
          await prisma.testCase.create({
            data: {
              problemId: existing.id,
              input: tc.input as object,
              expectedOutput: tc.expectedOutput as object,
              isHidden: tc.isHidden ?? false,
              orderIndex: i,
            },
          });
        }
      }

      if (problem.concepts && problem.concepts.length > 0) {
        await prisma.problemConcept.deleteMany({ where: { problemId: existing.id } });
        for (const conceptSlug of problem.concepts) {
          const conceptId = await ensureConceptExists(conceptSlug);
          await prisma.problemConcept.create({
            data: {
              problemId: existing.id,
              conceptId,
            },
          });
        }
      }

      if (problem.companies && problem.companies.length > 0) {
        await prisma.problemCompany.deleteMany({ where: { problemId: existing.id } });
        for (const companySlug of problem.companies) {
          const companyId = await ensureCompanyExists(companySlug);
          await prisma.problemCompany.create({
            data: {
              problemId: existing.id,
              companyId,
            },
          });
        }
      }

      console.log(`  Updated: ${problem.title}`);
      updated++;
    } else {
      const newProblem = await prisma.problem.create({
        data: {
          title: problem.title,
          slug: problem.slug,
          difficulty: problem.difficulty,
          description: problem.description,
          starterCodePython: problem.starterCodePython,
          starterCodeJs: problem.starterCodeJs,
          constraints: problem.constraints,
          hints: problem.hints,
          frequency: problem.frequency,
          acceptance: problem.acceptance,
        },
      });

      if (problem.testCases) {
        for (let i = 0; i < problem.testCases.length; i++) {
          const tc = problem.testCases[i];
          await prisma.testCase.create({
            data: {
              problemId: newProblem.id,
              input: tc.input as object,
              expectedOutput: tc.expectedOutput as object,
              isHidden: tc.isHidden ?? false,
              orderIndex: i,
            },
          });
        }
      }

      if (problem.concepts) {
        for (const conceptSlug of problem.concepts) {
          const conceptId = await ensureConceptExists(conceptSlug);
          await prisma.problemConcept.create({
            data: {
              problemId: newProblem.id,
              conceptId,
            },
          });
        }
      }

      if (problem.companies) {
        for (const companySlug of problem.companies) {
          const companyId = await ensureCompanyExists(companySlug);
          await prisma.problemCompany.create({
            data: {
              problemId: newProblem.id,
              companyId,
            },
          });
        }
      }

      console.log(`  Created: ${problem.title}`);
      created++;
    }
  }

  console.log(`\nImport complete:`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Problem Import Script

Usage:
  npx tsx scripts/import-problems.ts <file-path> [options]

Options:
  --format=json|csv  Specify input format (default: auto-detect)
  --dry-run          Preview changes without saving
  --update           Update existing problems

Example:
  npx tsx scripts/import-problems.ts problems.json
  npx tsx scripts/import-problems.ts leetcode.csv --format=csv --dry-run
`);
    process.exit(0);
  }

  const filePath = args.find(arg => !arg.startsWith('--'));
  
  if (!filePath) {
    console.error('Error: No file path provided');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const options = {
    dryRun: args.includes('--dry-run'),
    update: args.includes('--update'),
  };

  const formatArg = args.find(arg => arg.startsWith('--format='));
  let format = formatArg?.split('=')[1] || path.extname(filePath).slice(1);

  console.log(`Importing from: ${filePath}`);
  console.log(`Format: ${format}`);
  console.log(`Options: ${JSON.stringify(options)}`);

  let problems: ProblemInput[];

  if (format === 'json') {
    problems = await importFromJson(filePath);
  } else if (format === 'csv') {
    problems = await importFromCsv(filePath);
  } else {
    console.error(`Error: Unsupported format: ${format}`);
    process.exit(1);
  }

  await importProblems(problems, options);
}

main()
  .catch((e) => {
    console.error('Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
