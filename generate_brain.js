const fs = require('fs');
const path = require('path');

const brainDir = path.join(__dirname, '.ai-brain');
if (!fs.existsSync(brainDir)) fs.mkdirSync(brainDir);

// Helpers
function walk(dir, extension = '.ts') {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next')) {
                results = results.concat(walk(file, extension));
            }
        } else {
            if (file.endsWith(extension) || file.endsWith(extension + 'x')) {
                results.push(file);
            }
        }
    });
    return results;
}

function extractAPIRoutes() {
    const apiFiles = walk(path.join(__dirname, 'src/app/api'));
    let doc = '# توثيق جميع مسارات الواجهة الخلفية (API Routes)\n\n';
    
    apiFiles.forEach(file => {
        const relativePath = file.split('src\\app\\api\\')[1] || file.split('src/app/api/')[1];
        if (!relativePath) return;
        
        const endpoint = '/api/' + relativePath.replace(/\\/g, '/').replace('/route.ts', '');
        const content = fs.readFileSync(file, 'utf-8');
        const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].filter(m => content.includes(`export async function ${m}`));
        
        if (methods.length > 0) {
            doc += `## \`${endpoint}\`\n`;
            doc += `- **Methods:** ${methods.join(', ')}\n`;
            
            // Extract Zod schemas or bodies if any
            if (content.includes('z.object')) {
                doc += `- **Validation:** Uses Zod schema.\n`;
            }
            if (content.includes('withRoute')) {
                doc += `- **Security:** Protected by \`withRoute\` middleware.\n`;
            }
            doc += '\n';
        }
    });
    fs.writeFileSync(path.join(brainDir, '07-all-api-endpoints.md'), doc);
}

function extractDatabaseSchema() {
    const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
    if (!fs.existsSync(schemaPath)) return;
    
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const lines = content.split('\n');
    let doc = '# توثيق شامل لجميع جداول قاعدة البيانات (Database Schema Models)\n\n';
    
    let currentModel = null;
    let fields = [];
    
    lines.forEach(line => {
        line = line.trim();
        if (line.startsWith('model ')) {
            if (currentModel) {
                doc += `## Model: \`${currentModel}\`\n\`\`\`prisma\n${fields.join('\n')}\n\`\`\`\n\n`;
            }
            currentModel = line.split(' ')[1];
            fields = [];
        } else if (currentModel && line !== '}') {
            fields.push(line);
        }
    });
    
    if (currentModel) {
        doc += `## Model: \`${currentModel}\`\n\`\`\`prisma\n${fields.join('\n')}\n\`\`\`\n\n`;
    }
    
    fs.writeFileSync(path.join(brainDir, '08-database-models-full.md'), doc);
}

function extractCoreLib() {
    const libFiles = walk(path.join(__dirname, 'src/lib'));
    let doc = '# توثيق جميع المكتبات والأدوات المساعدة (Core Library & Utils)\n\n';
    
    libFiles.forEach(file => {
        const relativePath = file.split('src\\lib\\')[1] || file.split('src/lib/')[1];
        doc += `## \`src/lib/${relativePath.replace(/\\/g, '/')}\`\n`;
        const content = fs.readFileSync(file, 'utf-8');
        
        // Find exported functions
        const exports = [...content.matchAll(/export (?:async )?function ([a-zA-Z0-9_]+)/g)].map(m => m[1]);
        const classes = [...content.matchAll(/export class ([a-zA-Z0-9_]+)/g)].map(m => m[1]);
        
        if (exports.length > 0) doc += `- **Functions:** ${exports.join(', ')}\n`;
        if (classes.length > 0) doc += `- **Classes:** ${classes.join(', ')}\n`;
        doc += '\n';
    });
    fs.writeFileSync(path.join(brainDir, '09-core-libraries.md'), doc);
}

console.log('Extracting APIs...');
extractAPIRoutes();
console.log('Extracting DB Schema...');
extractDatabaseSchema();
console.log('Extracting Core Lib...');
extractCoreLib();
console.log('Brain Extracted Successfully!');
