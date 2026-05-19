import { machineId } from 'node-machine-id';
import os from 'os';
import crypto from 'crypto';
import { LicensePayload, LicenseVerifyResponse } from './types';

export async function generateDeviceFingerprint(): Promise<string> {
  const raw = `${await machineId()}-${os.hostname()}-${os.release()}-${os.userInfo().username}-NamasoftERP_Salt`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function checkLicense(_data: LicensePayload): Promise<LicenseVerifyResponse> {
  return { status: 'existing_company', valid: true, tenantId: 't1', subdomain: 'example.namasoft.com' };
}
