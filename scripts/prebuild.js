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

const vcredistPath = path.join(__dirname, '..', 'electron', 'assets', 'vcredist_x64.exe');
if (!fs.existsSync(vcredistPath)) {
    console.log('⬇️ Downloading Visual C++ Redistributable...');
    const { execSync } = require('child_process');
    try {
        execSync(`curl -L -o "${vcredistPath}" https://aka.ms/vs/17/release/vc_redist.x64.exe`, { stdio: 'inherit' });
        console.log('✅ vcredist_x64.exe downloaded successfully.');
    } catch (e) {
        console.error('⚠️ Failed to download vcredist:', e.message);
    }
} else {
    console.log('✅ vcredist_x64.exe already exists, skipping download.');
}
