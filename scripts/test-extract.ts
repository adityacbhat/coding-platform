const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

const QUESTION_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      content
      codeSnippets {
        langSlug
        code
      }
    }
  }
`;

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

function extractTestCases(html: string, starterCode: string) {
  const testCases: { input: Record<string, unknown>; expectedOutput: unknown }[] = [];
  
  if (!html) return testCases;
  
  const paramNames = extractParamNames(starterCode);
  console.log('Param names:', paramNames);
  
  const preBlocks = html.match(/<pre>([\s\S]*?)<\/pre>/gi) || [];
  console.log('Found', preBlocks.length, 'pre blocks');
  
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
    
    console.log('\n--- Pre block content ---');
    console.log(content);
    
    const inputMatch = content.match(/Input:\s*([\s\S]*?)(?=Output:|$)/i);
    const outputMatch = content.match(/Output:\s*([\s\S]*?)(?=Explanation:|$)/i);
    
    if (inputMatch && outputMatch) {
      const inputStr = inputMatch[1].trim();
      const outputStr = outputMatch[1].trim().split('\n')[0].trim();
      
      console.log('Input string:', inputStr);
      console.log('Output string:', outputStr);
      
      const input: Record<string, unknown> = {};
      
      const paramPattern = /(\w+)\s*=\s*(\[[^\]]*\]|"[^"]*"|'[^']*'|-?\d+\.?\d*|true|false|null)/g;
      let match;
      while ((match = paramPattern.exec(inputStr)) !== null) {
        const paramName = match[1];
        const paramValue = match[2].trim();
        console.log(`  Found param: ${paramName} = ${paramValue}`);
        input[paramName] = parseValue(paramValue);
      }
      
      const expectedOutput = parseValue(outputStr);
      
      if (Object.keys(input).length > 0) {
        testCases.push({ input, expectedOutput });
      }
    }
  }
  
  return testCases;
}

async function main() {
  const response = await fetch(LEETCODE_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    body: JSON.stringify({
      operationName: 'questionData',
      variables: { titleSlug: 'two-sum' },
      query: QUESTION_QUERY,
    }),
  });

  const data = await response.json();
  const pythonCode = data.data.question.codeSnippets.find((s: {langSlug: string}) => s.langSlug === 'python3')?.code || '';
  
  const testCases = extractTestCases(data.data.question.content, pythonCode);
  
  console.log('\n=== EXTRACTED TEST CASES ===');
  console.log(JSON.stringify(testCases, null, 2));
}

main();
