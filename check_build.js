const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  const scriptStr = `
  const http = require('http');
  // First, fetch the HTML for login page which might contain the Next.js build ID
  http.get('http://127.0.0.1:3011/login', res => {
      let body='';
      res.on('data', c => body+=c);
      res.on('end', () => {
          // Find the build ID inside the HTML: "buildId":"XYZ"
          const match = body.match(/"buildId":"([^"]+)"/);
          if (match) {
              console.log('BUILD ID:', match[1]);
          } else {
              console.log('No build ID found in HTML');
          }
      });
  });
  `;
  conn.exec(`node -e "${scriptStr.replace(/"/g, '\\"')}"`, (err, stream) => { 
      stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString())); 
      stream.stderr.on('data', d => process.stderr.write(d.toString()));
  }); 
}).connect({host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b'});
