const { spawn } = require('child_process');
const fs = require('fs');
const out = fs.openSync('build-error-stream.log', 'w');
console.log('Spawning npx.cmd next build...');
const child = spawn('npx.cmd', ['next', 'build'], {
  stdio: ['ignore', out, out]
});
child.on('close', code => {
  console.log('Build exited with code', code);
});
