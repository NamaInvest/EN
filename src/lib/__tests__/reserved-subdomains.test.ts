import {
  isReservedSubdomain,
  validateSubdomainCandidate,
  normalizeSubdomainCandidate,
} from '../tenant/reserved-subdomains';

describe('Reserved Subdomains Validation', () => {
  describe('isReservedSubdomain', () => {
    it('rejects exact reserved subdomains', () => {
      expect(isReservedSubdomain('admin')).toBe(true);
      expect(isReservedSubdomain('api')).toBe(true);
      expect(isReservedSubdomain('www')).toBe(true);
      expect(isReservedSubdomain('n1')).toBe(true);
      expect(isReservedSubdomain('n11')).toBe(true);
    });

    it('rejects reserved subdomains with uppercase bypass', () => {
      expect(isReservedSubdomain('Admin')).toBe(true);
      expect(isReservedSubdomain('API')).toBe(true);
      expect(isReservedSubdomain('WwW')).toBe(true);
    });

    it('allows non-reserved subdomains', () => {
      expect(isReservedSubdomain('valid-company')).toBe(false);
      expect(isReservedSubdomain('company123')).toBe(false);
    });
  });

  describe('validateSubdomainCandidate', () => {
    it('accepts valid alphanumeric subdomains', () => {
      const res1 = validateSubdomainCandidate('company123');
      expect(res1.valid).toBe(true);

      const res2 = validateSubdomainCandidate('valid-company');
      expect(res2.valid).toBe(true);
    });

    it('rejects reserved subdomains', () => {
      const res = validateSubdomainCandidate('admin');
      expect(res.valid).toBe(false);
      expect(res.code).toBe('RESERVED_SUBDOMAIN');
    });

    it('rejects short subdomains', () => {
      const res = validateSubdomainCandidate('co');
      expect(res.valid).toBe(false);
      expect(res.code).toBe('SUBDOMAIN_TOO_SHORT');
    });

    it('rejects long subdomains', () => {
      const res = validateSubdomainCandidate('a'.repeat(21));
      expect(res.valid).toBe(false);
      expect(res.code).toBe('SUBDOMAIN_TOO_LONG');
    });

    it('rejects empty strings', () => {
      const res = validateSubdomainCandidate('');
      expect(res.valid).toBe(false);
      expect(res.code).toBe('REQUIRED_SUBDOMAIN');
    });

    it('rejects spaces', () => {
      const res = validateSubdomainCandidate('company name');
      expect(res.valid).toBe(false);
      expect(res.code).toBe('INVALID_SUBDOMAIN');
    });

    it('rejects underscores', () => {
      const res = validateSubdomainCandidate('company_name');
      expect(res.valid).toBe(false);
      expect(res.code).toBe('INVALID_SUBDOMAIN');
    });

    it('rejects dots', () => {
      const res = validateSubdomainCandidate('company.name');
      expect(res.valid).toBe(false);
      expect(res.code).toBe('INVALID_SUBDOMAIN');
    });

    it('rejects unicode / Arabic', () => {
      const res = validateSubdomainCandidate('شركة');
      expect(res.valid).toBe(false);
      expect(res.code).toBe('INVALID_SUBDOMAIN');
    });

    it('rejects leading hyphen', () => {
      const res = validateSubdomainCandidate('-company');
      expect(res.valid).toBe(false);
      expect(res.code).toBe('INVALID_SUBDOMAIN');
    });

    it('rejects trailing hyphen', () => {
      const res = validateSubdomainCandidate('company-');
      expect(res.valid).toBe(false);
      expect(res.code).toBe('INVALID_SUBDOMAIN');
    });

    it('rejects double hyphens', () => {
      const res = validateSubdomainCandidate('comp--any');
      expect(res.valid).toBe(false);
      expect(res.code).toBe('INVALID_SUBDOMAIN');
    });
  });
});
