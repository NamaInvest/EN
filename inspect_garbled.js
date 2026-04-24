const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/lib/featuresList.json', 'utf8'));

const modules = new Set();
const labels = new Set();

data.forEach(item => {
    modules.add(item.module);
    labels.add(item.label);
});

// We want to extract just the garbled words to see them.
const garbledModules = Array.from(modules).filter(m => /[ظطµظٹع©]/.test(m));
console.log("Garbled Modules:", garbledModules);

// For labels, let's just print the ones that have garbled text
const garbledLabels = Array.from(labels).filter(l => /[ظطµظٹع©]/.test(l));
console.log(`Found ${garbledLabels.length} garbled labels.`);
// print first 20 to inspect
console.log(garbledLabels.slice(0, 20));

// Also let's try a heuristic decodifier
function tryDecode(str) {
    // find runs of garbled characters and decode just them
    return str.replace(/[\x80-\uFFFF]+/g, match => {
        try {
            // try binary -> utf8
            const decoded = Buffer.from(match, 'binary').toString('utf8');
            // if it looks like arabic, return it
            if (/[\u0600-\u06FF]/.test(decoded)) return decoded;
        } catch(e) {}
        return match;
    });
}

console.log("\nTesting Heuristic Decoding:");
garbledLabels.slice(0, 10).forEach(l => {
    console.log(l, " => ", tryDecode(l));
});
