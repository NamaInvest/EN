/**
 * SSO/SAML + SCIM Engine (Build #44)
 * ═════════════════════════════════════
 * 
 * - SAML 2.0 SP metadata generation
 * - SCIM 2.0 user provisioning/deprovisioning
 * - SSO session management
 */

import type { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'sso-engine' });
const db = (p: any) => p as any;

export type SSOConfig = {
    entityId: string;
    ssoUrl: string;
    sloUrl: string;
    certificate: string;
    nameIdFormat: string;
};

export class SSOEngine {
    /**
     * Generate SAML SP Metadata XML
     */
    static generateSPMetadata(tenantDomain: string): string {
        const entityId = `https://${tenantDomain}/saml/metadata`;
        const acsUrl = `https://${tenantDomain}/api/auth/saml/callback`;
        const sloUrl = `https://${tenantDomain}/api/auth/saml/logout`;

        return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"
    entityID="${entityId}">
  <md:SPSSODescriptor
      AuthnRequestsSigned="true"
      WantAssertionsSigned="true"
      protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService
        Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
        Location="${acsUrl}"
        index="0"
        isDefault="true"/>
    <md:SingleLogoutService
        Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
        Location="${sloUrl}"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
    }

    /**
     * SCIM 2.0 — Provision user from IdP
     */
    static async scimProvisionUser(
        prisma: PrismaClient,
        scimUser: {
            userName: string;
            displayName: string;
            emails: Array<{ value: string; primary: boolean }>;
            active: boolean;
            externalId?: string;
        }
    ): Promise<any> {
        const email = scimUser.emails.find(e => e.primary)?.value || scimUser.userName;

        // Check if user exists
        const existing = await db(prisma).user?.findFirst?.({
            where: { email },
        }).catch(() => null);

        if (existing) {
            // Update existing
            return db(prisma).user.update({
                where: { id: existing.id },
                data: {
                    name: scimUser.displayName,
                    isActive: scimUser.active,
                    externalId: scimUser.externalId || null,
                },
            });
        }

        // Create new user
        return db(prisma).user?.create?.({
            data: {
                email,
                name: scimUser.displayName,
                username: scimUser.userName,
                password: crypto.randomBytes(32).toString('hex'), // SSO users don't use passwords
                role: 'employee',
                isActive: scimUser.active,
                externalId: scimUser.externalId || null,
            },
        });
    }

    /**
     * SCIM 2.0 — Deprovision (disable) user
     */
    static async scimDeprovisionUser(prisma: PrismaClient, email: string): Promise<void> {
        await db(prisma).user?.updateMany?.({
            where: { email },
            data: { isActive: false },
        });
    }

    /**
     * Validate SSO session token
     */
    static async validateSSOSession(
        prisma: PrismaClient,
        sessionToken: string
    ): Promise<{ valid: boolean; user?: any }> {
        const session = await db(prisma).session?.findFirst?.({
            where: { token: sessionToken, expiresAt: { gte: new Date() } },
            include: { user: true },
        }).catch(() => null);

        if (!session) return { valid: false };
        return { valid: true, user: session.user };
    }
}
