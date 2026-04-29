const fs   = require('fs');
const path = require('path');

const dashDir = 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\(dashboard)';
const apiDir  = 'c:\\Users\\1\\Desktop\\alfa\\src\\app\\api';

// ── 1. جمع كل صفحات الـ dashboard ──
const pages = [];
function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) scanDir(full);
        else if (e.name === 'page.tsx') pages.push(full);
    }
}
scanDir(dashDir);

// ── 2. جمع كل API routes ──
const apis = new Set();
function scanApi(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) scanApi(full);
        else if (e.name === 'route.ts') {
            const rel = full.replace(apiDir, '').replace(/\\/g, '/').replace('/route.ts', '');
            apis.add(rel);
        }
    }
}
scanApi(apiDir);

// ── 3. تحليل كل صفحة ──
const results = [];
for (const pagePath of pages) {
    const content    = fs.readFileSync(pagePath, 'utf8');
    const pageName   = path.dirname(pagePath).split(path.sep).pop();

    // استخرج جميع fetch('/api/...')
    const fetchRegex = /fetch\(['"`]([^'"`]+)['"`]/g;
    const fetchCalls = [];
    let m;
    while ((m = fetchRegex.exec(content)) !== null) fetchCalls.push(m[1]);

    // استخرج جميع الأزرار
    const btnCount    = (content.match(/<button/g) || []).length;
    const catchCount  = (content.match(/catch\s*\(/g) || []).length;
    const noAlert     = (content.match(/console\.error/g) || []).length; // يسجل بدون إشعار للمستخدم

    // تحقق من API المفقودة
    const missingApis = fetchCalls.filter(url => {
        const normalized = url.split('?')[0].replace('/api', '');
        // تحقق بسيط
        return !Array.from(apis).some(apiPath => normalized.startsWith(apiPath));
    });

    results.push({
        page:        pageName,
        buttons:     btnCount,
        fetchCalls:  fetchCalls.length,
        catchBlocks: catchCount,
        silentErrors: noAlert,
        fetchUrls:   [...new Set(fetchCalls)],
        missingApis,
    });
}

// ── 4. طباعة التقرير ──
results.sort((a, b) => b.buttons - a.buttons);

console.log('\n📊 تقرير شامل للأزرار والـ API Calls في كل صفحة\n');
console.log('═'.repeat(90));

for (const r of results) {
    const issues = [];
    if (r.missingApis.length > 0) issues.push(`❌ API مفقودة: ${r.missingApis.join(', ')}`);
    if (r.fetchCalls > 0 && r.catchCount === 0) issues.push('⚠️  لا يوجد error handling');
    if (r.silentErrors > 0) issues.push(`🔇 ${r.silentErrors} أخطاء صامتة (console.error بدون alert)`);

    const status = issues.length === 0 ? '✅' : '🔴';
    console.log(`\n${status} [${r.page.padEnd(22)}] أزرار: ${r.buttons}  fetch: ${r.fetchCalls}  catch: ${r.catchBlocks}`);
    if (issues.length > 0) {
        issues.forEach(i => console.log(`    ${i}`));
    }
    if (r.fetchUrls.length > 0) {
        console.log(`    📡 APIs: ${r.fetchUrls.slice(0, 5).join(' | ')}${r.fetchUrls.length > 5 ? ` ... +${r.fetchUrls.length - 5}` : ''}`);
    }
}

console.log('\n' + '═'.repeat(90));
const totalIssues = results.filter(r => r.missingApis.length > 0).length;
console.log(`\n📌 ملخص: ${results.length} صفحة | ${results.reduce((s,r)=>s+r.buttons,0)} زر | ${totalIssues} صفحة بها APIs مشبوهة`);
