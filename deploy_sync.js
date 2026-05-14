const { execSync } = require('child_process');
const fs = require('fs');

const files = JSON.parse(fs.readFileSync('sync_report.json', 'utf8'));
console.log(`🚀 Preparing to deploy ${files.length} files...`);

// To avoid command line length limits, let's chunk them or just upload them via SFTP directly
// But deploy.js already has `deployWithBuild(conn, files)` logic! We can just call node deploy.js
try {
    const args = ['deploy.js', '--build', ...files];
    console.log('Running: node deploy.js --build [files...]');
    
    // Spawn the deploy.js process
    const { spawn } = require('child_process');
    const child = spawn('node', args, { stdio: 'inherit' });
    
    child.on('close', (code) => {
        console.log(`Deploy process exited with code ${code}`);
    });
} catch (error) {
    console.error('Failed to run deploy:', error);
}
