/**
 * LeetCode Scraper Script
 * 
 * Fetches problem data from LeetCode's GraphQL API and outputs JSON
 * compatible with import-problems.ts
 * 
 * Usage:
 *   npx tsx scripts/scrape-leetcode.ts --input <file> [options]
 * 
 * Input file format (one entry per line):
 *   CompanyName,https://leetcode.com/problems/two-sum/
 *   CompanyName,https://leetcode.com/problems/valid-parentheses/
 * 
 * Or just URLs:
 *   https://leetcode.com/problems/two-sum/
 * 
 * Options:
 *   --input=<file>     Input file with URLs (required)
 *   --output=<file>    Output JSON file (default: scripts/data/problems.json)
 *   --delay=<ms>       Delay between requests in ms (default: 2000)
 *   --resume           Resume from failed.json, skip already scraped
 */

import fs from 'fs';
import path from 'path';

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function cleanDescription(html: string): string {
  let text = html;
  
  text = text.replace(/<p><strong>Constraints:<\/strong><\/p>[\s\S]*$/i, '');
  
  text = text.replace(/<pre>([\s\S]*?)<\/pre>/gi, (_, content) => {
    let cleaned = content
      .replace(/<strong>/gi, '')
      .replace(/<\/strong>/gi, '')
      .replace(/<em>/gi, '')
      .replace(/<\/em>/gi, '')
      .replace(/<code>/gi, '')
      .replace(/<\/code>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .trim();
    return `\n<pre>${cleaned}</pre>\n`;
  });
  
  text = text.replace(/<strong>Example\s*(\d+):<\/strong>/gi, '\n**Example $1**\n');
  text = text.replace(/<p><strong>Example\s*(\d+):<\/strong><\/p>/gi, '\n**Example $1**\n');
  
  text = text
    .replace(/<code>([^<]+)<\/code>/gi, '`$1`')
    .replace(/<strong>([^<]+)<\/strong>/gi, '**$1**')
    .replace(/<em>([^<]+)<\/em>/gi, '*$1*')
    .replace(/<sup>([^<]+)<\/sup>/gi, '^$1')
    .replace(/<sub>([^<]+)<\/sub>/gi, '_$1')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<ul>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  
  text = decodeHtmlEntities(text);
  
  text = text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\*\*Input:\*\*/g, 'Input:')
    .replace(/\*\*Output:\*\*/g, 'Output:')
    .replace(/\*\*Explanation:\*\*/g, 'Explanation:')
    .trim();
  
  return text;
}

const QUESTION_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      title
      titleSlug
      difficulty
      content
      topicTags {
        slug
        name
      }
      codeSnippets {
        lang
        langSlug
        code
      }
      hints
      exampleTestcases
    }
  }
`;

type LeetCodeResponse = {
  data: {
    question: {
      title: string;
      titleSlug: string;
      difficulty: string;
      content: string;
      topicTags: { slug: string; name: string }[];
      codeSnippets: { lang: string; langSlug: string; code: string }[] | null;
      hints: string[];
      exampleTestcases: string;
    } | null;
  };
};

type TestCaseOutput = {
  input: Record<string, unknown>;
  expectedOutput: unknown;
  isHidden: boolean;
};

type ProblemOutput = {
  title: string;
  slug: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  starterCodePython: string;
  starterCodeJs?: string;
  concepts: string[];
  companies: string[];
  hints: string[];
  constraints: string[];
  testCases: TestCaseOutput[];
  frequency?: number;
  acceptance?: number;
};

type ScrapeResult = {
  problems: ProblemOutput[];
  failed: { slug: string; company: string; error: string }[];
};

function extractSlugFromUrl(url: string): string | null {
  const match = url.match(/leetcode\.com\/problems\/([^/]+)/);
  return match ? match[1] : null;
}

type InputEntry = {
  slug: string;
  company: string;
  frequency?: number;
  acceptance?: number;
};

function parseInputFile(filePath: string): InputEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  const entries: InputEntry[] = [];
  
  if (lines.length === 0) return entries;
  
  const firstLine = lines[0].toLowerCase();
  const isLeetCodeCsv = firstLine.includes('url') && firstLine.includes('title') && firstLine.includes('difficulty');
  
  if (isLeetCodeCsv) {
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const urlIndex = headers.findIndex(h => h === 'url');
    const frequencyIndex = headers.findIndex(h => h.includes('frequency'));
    const acceptanceIndex = headers.findIndex(h => h.includes('acceptance'));
    
    if (urlIndex === -1) {
      console.error('CSV format detected but no URL column found');
      return entries;
    }
    
    console.log(`CSV columns detected: URL=${urlIndex}, Frequency=${frequencyIndex}, Acceptance=${acceptanceIndex}`);
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const url = values[urlIndex]?.trim();
      if (url) {
        const slug = extractSlugFromUrl(url);
        if (slug) {
          const frequencyStr = frequencyIndex >= 0 ? values[frequencyIndex]?.trim() : undefined;
          const acceptanceStr = acceptanceIndex >= 0 ? values[acceptanceIndex]?.trim() : undefined;
          
          const frequency = frequencyStr ? parseFloat(frequencyStr.replace('%', '')) : undefined;
          const acceptance = acceptanceStr ? parseFloat(acceptanceStr.replace('%', '')) : undefined;
          
          entries.push({ slug, company: '', frequency, acceptance });
        }
      }
    }
  } else {
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.includes(',')) {
        const parts = trimmed.split(',').map(s => s.trim());
        const urlPart = parts.find(p => p.includes('leetcode.com/problems/'));
        const companyPart = parts.find(p => !p.includes('leetcode.com'));
        
        if (urlPart) {
          const slug = extractSlugFromUrl(urlPart);
          if (slug) {
            entries.push({ slug, company: companyPart || '' });
          }
        }
      } else {
        const slug = extractSlugFromUrl(trimmed);
        if (slug) {
          entries.push({ slug, company: '' });
        }
      }
    }
  }
  
  return entries;
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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchProblem(slug: string): Promise<LeetCodeResponse['data']['question']> {
  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': `https://leetcode.com/problems/${slug}/`,
    },
    body: JSON.stringify({
      operationName: 'questionData',
      variables: { titleSlug: slug },
      query: QUESTION_QUERY,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json() as LeetCodeResponse;
  return data.data.question;
}

function htmlToMarkdown(html: string): string {
  return cleanDescription(html);
}

function extractConstraints(html: string | null): string[] {
  const constraints: string[] = [];
  
  if (!html) return constraints;
  
  const constraintsMatch = html.match(/<p><strong>Constraints:<\/strong><\/p>\s*<ul>([\s\S]*?)<\/ul>/i);
  if (constraintsMatch) {
    const listItems = constraintsMatch[1].match(/<li>([\s\S]*?)<\/li>/gi);
    if (listItems) {
      for (const item of listItems) {
        const text = item
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/<sup>/g, '^')
          .replace(/<\/sup>/g, '')
          .trim();
        if (text) {
          constraints.push(text);
        }
      }
    }
  }
  
  return constraints;
}

function parseValue(valueStr: string): unknown {
  const trimmed = valueStr.trim();
  
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  
  if (/^-?\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }
  if (/^-?\d+\.\d+$/.test(trimmed)) {
    return parseFloat(trimmed);
  }
  
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }
  
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  
  return trimmed;
}

function extractTestCases(html: string, starterCode: string): TestCaseOutput[] {
  const testCases: TestCaseOutput[] = [];
  
  if (!html) return testCases;
  
  const paramNames = extractParamNames(starterCode);
  
  const preBlocks = html.match(/<pre>([\s\S]*?)<\/pre>/gi) || [];
  
  for (const preBlock of preBlocks) {
    const content = preBlock
      .replace(/<\/?pre>/gi, '')
      .replace(/<\/?strong>/gi, '')
      .replace(/<\/?code>/gi, '')
      .replace(/<\/?em>/gi, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    
    const inputMatch = content.match(/Input:\s*([\s\S]*?)(?=Output:|$)/i);
    const outputMatch = content.match(/Output:\s*([\s\S]*?)(?=Explanation:|$)/i);
    
    if (inputMatch && outputMatch) {
      const inputStr = inputMatch[1].trim();
      const outputStr = outputMatch[1].trim().split('\n')[0].trim();
      
      const input: Record<string, unknown> = {};
      
      const paramPattern = /(\w+)\s*=\s*(\[[^\]]*\]|"[^"]*"|'[^']*'|-?\d+\.?\d*|true|false|null)/g;
      let match;
      while ((match = paramPattern.exec(inputStr)) !== null) {
        const paramName = match[1];
        const paramValue = match[2].trim();
        input[paramName] = parseValue(paramValue);
      }
      
      if (Object.keys(input).length === 0 && paramNames.length > 0) {
        const singleValue = inputStr.trim();
        if (singleValue && !singleValue.includes('=')) {
          input[paramNames[0]] = parseValue(singleValue);
        }
      }
      
      const expectedOutput = parseValue(outputStr);
      
      if (Object.keys(input).length > 0) {
        testCases.push({
          input,
          expectedOutput,
          isHidden: false,
        });
      }
    }
  }
  
  return testCases;
}

function extractParamNames(starterCode: string): string[] {
  const defMatch = starterCode.match(/def\s+\w+\s*\(\s*self\s*,?\s*([^)]*)\)/);
  if (defMatch && defMatch[1]) {
    return defMatch[1]
      .split(',')
      .map(p => p.split(':')[0].split('=')[0].trim())
      .filter(p => p && p !== 'self');
  }
  return [];
}

function transformProblem(
  question: NonNullable<LeetCodeResponse['data']['question']>,
  company: string
): ProblemOutput {
  const pythonSnippet = question.codeSnippets?.find(s => s.langSlug === 'python3' || s.langSlug === 'python');
  const jsSnippet = question.codeSnippets?.find(s => s.langSlug === 'javascript');
  
  const constraints = extractConstraints(question.content);
  const description = question.content ? htmlToMarkdown(question.content) : '';
  
  const companies = company ? [company.toLowerCase().replace(/\s+/g, '-')] : [];
  const concepts = question.topicTags.map(t => t.slug);

  const decodedHints = (question.hints || []).map(h => decodeHtmlEntities(h.replace(/<[^>]+>/g, '')));
  const decodedConstraints = constraints.map(c => decodeHtmlEntities(c));
  
  const starterCode = pythonSnippet?.code || generateDefaultPythonCode(question.titleSlug);
  const testCases = extractTestCases(question.content, starterCode);

  return {
    title: question.title,
    slug: question.titleSlug,
    difficulty: question.difficulty as 'Easy' | 'Medium' | 'Hard',
    description,
    starterCodePython: starterCode,
    starterCodeJs: jsSnippet?.code,
    concepts,
    companies,
    hints: decodedHints,
    constraints: decodedConstraints,
    testCases,
  };
}

function generateDefaultPythonCode(slug: string): string {
  const funcName = slug.replace(/-/g, '_');
  return `class Solution:
    def ${funcName}(self):
        # Your code here
        pass`;
}

type SlugMetadata = {
  companies: string[];
  frequency?: number;
  acceptance?: number;
};

async function scrapeProblems(
  entries: InputEntry[],
  options: { delay: number; existingSlugs: Set<string> }
): Promise<ScrapeResult> {
  const result: ScrapeResult = {
    problems: [],
    failed: [],
  };

  const slugMetadata = new Map<string, SlugMetadata>();
  for (const entry of entries) {
    const existing = slugMetadata.get(entry.slug) || { companies: [] };
    if (entry.company && !existing.companies.includes(entry.company)) {
      existing.companies.push(entry.company);
    }
    if (entry.frequency !== undefined) existing.frequency = entry.frequency;
    if (entry.acceptance !== undefined) existing.acceptance = entry.acceptance;
    slugMetadata.set(entry.slug, existing);
  }

  const uniqueSlugs = Array.from(slugMetadata.keys());
  const toFetch = uniqueSlugs.filter(slug => !options.existingSlugs.has(slug));

  console.log(`\nTotal unique problems: ${uniqueSlugs.length}`);
  console.log(`Already scraped: ${uniqueSlugs.length - toFetch.length}`);
  console.log(`To fetch: ${toFetch.length}\n`);

  for (let i = 0; i < toFetch.length; i++) {
    const slug = toFetch[i];
    const metadata = slugMetadata.get(slug) || { companies: [] };
    
    console.log(`[${i + 1}/${toFetch.length}] Fetching: ${slug}...`);
    
    const question = await fetchProblem(slug);
    
    if (!question) {
      console.log(`  ❌ Failed: Problem not found or premium`);
      result.failed.push({ slug, company: metadata.companies.join(','), error: 'Problem not found or premium' });
    } else if (!question.content) {
      console.log(`  ⚠️ Skipped: ${question.title} (Premium - no content)`);
      result.failed.push({ slug, company: metadata.companies.join(','), error: 'Premium problem - no content available' });
    } else {
      const problem = transformProblem(question, '');
      problem.companies = metadata.companies.map(c => c.toLowerCase().replace(/\s+/g, '-'));
      problem.frequency = metadata.frequency;
      problem.acceptance = metadata.acceptance;
      result.problems.push(problem);
      console.log(`  ✓ Success: ${question.title} (${question.difficulty}) - Freq: ${metadata.frequency ?? 'N/A'}%`);
    }

    if (i < toFetch.length - 1) {
      await sleep(options.delay);
    }
  }

  return result;
}

function loadExistingProblems(outputPath: string): ProblemOutput[] {
  if (fs.existsSync(outputPath)) {
    const content = fs.readFileSync(outputPath, 'utf-8');
    return JSON.parse(content);
  }
  return [];
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log(`
LeetCode Scraper Script

Usage:
  npx tsx scripts/scrape-leetcode.ts --input=<file> [options]

Input file format (one entry per line):
  CompanyName,https://leetcode.com/problems/two-sum/
  
Or just URLs:
  https://leetcode.com/problems/two-sum/

Options:
  --input=<file>     Input file with URLs (required)
  --output=<file>    Output JSON file (default: scripts/data/problems.json)
  --delay=<ms>       Delay between requests in ms (default: 2000)
  --company=<name>   Tag all problems with this company (e.g., --company=Google)
  --resume           Resume from previous run, skip already scraped

Example:
  npx tsx scripts/scrape-leetcode.ts --input=urls.txt
  npx tsx scripts/scrape-leetcode.ts --input=urls.txt --company=Google --delay=3000 --resume
`);
    process.exit(0);
  }

  const inputArg = args.find(arg => arg.startsWith('--input='));
  const outputArg = args.find(arg => arg.startsWith('--output='));
  const delayArg = args.find(arg => arg.startsWith('--delay='));
  const companyArg = args.find(arg => arg.startsWith('--company='));
  const resume = args.includes('--resume');

  if (!inputArg) {
    console.error('Error: --input=<file> is required');
    process.exit(1);
  }

  const inputPath = inputArg.split('=')[1];
  const outputPath = outputArg?.split('=')[1] || 'scripts/data/problems.json';
  const delay = delayArg ? parseInt(delayArg.split('=')[1], 10) : 2000;
  const defaultCompany = companyArg?.split('=')[1] || '';

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Input: ${inputPath}`);
  console.log(`Output: ${outputPath}`);
  console.log(`Delay: ${delay}ms`);
  console.log(`Company: ${defaultCompany || '(none)'}`);
  console.log(`Resume: ${resume}`);

  const entries = parseInputFile(inputPath);
  
  if (defaultCompany) {
    for (const entry of entries) {
      if (!entry.company) {
        entry.company = defaultCompany;
      }
    }
  }
  
  console.log(`\nParsed ${entries.length} entries from input file`);

  const existingProblems = resume ? loadExistingProblems(outputPath) : [];
  const existingSlugs = new Set(existingProblems.map(p => p.slug));

  const result = await scrapeProblems(entries, { delay, existingSlugs });

  const allProblems = [...existingProblems, ...result.problems];
  
  const dedupedProblems = Array.from(
    new Map(allProblems.map(p => [p.slug, p])).values()
  );

  fs.writeFileSync(outputPath, JSON.stringify(dedupedProblems, null, 2));
  console.log(`\nWrote ${dedupedProblems.length} problems to ${outputPath}`);

  if (result.failed.length > 0) {
    const failedPath = path.join(outputDir, 'failed.json');
    fs.writeFileSync(failedPath, JSON.stringify(result.failed, null, 2));
    console.log(`Wrote ${result.failed.length} failures to ${failedPath}`);
  }

  console.log(`\nSummary:`);
  console.log(`  Fetched: ${result.problems.length}`);
  console.log(`  Failed: ${result.failed.length}`);
  console.log(`  Total in output: ${dedupedProblems.length}`);
}

main().catch(e => {
  console.error('Scraper failed:', e);
  process.exit(1);
});
