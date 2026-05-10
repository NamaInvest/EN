/**
 * src/lib/api-error.ts
 * ──────────────────────────────────────────────────────────
 * نظام موحد لمعالجة أخطاء API بأمان:
 * - يسجّل التفاصيل الكاملة في console (للمطور)
 * - يُرسل رسالة عامة آمنة للمستخدم (لا كشف لتفاصيل النظام)
 * - يُميّز الأخطاء المعروفة (validation) عن الأخطاء التقنية
 */
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'api-error' });

// رموز أخطاء Prisma الشائعة → رسائل عربية ودية
const PRISMA_ERRORS: Record<string, string> = {
    P2002: 'البيانات موجودة مسبقاً (تكرار)',
    P2025: 'السجل المطلوب غير موجود',
    P2003: 'خطأ في العلاقات — تأكد من صحة المراجع',
    P2014: 'هذه البيانات مرتبطة بسجلات أخرى',
    P2016: 'خطأ في الاستعلام',
    P2021: 'الجدول غير موجود',
    P2022: 'العمود غير موجود',
};

interface ApiErrorOptions {
    status?: number;
    context?: string; // اسم الملف/الوظيفة للـ logging
}

/**
 * apiError — ترسل رد خطأ آمن
 * @param error  الخطأ الأصلي (يُسجَّل فقط)
 * @param fallback رسالة عامة آمنة للمستخدم
 */
export function apiError(
    error: unknown,
    fallback = 'حدث خطأ في المعالجة، يرجى المحاولة لاحقاً',
    opts: ApiErrorOptions = {}
): NextResponse {
    // ── التسجيل التفصيلي للمطور ──
    const ctx = opts.context ? `[${opts.context}]` : '[API]';
    log.error(`${ctx} Error:`, error);

    // ── تحديد نوع الخطأ ──
    const err = error as any;
    const prismaCode = err?.code;

    // رسالة ودية من جدول Prisma
    if (prismaCode && PRISMA_ERRORS[prismaCode]) {
        return NextResponse.json(
            { error: PRISMA_ERRORS[prismaCode] },
            { status: opts.status || 400 }
        );
    }

    // رسالة أعطاها المطور بشكل صريح (ليست من Prisma)
    const isKnownError = err?.isKnownError === true;
    if (isKnownError && err?.message) {
        return NextResponse.json(
            { error: err.message },
            { status: opts.status || 400 }
        );
    }

    // خطأ تقني — لا نكشف التفاصيل
    return NextResponse.json(
        { error: fallback },
        { status: opts.status || 500 }
    );
}

/**
 * knownError — أنشئ خطأ معروف يمكن إظهاره للمستخدم
 */
export function knownError(message: string, status = 400): never {
    const err = new Error(message) as any;
    err.isKnownError = true;
    err.statusCode   = status;
    throw err;
}

/**
 * validateAmount — تحقق من المبلغ المالي
 */
export function validateAmount(value: unknown, fieldName = 'المبلغ'): number {
    const num = parseFloat(String(value ?? ''));
    if (isNaN(num))   throw Object.assign(new Error(`${fieldName} يجب أن يكون رقماً صحيحاً`), { isKnownError: true });
    if (num < 0)      throw Object.assign(new Error(`${fieldName} لا يمكن أن يكون سالباً`), { isKnownError: true });
    return num;
}

/**
 * validatePositiveInt — تحقق من معرّف صحيح موجب
 */
export function validatePositiveInt(value: unknown, fieldName = 'المعرّف'): number {
    const num = parseInt(String(value ?? ''), 10);
    if (isNaN(num) || num <= 0) {
        throw Object.assign(new Error(`${fieldName} غير صالح`), { isKnownError: true });
    }
    return num;
}

/**
 * requireFields — تحقق من وجود حقول مطلوبة
 */
export function requireFields(body: Record<string, unknown>, fields: string[]): void {
    const missing = fields.filter(f => body[f] === undefined || body[f] === null || body[f] === '');
    if (missing.length > 0) {
        throw Object.assign(
            new Error(`الحقول التالية مطلوبة: ${missing.join('، ')}`),
            { isKnownError: true }
        );
    }
}
