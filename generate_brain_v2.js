const fs = require('fs');
const path = require('path');

const brainDir = path.join(__dirname, '.ai-brain');
if (!fs.existsSync(brainDir)) fs.mkdirSync(brainDir, { recursive: true });

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. FULL PRISMA SCHEMA ANALYSIS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function extractFullSchema() {
    const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
    const content = fs.readFileSync(schemaPath, 'utf-8');
    const lines = content.split(/\r?\n/);

    let doc = '# 08 - قاعدة البيانات الكاملة — جميع الجداول والعلاقات (Full Database Schema)\n\n';
    doc += `> **إجمالي الأسطر في schema.prisma:** ${lines.length}\n\n`;
    doc += `> **تم التوليد تلقائياً من الكود الفعلي بتاريخ:** ${new Date().toISOString()}\n\n`;

    let models = [];
    let enums = [];
    let currentModel = null;
    let currentEnum = null;
    let currentFields = [];
    let currentEnumValues = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // Detect model start
        const modelMatch = trimmed.match(/^model\s+(\w+)\s*\{/);
        if (modelMatch) {
            if (currentModel) {
                models.push({ name: currentModel, fields: [...currentFields] });
            }
            currentModel = modelMatch[1];
            currentFields = [];
            continue;
        }

        // Detect enum start
        const enumMatch = trimmed.match(/^enum\s+(\w+)\s*\{/);
        if (enumMatch) {
            if (currentEnum) {
                enums.push({ name: currentEnum, values: [...currentEnumValues] });
            }
            currentEnum = enumMatch[1];
            currentEnumValues = [];
            continue;
        }

        // Detect block end
        if (trimmed === '}') {
            if (currentModel) {
                models.push({ name: currentModel, fields: [...currentFields] });
                currentModel = null;
                currentFields = [];
            }
            if (currentEnum) {
                enums.push({ name: currentEnum, values: [...currentEnumValues] });
                currentEnum = null;
                currentEnumValues = [];
            }
            continue;
        }

        // Collect fields
        if (currentModel && trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('@@')) {
            currentFields.push(trimmed);
        }

        // Collect enum values
        if (currentEnum && trimmed && !trimmed.startsWith('//')) {
            currentEnumValues.push(trimmed);
        }
    }

    // Write models
    doc += `## إحصائيات\n`;
    doc += `- **عدد الجداول (Models):** ${models.length}\n`;
    doc += `- **عدد التعدادات (Enums):** ${enums.length}\n\n`;

    doc += `## فهرس الجداول\n`;
    models.forEach((m, i) => {
        doc += `${i + 1}. \`${m.name}\` (${m.fields.length} حقل)\n`;
    });
    doc += '\n---\n\n';

    // Full model details
    for (const m of models) {
        doc += `## Model: \`${m.name}\`\n`;
        doc += `| الحقل | النوع | الوصف |\n|---|---|---|\n`;
        for (const f of m.fields) {
            const parts = f.split(/\s+/);
            const fieldName = parts[0];
            const fieldType = parts[1] || '';
            const rest = parts.slice(2).join(' ');
            doc += `| \`${fieldName}\` | \`${fieldType}\` | ${rest} |\n`;
        }
        doc += '\n';
    }

    // Write enums
    if (enums.length > 0) {
        doc += '---\n\n## التعدادات (Enums)\n\n';
        for (const e of enums) {
            doc += `### \`${e.name}\`\n`;
            doc += `القيم: ${e.values.map(v => '`' + v + '`').join(', ')}\n\n`;
        }
    }

    fs.writeFileSync(path.join(brainDir, '08-database-models-full.md'), doc);
    console.log(`✅ Schema: ${models.length} models, ${enums.length} enums`);
    return models;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. FULL API ROUTES ANALYSIS (with actual code reading)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function walk(dir, ext) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    for (const file of fs.readdirSync(dir)) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory() && !full.includes('node_modules') && !full.includes('.next')) {
            results = results.concat(walk(full, ext));
        } else if (full.endsWith(ext)) {
            results.push(full);
        }
    }
    return results;
}

function extractAPIRoutes() {
    const apiDir = path.join(__dirname, 'src/app/api');
    const routeFiles = walk(apiDir, 'route.ts');

    let doc = '# 07 - توثيق جميع مسارات API بالتفصيل (All API Endpoints)\n\n';
    doc += `> **إجمالي عدد ملفات route.ts:** ${routeFiles.length}\n`;
    doc += `> **تم التوليد تلقائياً من الكود الفعلي بتاريخ:** ${new Date().toISOString()}\n\n`;

    let categories = {};

    for (const file of routeFiles) {
        const rel = file.replace(/\\/g, '/').split('src/app/api/')[1] || '';
        const endpoint = '/api/' + rel.replace('/route.ts', '');
        const content = fs.readFileSync(file, 'utf-8');
        const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].filter(m =>
            content.includes(`export const ${m}`) || content.includes(`export async function ${m}`)
        );
        
        if (methods.length === 0) continue;

        const category = endpoint.split('/')[2] || 'root';
        if (!categories[category]) categories[category] = [];

        let info = {
            endpoint,
            methods,
            hasWithRoute: content.includes('withRoute'),
            hasWithGuard: content.includes('withGuard'),
            hasZod: content.includes('z.object') || content.includes('z.string'),
            requireAuth: !content.includes('requireAuth: false'),
            rateLimit: (content.match(/rateLimit:\s*['"](\w+)['"]/)||[])[1] || 'DEFAULT',
            usesModels: [],
        };

        // Extract Prisma model usage
        const modelUses = [...content.matchAll(/prisma\.(\w+)\./g)].map(m => m[1]);
        info.usesModels = [...new Set(modelUses)];

        categories[category].push(info);
    }

    // Write organized by category
    for (const [cat, routes] of Object.entries(categories).sort()) {
        doc += `## 📂 \`/api/${cat}\` (${routes.length} مسار)\n\n`;
        for (const r of routes) {
            doc += `### \`${r.endpoint}\`\n`;
            doc += `- **Methods:** ${r.methods.join(', ')}\n`;
            doc += `- **حماية:** ${r.hasWithRoute ? '`withRoute` ✅' : r.hasWithGuard ? '`withGuard` ✅' : '⚠️ بدون حماية'}\n`;
            doc += `- **مصادقة مطلوبة:** ${r.requireAuth ? 'نعم' : 'لا (عام)'}\n`;
            doc += `- **Rate Limit:** \`${r.rateLimit}\`\n`;
            if (r.hasZod) doc += `- **التحقق:** Zod Schema ✅\n`;
            if (r.usesModels.length > 0) doc += `- **جداول مستخدمة:** ${r.usesModels.map(m => '`' + m + '`').join(', ')}\n`;
            doc += '\n';
        }
    }

    fs.writeFileSync(path.join(brainDir, '07-all-api-endpoints.md'), doc);
    console.log(`✅ APIs: ${routeFiles.length} route files in ${Object.keys(categories).length} categories`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. CORE LIB WITH ACTUAL FUNCTION SIGNATURES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function extractCoreLib() {
    const libDir = path.join(__dirname, 'src/lib');
    const files = [...walk(libDir, '.ts'), ...walk(libDir, '.tsx')];

    let doc = '# 09 - المكتبات والأدوات الأساسية (Core Libraries & Utils)\n\n';
    doc += `> **عدد الملفات في src/lib:** ${files.length}\n`;
    doc += `> **تم التوليد تلقائياً بتاريخ:** ${new Date().toISOString()}\n\n`;

    for (const file of files) {
        const rel = file.replace(/\\/g, '/').split('src/lib/')[1] || '';
        const content = fs.readFileSync(file, 'utf-8');
        const lineCount = content.split('\n').length;

        doc += `## \`src/lib/${rel}\` (${lineCount} سطر)\n`;

        // Extract exports
        const funcExports = [...content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g)];
        const constExports = [...content.matchAll(/export\s+(?:const|let)\s+(\w+)/g)];
        const classExports = [...content.matchAll(/export\s+class\s+(\w+)/g)];
        const interfaceExports = [...content.matchAll(/export\s+interface\s+(\w+)/g)];
        const typeExports = [...content.matchAll(/export\s+type\s+(\w+)/g)];

        if (funcExports.length > 0) {
            doc += `### الدوال المُصدّرة:\n`;
            for (const m of funcExports) {
                doc += `- \`${m[1]}(${m[2].substring(0, 80)})\`\n`;
            }
        }
        if (constExports.length > 0) {
            doc += `### الثوابت المُصدّرة:\n`;
            for (const m of constExports) doc += `- \`${m[1]}\`\n`;
        }
        if (classExports.length > 0) {
            doc += `### الفئات:\n`;
            for (const m of classExports) doc += `- \`${m[1]}\`\n`;
        }
        if (interfaceExports.length > 0) {
            doc += `### الواجهات (Interfaces):\n`;
            for (const m of interfaceExports) doc += `- \`${m[1]}\`\n`;
        }
        if (typeExports.length > 0) {
            doc += `### الأنواع (Types):\n`;
            for (const m of typeExports) doc += `- \`${m[1]}\`\n`;
        }
        doc += '\n';
    }

    fs.writeFileSync(path.join(brainDir, '09-core-libraries.md'), doc);
    console.log(`✅ Lib: ${files.length} files analyzed`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. FRONTEND PAGES WITH DETAIL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function extractFrontendPages() {
    const appDir = path.join(__dirname, 'src/app');
    const pageFiles = walk(appDir, '.tsx').filter(f => f.endsWith('page.tsx'));
    const layoutFiles = walk(appDir, '.tsx').filter(f => f.endsWith('layout.tsx'));

    let doc = '# 10 - جميع صفحات الواجهة الأمامية (Frontend Pages)\n\n';
    doc += `> **عدد الصفحات (page.tsx):** ${pageFiles.length}\n`;
    doc += `> **عدد التخطيطات (layout.tsx):** ${layoutFiles.length}\n\n`;

    // Group by route segment
    let groups = {};
    for (const f of pageFiles) {
        const rel = f.replace(/\\/g, '/').split('src/app/')[1].replace('/page.tsx', '');
        const content = fs.readFileSync(f, 'utf-8');
        const segment = rel.split('/')[0] || 'root';

        if (!groups[segment]) groups[segment] = [];

        groups[segment].push({
            route: '/' + rel,
            isClient: content.includes("'use client'") || content.includes('"use client"'),
            lineCount: content.split('\n').length,
            usesState: content.includes('useState'),
            usesEffect: content.includes('useEffect'),
            usesFetch: content.includes('fetch(') || content.includes('useQuery'),
            usesI18n: content.includes('useTranslation') || content.includes("t('"),
        });
    }

    for (const [segment, pages] of Object.entries(groups).sort()) {
        doc += `## 📂 \`${segment}\` (${pages.length} صفحة)\n`;
        for (const p of pages) {
            doc += `- \`${p.route}\` — ${p.isClient ? 'Client' : 'Server'} (${p.lineCount} سطر)`;
            const flags = [];
            if (p.usesState) flags.push('useState');
            if (p.usesEffect) flags.push('useEffect');
            if (p.usesFetch) flags.push('fetch');
            if (p.usesI18n) flags.push('i18n');
            if (flags.length) doc += ` [${flags.join(', ')}]`;
            doc += '\n';
        }
        doc += '\n';
    }

    fs.writeFileSync(path.join(brainDir, '10-frontend-pages.md'), doc);
    console.log(`✅ Pages: ${pageFiles.length} pages, ${layoutFiles.length} layouts`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. COMPONENTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function extractComponents() {
    const compDir = path.join(__dirname, 'src/components');
    const files = walk(compDir, '.tsx');

    let doc = '# 11 - مكونات واجهة المستخدم (UI Components)\n\n';
    doc += `> **عدد مكونات الـ UI:** ${files.length}\n\n`;

    for (const file of files) {
        const rel = file.replace(/\\/g, '/').split('src/components/')[1];
        const content = fs.readFileSync(file, 'utf-8');
        const exports = [...content.matchAll(/export\s+(?:default\s+)?(?:function|const)\s+(\w+)/g)].map(m => m[1]);
        
        doc += `- \`${rel}\``;
        if (exports.length) doc += ` → ${exports.join(', ')}`;
        doc += ` (${content.split('\n').length} سطر)\n`;
    }

    fs.writeFileSync(path.join(brainDir, '11-components.md'), doc);
    console.log(`✅ Components: ${files.length} files`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. DEPENDENCIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function extractDeps() {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
    let doc = '# 12 - الحزم والاعتماديات (Dependencies & Config)\n\n';
    
    doc += `## معلومات المشروع\n`;
    doc += `- **الاسم:** \`${pkg.name}\`\n`;
    doc += `- **الإصدار:** \`${pkg.version}\`\n\n`;

    doc += `## أوامر التشغيل (Scripts)\n`;
    for (const [k, v] of Object.entries(pkg.scripts || {})) {
        doc += `- \`npm run ${k}\` → \`${v}\`\n`;
    }

    const deps = Object.entries(pkg.dependencies || {});
    const devDeps = Object.entries(pkg.devDependencies || {});

    doc += `\n## الحزم الأساسية (${deps.length} حزمة)\n`;
    for (const [name, ver] of deps) {
        doc += `- \`${name}\`: ${ver}\n`;
    }

    doc += `\n## حزم التطوير (${devDeps.length} حزمة)\n`;
    for (const [name, ver] of devDeps) {
        doc += `- \`${name}\`: ${ver}\n`;
    }

    fs.writeFileSync(path.join(brainDir, '12-dependencies.md'), doc);
    console.log(`✅ Deps: ${deps.length} prod, ${devDeps.length} dev`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. ENV/CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function extractConfig() {
    let doc = '# 13 - ملفات الإعداد والبيئة (Environment & Configuration)\n\n';

    // next.config
    const nextConfig = path.join(__dirname, 'next.config.ts');
    if (fs.existsSync(nextConfig)) {
        doc += `## \`next.config.ts\`\n\`\`\`ts\n${fs.readFileSync(nextConfig, 'utf-8')}\n\`\`\`\n\n`;
    }

    // .env.example or .env detection
    const envExample = path.join(__dirname, '.env.example');
    if (fs.existsSync(envExample)) {
        doc += `## \`.env.example\`\n\`\`\`\n${fs.readFileSync(envExample, 'utf-8')}\n\`\`\`\n\n`;
    }

    // tsconfig
    const tsconfig = path.join(__dirname, 'tsconfig.json');
    if (fs.existsSync(tsconfig)) {
        doc += `## \`tsconfig.json\`\n\`\`\`json\n${fs.readFileSync(tsconfig, 'utf-8')}\n\`\`\`\n\n`;
    }

    fs.writeFileSync(path.join(brainDir, '13-config.md'), doc);
    console.log(`✅ Config files extracted`);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RUN ALL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' 🧠 AI Brain — Full Deep Extraction v2');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
extractFullSchema();
extractAPIRoutes();
extractCoreLib();
extractFrontendPages();
extractComponents();
extractDeps();
extractConfig();
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(' ✅ AI Brain Complete! All files in .ai-brain/');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
