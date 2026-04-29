const fs = require('fs');
const glob = require('glob');
const dict = JSON.parse(fs.readFileSync('all_extracted_strings.json', 'utf8'));

const files = glob.sync('src/{app,components}/**/*.tsx');
let filesFixed = 0;

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let originalContent = content;
    
    // Find top-level variables containing t(...)
    // A regex to match const XXX = ... t('...') up to the end of the statement or array
    // This is tricky. Let's just find lines that are outside of the main export default function
    
    // Split by function/component boundaries
    let functionStartIndex = content.indexOf('export default function');
    if (functionStartIndex === -1) functionStartIndex = content.indexOf('export function');
    if (functionStartIndex === -1) functionStartIndex = content.indexOf('function');
    
    if (functionStartIndex > -1) {
        let beforeComponent = content.substring(0, functionStartIndex);
        
        let hasChanges = false;
        
        // Find all t('key') in beforeComponent and replace with original arabic
        beforeComponent = beforeComponent.replace(/t\('(.*?)'\)/g, (match, key) => {
            hasChanges = true;
            if (dict[key] && dict[key].ar) {
                return `"${dict[key].ar}"`;
            }
            return `"${key}"`;
        });
        
        if (hasChanges) {
            content = beforeComponent + content.substring(functionStartIndex);
        }
        
    }
    
    if (content !== originalContent) {
        fs.writeFileSync(f, content, 'utf8');
        filesFixed++;
        console.log('Fixed top-level t() in:', f);
    }
});

console.log('Total files fixed:', filesFixed);
