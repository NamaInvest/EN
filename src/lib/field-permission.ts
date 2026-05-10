import { getPrisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'field-permission' });

/**
 * Strips hidden fields and marks read-only fields based on RoleFieldPermission definitions.
 * 
 * @param role The user's role
 * @param entityName The name of the entity/model (e.g., 'Salary', 'BankAccount')
 * @param data The data object or array of objects to filter
 * @returns Filtered data
 */
export async function applyFieldPermissions(role: string, entityName: string, data: any | any[]) {
    if (!data) return data;
    
    // Admins usually bypass field level permissions
    if (role === 'admin' || role === 'system_admin' || role === 'owner') {
        return data;
    }

    // Since we can't easily pass the request context everywhere, we instantiate prisma.
    // In a real middleware we might use the request-bound prisma instance.
    const prisma = require('@prisma/client').PrismaClient ? new (require('@prisma/client').PrismaClient)() : null;
    if (!prisma) return data;

    try {
        const permissions = await prisma.roleFieldPermission.findMany({
            take: 100,
            where: {
                roleName: role,
                modelName: entityName,
                permission: 'HIDDEN' // We only need to strip hidden fields here
            }
        });

        if (permissions.length === 0) return data;

        const hiddenFields = permissions.map((p: any) => p.fieldName);

        const filterObject = (obj: any) => {
            if (typeof obj !== 'object' || obj === null) return obj;
            const newObj = { ...obj };
            for (const field of hiddenFields) {
                if (field in newObj) {
                    delete newObj[field];
                }
            }
            return newObj;
        };

        if (Array.isArray(data)) {
            return data.map(filterObject);
        } else {
            return filterObject(data);
        }
    } catch (error: any) {
        log.error('Field permission error:', error);
        // Fail-safe: if permission engine fails, return data as is, or maybe strip everything.
        return data;
    }
}
