import { listTmpReports } from './report-reader';
import { readPM2Status } from './health-reader';
import { getOnboardingStats } from './onboarding-reader';

export async function generateSupportOverview(): Promise<string> {
  const pm2Processes = await readPM2Status();
  const onboardingStats = await getOnboardingStats();
  const reportsList = await listTmpReports();

  const pm2Summary = pm2Processes.map(p => `- ${p.name}: ${p.status} (↺ ${p.restarts})`).join('\n');
  
  return `
=== NAMA INVEST SUPPORT OVERVIEW ===
Date: ${new Date().toISOString()}

1. Services Health (PM2 Status):
${pm2Summary}

2. Onboarding Runs Statistics:
- Total runs registered: ${onboardingStats.total}
- Awaiting Admin Approval: ${onboardingStats.awaitingApproval}
- Pending execution: ${onboardingStats.pending}
- Currently provisioning: ${onboardingStats.provisioning}
- Completed successfully: ${onboardingStats.ready}
- Failed attempts: ${onboardingStats.failed}
- Rejected: ${onboardingStats.rejected}

3. Latest Monitoring Reports found:
- ${reportsList.slice(0, 5).join('\n- ')}

4. Recommendations & Actions:
- Check PM2 status: All processes must remain online.
- Check Awaiting Approval runs: Prompt admins to review pending registrations.
- Check Failed runs: Review log snippets and suggest troubleshooting steps.
====================================
`;
}

export function suggestTroubleshootingSteps(errorCode: string, errorMessage: string): string {
  let steps = '';
  switch (errorCode) {
    case 'INVALID_INVITE_CODE':
      steps = '1. The user supplied a wrong or missing invite code.\n2. Advise the user to enter a valid, active onboarding invite code.\n3. Verify ONBOARDING_INVITE_CODES variable in the server .env if necessary.';
      break;
    case 'SUBDOMAIN_ALREADY_EXISTS':
      steps = '1. The subdomain requested is already registered in TenantAccounts.\n2. Request the user to select another unique subdomain/company English name.';
      break;
    case 'DATABASE_CREATION_FAILED':
      steps = '1. PostgreSQL database creation failed.\n2. Verify database connection string on the server.\n3. Check PostgreSQL service status on VPS (e.g. systemctl status postgresql).';
      break;
    case 'SCHEMA_PUSH_FAILED':
      steps = '1. Prisma schema push failed for the new tenant database.\n2. Ensure the migration files and schema are aligned with the server prisma package version.';
      break;
    case 'SEED_DATA_FAILED':
      steps = '1. The SOCPA Chart of Accounts seed failed to populate the new tenant DB.\n2. Check database availability and credentials for the tenant_db.';
      break;
    default:
      steps = `1. Analyze the sanitized error message: "${errorMessage}".\n2. Escalate to Level 3 development support if the root cause is programmatic.`;
  }
  return steps;
}
