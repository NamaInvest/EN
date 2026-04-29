/**
 * Script يُعدّل كل API routes:
 * يستبدل `import prisma from '@/lib/prisma'`
 * بـ `import { getPrisma } from '@/lib/prisma'`
 * ويستبدل كل `async function GET(` الخ بإضافة `const prisma = getPrisma(req || request);`
 * 
 * Strategy بسيطة وآمنة:
 * - يستبدل `import prisma from '@/lib/prisma'` بـ `import { getPrisma } from '@/lib/prisma'`
 * - في كل handler function body، يُضيف `const prisma = getPrisma(request);` بعد السطر الأول
 */
const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, 'src/app/api');

function getAllRouteFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...getAllRouteFiles(full));
        } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
            files.push(full);
        }
    }
    return files;
}

let modified = 0;
let skipped = 0;

const files = getAllRouteFiles(API_DIR);
console.log(`Found ${files.length} route files`);

for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if doesn't use default prisma import
    if (!content.includes("import prisma from '@/lib/prisma'")) {
        skipped++;
        continue;
    }
    
    // Skip if already using getPrisma
    if (content.includes("getPrisma(") && !content.includes("import prisma from '@/lib/prisma'")) {
        skipped++;
        continue;
    }
    
    let newContent = content;
    
    // Step 1: Replace import
    newContent = newContent.replace(
        /import prisma from '@\/lib\/prisma';/g,
        "import { getPrisma } from '@/lib/prisma';"
    );
    
    // Step 2: In each async handler, add `const prisma = getPrisma(request)` as first line
    // Pattern: async function (GET|POST|PUT|DELETE|PATCH)(req|request: ...) { \n    try {
    // We inject after the opening brace of the handler
    
    // Replace all handler function signatures that accept a request param
    // Pattern: export async function (METHOD)(req: ...) {\n    try {
    newContent = newContent.replace(
        /export async function (GET|POST|PUT|DELETE|PATCH|OPTIONS)\((\s*)(req|request)(\s*:|\s*,)/g,
        (match, method, sp1, paramName, restAfterParam) => {
            return match; // keep signature as-is, we'll handle body below
        }
    );
    
    // Add `const prisma = getPrisma(req/request);` after first `{` in each handler
    // This targets: export async function METHOD(req/request...) { \n    (try)?
    newContent = newContent.replace(
        /export async function (GET|POST|PUT|DELETE|PATCH|OPTIONS)\([^)]*\)\s*\{(\r?\n)/g,
        (match, method, newline) => {
            // Extract the first param name (req or request)
            const paramMatch = match.match(/function\s+\w+\(\s*(\w+)/);
            const pname = paramMatch ? paramMatch[1] : 'request';
            // Inject const prisma = getPrisma(paramName); as first line
            return match.replace(
                `\{${newline}`,
                `\{${newline}    const prisma = getPrisma(${pname});${newline}`
            );
        }
    );
    
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        modified++;
        console.log(`✅ Modified: ${path.relative(__dirname, filePath)}`);
    } else {
        skipped++;
    }
}

console.log(`\nDone! Modified: ${modified}, Skipped: ${skipped}`);
