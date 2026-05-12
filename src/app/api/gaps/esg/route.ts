import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  computeEmission,
  summarizeEmissions,
  computeDiversityKPIs,
  buildSGIReport,
  EMISSION_FACTORS,
} from '@/lib/gaps';

const EntrySchema = z.object({
  date: z.string().datetime(),
  scope: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  factorKey: z.string().refine((k) => k in EMISSION_FACTORS, 'Unknown factor'),
  qty: z.number().positive(),
  branchId: z.string().optional(),
  vendorId: z.string().optional(),
  productId: z.string().optional(),
  reference: z.string().optional(),
});

const ComputeRequestSchema = z.object({
  entries: z.array(EntrySchema).min(1),
  revenue: z.number().positive().optional(),
  employeeCount: z.number().positive().optional(),
  diversity: z
    .object({
      date: z.string().datetime(),
      totalEmployees: z.number().int().positive(),
      female: z.number().int().nonnegative(),
      male: z.number().int().nonnegative(),
      saudiNationals: z.number().int().nonnegative(),
      expats: z.number().int().nonnegative(),
      disability: z.number().int().nonnegative(),
      nationalities: z.record(z.string(), z.number().int().nonnegative()),
    })
    .optional(),
  buildSGI: z.boolean().default(false),
  organizationName: z.string().optional(),
  baselineEmissions: z.number().positive().optional(),
});

export async function POST(req: NextRequest) {
  const parsed = ComputeRequestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const logs = parsed.data.entries.map((e) =>
    computeEmission({
      date: new Date(e.date),
      scope: e.scope as 1 | 2 | 3,
      factorKey: e.factorKey as never,
      qty: e.qty,
      branchId: e.branchId,
      vendorId: e.vendorId,
      productId: e.productId,
      reference: e.reference,
    })
  );
  const summary = summarizeEmissions(logs, {
    revenue: parsed.data.revenue,
    employeeCount: parsed.data.employeeCount,
  });
  const diversity = parsed.data.diversity
    ? computeDiversityKPIs({
        ...parsed.data.diversity,
        date: new Date(parsed.data.diversity.date),
      })
    : undefined;
  const sgi =
    parsed.data.buildSGI && parsed.data.organizationName && parsed.data.baselineEmissions
      ? buildSGIReport({
          organizationName: parsed.data.organizationName,
          emissions: summary,
          baselineEmissions: parsed.data.baselineEmissions,
        })
      : undefined;
  return NextResponse.json({ summary, diversity, sgi, factorsAvailable: Object.keys(EMISSION_FACTORS) });
}

export async function GET() {
  return NextResponse.json({
    factors: EMISSION_FACTORS,
    scopes: {
      1: 'Direct emissions from owned sources (vehicles, on-site combustion, refrigerants)',
      2: 'Indirect from purchased electricity/heat',
      3: 'Indirect from value chain (supplier emissions, business travel, employee commute)',
    },
    standards: ['GHG Protocol', 'GRI Standards', 'SASB', 'Saudi Green Initiative'],
  });
}
