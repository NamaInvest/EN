import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

let db: Database;
let dbPath: string;

export const getDb = () => db;

export async function initializeDatabase() {
  dbPath = path.join(app.getPath('userData'), 'namasoft_offline.sqlite');
  
  // Use sql.js without Native compilation
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

    db.run(`
      DROP TABLE IF EXISTS cached_license;
      CREATE TABLE cached_license (
        id TEXT PRIMARY KEY, 
        trialToken TEXT, 
        tenantId TEXT, 
        subdomain TEXT, 
        workspaceUrl TEXT, 
        trialEndsAt TEXT, 
        serverTimeAtLastVerify TEXT, 
        localTimeAtLastVerify TEXT, 
        lastSeenLocalTime TEXT, 
        status TEXT
      );
    CREATE TABLE IF NOT EXISTS cached_company (company_id TEXT PRIMARY KEY, tenant_id TEXT, name TEXT, subdomain TEXT);
    CREATE TABLE IF NOT EXISTS cached_user (user_id TEXT PRIMARY KEY, name TEXT, role TEXT);
    CREATE TABLE IF NOT EXISTS local_outbox (
      id TEXT PRIMARY KEY, eventType TEXT, tenantId TEXT, companyId TEXT, deviceId TEXT,
      localSequence INTEGER, idempotencyKey TEXT, payload TEXT, status TEXT,
      retryCount INTEGER DEFAULT 0, createdAt TEXT, lastAttemptAt TEXT
    );
    CREATE TABLE IF NOT EXISTS sync_history (id TEXT PRIMARY KEY, sync_run_at TEXT, events_synced INTEGER, errors INTEGER);
    CREATE TABLE IF NOT EXISTS dead_letter_queue (id TEXT PRIMARY KEY, original_id TEXT, error_message TEXT, failed_at TEXT);
  `);
  
  saveDatabase();
  console.log('Database Initialized:', dbPath);
}

export function saveDatabase() {
  if (db && dbPath) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}
