import { NextResponse } from "next/server";
import { withRoute } from '@/lib/api/with-route';
import { getPrisma } from "@/lib/prisma";
import { encrypt, decrypt, maskSensitive } from "@/lib/encryption";

import { requireTenantId } from '@/lib/tenant/tenant-guard';
import { getUserFromRequest } from '@/lib/auth';
import { getHrScope } from '@/lib/hr-scope';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'employees' });
async function _GET(request: Request) {
  // Auth guard
  const { getUserFromRequest: _getAuth } = require("@/lib/auth");
  const _auth = _getAuth(request);
  if (!_auth) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const prisma = getPrisma(request);
  const tenantId = requireTenantId(request as any);
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const baseWhere = await getHrScope(_auth, tenantId, true);
    const where: any = { ...baseWhere };
    if (search) {
      where.name = { contains: search, mode: "insensitive" as const };
    }
    const employees = await prisma.employee.findMany({ take: 100,
      where,
      include: { branch: true },
      orderBy: { id: "desc" },
    });
    // فك تشفير IBAN للعرض (مع القناع)
    const result = employees.map((emp: any) => ({
      ...emp,
      iban: emp.iban ? maskSensitive(decrypt(emp.iban), 4, 4) : null,
      ibanFull: emp.iban ? decrypt(emp.iban) : null,
    }));
    return NextResponse.json(result);
  } catch (error: any) {
    log.error(error);
    return NextResponse.json([], { status: 500 });
  }
}


const _POSTSchema = z.object({
  salary: z.number().optional(),
  branchId: z.union([z.string(), z.number()]).optional(),
  name: z.any().optional(),
  phone: z.string().optional(),
  position: z.any().optional(),
  housingAllowance: z.any().optional(),
  transportAllowance: z.any().optional(),
  otherAllowance: z.any().optional(),
}).passthrough();

async function _POST(request: Request) {
  // Auth guard
  const { getUserFromRequest: _getAuth } = require("@/lib/auth");
  const _auth = _getAuth(request);
  if (!_auth) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const prisma = getPrisma(request);
  const tenantId = requireTenantId(request as any);
  try {
    const body = await request.json();

        const _parsed = _PUTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: _parsed.error.flatten().fieldErrors }, { status: 400 });
        }

        const _parsed2 = _POSTSchema.safeParse(body);
        if (!_parsed.success) {
          return NextResponse.json({ error: 'Invalid request body', details: (_parsed as any).error.flatten().fieldErrors }, { status: 400 });
        }
    body.salary =
      typeof body.salary === "string"
        ? body.salary.replace(/,/g, "")
        : body.salary;
    const { getNextNumber } = require("@/lib/numbering");
    const seqResult = await getNextNumber(
      prisma,
      "EMP",
      body.branchId ? parseInt(body.branchId) : undefined,
    );
    const employee = await prisma.employee.create({
      data: {
        tenantId,
        employeeNo: seqResult.formatted,
        name: body.name,
        phone: body.phone || null,
        position: body.position || null,
        salary: parseFloat(body.salary) || 0,
        housingAllowance: parseFloat(body.housingAllowance) || 0,
        transportAllowance: parseFloat(body.transportAllowance) || 0,
        otherAllowance: parseFloat(body.otherAllowance) || 0,
        bankName: body.bankName || null,
        iban: body.iban ? encrypt(body.iban) : null,
        startDate: body.startDate || null,
        branchId: body.branchId ? parseInt(body.branchId) : null,
      },
    });
    return NextResponse.json(employee, { status: 201 });
  } catch (error: any) {
    log.error(error);
    return NextResponse.json({ error: "فشل" }, { status: 500 });
  }
}

// Update Employee Biometrics (Face Descriptor)

const _PUTSchema = z.object({
  employeeId: z.union([z.string(), z.number()]).optional(),
  faceDescriptor: z.any().optional(),
}).passthrough();

async function _PUT(request: Request) {
  // Auth guard
  const { getUserFromRequest: _getAuth } = require("@/lib/auth");
  const _auth = _getAuth(request);
  if (!_auth) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const prisma = getPrisma(request);
  const tenantId = requireTenantId(request as any);
  try {
    const body = await request.json();
    if (!body.employeeId || !body.faceDescriptor) {
      return NextResponse.json(
        { error: "Missing employeeId or faceDescriptor" },
        { status: 400 },
      );
    }

    const updated = await prisma.employee.updateMany({
      where: { id: parseInt(body.employeeId), tenantId },
      data: {
        faceDescriptor: body.faceDescriptor,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    log.error("Face registration error:", error);
    return NextResponse.json(
      { error: "Failed to save biometric data" },
      { status: 500 },
    );
  }
}

export const GET = withRoute(async ({ req }) => _GET(req as any), { rateLimit: 'DEFAULT' });

export const POST = withRoute(async ({ req }) => _POST(req as any), { rateLimit: 'DEFAULT' });

export const PUT = withRoute(async ({ req }) => _PUT(req as any), { rateLimit: 'DEFAULT' });
