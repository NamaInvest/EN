'use client';

import React from 'react';
import { useUserPermissions, Permission } from '@/hooks/useUserPermissions';

interface PermissionGateProps {
  module: string;
  action?: keyof Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export default function PermissionGate({
  module,
  action = 'canView',
  fallback = null,
  children
}: PermissionGateProps) {
  const { loading, hasPermission } = useUserPermissions();

  // Show nothing while loading to prevent flashes of unauthorized content
  if (loading) return null;

  const allowed = hasPermission(module, action);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
