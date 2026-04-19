const fs = require('fs');
let lines = fs.readFileSync('src/app/ice/page.tsx', 'utf8').split('\n');

// Replace lines 651-679 (0-indexed: 650-678) with new header
const newHeader = `                            {/* Toast */}
                            {toast && (
                                <div className={\`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl text-sm font-black shadow-2xl \${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}\`}>
                                    {toast.msg}
                                </div>
                            )}

                            {/* Company Header Card */}
                            <div className={\`rounded-3xl p-8 \${T.card} relative overflow-hidden\`}>
                                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-l from-indigo-600 to-indigo-400" />
                                <div className="flex flex-col lg:flex-row justify-between gap-8">
                                    <div className="space-y-4 flex-1 min-w-0">
                                        <div className="flex items-center gap-4 flex-wrap">
                                            {editMode ? (
                                                <input value={editOrgName} onChange={e => setEditOrgName(e.target.value)}
                                                    className={\`text-2xl font-black rounded-xl px-3 py-1 border w-64 \${T.input}\`} />
                                            ) : (
                                                <h2 className="text-3xl font-black">{selected.companyNameAr}</h2>
                                            )}
                                            <Link href={\`https://\${selected.domainUrl}\`} target="_blank"
                                                className={\`p-2.5 rounded-xl transition-all border \${isLight ? 'bg-indigo-50 border-indigo-100 hover:bg-white' : 'bg-white/10 border-white/10 hover:bg-white/20'}\`}>
                                                <ExternalLink className="w-5 h-5 text-indigo-600" />
                                            </Link>
                                            {!editMode ? (
                                                <button onClick={() => setEditMode(true)}
                                                    className={\`p-2.5 rounded-xl transition-all border \${isLight ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' : 'bg-amber-900/20 border-amber-800 hover:bg-amber-900/40'}\`}>
                                                    <Pencil className="w-4 h-4 text-amber-600" />
                                                </button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button onClick={doUpdateInfo} disabled={!!busy}
                                                        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white">
                                                        {busy === 'update_info' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    </button>
                                                    <button onClick={() => { setEditMode(false); setEditEmail(selected.email); setEditOrgName(selected.companyNameAr); setEditVat(selected.vatNumber); }}
                                                        className={\`p-2.5 rounded-xl border \${isLight ? 'border-slate-200 hover:bg-slate-100' : 'border-white/10 hover:bg-white/10'}\`}>
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className={\`flex flex-wrap gap-6 pt-4 border-t \${isLight ? 'border-slate-100' : 'border-white/10'}\`}>
                                            {editMode ? (<>
                                                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-indigo-600" />
                                                    <input value={editEmail} onChange={e => setEditEmail(e.target.value)} className={\`text-xs font-bold rounded-lg px-2 py-1 border w-48 \${T.input}\`} /></div>
                                                <div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-indigo-600" />
                                                    <input value={editVat} onChange={e => setEditVat(e.target.value)} className={\`text-xs font-bold rounded-lg px-2 py-1 border w-40 \${T.input}\`} /></div>
                                            </>) : (<>
                                                <span className={\`flex items-center gap-2 text-xs font-bold \${T.textMuted}\`}><Mail className="w-3.5 h-3.5 text-indigo-600" />{selected.email}</span>
                                                <span className={\`flex items-center gap-2 text-xs font-bold \${T.textMuted}\`}><Hash className="w-3.5 h-3.5 text-indigo-600" />{selected.vatNumber}</span>
                                            </>)}
                                            <span className={\`flex items-center gap-2 text-xs font-black text-indigo-600 \${isLight ? 'bg-indigo-50' : 'bg-indigo-900/40'} px-3 py-1 rounded-xl\`}><Database className="w-3.5 h-3.5" />{selected.dbName}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 flex-shrink-0">
                                        <div className={\`px-6 py-4 rounded-2xl text-center \${PLAN_CONFIGS[selected.plan]?.colorBg || 'bg-slate-50'} border \${isLight ? 'border-slate-200' : 'border-white/10'}\`}>
                                            <div className={\`text-[9px] font-black uppercase tracking-widest mb-1 \${T.textMuted}\`}>الباقة</div>
                                            <div className={\`text-lg font-black \${selected.plan === 'enterprise' ? 'text-slate-800' : 'text-indigo-600'}\`}>{PLAN_CONFIGS[selected.plan]?.label || selected.plan}</div>
                                        </div>`;

// Replace lines 651-679 (29 lines → remove, insert new)
const newLines = newHeader.split('\n');
lines.splice(650, 29, ...newLines);
console.log(`✅ Header replaced: removed 29 lines, inserted ${newLines.length} lines`);

fs.writeFileSync('src/app/ice/page.tsx', lines.join('\n'), 'utf8');
console.log('Done!');
