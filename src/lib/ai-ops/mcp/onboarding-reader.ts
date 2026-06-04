import { PrismaClient } from '@prisma/client';
import { denyDbMutation, denyOnboardingActions } from './read-only-policy';

export interface ProvisioningRunSummary {
  id: string;
  subdomain: string;
  status: string;
  currentStep: string | null;
  attemptNo: number;
  createdAt: Date;
}

export interface TenantAccountSummary {
  subdomain: string;
  status: string;
  userEmail: string;
  createdAt: Date;
}

function getPrismaClient(): PrismaClient {
  const globalRef = global as unknown as { __mcpPrismaInstance?: PrismaClient };
  if (!globalRef.__mcpPrismaInstance) {
    globalRef.__mcpPrismaInstance = new PrismaClient();
  }
  return globalRef.__mcpPrismaInstance;
}

export async function readProvisioningRuns(): Promise<ProvisioningRunSummary[]> {
  const prisma = getPrismaClient();
  const runs = await prisma.tenantProvisioningRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return runs.map(r => ({
    id: r.id,
    subdomain: r.subdomain,
    status: r.status,
    currentStep: r.currentStep,
    attemptNo: r.attemptNo,
    createdAt: r.createdAt
  }));
}

export async function readTenantAccounts(): Promise<TenantAccountSummary[]> {
  const prisma = getPrismaClient();
  const accounts = await prisma.tenantAccount.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return accounts.map(a => ({
    subdomain: a.subdomain,
    status: a.status,
    userEmail: a.userEmail,
    createdAt: a.createdAt
  }));
}

export async function getOnboardingStats() {
  const prisma = getPrismaClient();
  const runs = await prisma.tenantProvisioningRun.findMany();
  
  const stats = {
    total: runs.length,
    awaitingApproval: runs.filter(r => r.status === 'AWAITING_APPROVAL').length,
    pending: runs.filter(r => r.status === 'PENDING').length,
    provisioning: runs.filter(r => r.status === 'PROVISIONING').length,
    ready: runs.filter(r => r.status === 'READY').length,
    failed: runs.filter(r => r.status === 'FAILED').length,
    rejected: runs.filter(r => r.status === 'REJECTED').length,
  };

  return stats;
}

export function approveOnboardingRun(): never {
  denyOnboardingActions('Approving onboarding runs is strictly disabled in Read-Only MCP.');
}

export function rejectOnboardingRun(): never {
  denyOnboardingActions('Rejecting onboarding runs is strictly disabled in Read-Only MCP.');
}

export function retryOnboardingRun(): never {
  denyOnboardingActions('Retrying onboarding runs is strictly disabled in Read-Only MCP.');
}

export function createNewTenant(): never {
  denyDbMutation('Creating a tenant is strictly disabled in Read-Only MCP.');
}
