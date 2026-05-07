const fs = require('fs');
const d = JSON.parse(fs.readFileSync('graphify-out/.graphify_detect.json', 'utf-8'));
const root = 'D:/namasoft9-3-main/';

for (const [key, arr] of Object.entries(d.files)) {
    d.files[key] = arr.filter(f => {
        let rel = f.replace(/\\/g, '/');
        if (rel.startsWith(root)) rel = rel.substring(root.length);
        if (rel.startsWith('dist-electron/')) return false;
        if (rel.startsWith('out/')) return false;
        return true;
    });
}

d.total_files = Object.values(d.files).reduce((acc, arr) => acc + arr.length, 0);
fs.writeFileSync('graphify-out/.graphify_detect.json', JSON.stringify(d, null, 2), 'utf-8');
console.log('Filtered out dist-electron. Remaining files:', d.total_files);
