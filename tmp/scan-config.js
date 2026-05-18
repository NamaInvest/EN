const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (file === 'route.ts' || fullPath.includes('.service.ts') || fullPath.includes('engine.ts')) {
            results.push(fullPath);
        }
    });
    return results;
}

const targetDirs = [
    'src/app/api/settings',
    'src/app/api/system',
    'src/app/api/approvals',
    'src/app/api/vat',
    'src/app/api/tax',
    'src/app/api/finance',
    'src/lib/services/settings'
];

let files = [];
targetDirs.forEach(dir => {
    files = files.concat(walk(dir));
});

let scanResults = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Ignore pure GET routes that do not mutate
    const hasMutation = content.includes('prisma.') && (
        content.includes('.create(') || 
        content.includes('.update(') || 
        content.includes('.upsert(') || 
        content.includes('.delete(') ||
        content.includes('queryRaw') ||
        content.includes('executeRaw')
    );

    if (!hasMutation) return; // Only care about config mutation

    const hasTenantId = content.includes('tenantId');
    const hasRequirePermissions = content.includes('auth.role') || content.includes('auth?.role') || content.includes('user.role') || content.includes('roles:') || content.includes('requirePermissions') || content.includes('hasPermission');
    const hasAuditLog = content.includes('auditLog.create') || content.includes('logFieldChanges');
    const hasZod = content.includes('z.object') || content.includes('zod');

    // Rule 1: Any mutation in settings/finance MUST be tenant-isolated
    if (!hasTenantId) {
        scanResults.push({ file, risk: 'Global Config Poisoning', severity: 'CRITICAL', issue: 'Missing tenantId in config DB operation' });
    }

    // Rule 2: Any mutation in settings/finance MUST have strict RBAC (admin/owner/finance_manager)
    if (!hasRequirePermissions) {
        scanResults.push({ file, risk: 'Cross-company config mutation', severity: 'CRITICAL', issue: 'Settings mutated without explicit admin/owner RBAC check' });
    }
    
    // Rule 3: Any config payload MUST be Zod-validated to prevent JSON injection
    if (!hasZod) {
        scanResults.push({ file, risk: 'Unsafe feature toggles', severity: 'HIGH', issue: 'Config mutated without strict Zod schema' });
    }

    // Rule 4: Config mutations should ideally be audited
    if (!hasAuditLog) {
        scanResults.push({ file, risk: 'Missing AuditLog', severity: 'MEDIUM', issue: 'Config state mutation without auditLog' });
    }
});

let csv = 'File,RiskType,Severity,Issue\n';
scanResults.forEach(r => {
    csv += `"${r.file}","${r.risk}","${r.severity}","${r.issue}"\n`;
});

fs.writeFileSync('tmp/config-security-audit.csv', csv);
console.log(`Saved Settings/Config report. Total files scanned: ${files.length}`);
console.log(`Total issues found: ${scanResults.length}`);

let md = '# Phase 4.2 Settings & Finance Config Security Scan\n\n';
md += '| File | Severity | Risk | Issue |\n';
md += '|---|---|---|---|\n';
scanResults.forEach(r => {
    md += `| ${r.file} | **${r.severity}** | ${r.risk} | ${r.issue} |\n`;
});
fs.writeFileSync('tmp/config-security-audit.md', md);
