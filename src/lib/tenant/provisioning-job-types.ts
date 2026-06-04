export interface ProvisioningPayload {
  provisioningRunId: string;
  tenantName: string;
  requestedSubdomain: string;
  ownerName: string;
  ownerEmail: string;
  locale: string;
  source: string;
  correlationId: string;
  createdAt: Date;
  password?: string;
  adminName?: string;
  username?: string;
  initialStatus?: ProvisioningRunStatus;
}

export type ProvisioningJobStep =
  | 'VALIDATE_REQUEST'
  | 'RESERVE_SUBDOMAIN'
  | 'CREATE_TENANT_RECORD'
  | 'VERIFY_SCHEMA'
  | 'SEED_INITIAL_DATA'
  | 'CREATE_OWNER_USER'
  | 'CREATE_DEFAULT_ROLES'
  | 'CONFIGURE_SUBDOMAIN'
  | 'VERIFY_TENANT_HEALTH'
  | 'MARK_READY';

export type ProvisioningRunStatus =
  | 'PENDING'
  | 'VALIDATING'
  | 'RESERVED'
  | 'PROVISIONING'
  | 'VERIFYING'
  | 'READY'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED'
  | 'NEEDS_MANUAL_REVIEW'
  | 'AWAITING_APPROVAL';

export interface ProvisioningJobState {
  runId: string;
  subdomain: string;
  status: ProvisioningRunStatus;
  currentStep: ProvisioningJobStep | null;
  attemptNo: number;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  failedAt: Date | null;
}
