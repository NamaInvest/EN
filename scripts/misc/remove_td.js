const fs = require('fs');
const file = 'c:/Users/1/Desktop/alfa/src/app/(dashboard)/sales/page.tsx';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const rateInputLine = lines.findIndex(l => l.includes("value={item.discountRate} onChange={e => updateCartItem(idx, 'discountRate'"));
const valInputLine = lines.findIndex(l => l.includes("value={item.discountValue || 0} onChange={e => updateCartItem(idx, 'discountValue'"));

if (rateInputLine !== -1 && valInputLine !== -1) {
    let startTd = rateInputLine;
    while (startTd > 0 && !lines[startTd].includes('<td>')) startTd--;
    
    let endTd = valInputLine;
    while (endTd < lines.length && !lines[endTd].includes('</td>')) endTd++;
    
    if (startTd > 0 && endTd > 0) {
        lines.splice(startTd, endTd - startTd + 1);
        fs.writeFileSync(file, lines.join('\n'));
        console.log("Successfully removed item discount table cells!");
    } else {
        console.error("Could not find td boundaries");
    }
} else {
    console.error("Could not find inputs");
}
