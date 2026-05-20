import { machineId } from 'node-machine-id';
import os from 'os';
import crypto from 'crypto';
import { LicensePayload, LicenseVerifyResponse } from './types';
import { getDb, saveDatabase } from './database';

export async function generateDeviceFingerprint(): Promise<string> {
  const raw = `${await machineId()}-${os.hostname()}-${os.release()}-${os.userInfo().username}-NamasoftERP_Salt`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function checkLicense(_data: LicensePayload): Promise<LicenseVerifyResponse> {
  const db = getDb();
  if (!db) return { status: 'invalid_license', valid: false, message: 'Database not initialized' };

  let cachedLicense: any = null;
  try {
    const res = db.exec("SELECT * FROM cached_license LIMIT 1");
    if (res.length > 0 && res[0].values.length > 0) {
      const columns = res[0].columns;
      const values = res[0].values[0];
      cachedLicense = columns.reduce((acc: any, col: string, idx: number) => {
        acc[col] = values[idx];
        return acc;
      }, {});
    }
  } catch(e) {}

  const currentLocalTime = Date.now();
  const fingerprint = await generateDeviceFingerprint();

  // If we have a cached license, update lastSeenLocalTime to detect rollback
  if (cachedLicense) {
    const lastSeen = parseInt(cachedLicense.lastSeenLocalTime || '0', 10);
    if (currentLocalTime < lastSeen) {
      // Time rollback detected!
      db.run("UPDATE cached_license SET status = 'LOCKED' WHERE id = ?", [cachedLicense.id]);
      saveDatabase();
      return { status: 'INVALID', valid: false, message: 'Time tampering detected. System locked.' };
    }
    // Update last seen time
    db.run("UPDATE cached_license SET lastSeenLocalTime = ? WHERE id = ?", [currentLocalTime.toString(), cachedLicense.id]);
    saveDatabase();
  }

  // Determine payload for verification
  const payload = {
    fingerprint,
    trialToken: cachedLicense?.trialToken,
    subdomain: cachedLicense?.subdomain || _data.companyName // fallback if companyName holds subdomain from form
  };

  // Try to verify online
  try {
    const response = await fetch('https://namainvist.com/api/desktop/trial/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json() as any;

    if (result.valid) {
      // Online and Active! Update local cache
      const id = cachedLicense?.id || crypto.randomUUID();
      db.run(`
        INSERT INTO cached_license (id, trialToken, tenantId, subdomain, workspaceUrl, trialEndsAt, serverTimeAtLastVerify, localTimeAtLastVerify, lastSeenLocalTime, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET 
          trialToken = excluded.trialToken,
          tenantId = excluded.tenantId,
          subdomain = excluded.subdomain,
          workspaceUrl = excluded.workspaceUrl,
          trialEndsAt = excluded.trialEndsAt,
          serverTimeAtLastVerify = excluded.serverTimeAtLastVerify,
          localTimeAtLastVerify = excluded.localTimeAtLastVerify,
          lastSeenLocalTime = excluded.lastSeenLocalTime,
          status = excluded.status
      `, [
        id, 
        cachedLicense?.trialToken || 'online-token', // we don't have token from backend verify yet, but maybe backend can send one
        result.tenantId, result.subdomain || payload.subdomain, result.workspaceUrl, result.trialEndsAt, 
        result.serverTime, currentLocalTime.toString(), currentLocalTime.toString(), 'ACTIVE'
      ]);
      saveDatabase();
      return { status: 'ACTIVE', valid: true, tenantId: result.tenantId, subdomain: payload.subdomain, workspaceUrl: result.workspaceUrl, daysRemaining: result.daysRemaining };
    } else if (result.trialStatus === 'EXPIRED') {
      if (cachedLicense) {
        db.run("UPDATE cached_license SET status = 'EXPIRED' WHERE id = ?", [cachedLicense.id]);
        saveDatabase();
      }
      return { status: 'EXPIRED', valid: false, message: 'Trial has expired' };
    } else {
      return { status: 'INVALID', valid: false, message: result.reason || 'Invalid license' };
    }
  } catch (e: any) {
    // Offline logic (OFFLINE_GRACE)
    if (!cachedLicense) {
      return { status: 'INVALID', valid: false, message: 'No internet connection and no cached license found.' };
    }

    if (cachedLicense.status === 'EXPIRED' || cachedLicense.status === 'LOCKED') {
      return { status: cachedLicense.status, valid: false, message: 'License is expired or locked locally.' };
    }

    // Check offline grace conditions
    const trialEndsAt = new Date(cachedLicense.trialEndsAt).getTime();
    if (currentLocalTime > trialEndsAt) {
       db.run("UPDATE cached_license SET status = 'EXPIRED' WHERE id = ?", [cachedLicense.id]);
       saveDatabase();
       return { status: 'EXPIRED', valid: false, message: 'Trial expired locally based on known end date.' };
    }

    // If everything is fine, allow OFFLINE_GRACE
    return { status: 'OFFLINE_GRACE', valid: true, tenantId: cachedLicense.tenantId, subdomain: cachedLicense.subdomain, workspaceUrl: cachedLicense.workspaceUrl, message: 'Working offline' };
  }
}

export async function saveProvisionedLicense(data: any): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  
  const currentLocalTime = Date.now().toString();
  const id = crypto.randomUUID();

  db.run(`
    INSERT INTO cached_license (id, trialToken, tenantId, subdomain, workspaceUrl, trialEndsAt, serverTimeAtLastVerify, localTimeAtLastVerify, lastSeenLocalTime, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET 
      trialToken = excluded.trialToken,
      tenantId = excluded.tenantId,
      subdomain = excluded.subdomain,
      workspaceUrl = excluded.workspaceUrl,
      trialEndsAt = excluded.trialEndsAt,
      serverTimeAtLastVerify = excluded.serverTimeAtLastVerify,
      localTimeAtLastVerify = excluded.localTimeAtLastVerify,
      lastSeenLocalTime = excluded.lastSeenLocalTime,
      status = excluded.status
  `, [
    id, 
    data.trialToken || '',
    data.tenantId || '',
    data.subdomain || '',
    data.workspaceUrl || '',
    data.trialEndsAt || '',
    data.serverTime || currentLocalTime,
    currentLocalTime,
    currentLocalTime,
    'ACTIVE'
  ]);
  saveDatabase();
  return true;
}
