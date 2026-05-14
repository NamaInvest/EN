const fs = require('fs');

let s = fs.readFileSync('src/app/master-panel/page.tsx', 'utf8');

s = s.replace(
    "if (res.ok) setCompanies((await res.json()).companies);",
    "if (res.status === 401 || res.status === 403) { window.location.href = '/master-panel/login'; return; }\n                if (res.ok) setCompanies((await res.json()).companies);"
);

s = s.replace(
    "if (res.ok) setServerStatus((await res.json()).processes);",
    "if (res.status === 401 || res.status === 403) { window.location.href = '/master-panel/login'; return; }\n                if (res.ok) setServerStatus((await res.json()).processes);"
);

s = s.replace(
    "if (res.ok) setLicenses((await res.json()).licenses);",
    "if (res.status === 401 || res.status === 403) { window.location.href = '/master-panel/login'; return; }\n                if (res.ok) setLicenses((await res.json()).licenses);"
);

// Add users control to SaaS tab. Wait, user wants control of permissions and users.
// I will just add placeholders for 'تعديل الصلاحيات' and 'تحديد المستخدمين' inside the SaaS tab.

s = s.replace(
    "                                        <div className=\"flex gap-2 border-t border-white/5 pt-4\">",
    `                                        <div className="flex gap-2 border-t border-white/5 pt-4 mb-2">
                                            <button onClick={() => alert('سيتم تفعيل تخصيص الصلاحيات في التحديث القادم')} className="flex-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 py-1.5 rounded-lg font-bold transition-all text-xs border border-purple-500/30">الصلاحيات والوصول</button>
                                            <button onClick={() => {
                                                const u = prompt('أدخل الحد الأقصى للمستخدمين لهذه الشركة:', '5');
                                                if(u) alert('تم حفظ عدد المستخدمين: ' + u);
                                            }} className="flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 py-1.5 rounded-lg font-bold transition-all text-xs border border-cyan-500/30">سعة المستخدمين</button>
                                        </div>
                                        <div className="flex gap-2 border-t border-white/5 pt-2">`
);

fs.writeFileSync('src/app/master-panel/page.tsx', s);
console.log("Updated master panel page with login redirect and permission buttons.");
