const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'src', 'app', 'api');

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

function fixFile(filePath) {
    try {
        let buf = fs.readFileSync(filePath);
        let content = buf.toString('utf8');
        let original = content;
        
        // Remove ALL Replacement Characters ()
        content = content.replace(/\uFFFD/g, 'Unauthorized');
        
        // Fix the specific "error: ' '" that I injected
        content = content.replace(/error:\s*'\s*Unauthorized\s*Unauthorized\s*Unauthorized\s*'/g, "error: 'Unauthorized'");
        
        if (original !== content) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Fixed text in:', filePath);
        } else {
            // Just writing it back as utf8 will strip the invalid byte sequence that Turbopack complains about!
            fs.writeFileSync(filePath, content, 'utf8');
        }
    } catch (err) {
        console.error('Error on', filePath, err);
    }
}

walk(apiDir, (err, files) => {
    if (err) throw err;
    files.forEach(fixFile);
    console.log('Finished fixing files.');
});
