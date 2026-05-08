/**
 * Unit Tests — ZATCA Phase 2 Services
 * تغطي: QR decoder، mode detection، late submission check
 */
import { ZATCAQrValidationService } from '../../services/zatca/qr-validation.service';
import { ZATCAPhase2ModeService } from '../../services/zatca/phase2-mode.service';

// ── QR Validation ────────────────────────────────────────────────────────────
describe('ZATCAQrValidationService', () => {
  const svc = new ZATCAQrValidationService();

  function buildQR(fields: Record<number, string>): string {
    const parts: Buffer[] = [];
    for (const [tag, value] of Object.entries(fields)) {
      const valBuf = Buffer.from(value, 'utf8');
      parts.push(Buffer.from([Number(tag), valBuf.length]));
      parts.push(valBuf);
    }
    return Buffer.concat(parts).toString('base64');
  }

  it('يفك تشفير QR بصيغة TLV بشكل صحيح', () => {
    const qr = buildQR({
      1: 'شركة الاختبار',
      2: '300000000000003',
      3: '2024-01-01T00:00:00Z',
      4: '115.00',
      5: '15.00',
    });
    const decoded = svc.decodeQR(qr);
    expect(decoded.sellerName).toBe('شركة الاختبار');
    expect(decoded.vatNumber).toBe('300000000000003');
    expect(decoded.totalWithVat).toBe('115.00');
    expect(decoded.vatAmount).toBe('15.00');
  });

  it('يتحقق من تطابق بيانات الفاتورة', () => {
    const qr = buildQR({ 2: '300000000000003', 4: '115.00', 5: '15.00' });
    const result = svc.validateQR(qr, { vatNumber: '300000000000003', totalWithVat: '115.00' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('يكتشف عدم التطابق', () => {
    const qr = buildQR({ 2: '300000000000003', 4: '115.00', 5: '15.00' });
    const result = svc.validateQR(qr, { vatNumber: '999999999999999' });
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('VAT number mismatch');
  });
});

// ── Phase 2 Mode Detection ────────────────────────────────────────────────────
describe('ZATCAPhase2ModeService', () => {
  const svc = new ZATCAPhase2ModeService();

  it('B2B مع رقم ضريبي → CLEARANCE', () => {
    expect(svc.determineMode({ buyerVatNumber: '300000000000003', totalAmount: 5000 })).toBe('CLEARANCE');
  });

  it('B2C بدون رقم ضريبي → REPORTING', () => {
    expect(svc.determineMode({ totalAmount: 200 })).toBe('REPORTING');
  });

  it('رقم ضريبي غير صالح (أقل من 15 رقماً) → REPORTING', () => {
    expect(svc.determineMode({ buyerVatNumber: '12345', totalAmount: 5000 })).toBe('REPORTING');
  });

  it('يكتشف التأخر في التقديم بعد 24 ساعة', () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
    expect(svc.isLateSubmission(yesterday)).toBe(true);
  });

  it('لا تأخر إذا كان داخل 24 ساعة', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    expect(svc.isLateSubmission(oneHourAgo)).toBe(false);
  });
});
