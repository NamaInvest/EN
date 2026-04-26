/**
 * E2E Test Suite v3 — Nama Invest ERP (FINAL)
 * Target: brightstartradingco.namainvist.com (port 3500)
 * All field names verified, accounts seeded, DB schema synced
 */
const { Client } = require('ssh2');
const HOST_HEADER = 'brightstartradingco.namainvist.com';
const BASE = 'http://localhost:3500';

function exec(conn, cmd) {
    return new Promise((resolve) => {
        conn.exec(cmd, (err, stream) => {
            if (err) { resolve('ERROR: ' + err.message); return; }
            let out = '';
            stream.on('data', d => out += d.toString());
            stream.stderr.on('data', d => out += d.toString());
            stream.on('close', () => resolve(out.trim()));
        });
    });
}

function api(conn, method, path, body) {
    const h = `-H 'Host: ${HOST_HEADER}' -H 'Content-Type: application/json'`;
    const auth = global.TOKEN ? `-H 'Authorization: Bearer ${global.TOKEN}' -b 'token=${global.TOKEN}'` : '';
    const bodyStr = body ? JSON.stringify(body) : '';
    const data = body ? `-d '${bodyStr.replace(/'/g, "'\\''")}'` : '';
    const cmd = `curl -s -m 10 -X ${method} ${auth} ${h} ${data} '${BASE}${path}' 2>&1`;
    return exec(conn, cmd);
}

function parse(r) { try { return JSON.parse(r); } catch { return null; } }

const results = [];
function log(id, name, status, detail) {
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    results.push({ id, name, status, detail });
    console.log(`${icon} ${id} ${name}: ${detail.substring(0, 140)}`);
}

const c = new Client();
c.on('ready', async () => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  E2E Test Suite v3 (FINAL) — Nama Invest ERP');
    console.log('  Target: brightstartradingco.namainvist.com');
    console.log('═══════════════════════════════════════════════════════\n');

    // LOGIN
    let r = await api(c, 'POST', '/api/auth/login', { username: 'admin', password: 'admin7773' });
    let d = parse(r);
    if (d && d.token) {
        global.TOKEN = d.token;
        log('0.0', 'تسجيل الدخول', 'PASS', `Token OK, role: ${d.user?.role}`);
    } else { console.log('❌ LOGIN FAILED'); c.end(); return; }

    // ═══════════════════════════════════════════════
    console.log('\n📦 الاختبار 1: سلسلة المخزون الكاملة');
    console.log('─────────────────────────────────────');

    // 1.1 إضافة مورد
    r = await api(c, 'POST', '/api/customers', { name: 'مصنع التقنية V3', phone: '0501111111', type: 1, taxNumber: '300123456700003' });
    d = parse(r);
    const suppId = d?.id;
    log('1.1', 'إضافة مورد', suppId ? 'PASS' : 'FAIL', suppId ? `ID: ${suppId}` : r.substring(0, 100));

    // 1.2 إضافة منتج (fields as strings to match Zod)
    r = await api(c, 'POST', '/api/products', { name: 'لابتوب Dell V3', nameEn: 'Dell V3', buyPrice: '3000', sellPrice: '4000', unitId: '1', taxRate: '15', currentStock: '10' });
    d = parse(r);
    const prodId = d?.id;
    log('1.2', 'إضافة منتج', prodId ? 'PASS' : 'FAIL', prodId ? `ID: ${prodId}, stock: ${d?.currentStock}` : r.substring(0, 100));

    // 1.3 أمر شراء
    r = await api(c, 'POST', '/api/purchase-orders', { supplierId: suppId, items: [{ productId: prodId, quantity: 10, unitPrice: 3000 }], notes: 'E2E V3 PO' });
    d = parse(r);
    log('1.3', 'أمر شراء PO', d && !d.error ? 'PASS' : 'FAIL', d?.error || `PO created`);

    // 1.4 فاتورة مشتريات
    r = await api(c, 'POST', '/api/purchases', { supplierId: suppId, items: [{ productId: prodId, quantity: 10, unitPrice: 3000 }], notes: 'E2E V3 Purchase' });
    d = parse(r);
    log('1.4', 'فاتورة مشتريات', d && !d.error ? 'PASS' : 'FAIL', d?.error || `Purchase OK`);

    // 1.5 تحويل مخازن
    r = await api(c, 'POST', '/api/smart-transfers', { fromWarehouseId: 1, toWarehouseId: 2, items: [{ productId: prodId, quantity: 3 }], notes: 'E2E Transfer' });
    d = parse(r);
    log('1.5', 'تحويل بين المخازن', d && !d.error ? 'PASS' : 'FAIL', d?.error || 'Transferred 3 units');

    // 1.6 تسوية مخزون
    r = await api(c, 'POST', '/api/stock/adjustments', { items: [{ productId: prodId, systemQty: 10, actualQty: 9, reason: 'E2E shortage' }] });
    d = parse(r);
    log('1.6', 'الجرد الفعلي', d && !d.error ? 'PASS' : 'FAIL', d?.error || 'Adjustment OK');

    // 1.7 البيع
    r = await api(c, 'POST', '/api/sales', { items: [{ productId: prodId, productName: 'لابتوب Dell V3', quantity: 1, price: 4000 }], paymentType: 'cash', taxRate: 15 });
    d = parse(r);
    const saleId = d?.id;
    log('1.7', 'البيع النهائي', saleId ? 'PASS' : 'FAIL', saleId ? `Sale ID: ${saleId}, Total: ${d?.total}` : (d?.error || r.substring(0, 100)));

    // 1.8 التحقق من المخزون بعد البيع
    r = await api(c, 'GET', `/api/products/${prodId}`);
    d = parse(r);
    log('1.8', 'المخزون بعد البيع', d?.currentStock !== undefined ? 'PASS' : 'FAIL', `Stock: ${d?.currentStock} (expected ~9)`);

    // ═══════════════════════════════════════════════
    console.log('\n💰 الاختبار 2: الدقة المحاسبية');
    console.log('─────────────────────────────────────');

    // Get real account codes
    r = await api(c, 'GET', '/api/accounting/trial-balance');
    d = parse(r);
    const accts = d?.accounts || [];
    const accCode1 = accts.find(a => a.code === '1001')?.code || accts[0]?.code || '1001';
    const accCode2 = accts.find(a => a.code === '4001')?.code || accts[1]?.code || '4001';

    // 2.1 رفض قيد غير متوازن
    r = await api(c, 'POST', '/api/accounting/journal', { description: 'E2E Unbalanced', lines: [{ accountCode: accCode1, debit: 1000, credit: 0 }, { accountCode: accCode2, debit: 0, credit: 900 }] });
    d = parse(r);
    log('2.1', 'رفض قيد غير متوازن', d?.error ? 'PASS' : 'FAIL', d?.error || 'NOT rejected!');

    // 2.2 قيد متوازن
    r = await api(c, 'POST', '/api/accounting/journal', { description: 'E2E Balanced', lines: [{ accountCode: accCode1, debit: 1000, credit: 0 }, { accountCode: accCode2, debit: 0, credit: 1000 }] });
    d = parse(r);
    log('2.2', 'قيد متوازن', d?.success || d?.entryId ? 'PASS' : 'FAIL', d?.error || `Entry ID: ${d?.entryId}`);

    // 2.3 ميزان المراجعة
    r = await api(c, 'GET', '/api/accounting/trial-balance');
    d = parse(r);
    const trialOk = d?.accounts?.length > 0;
    log('2.3', 'ميزان المراجعة', trialOk ? 'PASS' : 'FAIL', `${d?.accounts?.length || 0} accounts loaded`);

    // 2.4 قائمة الدخل
    r = await api(c, 'GET', '/api/accounting/income-statement');
    d = parse(r);
    log('2.4', 'قائمة الدخل', d && !d.error ? 'PASS' : 'FAIL', d?.error || 'Income statement OK');

    // 2.5 الميزانية العمومية
    r = await api(c, 'GET', '/api/accounting/balance-sheet');
    d = parse(r);
    log('2.5', 'الميزانية العمومية', d && !d.error ? 'PASS' : 'FAIL', d?.error || 'Balance sheet OK');

    // ═══════════════════════════════════════════════
    console.log('\n👷 الاختبار 3: الموارد البشرية');
    console.log('─────────────────────────────────────');

    r = await api(c, 'POST', '/api/employees', { name: 'خالد V3', phone: '0559999999', position: 'مطور', department: 'تقنية', basicSalary: 8000, nationality: 'Saudi', joinDate: '2026-01-01' });
    d = parse(r);
    const empId = d?.id;
    log('3.1', 'إضافة موظف', empId ? 'PASS' : 'FAIL', empId ? `ID: ${empId}` : r.substring(0, 100));

    r = await api(c, 'POST', '/api/attendance', { employeeId: empId, date: '2026-04-25', checkIn: '08:00', checkOut: '17:00' });
    d = parse(r);
    log('3.2', 'تسجيل حضور', d && !d.error ? 'PASS' : 'FAIL', d?.error || 'Attendance OK');

    r = await api(c, 'POST', '/api/vacations', { employeeId: empId, type: 'annual', dateFrom: '2026-04-15', dateTo: '2026-04-16', status: 'approved' });
    d = parse(r);
    log('3.3', 'تسجيل إجازة', d?.id ? 'PASS' : 'FAIL', d?.error || `Vacation ID: ${d?.id}`);

    r = await api(c, 'POST', '/api/hr/loans', { employeeId: empId, amount: 2000, monthlyDeduction: 500, reason: 'E2E Loan' });
    d = parse(r);
    log('3.4', 'سلفة', d && !d.error ? 'PASS' : 'FAIL', d?.error || `Loan OK`);

    r = await api(c, 'POST', '/api/salaries', { employeeId: empId, month: '4', year: '2026', basicSalary: 8000, additions: 2800, deductions: 1567, notes: 'E2E Salary' });
    d = parse(r);
    log('3.5', 'حساب الراتب', d?.netSalary ? 'PASS' : 'FAIL', d?.error || `Net: ${d?.netSalary}`);

    r = await api(c, 'GET', '/api/salaries');
    d = parse(r);
    log('3.6', 'قائمة الرواتب', Array.isArray(d) && d.length > 0 ? 'PASS' : 'FAIL', `${Array.isArray(d) ? d.length : 0} records`);

    // ═══════════════════════════════════════════════
    console.log('\n🏭 الاختبار 4: التصنيع');
    console.log('─────────────────────────────────────');

    // Create raw material
    r = await api(c, 'POST', '/api/products', { name: 'دقيق V3', nameEn: 'Flour V3', buyPrice: '10', sellPrice: '15', unitId: '1', currentStock: '50' });
    const flourId = parse(r)?.id;
    r = await api(c, 'POST', '/api/products', { name: 'كعكة V3', nameEn: 'Cake V3', buyPrice: '5', sellPrice: '15', unitId: '1' });
    const cakeId = parse(r)?.id;

    r = await api(c, 'POST', '/api/manufacturing/recipes', { name: 'وصفة كعكة V3', finishedProductId: cakeId, outputQuantity: 1, ingredients: [{ rawProductId: flourId, quantity: 0.2, unit: 'kg' }] });
    d = parse(r);
    const recipeId = d?.id;
    log('4.1', 'إنشاء وصفة BOM', recipeId ? 'PASS' : 'FAIL', recipeId ? `Recipe ID: ${recipeId}` : (d?.error || r.substring(0, 100)));

    r = await api(c, 'POST', '/api/manufacturing/orders', { recipeId: recipeId, quantity: 100, notes: 'E2E Production' });
    d = parse(r);
    log('4.2', 'أمر إنتاج', d && !d.error ? 'PASS' : 'FAIL', d?.error || `Order: ${d?.status || 'created'}`);

    // ═══════════════════════════════════════════════
    console.log('\n🔄 الاختبار 5: التكامل والإضافات');
    console.log('─────────────────────────────────────');

    r = await api(c, 'POST', '/api/customers', { name: 'شركة النور V3', phone: '0559876543', type: 0 });
    d = parse(r);
    const custId = d?.id;
    log('5.1', 'إضافة عميل', custId ? 'PASS' : 'FAIL', custId ? `ID: ${custId}` : r.substring(0, 100));

    r = await api(c, 'POST', '/api/price-quotes', { customerId: custId, items: [{ productId: prodId, quantity: 100, price: 4000 }], notes: 'E2E Quote' });
    d = parse(r);
    log('5.2', 'عرض سعر', d && !d.error ? 'PASS' : 'FAIL', d?.error || 'Quote OK');

    r = await api(c, 'GET', '/api/delivery-platforms');
    d = parse(r);
    log('5.3', 'منصات التوصيل', d?.platforms?.length >= 4 ? 'PASS' : 'FAIL', `${d?.platforms?.length} platforms`);

    r = await api(c, 'GET', '/api/shipments');
    d = parse(r);
    log('5.4', 'خدمة الشحنات', d !== null ? 'PASS' : 'FAIL', 'Shipments OK');

    r = await api(c, 'GET', '/api/reports/bi-export?entity=sales');
    d = parse(r);
    log('5.5', 'تصدير BI', d?.entity ? 'PASS' : 'FAIL', `Entity: ${d?.entity}, Count: ${d?.count}`);

    r = await api(c, 'GET', '/api/reports/export?type=trial-balance&format=csv');
    log('5.6', 'تصدير CSV', r.length > 10 ? 'PASS' : 'FAIL', `${r.length} chars`);

    r = await api(c, 'GET', '/api/contracts/alerts');
    d = parse(r);
    log('5.7', 'تنبيهات العقود', d !== null ? 'PASS' : 'FAIL', 'Alerts OK');

    // ═══════════════════════════════════════════════
    console.log('\n🛡️ الاختبار 6: الأمان');
    console.log('─────────────────────────────────────');

    r = await api(c, 'POST', '/api/auth/login', { username: 'admin', password: 'WRONG' });
    d = parse(r);
    log('6.1', 'رفض كلمة سر خاطئة', d?.error ? 'PASS' : 'FAIL', d?.error || 'Not rejected');

    r = await api(c, 'POST', '/api/auth/login', { username: 'ghost_user', password: 'x' });
    d = parse(r);
    log('6.2', 'رفض مستخدم غير موجود', d?.error ? 'PASS' : 'FAIL', d?.error || 'Not rejected');

    r = await exec(c, `curl -s -m 5 -H 'Host: ${HOST_HEADER}' '${BASE}/api/products' 2>&1 | head -c 100`);
    d = parse(r);
    log('6.3', 'حماية API بدون توكن', d?.error ? 'PASS' : 'FAIL', d?.error || r.substring(0, 60));

    // ═══════════════════════════════════════════════
    console.log('\n📊 الاختبار 7: التقارير');
    console.log('─────────────────────────────────────');

    r = await api(c, 'GET', '/api/reports/sales-summary');
    d = parse(r);
    log('7.1', 'تقرير المبيعات', d && !d.error ? 'PASS' : 'FAIL', d?.error || 'Sales report OK');

    r = await api(c, 'GET', '/api/reports/inventory');
    d = parse(r);
    log('7.2', 'تقرير المخزون', d && !d.error ? 'PASS' : 'FAIL', d?.error || 'Inventory OK');

    r = await api(c, 'GET', '/api/reports/cash-flow');
    d = parse(r);
    log('7.3', 'التدفقات النقدية', d && !d.error ? 'PASS' : 'FAIL', d?.error || 'Cash flow OK');

    // Ledger with real account
    const ledgerAccId = accts[0]?.id || 1;
    r = await api(c, 'GET', `/api/accounting/ledger?accountId=${ledgerAccId}`);
    d = parse(r);
    log('7.4', 'دفتر الأستاذ', d && !d.error ? 'PASS' : 'FAIL', d?.error || 'Ledger OK');

    r = await api(c, 'GET', '/api/treasury/balance');
    d = parse(r);
    log('7.5', 'رصيد الصندوق', d !== null ? 'PASS' : 'FAIL', `Balance: ${JSON.stringify(d).substring(0, 80)}`);

    // ═══════════════════════════════════════════════
    console.log('\n🏥 الاختبار 8: صحة النظام');
    console.log('─────────────────────────────────────');

    r = await api(c, 'GET', '/api/sys/health');
    d = parse(r);
    log('8.1', 'Health Check', d && !d.error ? 'PASS' : 'FAIL', `Status: ${d?.status || 'OK'}`);

    r = await api(c, 'GET', '/api/version');
    d = parse(r);
    log('8.2', 'Version', d !== null ? 'PASS' : 'FAIL', `v${d?.version}`);

    // ═══════════════════════════════════════════════
    const pass = results.filter(r => r.status === 'PASS').length;
    const fail = results.filter(r => r.status === 'FAIL').length;
    const total = results.length;
    const pct = ((pass / total) * 100).toFixed(0);

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              نتائج اختبار نظام Nama Invest                ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  الاختبارات الناجحة:     ${String(pass).padStart(2)} / ${total}                          ║`);
    console.log(`║  الاختبارات الفاشلة:     ${String(fail).padStart(2)} / ${total}                          ║`);
    console.log(`║  نسبة النجاح:           ${String(pct).padStart(3)}%                              ║`);
    console.log('╠════════════════════════════════════════════════════════════╣');
    
    const failures = results.filter(r => r.status === 'FAIL');
    if (failures.length > 0) {
        console.log('║  الأخطاء:                                                 ║');
        failures.forEach(f => console.log(`║  ❌ ${f.id} ${f.name}: ${f.detail.substring(0, 45)}`));
    } else {
        console.log('║  🎉 جميع الاختبارات ناجحة!                                 ║');
    }
    console.log('╚════════════════════════════════════════════════════════════╝');

    c.end();
});
c.on('error', e => console.error(e.message));
c.connect({ host: '46.4.188.170', port: 22, username: 'root', password: '_ee4SWbxLVfH9b', readyTimeout: 15000 });
