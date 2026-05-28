const fs = require('fs');
const path = require('path');

// Patterns representing Arabic Mojibake corruption
const MOJIBAKE_PATTERNS = [
    /ط·/,
    /ط¢/,
    /أ¢/,
    /â€/,
    /â‚¬/,
    /ï»¿/
];

// File extensions allowed for scanning
const ALLOWED_EXTENSIONS = new Set([
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.md',
    '.prisma',
    '.json',
    '.sql'
]);

// Ignored folders
const IGNORED_FOLDERS = new Set([
    'node_modules',
    '.next',
    '.git',
    'backups',
    'dist',
    'build',
    'out',
    'tmp',
    '.ai-brain',
    '.agent',
    'scripts',
    'dist-electron'
]);

// Ignored files (like generated audit reports and legacy backups/archives)
const IGNORED_FILES = new Set([
    'FLOAT_FIELDS_AUDIT.json',
    'audit_results.json',
    'schema_decimal_migration.prisma',
    'PROJECT_ARCHIVE.md'
]);

let totalFilesScanned = 0;
let totalCorruptionFound = 0;

function scanDirectory(dir) {
    let files;
    try {
        files = fs.readdirSync(dir);
    } catch (err) {
        console.error(`Error reading directory: ${dir}`, err.message);
        return;
    }

    for (const file of files) {
        const fullPath = path.join(dir, file);
        
        let stats;
        try {
            stats = fs.statSync(fullPath);
        } catch (err) {
            continue;
        }

        if (stats.isDirectory()) {
            if (IGNORED_FOLDERS.has(file)) continue;
            scanDirectory(fullPath);
        } else if (stats.isFile()) {
            if (IGNORED_FILES.has(file)) continue;
            
            const ext = path.extname(file).toLowerCase();
            if (!ALLOWED_EXTENSIONS.has(ext)) continue;

            totalFilesScanned++;
            checkFileForMojibake(fullPath);
        }
    }
}

function checkFileForMojibake(filePath) {
    let content;
    try {
        content = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
        return; // Skip unreadable/binary files safely
    }

    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
        const matched = MOJIBAKE_PATTERNS.some(pattern => pattern.test(line));
        if (matched) {
            // Also skip brain directory scratch scripts
            if (filePath.includes('.gemini') || filePath.includes('antigravity-ide')) return;

            const lineNum = idx + 1;
            console.error(`❌ Mojibake Found: [${filePath}:${lineNum}] -> ${line.trim().substr(0, 100)}`);
            totalCorruptionFound++;
        }
    });
}

console.log('🛡️  Starting Nama Invest Mojibake Guard scan...');
const startTime = Date.now();
const projectRoot = path.join(__dirname, '..');

scanDirectory(projectRoot);

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`\nScan completed in ${duration}s. Scanned ${totalFilesScanned} files.`);

if (totalCorruptionFound > 0) {
    console.error(`\n⚠️  Guard Failed: Found ${totalCorruptionFound} instances of Mojibake corruption!`);
    process.exit(1);
} else {
    console.log('✅ Success: Codebase is 100% clean of Mojibake! Arabic text is safe.');
    process.exit(0);
}
