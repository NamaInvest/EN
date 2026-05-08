const PATTERNS = {
  IBAN_SA: /SA\d{22}/g,
  NATIONAL_ID: /[12]\d{9}/g,
  PHONE_SA: /(\+966|05)\d{8}/g,
  CARD: /\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}/g,
};

export function redactPII(text: string): string {
  if (!text) return text;
  return Object.entries(PATTERNS).reduce(
    (acc, [type, pattern]) => acc.replace(pattern, `[${type}_REDACTED]`),
    text
  );
}
