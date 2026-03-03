import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import type { AnalysisData } from '@/app/api/analyze/route';
import type { AlgorithmAnalysisData } from '@/app/api/analyze-algorithm/route';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
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

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: systemContext,
    messages: [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ],
  });

  const reply = message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');

  return NextResponse.json({ reply });
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
