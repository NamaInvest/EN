const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.json')) {
                results.push(file);
            }
        }
    });
    return results;
}

const list = walkDir(path.join(__dirname, 'src'));
let fixedCount = 0;

list.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Check if the file still contains typical Mojibake characters
    if (content.includes('ً') || content.includes('ں') || content.includes('ڈ') || content.includes('ھ') || content.includes('أ—') || content.includes('ط') || content.includes('ظ')) {
        let fixedContent = '';
        try {
            const encodedBytes = iconv.encode(content, 'cp1256');
            fixedContent = iconv.decode(encodedBytes, 'utf8');
            
            // Contains standard Arabic range
            if (/[\u0600-\u06FF]/.test(fixedContent)) {
                fixedContent = fixedContent.replace(/\uFFFD/g, ''); 
                
                fs.writeFileSync(file, fixedContent, 'utf8');
                console.log('Fixed:', file);
                fixedCount++;
            } else {
                // If it doesn't contain Arabic, it might just be broken emojis. Let's force it if it looks like it had a lot of Mojibake.
                // Actually, let's just write it if the length changed significantly or we found some fix
                // Let's print out what we skipped to debug.
                // console.log('Skipped (no Arabic):', file);
            }
        } catch (e) {
            console.log('Error processing', file, e.message);
        }
    }
});

console.log('Total files fixed this round:', fixedCount);
