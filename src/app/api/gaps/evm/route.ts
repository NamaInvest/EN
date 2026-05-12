import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { computeEVM, buildSCurve, detectEVMIssues } from '@/lib/gaps';

const Schema = z.object({
  asOfDate: z.string().datetime(),
  projectStartDate: z.string().datetime(),
  projectEndDate: z.string().datetime(),
  budgetLines: z
    .array(
      z.object({
        date: z.string().datetime(),
        description: z.string(),
        budgetedAmount: z.number().nonnegative(),
      })
    )
    .min(1),
  milestones: z
    .array(
      z.object({
        id: z.string(),
        description: z.string(),
        budgetedAmount: z.number().nonnegative(),
        plannedDate: z.string().datetime(),
        percentComplete: z.number().min(0).max(1),
        actualCompletionDate: z.string().datetime().optional(),
      })
    )
    .min(1),
  actuals: z
    .array(
      z.object({
        date: z.string().datetime(),
        description: z.string(),
        amount: z.number().nonnegative(),
        category: z.enum(['LABOR', 'MATERIAL', 'EXPENSE', 'SUBCONTRACTOR', 'OVERHEAD']),
      })
    )
    .default([]),
  buildSCurve: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = {
    asOfDate: new Date(parsed.data.asOfDate),
    projectStartDate: new Date(parsed.data.projectStartDate),
    projectEndDate: new Date(parsed.data.projectEndDate),
    budgetLines: parsed.data.budgetLines.map((b) => ({ ...b, date: new Date(b.date) })),
    milestones: parsed.data.milestones.map((m) => ({
      ...m,
      plannedDate: new Date(m.plannedDate),
      actualCompletionDate: m.actualCompletionDate ? new Date(m.actualCompletionDate) : undefined,
    })),
    actuals: parsed.data.actuals.map((a) => ({ ...a, date: new Date(a.date) })),
  };
  const snapshot = computeEVM(input);
  const issues = detectEVMIssues(snapshot);
  const sCurve = parsed.data.buildSCurve ? buildSCurve(input) : undefined;
  return NextResponse.json({ snapshot, issues, sCurve });
}
