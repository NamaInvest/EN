const { Client } = require('ssh2');

const SERVER = '46.4.188.170';

function ssh(cmd) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.exec(cmd, (err, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += d);
        stream.on('close', () => { c.end(); r(out.trim()); });
      });
    }).connect({ host: SERVER, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

function writeFile(remotePath, content) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) { c.end(); return r(false); }
        const ws = sftp.createWriteStream(remotePath, { flags: 'w', encoding: null, mode: 0o644 });
        ws.on('close', () => { c.end(); r(true); });
        ws.on('error', () => { c.end(); r(false); });
        ws.end(Buffer.from(content, 'utf8'));
      });
    }).on('error', () => r(false))
      .connect({ host: SERVER, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

function readRemoteFile(remotePath) {
  return new Promise(r => {
    const c = new Client();
    c.on('ready', () => {
      c.sftp((err, sftp) => {
        if (err) { c.end(); return r(''); }
        const chunks = [];
        const rs = sftp.createReadStream(remotePath);
        rs.on('data', d => chunks.push(d));
        rs.on('end', () => { c.end(); r(Buffer.concat(chunks).toString('utf8')); });
        rs.on('error', () => { c.end(); r(''); });
      });
    }).on('error', () => r(''))
      .connect({ host: SERVER, port: 22, username: 'root', password: '_ee4SWbxLVfH9b' });
  });
}

(async () => {
  console.log('=== Reading _landing.tsx from server ===');
  let content = await readRemoteFile('/www/wwwroot/namainvist.com/src/app/_landing.tsx');
  console.log(`Read: ${content.length} bytes, ${content.split('\n').length} lines`);
  
  // Find the hero section text
  const heroMatches = content.match(/73[^"']*(?:قسم|وحدة|برمجي|نموذج|module)/g);
  console.log('Found 73 references:', heroMatches || 'none');
  
  // Fix ALL occurrences of 73 references in the landing page
  let fixed = content
    // Hero main number
    .replace(/73 قسم برمجي في بيئة موحدة/g, '104 وحدة برمجية في بيئة واحدة')
    .replace(/\(73 قسم برمجي في بيئة موحدة\)/g, '(104 وحدة برمجية في بيئة واحدة)')
    // Any "73 قسم" pattern
    .replace(/73 قسم/g, '104 وحدة')
    // Stats counter showing 73
    .replace(/\+73/g, '+104')
    .replace(/'73\+'/g, "'104+'")
    .replace(/"73\+"/g, '"104+"')
    // "73 نموذج" or "73 module"
    .replace(/73 نموذج/g, '104 وحدة')
    .replace(/73-module/gi, '104-module')
    // Any remaining "73" that's a module count (not part of other numbers like 730, 173 etc)
    .replace(/\b73\b(?= وحدة| قسم| نموذج| module| Module)/g, '104');
  
  // Count total changes
  const changes = [];
  if (content !== fixed) {
    const origLines = content.split('\n');
    const fixedLines = fixed.split('\n');
    origLines.forEach((line, i) => {
      if (line !== fixedLines[i]) {
        changes.push(`Line ${i+1}: "${line.trim()}" → "${fixedLines[i].trim()}"`);
      }
    });
  }
  
  console.log(`\nChanges made: ${changes.length}`);
  changes.forEach(c => console.log(' ', c));
  
  if (changes.length === 0) {
    console.log('\n⚠️  No changes detected in _landing.tsx');
    // Show hero section
    const heroSection = content.split('\n').filter(l => l.includes('73') || l.includes('قسم') || l.includes('hero') || l.includes('Hero')).slice(0, 10);
    console.log('Lines with 73/قسم/hero:\n', heroSection.join('\n'));
  } else {
    // Upload fixed version
    console.log('\n=== Uploading fixed _landing.tsx ===');
    const ok = await writeFile('/www/wwwroot/namainvist.com/src/app/_landing.tsx', fixed);
    console.log(ok ? '[✓] Uploaded' : '[✗] Upload failed');
    
    // Rebuild
    console.log('\n=== Rebuilding namainvist.com ===');
    await ssh('cd /www/wwwroot/namainvist.com && rm -rf .next && npm run build 2>&1 | tail -5 && pm2 restart main-site 2>&1 | tail -2');
    
    console.log('\n✅ Done! Try https://namainvist.com now');
  }
})();
