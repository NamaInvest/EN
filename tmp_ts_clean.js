const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    fs.readdirSync(dir).forEach(file => {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, 'src', 'app', 'api'));
let modified = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/vatNumber:\s*true\s*,?/g, '');
    content = content.replace(/auth\.userId/g, '(auth as any).userId');
    // sys/alerts id
    if(file.includes('alerts')) {
        content = content.replace(/auth\.id/g, '(auth as any).id');
    }
    
    // recurring invoices
    if(file.includes('recurring-invoices')) {
         content = content.replace(/payload\.id/g, '(payload as any).id');
    }

    // api-handler issues
    if (file.includes('api-handler')) {
       // it's in lib, wait we need to include lib explicitly
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Fixed:', file);
        modified++;
    }
});

// also do lib/api-handler.ts
const libApi = path.join(__dirname, 'src', 'lib', 'api-handler.ts');
if (fs.existsSync(libApi)) {
    let content = fs.readFileSync(libApi, 'utf8');
    content = content.replace(/error\.errors/g, '(error as any).errors');
    content = content.replace(/issue: any/g, 'issue: any');
    fs.writeFileSync(libApi, content, 'utf8');
    console.log('Fixed:', libApi);
}

const provision = path.join(__dirname, 'src', 'app', 'api', 'tenant', 'provision', 'route.ts');
if (fs.existsSync(provision)) {
    let content = fs.readFileSync(provision, 'utf8');
    content = content.replace(/\(err\)/g, '(err: any)');
    content = content.replace(/\(err, stream\)/g, '(err: any, stream: any)');
    content = content.replace(/catch \(e2\)/g, 'catch (e2: any)');
    fs.writeFileSync(provision, content, 'utf8');
    console.log('Fixed:', provision);
}

console.log(`Total fixed.`);
