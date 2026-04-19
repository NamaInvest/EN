const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ──────────────────────────────────────────────────────────────────────────────
// After-Pack Hook — Obfuscate code inside the packaged app
// ──────────────────────────────────────────────────────────────────────────────

exports.default = async function afterPack(context) {
  console.log('\n🔐 Running code protection...');
  
  const appDir = path.join(context.appOutDir, 'resources', 'app');
  const electronDir = path.join(appDir, 'electron');
  
  if (!fs.existsSync(electronDir)) {
    console.log('⚠️ electron/ dir not found in package, skipping protection');
    return;
  }

  try {
    const { obfuscateDirectory } = require('./protect-code');
    const tempDir = path.join(context.appOutDir, '_protected_temp');
    
    obfuscateDirectory(electronDir, tempDir);
    
    // Replace original with protected
    fs.rmSync(electronDir, { recursive: true, force: true });
    fs.renameSync(tempDir, electronDir);
    
    console.log('✅ Code protection applied to packaged app!');
  } catch (e) {
    console.error('⚠️ Code protection error (non-fatal):', e.message);
  }
};
