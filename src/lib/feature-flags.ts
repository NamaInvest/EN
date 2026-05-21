import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// In-memory cache for feature flags to reduce DB load
let cache: Record<string, any> = {};
let lastFetchTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchFeatureFlags() {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_TTL && Object.keys(cache).length > 0) {
    return cache;
  }

  const flags = await prisma.featureFlag.findMany();
  const newCache: Record<string, any> = {};
  
  for (const flag of flags) {
    newCache[flag.key] = flag;
  }

  cache = newCache;
  lastFetchTime = now;
  return cache;
}

export async function isEnabled(key: string, tenantId?: string, userId?: string): Promise<boolean> {
  const flags = await fetchFeatureFlags();
  const flag = flags[key];

  if (!flag) return false;
  if (!flag.enabled) return false;

  // Global enablement without restrictions
  if (!flag.targetTenants && !flag.targetUsers && flag.percentage === 100) {
    return true;
  }

  // Tenant targeting
  if (tenantId && flag.targetTenants) {
    const tenants = typeof flag.targetTenants === 'string' 
      ? JSON.parse(flag.targetTenants) 
      : flag.targetTenants;
    if (Array.isArray(tenants) && tenants.includes(tenantId)) {
      return true;
    }
  }

  // User targeting
  if (userId && flag.targetUsers) {
    const users = typeof flag.targetUsers === 'string'
      ? JSON.parse(flag.targetUsers)
      : flag.targetUsers;
    if (Array.isArray(users) && users.includes(userId)) {
      return true;
    }
  }

  // Percentage rollout based on tenantId or generic random (not strictly consistent without hash)
  if (flag.percentage > 0) {
    // Simple deterministic hash based on tenantId or fallback to random
    if (tenantId) {
      const hash = tenantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      if ((hash % 100) < flag.percentage) return true;
    } else {
      if ((Math.random() * 100) < flag.percentage) return true;
    }
  }

  return false;
}
