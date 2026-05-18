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
        } else if (file === 'route.ts' || fullPath.includes('.service.ts')) {
            results.push(fullPath);
        }
    });
    return results;
}

const targetDirs = [
    'src/app/api/hr',
    'src/app/api/payroll',
    'src/app/api/employees',
    'src/lib/services/hr',
    'src/lib/services/payroll'
];

let files = [];
targetDirs.forEach(dir => {
    files = files.concat(walk(dir));
});

let scanResults = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    const hasTenantId = content.includes('tenantId');
    const hasRequirePermissions = content.includes('requirePermissions') || content.includes('auth.role') || content.includes('auth.permissions');
    const hasAuditLog = content.includes('auditLog.create');
    const hasZod = content.includes('z.object') || content.includes('zod');
    const hasBranchIdFilter = content.includes('branchId');
    const hasManagerFilter = content.includes('managerId') || content.includes('departmentId');
    const isSalaryOrPayroll = file.includes('salary') || file.includes('payroll');
    const isDocument = file.includes('document');
    const isESS = file.includes('ess') || file.includes('self-service');
    const hasUserScope = content.includes('userId') || content.includes('employeeId: auth.employeeId');

    const hasMutation = content.includes('prisma.') && (
        content.includes('.create(') || 
        content.includes('.createMany(') || 
        content.includes('.update(') || 
        content.includes('.updateMany(') || 
        content.includes('.upsert(') || 
        content.includes('.delete(') || 
        content.includes('.deleteMany(')
    );
    
    const hasQuery = content.includes('prisma.') && (
        content.includes('.findMany(') || 
        content.includes('.findFirst(') || 
        content.includes('.findUnique(')
    );

    const isApiRoute = file.includes('api/');

    if (isApiRoute || hasMutation || hasQuery) {
        // 1) tenantId missing
        if (!hasTenantId) {
            scanResults.push({ file, type: 'tenantId missing', severity: 'CRITICAL', issue: 'Missing tenantId in DB operation' });
        }

        // 2) missing permission guard
        if (isApiRoute && !hasRequirePermissions && !isESS) {
            scanResults.push({ file, type: 'missing RBAC', severity: 'HIGH', issue: 'No requirePermissions guard found' });
        }

        // 3) salary visibility leakage
        if (isSalaryOrPayroll && hasQuery && (!hasRequirePermissions && !hasManagerFilter && !hasUserScope)) {
            scanResults.push({ file, type: 'salary visibility leakage', severity: 'CRITICAL', issue: 'Salary data exposed without explicit RBAC or scoping' });
        }

        // 4) employee document access leakage
        if (isDocument && hasQuery && !hasUserScope && !hasRequirePermissions) {
            scanResults.push({ file, type: 'document leakage', severity: 'CRITICAL', issue: 'Employee documents accessible without strict scope' });
        }

        // 5) & 6) manager/branch scope missing
        if (!isESS && hasQuery && !hasBranchIdFilter && !hasManagerFilter && file.includes('employees')) {
            scanResults.push({ file, type: 'manager/branch scope missing', severity: 'MEDIUM', issue: 'Queries lack branchId or managerId filters' });
        }

        // 7) payroll period mutation without auditLog
        if (isSalaryOrPayroll && hasMutation && !hasAuditLog) {
            scanResults.push({ file, type: 'mutation without auditLog', severity: 'LOW', issue: 'Payroll/Salary mutation lacks auditLog' }); // Wait, user said CRITICAL/HIGH/MEDIUM/LOW
        }

        // 8) direct body-to-prisma without Zod
        if (isApiRoute && hasMutation && !hasZod && content.includes('req.json()')) {
            scanResults.push({ file, type: 'missing validation', severity: 'LOW', issue: 'Direct body usage without Zod validation' });
        }

        // 9) self-service employee routes exposing others’ data
        if (isESS && hasQuery && !hasUserScope) {
            scanResults.push({ file, type: 'self-service data exposure', severity: 'CRITICAL', issue: 'ESS route lacks strict user ID enforcement' });
        }
    }
});

let md = '# HR & Payroll Security Risk Scan\n\n';
md += '| File | Risk Type | Severity | Issue |\n';
md += '|---|---|---|---|\n';

let csv = 'File,RiskType,Severity,Issue\n';

// Sort by severity (CRITICAL > HIGH > MEDIUM > LOW)
const severityMap = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4 };
scanResults.sort((a, b) => severityMap[a.severity] - severityMap[b.severity]);

scanResults.forEach(r => {
    md += `| ${r.file} | ${r.type} | ${r.severity} | ${r.issue} |\n`;
    csv += `"${r.file}","${r.type}","${r.severity}","${r.issue}"\n`;
});

fs.writeFileSync('tmp/hr-security-audit.md', md);
fs.writeFileSync('tmp/hr-security-audit.csv', csv);
console.log('Saved HR report. Total files scanned:', files.length);
console.log('Total issues found:', scanResults.length);
