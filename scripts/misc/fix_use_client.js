const fs = require('fs');
const path = require('path');
const glob = require('glob'); // Note: Glob may not be installed natively. I will use standard recursive readdir if glob is unavailable. We can execute a fast find command or js function.

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

const targetDirs = ['src/app', 'src/components'];
let filesFixed = 0;

targetDirs.forEach(dir => {
    if(!fs.existsSync(dir)) return;
    walkDir(dir, (filepath) => {
        if (!filepath.endsWith('.tsx') && !filepath.endsWith('.ts')) return;
        let content = fs.readFileSync(filepath, 'utf8');
        
        // Find if file has 'use client'
        if (content.includes("'use client'") || content.includes('"use client"')) {
            const lines = content.split('\n');
            let hasUseClient = false;
            let importLineFound = false;
            let useClientIndex = -1;
            let importIndex = -1;
            
            for(let i=0; i<lines.length; i++) {
                if(lines[i].includes('import ')) {
                    importLineFound = true;
                    if(importIndex === -1) importIndex = i;
                }
                if(lines[i].trim() === "'use client';" || lines[i].trim() === '"use client";') {
                    hasUseClient = true;
                    useClientIndex = i;
                    break;
                }
            }
            
            if(hasUseClient && importLineFound && useClientIndex > importIndex) {
                // Remove it
                lines.splice(useClientIndex, 1);
                // Insert at very top
                lines.unshift("'use client';");
                
                fs.writeFileSync(filepath, lines.join('\n'), 'utf8');
                filesFixed++;
            }
        }
    });
});

console.log('Fixed use client directive across ' + filesFixed + ' files.');
