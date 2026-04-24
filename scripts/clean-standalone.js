const fs = require('fs');
const path = require('path');

const standaloneDir = path.join(__dirname, '..', process.env.ELECTRON_BUILD ? '.next-electron' : '.next', 'standalone');

if (fs.existsSync(standaloneDir)) {
  console.log('🧹 Cleaning NextJS standalone directory from bloated traces...');
  const files = fs.readdirSync(standaloneDir);
  for (const file of files) {
    const filePath = path.join(standaloneDir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isFile()) {
      // Keep server.js
      if (file === 'server.js') continue;
      
      // Remove all utility scripts accidentally traced by NextJS
      if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.bat') || file.endsWith('.sh') || file.endsWith('.zip') || file.endsWith('.log') || file.endsWith('.txt') || file.endsWith('.tar.gz') || file.endsWith('.json')) {
        
        // Keep essential files
        if (file === 'package.json' || file.includes('chunk') || file.includes('env')) {
          continue;
        }

        try {
          fs.unlinkSync(filePath);
        } catch (e) { }
      }
    }
  }
  // Install Prisma in isolation then merge into standalone
  console.log('\n📦 Downloading Prisma CLI into standalone bundle for offline capabilities...');
  try {
    const { execSync } = require('child_process');
    const tmpDir = path.join(__dirname, '..', '.tmp-prisma-cli');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    
    // Install purely in the tmp dir to prevent NPM from destroying NextJS un-tracked modules
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: "prisma-sandbox", version: "1.0.0" }));
    execSync('npm install prisma@^5.14.0 --no-package-lock', { cwd: tmpDir, stdio: 'inherit' });

    // Recursively copy all fetched dependencies from tmp/node_modules to standalone/node_modules
    const srcNodeModules = path.join(tmpDir, 'node_modules');
    const destNodeModules = path.join(standaloneDir, 'node_modules');
    
    const cpSync = (src, dest) => {
      if (fs.existsSync(src)) {
        const stats = fs.statSync(src);
        if (stats.isDirectory()) {
          if (!fs.existsSync(dest)) fs.mkdirSync(dest);
          fs.readdirSync(src).forEach(item => cpSync(path.join(src, item), path.join(dest, item)));
        } else {
          fs.copyFileSync(src, dest);
        }
      }
    };
    
    cpSync(srcNodeModules, destNodeModules);
    console.log('✅ Prisma CLI offline wrapper fetched and merged securely.');
  } catch(e) {
    console.error('⚠️ Failed to append Prisma CLI to standalone: ', e.message);
  }
}
