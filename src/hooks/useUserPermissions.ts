'use client';

import { useState, useEffect } from 'react';

// Module-level cache to share profile promise and data across multiple component instances
let cachedUserPromise: Promise<any> | null = null;
let cachedUserData: any = null;

export interface Permission {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPrint: boolean;
}

export interface UserProfile {
  id: number;
  username: string;
  name: string;
  role: string;
  active: boolean;
  branchId: number | null;
  defaultPage: string | null;
  createdAt: string;
  tenantId: string;
  permissionsMap: Record<string, Permission>;
}

export function useUserPermissions() {
  const [user, setUser] = useState<UserProfile | null>(cachedUserData);
  const [loading, setLoading] = useState(!cachedUserData);
  const [error, setError] = useState<string | null>(null);

  // Function to invalidate cache (useful on logout or force refresh)
  const invalidateCache = () => {
    cachedUserPromise = null;
    cachedUserData = null;
  };

  const fetchProfile = () => {
    if (cachedUserData) {
      setUser(cachedUserData);
      setLoading(false);
      return;
    }

    if (!cachedUserPromise) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      cachedUserPromise = fetch('/api/auth/me', { headers })
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch user permissions map');
          }
          return res.json();
        })
        .then(data => {
          cachedUserData = data;
          return data;
        })
        .catch(err => {
          cachedUserPromise = null; // Reset promise so we can retry on failure
          throw err;
        });
    }

    cachedUserPromise
      .then(data => {
        setUser(data);
        setError(null);
      })
      .catch(err => {
        setError(err.message || 'Error loading permissions');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Safe checks. Defaults to deny (false) on any error, missing user, or missing map.
  const hasPermission = (
    module: string,
    action: keyof Permission = 'canView'
  ): boolean => {
    if (!user) return false;
    
    // Admins and owners bypass all functional module restrictions
    const role = user.role?.toLowerCase();
    if (role === 'admin' || role === 'owner' || role === 'master_admin') {
      return true;
    }

    if (user.permissionsMap?.[module]?.[action]) {
      return true;
    }

    // Fallback mapping for sales.quotation.*
    if (module.startsWith('sales.quotation.')) {
      const parentPerm = user.permissionsMap?.['price_quotes'] || user.permissionsMap?.['sales_quotes'];
      if (parentPerm) {
        const subAction = module.replace('sales.quotation.', '');
        if (subAction === 'view') return parentPerm.canView;
        if (subAction === 'create') return parentPerm.canAdd;
        if (subAction === 'update') return parentPerm.canEdit;
        if (subAction === 'delete') return parentPerm.canDelete;
        if (['print', 'send', 'accept', 'reject', 'convert_to_invoice', 'cancel'].includes(subAction)) return parentPerm.canPrint;
      }
    }

    const modulePerms = user.permissionsMap?.[module];
    if (!modulePerms) return false;

    return !!modulePerms[action];
  };

  // Helper shortcuts
  const canView = (module: string) => hasPermission(module, 'canView');
  const canAdd = (module: string) => hasPermission(module, 'canAdd');
  const canEdit = (module: string) => hasPermission(module, 'canEdit');
  const canDelete = (module: string) => hasPermission(module, 'canDelete');
  const canPrint = (module: string) => hasPermission(module, 'canPrint');

  const hasRole = (roleName: string): boolean => {
    return user?.role?.toLowerCase() === roleName.toLowerCase();
  };

  const isAdmin = 
    user?.role?.toLowerCase() === 'admin' || 
    user?.role?.toLowerCase() === 'owner' || 
    user?.role?.toLowerCase() === 'master_admin';

  const isFinanceManager = 
    isAdmin || user?.role?.toLowerCase() === 'accountant';

  const isHRManager = 
    isAdmin || user?.role?.toLowerCase() === 'hr_manager' || user?.role?.toLowerCase() === 'hr';

  return {
    user,
    loading,
    error,
    hasPermission,
    canView,
    canAdd,
    canEdit,
    canDelete,
    canPrint,
    hasRole,
    isAdmin,
    isFinanceManager,
    isHRManager,
    refetch: () => {
      invalidateCache();
      setLoading(true);
      fetchProfile();
    }
  };
}
