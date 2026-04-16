import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

interface PrismaError extends Error {
  code?: string;
  meta?: Record<string, unknown>;
}

export function handleApiError(error: unknown) {
  // Always log the actual error internally for debugging
  console.error("API Execution Error:", error);
  
  // Zod Validation Errors
  if (error instanceof ZodError) {
    const errorMessages = (error as any).errors.map((issue: any) => `${issue.message}`).join(', ');
    return NextResponse.json({ error: `الرجاء التحقق من صحة البيانات: ${errorMessages}` }, { status: 400 });
  }

  // Handle Prisma Database Error Responses (Prevent Information Leakage)
  const prismaErr = error as PrismaError;
  if (prismaErr?.code === 'P2002') {
    return NextResponse.json({ error: 'تعارض في البيانات: يوجد سجل مشابه مسبقاً (Unique Constraint).' }, { status: 409 });
  }
  if (prismaErr?.code === 'P2025') {
    return NextResponse.json({ error: 'السجل غير موجود أو تم حذفه مسبقاً.' }, { status: 404 });
  }
  // Generic database errors format matching PRISMA pattern
  if (prismaErr?.code?.startsWith('P2')) {
    return NextResponse.json({ error: 'حدث خطأ متعلق بقاعدة البيانات. يرجى مراجعة المدخلات.' }, { status: 400 });
  }

  // Custom errors thrown intentionally
  if (error instanceof Error && error.message.startsWith('Custom:')) {
    return NextResponse.json({ error: error.message.replace('Custom:', '').trim() }, { status: 400 });
  }

  // Fallback generic error
  return NextResponse.json({ error: 'حدث خطأ داخلي في الخادم. يرجى المحاولة لاحقاً.' }, { status: 500 });
}
