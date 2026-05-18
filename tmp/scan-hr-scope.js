const fs = require('fs');

const filesToScan = [
    'src/app/api/employees/route.ts',
    'src/app/api/hr/attendance/route.ts',
    'src/app/api/hr/leaves/route.ts',
    'src/app/api/hr/leaves/balance/route.ts'
];

let results = [];

filesToScan.forEach(file => {
    if (!fs.existsSync(file)) {
        console.log('File not found:', file);
        return;
    }
    
    const content = fs.readFileSync(file, 'utf8');

    const hasMutation = content.includes('.create(') || content.includes('.update(') || content.includes('.updateMany(');
    const hasQuery = content.includes('.findMany(') || content.includes('.findFirst(');
    
    // Checks
    const hasAdminScope = content.includes("'admin'") || content.includes('hr_manager');
    const hasBranchManagerScope = content.includes('auth.branchId') || content.includes('getHrScope');
    const hasManagerScope = content.includes('managerId') || content.includes('directReports') || content.includes('getHrScope');
    const hasEmployeeSelfScope = content.includes('auth.employeeId') || content.includes('userId') || content.includes('getHrScope');
    const hasZod = content.includes('z.object(') || content.includes('zod');
    const hasAuditLog = content.includes('auditLog.create');

    if (hasQuery || hasMutation) {
        if (!hasEmployeeSelfScope && !hasManagerScope) {
            results.push({ file, type: 'Employee/Manager visibility leakage', severity: 'CRITICAL', issue: 'Missing employee self-service or manager scope restrictions' });
        }
        
        if (!hasBranchManagerScope) {
            results.push({ file, type: 'Branch visibility leakage', severity: 'HIGH', issue: 'Missing branchId restriction for branch managers' });
        }

        if (hasMutation && !hasZod) {
            results.push({ file, type: 'Missing Zod validation', severity: 'MEDIUM', issue: 'No Zod validation found for incoming filters/payload' });
        }

        if (hasMutation && !hasAuditLog) {
            results.push({ file, type: 'Missing AuditLog', severity: 'LOW', issue: 'State mutation without auditLog' });
        }
    }
});

let md = '# HR Manager Scope & Branch Isolation Scan\n\n';
md += '| File | Risk Type | Severity | Issue |\n';
md += '|---|---|---|---|\n';

let csv = 'File,RiskType,Severity,Issue\n';

const severityMap = { 'CRITICAL': 1, 'HIGH': 2, 'MEDIUM': 3, 'LOW': 4 };
results.sort((a, b) => severityMap[a.severity] - severityMap[b.severity]);

results.forEach(r => {
    md += `| ${r.file} | ${r.type} | ${r.severity} | ${r.issue} |\n`;
    csv += `"${r.file}","${r.type}","${r.severity}","${r.issue}"\n`;
});

fs.writeFileSync('tmp/hr-scope-isolation-scan.md', md);
fs.writeFileSync('tmp/hr-scope-isolation-scan.csv', csv);
console.log('Total issues found:', results.length);
