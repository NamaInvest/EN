// Batch fix: Add request parameter to GET() handlers that use getPrisma
const fs = require('fs');
const path = require('path');

const apiDir = path.join('c:\\Users\\1\\Desktop\\alfa', 'src', 'app', 'api');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;
    
    // Only fix files that have GET() without request AND use getPrisma
    if (!content.includes('getPrisma')) return false;
    
    // Fix pattern: export async function GET() { ... getPrisma(request)
    // The request variable doesn't exist in scope
    const getNoParam = /export\s+async\s+function\s+GET\(\)/g;
    if (!getNoParam.test(content)) return false;
    
    // Check if NextRequest is imported
    const hasNextRequest = content.includes('NextRequest');
    
    // Add NextRequest import if missing
    if (!hasNextRequest) {
        content = content.replace(
            /import\s*{\s*NextResponse\s*}\s*from\s*'next\/server'/,
            "import { NextResponse, NextRequest } from 'next/server'"
        );
        // Handle case where import already has NextRequest but in different format
        if (!content.includes('NextRequest') && content.includes("from 'next/server'")) {
            content = content.replace(
                /from\s*'next\/server'/,
                (match) => match // skip if can't add
            );
        }
    }
    
    // Fix GET() -> GET(request: NextRequest)
    content = content.replace(
        /export\s+async\s+function\s+GET\(\)/g,
        'export async function GET(request: NextRequest)'
    );
    
    // Also check for GET() { ... getPrisma(request || req) pattern - fix that too
    content = content.replace(/getPrisma\(request\s*\|\|\s*req\)/g, 'getPrisma(request)');
    
    if (content !== original) {
        fs.writeFileSync(filePath, content);
        return true;
    }
    return false;
}

function walkDir(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    let fixed = 0;
    for (const f of files) {
        const full = path.join(dir, f.name);
        if (f.isDirectory()) {
            fixed += walkDir(full);
        } else if (f.name === 'route.ts') {
            if (fixFile(full)) {
                const rel = path.relative(apiDir, full);
                console.log('✅ Fixed:', rel);
                fixed++;
            }
        }
    }
    return fixed;
}

const total = walkDir(apiDir);
console.log(`\n📊 Total files fixed: ${total}`);
