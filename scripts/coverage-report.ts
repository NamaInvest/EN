import fs from 'fs';
import path from 'path';

export function parseCoverageAndGenerateReport() {
    const coveragePath = path.resolve(process.cwd(), 'coverage/coverage-summary.json');
    if (!fs.existsSync(coveragePath)) {
        console.warn('⚠️ No coverage summary found. Run tests with --coverage first.');
        return;
    }

    const data = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    let md = '# 📊 Test Coverage Report by Module\n\n';
    
    md += '| File | Lines % | Statements % | Functions % | Branches % |\n';
    md += '|---|---|---|---|---|\n';

    for (const [file, metrics] of Object.entries(data)) {
        if (file === 'total') continue;
        const shortName = file.replace(process.cwd(), '').replace(/\\/g, '/');
        md += `| ${shortName} | ${metrics.lines.pct}% | ${metrics.statements.pct}% | ${metrics.functions.pct}% | ${metrics.branches.pct}% |\n`;
    }

    const docsDir = path.resolve(process.cwd(), 'docs/testing');
    if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
    
    fs.writeFileSync(path.join(docsDir, 'COVERAGE_BY_MODULE.md'), md);
    console.log('✅ Coverage report generated at docs/testing/COVERAGE_BY_MODULE.md');
}

// execute if run directly
if (require.main === module) {
    parseCoverageAndGenerateReport();
}
