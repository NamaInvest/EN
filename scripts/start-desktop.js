const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────────────────────────────────────
// Desktop Dev Starter
// Creates .env.local with local DB URL, starts Next.js, restores on exit
// ──────────────────────────────────────────────────────────────────────────────

const ENV_LOCAL = path.join(__dirname, '..', '.env.local');
const ENV_LOCAL_BACKUP = path.join(__dirname, '..', '.env.local.backup');

const LOCAL_DB_URL = 'postgresql://nama:NamaLocal2026!@localhost:5433/nama_local';

// Backup existing .env.local if it exists
if (fs.existsSync(ENV_LOCAL)) {
  fs.copyFileSync(ENV_LOCAL, ENV_LOCAL_BACKUP);
  console.log('📋 Backed up existing .env.local');
}

// Create .env.local with desktop overrides (Next.js prioritizes .env.local over .env)
const envContent = `# Auto-generated for Desktop Mode — DO NOT EDIT
DATABASE_URL="${LOCAL_DB_URL}"
DESKTOP_MODE=true
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
JWT_SECRET=nama-desktop-jwt-secret-2026-local
`;

fs.writeFileSync(ENV_LOCAL, envContent);
console.log('📝 Created .env.local for desktop mode');
console.log(`   DATABASE_URL → localhost:5433/nama_local`);

// Start Next.js dev server
const next = spawn('npx', ['next', 'dev', '-p', '3500'], {
  cwd: path.join(__dirname, '..'),
  shell: true,
  stdio: 'inherit',
  env: {
    ...process.env,
    DESKTOP_MODE: 'true',
    DATABASE_URL: LOCAL_DB_URL,
  },
});

// Cleanup on exit
function cleanup() {
  console.log('\n🧹 Cleaning up .env.local...');
  try {
    if (fs.existsSync(ENV_LOCAL_BACKUP)) {
      fs.copyFileSync(ENV_LOCAL_BACKUP, ENV_LOCAL);
      fs.unlinkSync(ENV_LOCAL_BACKUP);
      console.log('📋 Restored original .env.local');
    } else {
      fs.unlinkSync(ENV_LOCAL);
      console.log('🗑️ Removed desktop .env.local');
    }
  } catch (e) {
    console.error('Cleanup error:', e.message);
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
next.on('close', cleanup);
