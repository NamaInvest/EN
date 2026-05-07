const fs = require('fs');
const path = require('path');

const DIRECTORIES = [
    path.join(__dirname, 'src', 'app', 'api'),
    path.join(__dirname, 'src', 'app', '(dashboard)')
];

function walk(dir, done) {
    let results = [];
    fs.readdir(dir, function(err, list) {
        if (err) return done(err);
        let pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(function(file) {
            file = path.resolve(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function(err, res) {
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                        results.push(file);
                    }
                    if (!--pending) done(null, results);
                }
            });
        });
    });
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Pattern 1: export async function GET(req: Request, { params }: { params: { id: string } })
    // -> export async function GET(req: Request, { params }: { params: Promise<{ id: string }> })
    
    // We need to match { params }: { params: { ... } } and change it to { params }: { params: Promise<{ ... }> }
    // AND then add `const { ... } = await params;` at the start of the function body.
    
    const regex = /(export\s+(?:async\s+)?function\s+(?:GET|POST|PUT|PATCH|DELETE)\s*\([^,]+,\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*)(\{[^}]+\})(\s*\}\s*\)\s*\{)/g;
    
    let match;
    let modified = false;
    
    while ((match = regex.exec(content)) !== null) {
        let before = match[1];
        let paramsObj = match[2]; // e.g. { id: string }
        let after = match[3];
        
        let newParams = `Promise<${paramsObj}>`;
        
        // Find what properties are inside paramsObj
        let propsMatch = paramsObj.match(/\{([^}]+)\}/);
        if (propsMatch) {
            let props = propsMatch[1].split(',').map(p => p.split(':')[0].trim()).filter(Boolean);
            let awaitStmt = `\n  const { ${props.join(', ')} } = await params;`;
            
            let replacement = before + newParams + after + awaitStmt;
            content = content.slice(0, match.index) + replacement + content.slice(match.index + match[0].length);
            
            // update index since we modified content length
            regex.lastIndex = match.index + replacement.length;
            modified = true;
        }
    }
    
    // Pattern 2: Page components: export default function Page({ params }: { params: { id: string } })
    // Next.js 15 page props: { params: Promise<{ id: string }> }
    const pageRegex = /(export\s+default\s+(?:async\s+)?function\s+[A-Za-z0-9_]+\s*\(\s*\{\s*params\s*(?:,\s*searchParams)?\s*\}\s*:\s*\{\s*params\s*:\s*)(\{[^}]+\})(,\s*searchParams\s*:\s*[^}]+)?(\s*\}\s*\)\s*\{)/g;
    
    while ((match = pageRegex.exec(content)) !== null) {
        let before = match[1];
        let paramsObj = match[2];
        let searchParams = match[3] || '';
        let after = match[4];
        
        let newParams = `Promise<${paramsObj}>`;
        
        let propsMatch = paramsObj.match(/\{([^}]+)\}/);
        if (propsMatch) {
            let props = propsMatch[1].split(',').map(p => p.split(':')[0].trim()).filter(Boolean);
            // check if function is async, if not make it async
            let funcDef = content.substring(content.lastIndexOf('export', match.index), match.index + match[0].length);
            let isAsync = funcDef.includes('async function');
            
            let awaitStmt = `\n  const { ${props.join(', ')} } = await params;`;
            let replacement = before + newParams + searchParams + after + awaitStmt;
            
            if (!isAsync) {
               // need to make the function async
               replacement = replacement.replace('function', 'async function');
            }
            
            content = content.slice(0, match.index) + replacement + content.slice(match.index + match[0].length);
            regex.lastIndex = match.index + replacement.length;
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed:', filePath);
    }
}

DIRECTORIES.forEach(dir => {
    walk(dir, (err, results) => {
        if (err) throw err;
        results.forEach(processFile);
    });
});
