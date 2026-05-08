export class ZATCACertificateRenewalService {
  async checkExpiry(tenantId: string) {
    return { needsRenewal: false };
  }
}
