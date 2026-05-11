import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'sso-engine' });

export class SSOEngine {
  static async registerProvider(tenantId: string, type: 'SAML' | 'OIDC', name: string, config: {
    metadataUrl?: string;
    clientId?: string;
    clientSecret?: string;
    attributeMapping?: object;
  }) {
    log.info(`Registering SSO provider: ${name} (${type}) for tenant ${tenantId}`);
    return prisma.ssoProvider.create({
      data: { tenantId, type, name, ...config, isActive: true },
    });
  }

  static async getActiveProvider(tenantId: string) {
    return prisma.ssoProvider.findFirst({ where: { tenantId, isActive: true } });
  }

  /** JIT provisioning: create user on first SAML login */
  static async provisionUser(email: string, firstName: string, lastName: string, tenantId: string, roleId?: number) {
    log.info(`JIT provisioning user: ${email}`);
    // In production: call your user creation service
    return { email, firstName, lastName, tenantId, roleId, provisioned: true };
  }

  static async toggleProvider(id: number, isActive: boolean) {
    return prisma.ssoProvider.update({ where: { id }, data: { isActive } });
  }
}
