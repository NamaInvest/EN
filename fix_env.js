const fs = require('fs');
const path = require('path');

const projectPath = path.join(__dirname, 'namasoft-erp-launcher');

// 1. Remove better-sqlite3 and add sql.js to package.json
const pkgPath = path.join(projectPath, 'package.json');
let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

delete pkg.dependencies['better-sqlite3'];
delete pkg.devDependencies['@types/better-sqlite3'];
pkg.dependencies['sql.js'] = '^1.10.2';
pkg.devDependencies['@types/sql.js'] = '^1.4.9';

// Fix lint script
pkg.scripts['lint'] = 'eslint "electron/**/*.{ts,tsx}" "src/**/*.{ts,tsx}"';

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

// 2. Rewrite electron/database.ts to use sql.js
const dbTsPath = path.join(projectPath, 'electron', 'database.ts');
const dbTsContent = `import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

let db: any;
let dbPath: string;

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

  db.run(\`
    CREATE TABLE IF NOT EXISTS cached_license (id TEXT PRIMARY KEY, key_hash TEXT, expires_at TEXT, status TEXT);
    CREATE TABLE IF NOT EXISTS cached_company (company_id TEXT PRIMARY KEY, tenant_id TEXT, name TEXT, subdomain TEXT);
    CREATE TABLE IF NOT EXISTS cached_user (user_id TEXT PRIMARY KEY, name TEXT, role TEXT);
    CREATE TABLE IF NOT EXISTS local_outbox (
      id TEXT PRIMARY KEY, eventType TEXT, tenantId TEXT, companyId TEXT, deviceId TEXT,
      localSequence INTEGER, idempotencyKey TEXT, payload TEXT, status TEXT,
      retryCount INTEGER DEFAULT 0, createdAt TEXT, lastAttemptAt TEXT
    );
    CREATE TABLE IF NOT EXISTS sync_history (id TEXT PRIMARY KEY, sync_run_at TEXT, events_synced INTEGER, errors INTEGER);
    CREATE TABLE IF NOT EXISTS dead_letter_queue (id TEXT PRIMARY KEY, original_id TEXT, error_message TEXT, failed_at TEXT);
  \`);
  
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
`;
fs.writeFileSync(dbTsPath, dbTsContent);

// 3. Add src/vite-env.d.ts
const viteEnvPath = path.join(projectPath, 'src', 'vite-env.d.ts');
fs.writeFileSync(viteEnvPath, '/// <reference types="vite/client" />\n');

// 4. Update tsconfig.json to include vite-env.d.ts if not already (it covers src by default)

// 5. Fix electron/licenseManager.ts (unused data var)
const licenseManagerPath = path.join(projectPath, 'electron', 'licenseManager.ts');
let licenseManagerContent = fs.readFileSync(licenseManagerPath, 'utf8');
// Prefix data with underscore to avoid unused warning
licenseManagerContent = licenseManagerContent.replace(
  'export async function checkLicense(data: LicensePayload)',
  'export async function checkLicense(_data: LicensePayload)'
);
fs.writeFileSync(licenseManagerPath, licenseManagerContent);

// 6. Fix src/App.tsx (unused React var)
const appTsxPath = path.join(projectPath, 'src', 'App.tsx');
let appTsxContent = fs.readFileSync(appTsxPath, 'utf8');
appTsxContent = appTsxContent.replace(
  "import React, { useState, useEffect } from 'react';",
  "import { useState, useEffect } from 'react';"
);
fs.writeFileSync(appTsxPath, appTsxContent);

// 7. Fix main.tsx (unused React var - though it is used in JSX, but strict TS might complain if JSX is preserved. We'll leave it as React 17 handles it without import if compilerOptions.jsx is react-jsx)
// Wait, React is actually used in <React.StrictMode>
// The error was only in App.tsx

console.log('Environment fixes applied successfully.');
