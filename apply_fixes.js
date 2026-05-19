const fs = require('fs');
const path = require('path');

const projectPath = path.join(__dirname, 'namasoft-erp-launcher');

const files = {
  'electron/types.ts': `export interface LicensePayload {
  licenseKey?: string;
  companyName?: string;
  crNumber?: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
  deviceFingerprint?: string;
  os?: string;
  app?: string;
  version?: string;
}

export interface LicenseVerifyResponse {
  status: 'existing_company' | 'new_company' | 'invalid_license';
  valid: boolean;
  tenantId?: string;
  companyId?: string;
  companyName?: string;
  subdomain?: string;
  licenseExpiresAt?: string;
  suggestedSubdomain?: string;
  message?: string;
}

export interface ProvisionTenantPayload {
  licenseKey: string;
  companyName: string;
  crNumber?: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
  subdomain: string;
  deviceFingerprint: string;
  version: string;
}

export interface SyncEvent {
  id: string;
  eventType: string;
  tenantId: string;
  companyId: string;
  deviceId: string;
  localSequence: number;
  idempotencyKey: string;
  payload: string;
  status: SyncStatus;
  retryCount: number;
  createdAt: string;
  lastAttemptAt?: string | null;
}

export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED' | 'DEAD_LETTER';

export interface AppUpdateInfo {
  latestVersion: string;
  updateAvailable: boolean;
  mandatory: boolean;
  downloadUrl: string;
  sha256: string;
  changelog: string[];
}

export interface QzTrayStatus {
  installed: boolean;
  running: boolean;
  version?: string;
}
`,
  'electron/database.ts': `import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

export function initializeDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'namasoft_offline.sqlite');
  const db = new Database(dbPath);

  db.exec(\`
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
  console.log('Database Initialized:', dbPath);
}
`,
  'electron/updater.ts': `import { AppUpdateInfo } from './types';

export function compareVersions(v1: string, v2: string): number {
  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

export async function checkForUpdates(currentVersion: string): Promise<AppUpdateInfo> {
  const mockLatest = "2.4.8";
  return {
    latestVersion: mockLatest,
    updateAvailable: compareVersions(mockLatest, currentVersion) > 0,
    mandatory: false,
    downloadUrl: "https://example.com/download.exe",
    sha256: "safe_placeholder_sha256",
    changelog: ["Bug fixes"]
  };
}
`,
  'electron/qzTraySetup.ts': `import { QzTrayStatus } from './types';

export async function detectQzTray(): Promise<boolean> {
  return true; // Placeholder
}

export async function getQzTrayStatus(): Promise<QzTrayStatus> {
  const installed = await detectQzTray();
  return { installed, running: installed, version: '2.2.2' };
}

export async function installQzTrayPlaceholder(): Promise<void> {
  console.log("QZ Tray install triggered, but skipped (Placeholder).");
}
`,
  'electron/syncWorker.ts': `import { SyncEvent } from './types';

export async function processOutboxOnce(): Promise<{ success: number, failed: number }> {
  console.log("Processing Outbox... (Placeholder)");
  return { success: 0, failed: 0 };
}

export async function moveToDeadLetter(event: SyncEvent, errorMsg: string): Promise<void> {
  console.log("Moved to Dead Letter:", event.id, errorMsg);
}

export async function recordSyncHistory(successCount: number, errorCount: number): Promise<void> {
  console.log(\`Sync History: \${successCount} success, \${errorCount} errors\`);
}
`,
  'electron/licenseManager.ts': `import { machineId } from 'node-machine-id';
import os from 'os';
import crypto from 'crypto';
import { LicensePayload, LicenseVerifyResponse } from './types';

export async function generateDeviceFingerprint(): Promise<string> {
  const raw = \`\${await machineId()}-\${os.hostname()}-\${os.release()}-\${os.userInfo().username}-NamasoftERP_Salt\`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function checkLicense(data: LicensePayload): Promise<LicenseVerifyResponse> {
  return { status: 'existing_company', valid: true, tenantId: 't1', subdomain: 'example.namasoft.com' };
}
`,
  'electron/preload.ts': `import { contextBridge, ipcRenderer } from 'electron';
import type { LicensePayload } from './types';

contextBridge.exposeInMainWorld('electronAPI', {
  getFingerprint: () => ipcRenderer.invoke('app:fingerprint'),
  checkLicense: (data: LicensePayload) => ipcRenderer.invoke('license:verify', data),
  checkUpdates: () => ipcRenderer.invoke('app:checkUpdate'),
  getQzStatus: () => ipcRenderer.invoke('qz:status'),
  runSync: () => ipcRenderer.invoke('sync:runOnce')
});
`,
  'electron/main.ts': `import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initializeDatabase } from './database';
import { checkLicense, generateDeviceFingerprint } from './licenseManager';
import { checkForUpdates } from './updater';
import { getQzTrayStatus } from './qzTraySetup';
import { processOutboxOnce } from './syncWorker';
import type { LicensePayload } from './types';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, contextIsolation: true,
    },
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  initializeDatabase();
  await createWindow();
});

ipcMain.handle('app:fingerprint', async () => generateDeviceFingerprint());
ipcMain.handle('license:verify', async (_, data: LicensePayload) => checkLicense(data));
ipcMain.handle('app:checkUpdate', async () => checkForUpdates(app.getVersion()));
ipcMain.handle('qz:status', async () => getQzTrayStatus());
ipcMain.handle('sync:runOnce', async () => processOutboxOnce());
`,
  'src/lib/api.ts': `import { LicensePayload, LicenseVerifyResponse, AppUpdateInfo, QzTrayStatus } from '../../electron/types';

declare global {
  interface Window {
    electronAPI: {
      getFingerprint: () => Promise<string>;
      checkLicense: (data: LicensePayload) => Promise<LicenseVerifyResponse>;
      checkUpdates: () => Promise<AppUpdateInfo>;
      getQzStatus: () => Promise<QzTrayStatus>;
      runSync: () => Promise<{ success: number, failed: number }>;
    }
  }
}

export const api = {
  getFingerprint: () => window.electronAPI.getFingerprint(),
  checkLicense: (data: LicensePayload) => window.electronAPI.checkLicense(data),
  checkUpdates: () => window.electronAPI.checkUpdates(),
  getQzStatus: () => window.electronAPI.getQzStatus(),
  runSync: () => window.electronAPI.runSync()
};
`,
  'package.json': `{
  "name": "namasoft-erp-launcher",
  "version": "2.4.8",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build && electron-builder",
    "dist": "electron-builder",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src electron --ext .ts,.tsx"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.3",
    "lucide-react": "^0.344.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "node-machine-id": "^1.1.12"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.9",
    "@types/react": "^18.2.64",
    "@types/react-dom": "^18.2.21",
    "@typescript-eslint/eslint-plugin": "^7.1.1",
    "@typescript-eslint/parser": "^7.1.1",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "electron": "^29.1.1",
    "electron-builder": "^24.13.3",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.6",
    "vite-plugin-electron": "^0.28.2",
    "vite-plugin-electron-renderer": "^0.14.5"
  }
}
`,
  '.eslintrc.json': `{
  "root": true,
  "env": { "browser": true, "es2020": true, "node": true },
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "ignorePatterns": ["dist", "dist-electron", "node_modules", "vite.config.ts", "tailwind.config.js"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["react-refresh"],
  "rules": {
    "react-refresh/only-export-components": [
      "warn",
      { "allowConstantExport": true }
    ],
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "warn"
  }
}
`,
  'src/App.tsx': `import React, { useState, useEffect } from 'react';
import { api } from './lib/api';

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [fingerprint, setFingerprint] = useState('');

  useEffect(() => {
    api.getFingerprint().then((fp) => setFingerprint(fp));
  }, []);

  if (screen === 'welcome') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-gray-800">
        <h1 className="text-4xl font-bold text-blue-600 mb-2">Namasoft ERP Launcher</h1>
        <p className="text-lg text-gray-500 mb-8">Version 2.4.8</p>
        <button 
          onClick={() => setScreen('license')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        >
          Start Setup
        </button>
        <p className="mt-8 text-xs text-gray-400">Device FP: {fingerprint.slice(0,16)}...</p>
      </div>
    );
  }

  if (screen === 'license') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-[500px]">
          <h2 className="text-2xl font-bold mb-6 text-center">Activate License</h2>
          <input className="w-full border p-2 mb-4 rounded" placeholder="License Key" />
          <input className="w-full border p-2 mb-4 rounded" placeholder="Company Name" />
          <input className="w-full border p-2 mb-4 rounded" placeholder="VAT Number" />
          <button 
            onClick={async () => {
              const res = await api.checkLicense({ licenseKey: 'test', companyName: 'test' });
              if (res.valid) setScreen('dashboard');
            }}
            className="w-full bg-emerald-600 text-white py-2 rounded shadow hover:bg-emerald-700"
          >
            Verify & Activate
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'dashboard') {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="w-64 bg-slate-800 text-white p-4">
          <h2 className="text-xl font-bold mb-4">Namasoft</h2>
        </div>
        <div className="flex-1 p-8">
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        </div>
      </div>
    );
  }

  return null;
}
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(projectPath, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}
console.log('Project structures updated successfully.');
