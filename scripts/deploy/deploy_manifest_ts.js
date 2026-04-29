const JSZip = require("jszip");
const fs = require("fs");
const path = require("path");

const zip = new JSZip();

const filesToZip = [
  'src/app/manifest.ts'
];

for (const file of filesToZip) {
  const absolutePath = path.join(__dirname, file);
  if (fs.existsSync(absolutePath)) {
    const content = fs.readFileSync(absolutePath);
    // JSZip handles folder structure
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
      console.log("Starting App Router Manifest deployment to all 10 tenants...");
      // using deploy_zip.js since it unzips, then npm install, then npm run build, then PM2 restart!
      const child = exec('node deploy_zip.js');
      child.stdout.on('data', console.log);
      child.stderr.on('data', console.error);
      child.on('exit', () => console.log('Deployment trigger finished.'));
  });
