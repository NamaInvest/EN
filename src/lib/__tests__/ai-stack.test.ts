/**
 * AI-28 — Test Suite: AI Stack Core Infrastructure
 * Tests PII Masking Engine and Environment Validation
 */

// ── PII Masking Tests ─────────────────────────────────────────────────────────

describe('PII Masking Engine', () => {
  let maskPII: any;
  let detectPII: any;

  beforeAll(async () => {
    const mod = await import('../pii-mask');
    maskPII  = mod.maskPII;
    detectPII = mod.detectPII;
  });

  it('should mask Saudi National ID (10 digits starting with 1 or 2)', () => {
    const result = maskPII('الموظف رقم هويته 1098765432 في الملف');
    expect(result.masked).not.toContain('1098765432');
    expect(result.maskedCount).toBe(1);
    expect(result.maskedTypes).toContain('nationalId');
  });

  it('should mask Saudi IBAN', () => {
    const result = maskPII('رقم الحساب SA0380000000608010167519');
    expect(result.masked).not.toContain('SA0380000000608010167519');
    expect(result.maskedCount).toBe(1);
    expect(result.maskedTypes).toContain('iban');
  });

  it('should mask Saudi phone numbers', () => {
    const result = maskPII('اتصل على 0512345678 أو +966512345678');
    expect(result.masked).not.toContain('0512345678');
    expect(result.maskedCount).toBe(2);
    expect(result.maskedTypes).toContain('phone');
  });

  it('should mask email addresses', () => {
    const result = maskPII('أرسل إلى ahmed@company.com');
    expect(result.masked).not.toContain('ahmed@company.com');
    expect(result.maskedCount).toBe(1);
  });

  it('should mask salary references', () => {
    const result = maskPII('راتب الموظف: 15,000.00');
    expect(result.masked).not.toContain('15,000');
    expect(result.maskedTypes).toContain('salary');
  });

  it('should return 0 masks for clean text', () => {
    const result = maskPII('هذا نص عادي بدون بيانات حساسة');
    expect(result.maskedCount).toBe(0);
    expect(result.maskedTypes).toHaveLength(0);
  });

  it('detectPII should return true for text with PII', () => {
    expect(detectPII('هاتف 0512345678')).toBe(true);
  });

  it('detectPII should return false for clean text', () => {
    expect(detectPII('نص عادي بدون بيانات')).toBe(false);
  });
});

// ── Environment Validation Tests ──────────────────────────────────────────────

describe('Environment Validation', () => {
  it('should export getEnv function', async () => {
    const mod = await import('../env');
    expect(typeof mod.getEnv).toBe('function');
  });

  it('should export redactSecret function', async () => {
    const { redactSecret } = await import('../env');
    expect(redactSecret('sk-1234567890abcdef')).toBe('sk-1...cdef');
  });

  it('should mask short secrets completely', async () => {
    const { redactSecret } = await import('../env');
    expect(redactSecret('short')).toBe('****');
  });
});
