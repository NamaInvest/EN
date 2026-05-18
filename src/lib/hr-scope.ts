import { JWTPayload } from './auth';
import prisma from './prisma';

/**
 * Builds a Prisma `where` scope for HR and Employee data isolation.
 * 
 * @param auth Authenticated user payload
 * @param tenantId Current tenant ID
 * @param isEmployeeTable True if querying the Employee table directly, false if querying a related table (Attendance, Leaves)
 */
export async function getHrScope(auth: JWTPayload, tenantId: string, isEmployeeTable: boolean = false) {
    if (!auth) throw new Error('Unauthorized');

    const fullAccessRoles = ['admin', 'owner', 'hr', 'hr_manager', 'payroll_admin'];
    if (fullAccessRoles.includes(auth.role)) {
        return { tenantId };
    }

    const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { branchId: true, username: true }
    });

    // We assume employeeNo matches username for ESS linkage
    const employee = await prisma.employee.findFirst({
        where: { tenantId, employeeNo: user?.username }
    });

    if (auth.role === 'branch_manager' && user?.branchId) {
        if (isEmployeeTable) {
            return { tenantId, branchId: user.branchId };
        } else {
            return { tenantId, employee: { branchId: user.branchId } };
        }
    }

    if (auth.role === 'manager' && employee) {
        if (isEmployeeTable) {
            return { tenantId, managerId: employee.id };
        } else {
            return { tenantId, employee: { managerId: employee.id } };
        }
    }

    if (employee) {
        // Standard employee self-service
        if (isEmployeeTable) {
            return { tenantId, id: employee.id };
        } else {
            return { tenantId, employeeId: employee.id };
        }
    }

    // Default deny if no mapping found for non-admin
    if (isEmployeeTable) {
        return { tenantId, id: -1 };
    } else {
        return { tenantId, employeeId: -1 };
    }
}
