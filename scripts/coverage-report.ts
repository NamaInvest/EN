import fs from 'fs';
import path from 'path';

const COVERAGE_FILE = path.join(process.cwd(), 'coverage/coverage-summary.json');
const OUTPUT_FILE = path.join(process.cwd(), 'docs/testing/COVERAGE_BY_MODULE.md');

function run() {
    console.log('Generating Coverage Report by Module...');
    
    if (!fs.existsSync(COVERAGE_FILE)) {
        console.warn('⚠️ Coverage file not found. Run tests with --coverage first.');
        return;
    }

    const data = JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf8'));
    const modules: Record<string, { lines: number, covered: number, total: number }> = {};

    for (const [filePath, metrics] of Object.entries(data)) {
        if (filePath === 'total') continue;
        
        // Naive extraction of module name from src/app/(dashboard)/<module>
        const match = filePath.match(/src[\/\\]app[\/\\]\(dashboard\)[\/\\]([^\/\\]+)/);
        const modName = match ? match[1] : 'core/lib';
        
        if (!modules[modName]) {
            modules[modName] = { lines: 0, covered: 0, total: 0 };
        }
        
        const m = (metrics as any).lines;
        modules[modName].covered += m.covered;
        modules[modName].total += m.total;
    }

    let md = '# Code Coverage by Module\n\n';
    md += '| Module | Coverage % | Status |\n';
    md += '|--------|------------|--------|\n';

    for (const [mod, stats] of Object.entries(modules)) {
        if (stats.total === 0) continue;
        const pct = ((stats.covered / stats.total) * 100).toFixed(2);
        const status = Number(pct) >= 80 ? '🟢 Pass' : Number(pct) >= 60 ? '🟡 Warning' : '🔴 Critical';
        md += `| ${mod} | ${pct}% | ${status} |\n`;
    }

    const docsDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, md);
    console.log(`✅ Coverage report written to ${OUTPUT_FILE}`);
}

run();
