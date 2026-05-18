const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (file === 'route.ts') {
            results.push(fullPath);
        }
    });
    return results;
}

const apiRoutes = walk('src/app/api');
let scanResults = [];

apiRoutes.forEach(routePath => {
    const content = fs.readFileSync(routePath, 'utf8');
    
    // Check if it has POST, PUT, PATCH, DELETE
    if (!/export\s+(const|async\s+function)\s+(POST|PUT|PATCH|DELETE)/.test(content) && !/export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)/.test(content)) {
        return;
    }
    
    const hasWithRoute = content.includes('withRoute(');
    const hasZod = content.includes('z.object') || content.includes('zod');
    const hasAuditLog = content.includes('auditLog.create');
    
    // Check for Prisma mutations
    const prismaOpsRegex = /\.([a-zA-Z0-9_]+)\s*\.\s*(create|update|upsert|delete|createMany|updateMany|deleteMany)\s*\(/g;
    let match;
    let ops = [];
    while ((match = prismaOpsRegex.exec(content)) !== null) {
        ops.push({ model: match[1], op: match[2], index: match.index });
    }
    
    if (ops.length === 0) return; // No direct prisma mutations found in this way
    
    ops.forEach(op => {
        let parenCount = 1;
        let i = op.index + op.model.length + op.op.length + 3;
        while (i < content.length && content[i] !== '(') i++;
        i++;
        let start = i;
        while (i < content.length && parenCount > 0) {
            if (content[i] === '(') parenCount++;
            else if (content[i] === ')') parenCount--;
            i++;
        }
        const block = content.substring(start, i - 1);
        
        const hasTenantInBlock = block.includes('tenantId') || block.includes('resolveTenantContext');
        let severity = 'OK';
        let issue = '';
        
        if (!hasTenantInBlock && op.model !== 'auditLog' && op.model !== 'user') {
            severity = 'CRITICAL';
            issue = 'Mutation without tenantId';
        } else if (block.includes('status') && !hasAuditLog) {
            severity = 'HIGH';
            issue = 'Status change without audit';
        } else if (!hasZod) {
            severity = 'MEDIUM';
            issue = 'Missing Zod validation';
        }
        
        if (severity !== 'OK') {
            scanResults.push({
                file: routePath.replace(/\\/g, '/'),
                model: op.model,
                operation: op.op,
                severity,
                issue
            });
        }
    });
});

let md = '# Status-Changing API Security Scan\n\n';
md += '| File | Model | Operation | Severity | Issue |\n';
md += '|---|---|---|---|---|\n';

let csv = 'File,Model,Operation,Severity,Issue\n';

scanResults.forEach(r => {
    md += `| ${r.file} | ${r.model} | ${r.operation} | ${r.severity} | ${r.issue} |\n`;
    csv += `"${r.file}","${r.model}","${r.operation}","${r.severity}","${r.issue}"\n`;
});

fs.writeFileSync('tmp/security-baseline-rescan.md', md);
fs.writeFileSync('tmp/security-baseline-rescan.csv', csv);
console.log('Saved report. Total issues:', scanResults.length);
