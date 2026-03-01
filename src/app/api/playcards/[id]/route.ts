import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const playcardId = parseInt(id, 10);

  const existing = await prisma.playcard.findUnique({
    where: { id: playcardId },
    select: { userId: true },
  });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.playcard.delete({ where: { id: playcardId } });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const playcardId = parseInt(id, 10);

  const existing = await prisma.playcard.findUnique({
    where: { id: playcardId },
    select: { userId: true },
  });

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { front, back } = await request.json();

  const updated = await prisma.playcard.update({
    where: { id: playcardId },
    data: { front, back },
  });

  return NextResponse.json({ playcard: updated });
}
