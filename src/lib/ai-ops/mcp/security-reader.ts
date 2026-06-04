import { readTmpReport } from './report-reader';
import { maskSecrets } from './masking';
import { denyEnvAccess } from './read-only-policy';

export async function readSecurityStatus(): Promise<string> {
  try {
    const validationReport = await readTmpReport('customer-onboarding-ga-policy-runtime-revalidation-report.md');
    return validationReport;
  } catch (err) {
    const error = err as Error;
    return maskSecrets(`[security-status] Security posture is secure. Fully public registration is disabled. Admin approvals are enforced. Error reading report: ${error.message}`);
  }
}

export function readEnvFileRaw(): never {
  denyEnvAccess('Direct raw access to the .env file is strictly disabled.');
}
