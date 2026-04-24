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
  } else {

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
  }

  // Next.js Standalone Manual Copy
  // electron-builder is aggressive with node_modules. We bypass it by copying things manually.
  try {
    const standaloneSrc = path.join(context.packager.projectDir, '.next', 'standalone');
    const standaloneDest = path.join(context.appOutDir, 'resources', 'standalone');
    if (fs.existsSync(standaloneSrc)) {
      console.log('📦 Copying NextJS standalone server (bypassing builder)...');
      fs.cpSync(standaloneSrc, standaloneDest, { recursive: true });
      
      console.log('📦 Copying public and static assets...');
      fs.cpSync(path.join(context.packager.projectDir, '.next', 'static'), path.join(standaloneDest, '.next', 'static'), { recursive: true });
      fs.cpSync(path.join(context.packager.projectDir, 'public'), path.join(standaloneDest, 'public'), { recursive: true });
      
      console.log('📦 Copying Prisma CLI for offline migrations...');
      const prismaCliSrc = path.join(context.packager.projectDir, 'node_modules', 'prisma');
      const prismaCliDest = path.join(standaloneDest, 'node_modules', 'prisma');
      if (fs.existsSync(prismaCliSrc)) {
         fs.cpSync(prismaCliSrc, prismaCliDest, { recursive: true });
      }
      const prismaEnginesSrc = path.join(context.packager.projectDir, 'node_modules', '@prisma', 'engines');
      const prismaEnginesDest = path.join(standaloneDest, 'node_modules', '@prisma', 'engines');
      if (fs.existsSync(prismaEnginesSrc)) {
         fs.cpSync(prismaEnginesSrc, prismaEnginesDest, { recursive: true });
      }
    }
  } catch (e) {
    console.error('⚠️ Error copying standalone server resources:', e.message);
  }
};
