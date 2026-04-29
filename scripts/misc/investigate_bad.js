const fs = require('fs');

// Fix reports page - top-level t() in constants
{
    const p = 'src/app/(dashboard)/reports/page.tsx';
    let code = fs.readFileSync(p, 'utf8');
    const lines = code.split('\n');
    const funcLine = lines.findIndex(l => l.match(/^export default function|^function [A-Z]/));
    
    // Find the top-level constants using t()
    // They'll be constant arrays/objects
    const topSection = lines.slice(0, funcLine).join('\n');
    console.log('Reports top section:\n', topSection.substring(0, 800));
}

// Fix fixed-assets page
{
    const p = 'src/app/(dashboard)/fixed-assets/page.tsx';
    let code = fs.readFileSync(p, 'utf8');
    const lines = code.split('\n');
    console.log('\nFixed-assets lines 8-18:');
    lines.slice(7, 18).forEach((l,i) => console.log(i+8, l));
}

// Fix invoice/[id] page
{
    const p = 'src/app/invoice/[id]/page.tsx';
    let code = fs.readFileSync(p, 'utf8');
    const lines = code.split('\n');
    const funcLine = lines.findIndex(l => l.match(/^export default function|^function [A-Z]/));
    console.log('\ninvoice funcLine:', funcLine);
    lines.slice(65, 105).forEach((l,i) => console.log(i+66, l));
}
