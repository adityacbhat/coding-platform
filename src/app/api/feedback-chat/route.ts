import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { AnalysisData } from '@/app/api/analyze/route';
import type { AlgorithmAnalysisData } from '@/app/api/analyze-algorithm/route';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

type ChatMessage = { 
  role: 'user' | 'assistant'; 
  content: string;
  reasoning_details?: unknown;
};

type OpenRouterMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  reasoning_details?: unknown;
};

type OpenRouterResponse = {
  choices: Array<{
    message: {
      content: string;
      reasoning_details?: unknown;
    };
  }>;
};

export async function POST(request: NextRequest) {
  const {
    problemSlug,
    analysisSource,
    analysis,
    code,
    algorithm,
    language,
    messages,
    userMessage,
  } = await request.json() as {
    problemSlug: string;
    analysisSource: 'code' | 'algorithm';
    analysis: AnalysisData | AlgorithmAnalysisData;
    code?: string;
    algorithm?: string;
    language?: string;
    messages: ChatMessage[];
    userMessage: string;
  };

  const problem = await prisma.problem.findUnique({
    where: { slug: problemSlug },
    select: { title: true, description: true, difficulty: true },
  });

  if (!problem) {
    return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
  }

  const analysisText =
    analysisSource === 'code'
      ? formatCodeAnalysisContext(analysis as AnalysisData)
      : formatAlgorithmAnalysisContext(analysis as AlgorithmAnalysisData);

  const solutionBlock =
    analysisSource === 'code'
      ? `User's Solution (${language ?? 'python'}):\n${code ?? ''}`
      : `User's Algorithm/Approach:\n${algorithm ?? ''}`;

  const systemContext = `You are a helpful coding interview coach. You previously analysed the user's ${analysisSource === 'code' ? 'code solution' : 'algorithm/approach'} for this problem and gave feedback. The user may now have follow-up questions. Answer based on the context below. Be concise and helpful.

Problem: ${problem.title} (${problem.difficulty})
${problem.description}

${solutionBlock}

Your previous feedback:
${analysisText}`;

  const apiMessages: OpenRouterMessage[] = [
    { role: 'system', content: systemContext },
    ...messages.map((m) => ({ 
      role: m.role as 'user' | 'assistant', 
      content: m.content,
      ...(m.reasoning_details ? { reasoning_details: m.reasoning_details } : {})
    })),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "arcee-ai/trinity-mini:free",
      messages: apiMessages,
      reasoning: { enabled: true }
    })
  });

  const result = await response.json() as OpenRouterResponse;
  
  if (!result.choices || !result.choices[0]?.message) {
    return NextResponse.json({ error: 'Unexpected response from AI' }, { status: 500 });
  }

  const assistantMessage = result.choices[0].message;

  return NextResponse.json({ 
    reply: assistantMessage.content,
    reasoning_details: assistantMessage.reasoning_details
  });
}

function formatCodeAnalysisContext(a: AnalysisData): string {
  return `- Optimal: ${a.isOptimal}
- Optimality explanation: ${a.optimalityExplanation}
- Time complexity: ${a.timeComplexity} (${a.timeComplexityReason})
- Space complexity: ${a.spaceComplexity} (${a.spaceComplexityReason})
- Feedback: ${a.feedback}`;
}

function formatAlgorithmAnalysisContext(a: AlgorithmAnalysisData): string {
  const hintsText = a.hints?.length ? `\n- Hints: ${a.hints.join('; ')}` : '';
  return `- On track: ${a.onTrack}\n- Validation: ${a.validationMessage}${hintsText}`;
}
