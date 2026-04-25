const fs = require('fs');
const path = require('path');

function rimraf(dir_path) {
    if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach(function(entry) {
            var entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory()) {
                rimraf(entry_path);
            } else {
                try { fs.unlinkSync(entry_path); } catch (e) {}
            }
        });
        try { fs.rmdirSync(dir_path); } catch (e) {}
    }
}

console.log('🧹 Cleaning previous build artifacts...');
const distElectron = path.join(__dirname, '..', 'dist-electron');
if (fs.existsSync(distElectron)) {
    rimraf(distElectron);
    console.log('✅ Deleted dist-electron');
}
