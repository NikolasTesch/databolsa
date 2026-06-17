import { NextRequest, NextResponse } from 'next/server';
import { Decimal } from 'decimal.js';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth/get-user';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { monthly_income_goal: true },
  });

  return NextResponse.json({
    monthly_income_goal: dbUser?.monthly_income_goal?.toString() ?? null,
  });
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  let body: { monthly_income_goal?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 422 });
  }

  const { monthly_income_goal } = body;

  if (monthly_income_goal === null || monthly_income_goal === undefined) {
    await prisma.user.update({
      where: { id: user.id },
      data: { monthly_income_goal: null },
    });
    return NextResponse.json({ monthly_income_goal: null });
  }

  let goalDecimal: Decimal;
  try {
    goalDecimal = new Decimal(String(monthly_income_goal));
    if (goalDecimal.lt(0)) {
      return NextResponse.json({ error: 'INVALID_INPUT', message: 'Meta não pode ser negativa' }, { status: 422 });
    }
  } catch {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 422 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { monthly_income_goal: goalDecimal.toString() },
  });

  return NextResponse.json({ monthly_income_goal: goalDecimal.toString() });
}
