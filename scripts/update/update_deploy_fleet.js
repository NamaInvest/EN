const fs = require('fs');
let c = fs.readFileSync('deploy_fleet.js', 'utf8');
c = c.replace("execStream.on('close',", "execStream.stderr.on('data', d => { let s = d.toString(); if(!s.includes('npm WARN') && !s.includes('Debugger attached')) console.log('[STDERR] ' + s.trim()); });\n                                    execStream.on('close',");
fs.writeFileSync('deploy_fleet.js', c);
