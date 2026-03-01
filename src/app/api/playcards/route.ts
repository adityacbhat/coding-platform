import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section');

  const playcards = await prisma.playcard.findMany({
    where: {
      userId: user.id,
      ...(section ? { section } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ playcards });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { section, front, back } = await request.json();

  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email! },
  });

  const playcard = await prisma.playcard.create({
    data: {
      userId: user.id,
      section,
      front,
      back,
    },
  });

  return NextResponse.json({ playcard }, { status: 201 });
}
