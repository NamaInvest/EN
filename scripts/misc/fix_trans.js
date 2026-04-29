const fs = require('fs'); 
const keys = JSON.parse(fs.readFileSync('new_global_keys.json', 'utf8')); 
let content = fs.readFileSync('src/lib/translations.ts', 'utf8'); 
let arBlockMatch = content.match(/ar:\s*\{([\s\S]*?)\}\s*\};/); 
let enBlockMatch = content.match(/en:\s*\{([\s\S]*?)\},\s*ar:/); 
if(arBlockMatch && enBlockMatch) { 
    let newAr = arBlockMatch[1]; 
    let newEn = enBlockMatch[1];
    for(let k in keys) { 
        if(!newAr.includes('"' + k + '"')) { 
            newAr += `    "${k}": "${keys[k]}",\n`; 
            newEn += `    "${k}": "${keys[k]}",\n`; 
        } 
    } 
    content = content.replace(arBlockMatch[1], newAr); 
    content = content.replace(enBlockMatch[1], newEn); 
    fs.writeFileSync('src/lib/translations.ts', content); 
    console.log('Successfully updated translations.ts'); 
} else { 
    console.log('Failed to match ar block'); 
}
