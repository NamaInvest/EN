const fs = require('fs');
let c = fs.readFileSync('src/app/ice/page.tsx', 'utf8');
let fixes = 0;

// ====== FIX 1: doAction - refresh selected tenant from updated list ======
const oldDoAction = `            if (data.success) {
                await fetchTenants();
                if (isDelete) {
                    setSelected(null);
                    alert('✅ تم حذف الحساب بنجاح');
                } else {
                    setSelected(prev => prev ? { ...prev, ...extra } : prev);
                }`;

const newDoAction = `            if (data.success) {
                const freshRes = await fetch('/api/ice/tenants');
                const freshData = await freshRes.json();
                if (freshData.success) {
                    setTenants(freshData.tenants);
                    if (isDelete) {
                        setSelected(null);
                    } else {
                        // Re-select from fresh data
                        const fresh = freshData.tenants.find((t: any) => t.subdomain === selected.subdomain);
                        if (fresh) {
                            setSelected(fresh);
                            setNewPlan(fresh.plan || 'basic');
                            setQuotaInv(String(fresh.invoiceQuota));
                            setQuotaProd(String(fresh.productQuota));
                            setQuotaUser(String(fresh.userQuota));
                        }
                    }
                }
                setLoading(false);`;

if (c.includes(oldDoAction)) {
    c = c.replace(oldDoAction, newDoAction);
    fixes++;
    console.log('✅ Fix 1: doAction now refreshes selected tenant');
}

// ====== FIX 2: Replace prompt-based delete with state-based confirmation ======
// Add deleteConfirm state
c = c.replace(
    "const [expandedSection, setExpandedSection] = useState<string | null>(null);",
    `const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);`
);
fixes++;
console.log('✅ Fix 2: Added delete confirmation states');

// ====== FIX 3: Replace the old Danger Zone with working one ======
// Find and replace the entire danger zone section
const dangerZoneOld = `                                        {/* Danger Zone */}
                                        <div className={\`pt-6 mt-4 border-t space-y-3 \${isLight ? 'border-slate-100' : 'border-white/10'}\`}>
                                            <label className={\`text-[10px] font-black uppercase tracking-widest text-rose-500\`}>منطقة الخطر</label>
                                            <button
                                                disabled={!!busy}
                                                onClick={() => { if (confirm('⚠️ هل أنت متأكد من تعليق الوصول الكامل؟')) doAction('suspend'); }}
                                                className={\`w-full py-3 rounded-2xl text-sm font-black transition-all border flex items-center justify-center gap-2 \${isLight ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-amber-800 bg-amber-900/20 text-amber-400 hover:bg-amber-900/40'}\`}>
                                                {busy === 'suspend' ? <RefreshCw className="w-4 h-4 animate-spin" /> : '⛔'}
                                                تعليق الوصول الكامل
                                            </button>
                                            <button
                                                disabled={!!busy}
                                                onClick={() => {
                                                    const name = prompt(\`⚠️ لحذف الحساب نهائياً، اكتب اسم النطاق: \${selected.subdomain}\`);
                                                    if (name === selected.subdomain) {
                                                        if (confirm(\`🗑️ سيتم حذف:\\n- قاعدة البيانات (\${selected.dbName})\\n- حساب Clerk المرتبط\\n- سجل المستأجر\\n\\nهل أنت متأكد؟ لا يمكن التراجع!\`)) {
                                                            doAction('delete');
                                                        }
                                                    } else if (name !== null) {
                                                        alert('❌ الاسم غير مطابق. تم إلغاء الحذف.');
                                                    }
                                                }}
                                                className={\`w-full py-3 rounded-2xl text-sm font-black transition-all border flex items-center justify-center gap-2 \${isLight ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'border-rose-800 bg-rose-900/20 text-rose-400 hover:bg-rose-900/40'}\`}>
                                                {busy === 'delete' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                🗑️ حذف الحساب نهائياً
                                            </button>
                                        </div>`;

const dangerZoneNew = `                                        {/* Danger Zone */}
                                        <div className={\`pt-6 mt-4 border-t space-y-3 \${isLight ? 'border-slate-100' : 'border-white/10'}\`}>
                                            <label className={\`text-[10px] font-black uppercase tracking-widest text-rose-500\`}>منطقة الخطر</label>
                                            <button
                                                disabled={!!busy}
                                                onClick={() => { if (window.confirm('⚠️ هل أنت متأكد من تعليق الوصول الكامل؟')) doAction('suspend'); }}
                                                className={\`w-full py-3 rounded-2xl text-sm font-black transition-all border flex items-center justify-center gap-2 \${isLight ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-amber-800 bg-amber-900/20 text-amber-400 hover:bg-amber-900/40'}\`}>
                                                {busy === 'suspend' ? <RefreshCw className="w-4 h-4 animate-spin" /> : '⛔'}
                                                تعليق الوصول الكامل
                                            </button>
                                            {!showDeleteConfirm ? (
                                                <button
                                                    disabled={!!busy || ['n7','n11'].includes(selected.subdomain)}
                                                    onClick={() => { setShowDeleteConfirm(true); setDeleteConfirmInput(''); }}
                                                    className={\`w-full py-3 rounded-2xl text-sm font-black transition-all border flex items-center justify-center gap-2 \${['n7','n11'].includes(selected.subdomain) ? 'opacity-30 cursor-not-allowed border-slate-300 bg-slate-100 text-slate-400' : isLight ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'border-rose-800 bg-rose-900/20 text-rose-400 hover:bg-rose-900/40'}\`}>
                                                    <Trash2 className="w-4 h-4" />
                                                    {['n7','n11'].includes(selected.subdomain) ? '🔒 محمي - لا يمكن حذفه' : '🗑️ حذف الحساب نهائياً'}
                                                </button>
                                            ) : (
                                                <div className={\`p-4 rounded-2xl border space-y-3 \${isLight ? 'border-rose-200 bg-rose-50' : 'border-rose-800 bg-rose-900/20'}\`}>
                                                    <p className="text-sm font-bold text-rose-600">⚠️ لتأكيد الحذف، اكتب اسم النطاق: <strong className="font-outfit">{selected.subdomain}</strong></p>
                                                    <input
                                                        type="text"
                                                        value={deleteConfirmInput}
                                                        onChange={e => setDeleteConfirmInput(e.target.value)}
                                                        placeholder={\`اكتب \${selected.subdomain} هنا...\`}
                                                        className={\`w-full rounded-xl px-4 py-2.5 text-sm font-outfit border focus:outline-none focus:ring-2 focus:ring-rose-400/30 \${isLight ? 'bg-white border-rose-200' : 'bg-slate-900 border-rose-800 text-white'}\`}
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmInput(''); }}
                                                            className={\`flex-1 py-2.5 rounded-xl text-sm font-black border \${isLight ? 'border-slate-200 hover:bg-slate-100' : 'border-white/10 hover:bg-white/10 text-white'}\`}>
                                                            إلغاء
                                                        </button>
                                                        <button
                                                            disabled={deleteConfirmInput !== selected.subdomain || !!busy}
                                                            onClick={() => { doAction('delete'); setShowDeleteConfirm(false); }}
                                                            className="flex-1 py-2.5 rounded-xl text-sm font-black bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:hover:bg-rose-600 text-white flex items-center justify-center gap-2">
                                                            {busy === 'delete' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                                            تأكيد الحذف
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>`;

if (c.includes(dangerZoneOld)) {
    c = c.replace(dangerZoneOld, dangerZoneNew);
    fixes++;
    console.log('✅ Fix 3: Replaced prompt-based delete with inline confirmation');
} else {
    console.log('⚠️ Fix 3: Danger zone not found by exact match, searching...');
    // Try to find it by partial match
    const dzIdx = c.indexOf('{/* Danger Zone */}');
    if (dzIdx > -1) {
        // Find the end of this section (next </div> that closes the outer)
        let depth = 0;
        let start = dzIdx;
        let end = dzIdx;
        let foundStart = false;
        for (let i = dzIdx; i < c.length; i++) {
            if (c.substring(i, i + 4) === '<div') { depth++; foundStart = true; }
            if (c.substring(i, i + 6) === '</div>') {
                depth--;
                if (foundStart && depth === 0) {
                    end = i + 6;
                    break;
                }
            }
        }
        c = c.substring(0, start) + dangerZoneNew + c.substring(end);
        fixes++;
        console.log('✅ Fix 3: Replaced danger zone via partial match');
    }
}

// ====== FIX 4: Remove the old "Global Access Suspension" at the bottom if it exists ======
const oldGlobalSuspension = `                                        <div className={\`pt-4 border-t text-center \${isLight ? 'border-slate-100' : 'border-white/10'}\`}>
                                            <button
                                                disabled={!!busy}
                                                onClick={() => { if (confirm('⚠️ هل أنت متأكد من تعليق الوصول الكامل؟')) doAction('suspend'); }}
                                                className="text-[10px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-600 transition-all disabled:opacity-50">
                                                ⛔ Global Access Suspension
                                            </button>
                                        </div>`;

if (c.includes(oldGlobalSuspension)) {
    c = c.replace(oldGlobalSuspension, '');
    fixes++;
    console.log('✅ Fix 4: Removed old Global Access Suspension');
}

// ====== FIX 5: Reset delete confirm when selecting a different tenant ======
c = c.replace(
    `const pickTenant = (t: Tenant) => {
        setSelected(t);`,
    `const pickTenant = (t: Tenant) => {
        setSelected(t);
        setShowDeleteConfirm(false);
        setDeleteConfirmInput('');`
);
fixes++;
console.log('✅ Fix 5: Reset delete confirm on tenant switch');

// ====== FIX 6: Translate remaining English labels in the header ======
// "Plan" label 
c = c.replace('>Plan</div>', '>الباقة</div>');
c = c.replace('>Status</div>', '>الحالة</div>');
c = c.replace('>Days Left</span>', '>أيام متبقية</span>');
c = c.replace('>INVOICES</span>', '>فواتير</span>');
c = c.replace('>PRODUCTS</span>', '>أصناف</span>');
c = c.replace('>USERS</span>', '>مستخدمين</span>');
fixes++;
console.log('✅ Fix 6: Translated English labels to Arabic');

fs.writeFileSync('src/app/ice/page.tsx', c, 'utf8');
console.log(`\nTotal fixes applied: ${fixes}`);
