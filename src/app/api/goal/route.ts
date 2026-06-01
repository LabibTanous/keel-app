import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateGoal } from '@/lib/db';

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { goalName, goalTarget, goalCurrent, goalMonthly } = body;

    const row = await updateGoal(session.user.id, {
      goalName: goalName ?? undefined,
      goalTarget: goalTarget != null ? Number(goalTarget) : undefined,
      goalCurrent: goalCurrent != null ? Number(goalCurrent) : undefined,
      goalMonthly: goalMonthly != null ? Number(goalMonthly) : undefined,
    });

    return NextResponse.json({ goal: row });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[PATCH /api/goal] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
