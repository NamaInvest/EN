const fs = require('fs');
const path = require('path');

const targetDirs = [
    'src/app/api/products',
    'src/app/api/categories',
    'src/app/api/units',
    'src/app/api/vendors',
    'src/app/api/customers',
    'src/app/api/product-stocks',
    'src/app/api/price-lists',
    'src/app/api/brands',
];

function getFiles(dir, filesList = []) {
    if (!fs.existsSync(dir)) return filesList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath, filesList);
        } else if (fullPath.endsWith('route.ts')) {
            filesList.push(fullPath);
        }
    }
    return filesList;
}

let allFiles = [];
for (const dir of targetDirs) {
    allFiles = allFiles.concat(getFiles(dir));
}

const issues = [];
let totalScanned = 0;

for (const file of allFiles) {
    totalScanned++;
    const content = fs.readFileSync(file, 'utf8');
    
    // Check missing tenantId in DB calls
    const hasDbCall = content.includes('prisma.') || content.includes('runFinancialTx') || content.includes('runInventoryTx');
    const hasTenantId = content.includes('tenantId') || content.includes('assertTenant');
    if (hasDbCall && !hasTenantId) {
        issues.push({ file, severity: 'CRITICAL', issue: 'Missing tenantId isolation in database queries' });
    }

    // Check cross-tenant mutation (upsert/delete without tenant check)
    const hasUpsert = content.includes('.upsert(') && !content.includes('tenantId');
    const hasDelete = content.includes('.delete(') && !content.includes('tenantId');
    if (hasUpsert || hasDelete) {
        issues.push({ file, severity: 'CRITICAL', issue: 'Unsafe DB operation (upsert/delete) without tenant isolation' });
    }
    
    // Check missing RBAC on mutations (POST, PUT, DELETE, PATCH)
    const hasMutation = content.includes('function _POST') || content.includes('function _PUT') || content.includes('function _DELETE') || content.includes('function _PATCH');
    const hasAuth = content.includes('getUserFromRequest') || content.includes('requireAuth');
    const hasRoles = content.includes('roles:') || content.includes('.role)') || content.includes('hasPermission');
    
    if (hasMutation && (!hasAuth || !hasRoles)) {
        issues.push({ file, severity: 'HIGH', issue: 'Missing RBAC on master-data mutations' });
    }

    // Check missing Zod validation
    const hasZod = content.includes('z.object') || content.includes('zod');
    if (hasMutation && !hasZod) {
        issues.push({ file, severity: 'MEDIUM', issue: 'Missing Zod validation for body-to-prisma' });
    }

    // Check missing auditLog
    const hasAudit = content.includes('AuditLog') || content.includes('EnterpriseLogger.trace');
    if (hasMutation && !hasAudit) {
        issues.push({ file, severity: 'LOW', issue: 'Missing audit trail for mutations' });
    }
}

// Write CSV
let csv = 'File,Severity,Issue\n';
issues.forEach(i => {
    csv += `${i.file.replace(/\\/g, '/')},${i.severity},"${i.issue}"\n`;
});
fs.writeFileSync('tmp/master-data-security-audit.csv', csv);

// Write Markdown
let md = '# Phase 4.4 - Master Data Security Audit\n\n';
md += `**Total Files Scanned:** ${totalScanned}\n`;
md += `**Total Issues Found:** ${issues.length}\n\n`;

const critical = issues.filter(i => i.severity === 'CRITICAL');
const high = issues.filter(i => i.severity === 'HIGH');
const medium = issues.filter(i => i.severity === 'MEDIUM');
const low = issues.filter(i => i.severity === 'LOW');

md += `## Summary\n`;
md += `- **CRITICAL**: ${critical.length}\n`;
md += `- **HIGH**: ${high.length}\n`;
md += `- **MEDIUM**: ${medium.length}\n`;
md += `- **LOW**: ${low.length}\n\n`;

md += `## Details\n`;
['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].forEach(sev => {
    const sevIssues = issues.filter(i => i.severity === sev);
    if (sevIssues.length > 0) {
        md += `### ${sev} (${sevIssues.length})\n`;
        sevIssues.forEach(i => {
            md += `- \`${i.file}\`: ${i.issue}\n`;
        });
        md += '\n';
    }
});

fs.writeFileSync('tmp/master-data-security-audit.md', md);
console.log(`Saved Master Data report. Total files scanned: ${totalScanned}`);
console.log(`CRITICAL: ${critical.length}, HIGH: ${high.length}, MEDIUM: ${medium.length}, LOW: ${low.length}`);
