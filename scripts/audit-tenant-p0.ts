import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

const API_DIR = path.resolve('./src/app/api');
const EXEMPT_PATTERNS = [
    '/auth/', '/public/', '/webhooks/', '/master-panel/', '/health/', '/docs/', '/check-env/', '/tenant/provision', '/system/'
];

interface AuditResult {
    file: string;
    line: number;
    model: string;
    operation: string;
    status: 'P0_CONFIRMED' | 'P0_REVIEW' | 'EXEMPTED' | 'SAFE';
    reason?: string;
}

const results: AuditResult[] = [];

function isExempt(filePath: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');
    return EXEMPT_PATTERNS.some(p => normalizedPath.includes(p));
}

function walkDir(dir: string, callback: (path: string) => void) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

function auditFile(filePath: string) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
    
    if (isExempt(filePath)) {
        results.push({ file: filePath, line: 0, model: 'N/A', operation: 'N/A', status: 'EXEMPTED' });
        return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');

    if (filePath.includes('/api/') && filePath.endsWith('route.ts')) {
        if (!fileContent.includes('requireTenantId') && !fileContent.includes('requireTenantFilter') && !fileContent.includes('assertTenant')) {
             results.push({
                file: filePath,
                line: 1,
                model: 'ROUTE',
                operation: 'MISSING_GUARD',
                status: 'P0_CONFIRMED',
                reason: 'No tenant guard found in route file'
            });
        }
    }

    const sourceFile = ts.createSourceFile(
        filePath,
        fileContent,
        ts.ScriptTarget.Latest,
        true
    );

    function visit(node: ts.Node) {
        if (ts.isCallExpression(node)) {
            const exp = node.expression;
            if (ts.isPropertyAccessExpression(exp)) {
                const operationName = exp.name.text;
                if (['update', 'updateMany', 'delete', 'deleteMany', 'upsert'].includes(operationName)) {
                    
                    let modelName = 'unknown';
                    if (ts.isPropertyAccessExpression(exp.expression)) {
                        modelName = exp.expression.name.text;
                    }

                    const args = node.arguments;
                    let isSafe = false;
                    let reviewNeeded = false;

                    if (args.length > 0 && ts.isObjectLiteralExpression(args[0])) {
                        const obj = args[0] as ts.ObjectLiteralExpression;
                        const text = obj.getText(sourceFile);
                        
                        if (text.includes('requireTenantFilter') || text.includes('tenantId')) {
                            isSafe = true;
                        } else {
                            const whereProp = obj.properties.find(p => p.name && p.name.getText(sourceFile) === 'where');
                            if (whereProp && ts.isPropertyAssignment(whereProp) && ts.isObjectLiteralExpression(whereProp.initializer)) {
                                const whereText = whereProp.initializer.getText(sourceFile);
                                if (whereText.includes('tenantId') || whereText.includes('requireTenantFilter')) {
                                    isSafe = true;
                                }
                            } else if (whereProp && !ts.isPropertyAssignment(whereProp)) {
                                reviewNeeded = true;
                            }
                        }
                    } else {
                        reviewNeeded = true;
                    }

                    if (isSafe) {
                        results.push({
                            file: filePath,
                            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
                            model: modelName,
                            operation: operationName,
                            status: 'SAFE'
                        });
                    } else if (reviewNeeded) {
                        results.push({
                            file: filePath,
                            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
                            model: modelName,
                            operation: operationName,
                            status: 'P0_REVIEW'
                        });
                    } else {
                        results.push({
                            file: filePath,
                            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
                            model: modelName,
                            operation: operationName,
                            status: 'P0_CONFIRMED'
                        });
                    }
                }
            }
        }
        ts.forEachChild(node, visit);
    }
    
    visit(sourceFile);
}

walkDir(API_DIR, auditFile);

const summary = {
    P0_CONFIRMED: results.filter(r => r.status === 'P0_CONFIRMED').length,
    P0_REVIEW: results.filter(r => r.status === 'P0_REVIEW').length,
    SAFE: results.filter(r => r.status === 'SAFE').length,
    EXEMPTED: [...new Set(results.filter(r => r.status === 'EXEMPTED').map(r => r.file))].length
};

fs.mkdirSync(path.resolve('./tmp'), { recursive: true });
fs.writeFileSync(path.resolve('./tmp/tenant-p0-audit.json'), JSON.stringify({ summary, results }, null, 2));

let md = '# Phase 3.1: Tenant Isolation P0 Audit Report\n\n';
md += `## Summary\n- **P0_CONFIRMED**: ${summary.P0_CONFIRMED}\n- **P0_REVIEW**: ${summary.P0_REVIEW}\n- **SAFE**: ${summary.SAFE}\n- **EXEMPTED FILES**: ${summary.EXEMPTED}\n\n`;

md += `## Top 20 P0_CONFIRMED\n`;
results.filter(r => r.status === 'P0_CONFIRMED').slice(0, 20).forEach(r => {
    md += `- \`${r.file.split('src/app/api/')[1] || r.file}\` (Line ${r.line}) - \`${r.model}.${r.operation}\`\n`;
});

fs.writeFileSync(path.resolve('./tmp/tenant-p0-audit.md'), md);
console.log(JSON.stringify(summary));
