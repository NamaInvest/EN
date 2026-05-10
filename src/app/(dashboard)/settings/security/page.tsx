import React from 'react';
import SecuritySettingsClient from './SecuritySettingsClient';

import prisma from '@/lib/prisma';
import { _t } from '@/lib/server-t';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.app.(dashboard).' });
export default async function SecuritySettingsPage() {
    // We assume tenant/user is 1 for now (mock user until auth is fully integrated in layout)
    // Normally we would get user ID from session/JWT
    const userId = 1; 

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            trustedDevices: true,
            backupCodes: {
                select: {
                    id: true,
                    usedAt: true,
                    createdAt: true,
                    codeHint: true,
                    generatedBatchId: true
                }
            }
        }
    });

    if (!user) {
        return <div>{_t('User not found', 'User not found')}</div>;
    }

    // Format data for the client
    const clientData = {
        userId: user.id,
        mfaEnabled: user.mfaEnabled,
        mfaMethod: user.mfaMethod,
        mfaPendingActivation: user.mfaPendingActivation,
        mfaEnrolledAt: user.mfaEnrolledAt,
        trustedDevices: user.trustedDevices.map(d => ({
            id: d.id,
            deviceName: d.deviceName,
            browser: d.browser,
            os: d.os,
            ipAddress: d.ipAddress,
            city: d.city,
            countryCode: d.countryCode,
            trustedAt: d.trustedAt.toISOString(),
            trustedUntil: d.trustedUntil.toISOString(),
            lastUsedAt: d.lastUsedAt?.toISOString(),
            revokedAt: d.revokedAt?.toISOString()
        })),
        backupCodesCount: user.backupCodes.filter(c => !c.usedAt).length,
        backupCodesGeneratedAt: user.backupCodes[0]?.createdAt?.toISOString() || null
    };

    return <SecuritySettingsClient initialData={clientData} />;
}
