/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  Advanced Planning & Scheduling (APS) — `/manufacturing/aps`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  نظام التخطيط المتقدم — APS = Advanced Planning & Scheduling.
 *  يجدول أوامر التصنيع على مراكز العمل مع مراعاة:
 *   - القدرات المتاحة
 *   - تتابع العمليات (Routing)
 *   - تواريخ التسليم (Due Dates)
 *
 *  يفعل: تشغيل/محاكاة الجدولة، كشف التضاربات، جدولة عملية واحدة.
 *
 *  @see src/app/api/manufacturing/aps/route.ts
 *  @see src/services/manufacturing/manufacturing-aps.service.ts
 *  @see src/lib/aps-scheduler.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

import ManufacturingApsClient from './ManufacturingApsClient';

export default function ManufacturingApsPage() {
  return <ManufacturingApsClient />;
}
