const { execSync } = require('child_process');
const fs = require('fs');
try {
    console.log('Starting build...');
    const out = execSync('npm run build', { encoding: 'utf-8', stdio: 'pipe' });
    fs.writeFileSync('build_out.log', out);
    console.log('Build completed successfully.');
} catch (e) {
    console.log('Build failed. Writing output to build_out.log...');
    fs.writeFileSync('build_out.log', 'ERROR:\n' + (e.stdout || e.message) + '\n' + (e.stderr || ''));
}
