const JSZip = require("jszip");
const fs = require("fs");
const path = require("path");

const zip = new JSZip();

const filesToZip = [
  'next.config.ts',
  'package.json',
  'package-lock.json',
  'src/app/layout.tsx',
  'public/manifest.json',
  'public/icon-192x192.png',
  'public/icon-512x512.png'
];

for (const file of filesToZip) {
  const absolutePath = path.join(__dirname, file);
  if (fs.existsSync(absolutePath)) {
    const content = fs.readFileSync(absolutePath);
    // Explicitly handle folders vs files (JSZip requires nested structure handled)
    zip.file(file, content);
    console.log(`Added: ${file}`);
  } else {
    console.error(`Missing: ${file}`);
  }
}

zip.generateAsync({type:"nodebuffer", compression: "DEFLATE"})
  .then(function(content) {
      fs.writeFileSync("patch.zip", content);
      console.log("patch.zip created successfully.");
      
      const { exec } = require('child_process');
      console.log("Starting PWA Sync deployment to all 10 tenants...");
      const child = exec('node deploy_zip.js');
      child.stdout.on('data', console.log);
      child.stderr.on('data', console.error);
      child.on('exit', () => console.log('Deployment trigger finished.'));
  });
