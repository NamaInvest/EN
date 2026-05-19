const fs = require('fs');
const path = require('path');

const projectPath = path.join(__dirname, 'namasoft-erp-launcher');

// Create directories
const dirs = [
  'electron',
  'src',
  'src/components',
  'src/lib',
  'src/assets',
  'build'
];

dirs.forEach(d => {
  fs.mkdirSync(path.join(projectPath, d), { recursive: true });
});

const files = {
  'package.json': `{
  "name": "namasoft-erp-launcher",
  "version": "2.4.8",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build && electron-builder",
    "dist": "electron-builder"
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
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "electron": "^29.1.1",
    "electron-builder": "^24.13.3",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.6",
    "vite-plugin-electron": "^0.28.2",
    "vite-plugin-electron-renderer": "^0.14.5"
  }
}`,
  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "electron"]
}`,
  'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: { entry: 'electron/main.ts' },
      preload: { input: 'electron/preload.ts' },
    }),
  ],
});`,
  'electron-builder.yml': `appId: com.namasoft.erplauncher
productName: NamasoftERPLauncher
directories:
  output: release/\${version}
files:
  - dist
  - dist-electron
win:
  target:
    - target: nsis
      arch:
        - x64
nsis:
  oneClick: false
  allowElevation: true
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: Namasoft ERP`,
  'electron/main.ts': `import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initializeDatabase } from './database';
import { checkLicense, generateDeviceFingerprint } from './licenseManager';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
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

ipcMain.handle('get-fingerprint', async () => generateDeviceFingerprint());
ipcMain.handle('check-license', async (_, data) => checkLicense(data));
`,
  'electron/preload.ts': `import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electronAPI', {
  getFingerprint: () => ipcRenderer.invoke('get-fingerprint'),
  checkLicense: (data: any) => ipcRenderer.invoke('check-license', data)
});`,
  'electron/database.ts': `import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

export function initializeDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'namasoft_offline.sqlite');
  const db = new Database(dbPath);

  db.exec(\`
    CREATE TABLE IF NOT EXISTS cached_license (id TEXT PRIMARY KEY, status TEXT);
    CREATE TABLE IF NOT EXISTS local_outbox (
      id TEXT PRIMARY KEY, event_type TEXT, payload TEXT, status TEXT, created_at TEXT
    );
  \`);
  console.log('DB Init:', dbPath);
}`,
  'electron/licenseManager.ts': `import { machineId } from 'node-machine-id';
import os from 'os';
import crypto from 'crypto';

export async function generateDeviceFingerprint(): Promise<string> {
  const raw = \`\${await machineId()}-\${os.hostname()}-\${os.release()}-\${os.userInfo().username}-NamasoftERP_Salt\`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function checkLicense(data: any): Promise<any> {
  return { status: 'existing_company', valid: true, tenantId: 't1', subdomain: 'example.namasoft.com' };
}`,
  'src/App.tsx': `import React, { useState } from 'react';
export default function App() {
  const [screen, setScreen] = useState('welcome');
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
      <h1 className="text-4xl font-bold text-blue-600 mb-2">Namasoft ERP Launcher</h1>
      <p className="text-gray-500 mb-6">Version 2.4.8</p>
      <button onClick={() => setScreen('license')} className="bg-blue-600 text-white px-6 py-2 rounded">Start Setup</button>
    </div>
  );
}`,
  'src/main.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode><App /></React.StrictMode>
);`,
  'src/index.css': `@tailwind base; @tailwind components; @tailwind utilities;`,
  'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}`,
  'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Namasoft ERP Launcher</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(projectPath, filepath), content);
}
console.log('Project scaffolded successfully in', projectPath);
