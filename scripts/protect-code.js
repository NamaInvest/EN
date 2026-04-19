const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────────────────────────────────────
// Nama Invest — Code Protection Script
// 3 Layers: Obfuscation → Bytecode → ASAR Encryption
// ──────────────────────────────────────────────────────────────────────────────

const OBFUSCATION_CONFIG = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: true,
  debugProtectionInterval: 2000,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 5,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
};

function obfuscateFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const obfuscated = JavaScriptObfuscator.obfuscate(code, OBFUSCATION_CONFIG);
  return obfuscated.getObfuscatedCode();
}

function obfuscateDirectory(dir, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const outPath = path.join(outputDir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      obfuscateDirectory(fullPath, outPath);
    } else if (file.endsWith('.js')) {
      console.log(`🔒 Obfuscating: ${file}`);
      try {
        const obfuscated = obfuscateFile(fullPath);
        fs.writeFileSync(outPath, obfuscated);
        console.log(`  ✅ ${file} — ${(obfuscated.length / 1024).toFixed(1)} KB`);
      } catch (e) {
        console.log(`  ⚠️ Skipping ${file}: ${e.message}`);
        fs.copyFileSync(fullPath, outPath);
      }
    } else {
      fs.copyFileSync(fullPath, outPath);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const electronDir = path.join(__dirname, '..', 'electron');
  const outputDir = path.join(__dirname, '..', 'electron-protected');

  console.log('\n🔐 Nama Invest Code Protection');
  console.log('================================');
  console.log('Layer 1: JavaScript Obfuscation');
  console.log(`Input:  ${electronDir}`);
  console.log(`Output: ${outputDir}\n`);

  obfuscateDirectory(electronDir, outputDir);

  console.log('\n✅ Code protection complete!');
  console.log('The protected code is in: electron-protected/');
  console.log('\nNext steps:');
  console.log('  1. Use electron-protected/ in your build');
  console.log('  2. electron-builder will auto-pack as ASAR (Layer 2)');
  console.log('  3. ASAR integrity check prevents tampering (Layer 3)');
}

module.exports = { obfuscateFile, obfuscateDirectory, OBFUSCATION_CONFIG };
