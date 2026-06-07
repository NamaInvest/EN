export interface MockRoleConfig {
  role: string;
  permissions: string[];
}

export const MOCK_ROLES: Record<string, MockRoleConfig> = {
  CFO: {
    role: 'CFO',
    permissions: ['manage:coa', 'manage:bank_recon', 'manage:depreciation']
  },
  CASHIER: {
    role: 'CASHIER',
    permissions: ['create:pos_invoice']
  },
  HR_SPECIALIST: {
    role: 'HR_SPECIALIST',
    permissions: ['create:employee', 'manage:wps_files']
  }
};

export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(requiredPermission);
}
