const fs = require('fs');
const dict = JSON.parse(fs.readFileSync('all_extracted_strings.json', 'utf8'));

const brokenFiles = [
    'src/app/(dashboard)/settings/permissions/page.tsx',
    'src/app/restaurant-pos/page.tsx',
    'src/app/(dashboard)/barcode/page.tsx',
    'src/app/(dashboard)/expenses/page.tsx',
    'src/app/(dashboard)/fixed-assets/page.tsx',
    'src/app/(dashboard)/reports/page.tsx',
    'src/app/(dashboard)/settings/page.tsx'
];

brokenFiles.forEach(f => {
    if(!fs.existsSync(f)) return;
    let content = fs.readFileSync(f, 'utf8');
    let original = content;
    
    let compStart = content.search(/export (default )?function /);
    if(compStart > -1) {
        let topSection = content.substring(0, compStart);
        let botSection = content.substring(compStart);
        
        topSection = topSection.replace(/t\('([^']+)'\)/g, (match, key) => {
            if(dict[key] && dict[key].ar) return `"${dict[key].ar}"`;
            return `"${key}"`;
        });
        
        content = topSection + botSection;
        if(content !== original) {
            fs.writeFileSync(f, content, 'utf8');
            console.log('Fixed', f);
        }
    }
});

const serverComps = ['src/app/~offline/page.tsx', 'src/app/invoice/[id]/page.tsx', 'src/app/layout.tsx'];
serverComps.forEach(f => {
    if(!fs.existsSync(f)) return;
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/import \{ useTranslation \} from '.*i18n';?\n/g, '');
    content = content.replace(/const \{ t \} = useTranslation\(\);\s*\n/g, '');
    content = content.replace(/\{?t\('([^']+)'\)\}?/g, (match, key) => {
        if(dict[key] && dict[key].ar) return match.startsWith('{') ? `"${dict[key].ar}"` : dict[key].ar;
        return match.startsWith('{') ? `"${key}"` : key;
    });
    fs.writeFileSync(f, content, 'utf8');
    console.log('Reverted server component:', f);
});

console.log('All patches applied cleanly!');
