const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/featuresList.json');
const content = fs.readFileSync(filePath, 'utf8');

// Try parsing
const data = JSON.parse(content);

// Let's test fixing one entry
const testEntry = data.find(d => d.label.includes('ظ'));
if (testEntry) {
    console.log("Original:", testEntry.label);
    
    // Try to decode it
    try {
        const fixed = Buffer.from(testEntry.label, 'binary').toString('utf8');
        console.log("Fixed (binary->utf8):", fixed);
    } catch(e) {}
    
    try {
        const fixed2 = Buffer.from(testEntry.label, 'latin1').toString('utf8');
        console.log("Fixed (latin1->utf8):", fixed2);
    } catch(e) {}
    
    // Let's try fixing all items in memory to see how many change
    let fixedCount = 0;
    for (const item of data) {
        if (/[ظطµظٹع©]/.test(item.label) || /[ظطµظٹع©]/.test(item.module)) {
            // This is a heuristic for garbled text
            item.label = Buffer.from(item.label, 'binary').toString('utf8');
            // Try to fix module too if needed
            if (/[ظطµظٹع©]/.test(item.module)) {
                item.module = Buffer.from(item.module, 'binary').toString('utf8');
            }
            fixedCount++;
        }
    }
    console.log(`Found ${fixedCount} garbled items out of ${data.length}`);
    
    // Test a fixed one
    const check = data.find(d => d.label.includes('⏳') || d.label.includes('حفظ'));
    console.log("After fix sample:", check?.label);
} else {
    console.log("No garbled text found.");
}
