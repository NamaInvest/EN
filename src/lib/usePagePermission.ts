'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'usePagePermission' });

/**
 * Hook موحد للتحقق من صلاحية الوصول لصفحة معينة.
 * 
 * منطق الصلاحيات:
 * - admin / owner → وصول كامل دائماً
 * - مستخدم بدون صلاحيات (permissions.length === 0) وليس admin → يُحجب
 * - مستخدم بصلاحيات محددة → يُسمح فقط لمن لديه moduleKey في قائمته
 * 
 * @param moduleKey - مفتاح الوحدة مثل 'pos', 'purchases', 'reports'
 * @returns true إذا مسموح | false إذا ممنوع | null جاري التحقق
 */
export function usePagePermission(moduleKey: string | string[]): boolean | null {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const keyString = Array.isArray(moduleKey) ? moduleKey.join(',') : moduleKey;

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (!u?.id) {
        router.push('/login');
        return;
      }

      // admin / owner → وصول كامل
      if (u.role === 'admin' || u.role === 'owner') {
        Promise.resolve().then(() => setAllowed(true));
        return;
      }

      const perms: string[] = (u.permissions || []).map((p: { module: string }) => p.module);

      // مستخدم بدون أي صلاحية محددة → يُحجب من كل شيء
      if (perms.length === 0) {
        Promise.resolve().then(() => setAllowed(false));
        router.push('/dashboard?reason=no_permissions');
        return;
      }

      const keys = keyString.split(',');
      const hasAccess = keys.some(k => perms.includes(k));
      Promise.resolve().then(() => setAllowed(hasAccess));

      if (!hasAccess) {
        router.push('/dashboard?reason=no_access');
      }
    } catch {
      router.push('/login');
    }
  }, [keyString, router]);

  return allowed;
}
