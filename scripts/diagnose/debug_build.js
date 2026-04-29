const { execSync } = require('child_process');
const fs = require('fs');
try {
  console.log('Running npx next build...');
  const out = execSync('npx next build', { encoding: 'utf8', stdio: 'pipe' });
  fs.writeFileSync('build-error.log', 'SUCCESS\n' + out);
  console.log('Done successfully');
} catch (e) {
  let errLog = 'ERROR STATUS: ' + e.status + '\n\n';
  errLog += 'STDOUT:\n' + (e.stdout ? e.stdout.toString() : '') + '\n\n';
  errLog += 'STDERR:\n' + (e.stderr ? e.stderr.toString() : '');
  fs.writeFileSync('build-error.log', errLog, 'utf8');
  console.log('Done with error, wrote to build-error.log');
}
