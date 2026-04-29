const JSZip = require("jszip");
const fs = require("fs");
const path = require("path");

const zip = new JSZip();
const files = ['src/app/api/manifest/route.ts', 'src/app/layout.tsx'];
files.forEach(f => zip.file(f, fs.readFileSync(path.join(__dirname, f))));

zip.generateAsync({type:"nodebuffer", compression: "DEFLATE"})
  .then(c => {
      fs.writeFileSync("patch.zip", c);
      console.log("patch.zip created.");
      const { exec } = require('child_process');
      const child = exec('node deploy_zip.js');
      child.stdout.on('data', console.log);
      child.stderr.on('data', console.error);
  });
