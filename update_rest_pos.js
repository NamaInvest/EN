const fs = require('fs');

let c = fs.readFileSync('src/app/(dashboard)/restaurant-pos/page.tsx', 'utf8');

const replacementQRFunc = `    const printQR = (e: any, table: any) => {
        e.stopPropagation();
        const token = table.qrToken || 'NO_TOKEN';
        const link = \`\${window.location.origin}/qr-menu/\${token}\`;
        const qrHtml = \`
            <html dir="rtl"><head><title>QR طاولة</title>
            <style>
                body { font-family: 'Courier New', monospace; width: 280px; margin: 0 auto; text-align: center; padding: 20px 0; }
                h2 { font-size: 24px; margin-bottom: 5px; }
                .qr-placeholder { margin: 20px auto; width: 200px; height: 200px; background: url('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=\${encodeURIComponent(link)}') no-repeat center center; background-size: cover; }
                .footer { font-size: 14px; margin-top: 10px; color: #555; }
            </style></head><body>
            <h2>طاولة \${table.name}</h2>
            <div class="qr-placeholder"></div>
            <div class="footer">امسح الباركود لاستعراض المنيو واستدعاء النادل</div>
            <script>setTimeout(() => { window.print(); setTimeout(() => window.close(), 1000); }, 500);</script>
            </body></html>\`;
        const qrWin = window.open('', '_blank', 'width=320,height=500');
        if (qrWin) qrWin.document.write(qrHtml);
    };

    const closeTableSession = async (e: React.MouseEvent, table: any) => {`;

c = c.replace('    const closeTableSession = async (e: React.MouseEvent, table: any) => {', replacementQRFunc);

const replacementFloor = `<div className="flex flex-col gap-6 w-full h-full">
                            <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                                    {zones.map((z: any) => (
                                        <button 
                                            key={z.id} 
                                            onClick={() => setActiveZone(z)}
                                            className={\`px-6 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all \${activeZone?.id === z.id ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}\`}
                                        >
                                            {z.name}
                                        </button>
                                    ))}
                                    <button onClick={createZone} className="px-6 py-2.5 rounded-2xl font-bold text-sm bg-white text-slate-500 border border-dashed border-slate-300 hover:bg-slate-50 hover:text-slate-700 whitespace-nowrap transition-colors flex items-center gap-2">
                                        <Plus className="w-4 h-4"/> قسم جديد
                                    </button>
                                </div>
                                {activeZone && (
                                    <button onClick={createTable} className="px-6 py-2.5 rounded-2xl font-bold text-sm bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 hover:border-orange-300 transition-colors flex items-center gap-2 shrink-0">
                                        <Plus className="w-4 h-4"/> إضافة طاولة
                                    </button>
                                )}
                            </div>
                            
                            {(!activeZone || !activeZone.tables || activeZone.tables.length === 0) ? (
                                <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-4xl border border-dashed border-slate-300 p-12 text-slate-400">
                                    <Utensils className="w-16 h-16 mb-4 opacity-50"/>
                                    <h3 className="text-xl font-bold text-slate-500 mb-2">لا يوجد طاولات في هذا القسم</h3>
                                    <p className="text-sm">قم بإضافة طاولات جديدة لتبدأ باستقبال الطلبات</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {activeZone.tables.map((table: any) => {
                                        const isActive = table.status === 'OCCUPIED';
                                        const hasPendingCall = table.waiterCalls && table.waiterCalls.length > 0;
                                        return (
                                            <div key={table.id} onClick={() => typeof openTableSession !== 'undefined' && openTableSession(table)} className={\`relative flex flex-col rounded-4xl border cursor-pointer transition-all duration-300 overflow-hidden group \${isActive ? 'bg-orange-50 border-orange-200 shadow-md shadow-orange-500/10' : 'bg-white border-slate-200 hover:shadow-md hover:border-slate-300'}\`}>
                                                
                                                {hasPendingCall && (
                                                    <div className="absolute top-4 right-4 flex items-center justify-center bg-yellow-500 text-white rounded-full p-2 animate-bounce shadow-lg z-10">
                                                        <Bell className="w-5 h-5" />
                                                    </div>
                                                )}

                                                <div className="flex-1 p-6 flex flex-col items-center justify-center">
                                                    <div className={\`w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1 \${isActive ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-slate-100 text-slate-400'}\`}>
                                                        <Utensils className="w-7 h-7" />
                                                    </div>
                                                    <h3 className={\`text-2xl font-black mb-1 \${isActive ? 'text-orange-600' : 'text-slate-800'}\`}>{table.name}</h3>
                                                    <span className={\`text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider \${isActive ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}\`}>
                                                        {hasPendingCall ? 'استدعاء نادل' : (isActive ? 'مشغولة' : 'متاحة')}
                                                    </span>
                                                </div>

                                                {/* Footer Actions */}
                                                <div className="border-t border-slate-100 bg-slate-50/50 p-3 flex gap-2">
                                                    {isActive && (
                                                        <button 
                                                            onClick={(e) => closeTableSession(e, table)}
                                                            className="flex-1 py-2 bg-white text-slate-600 text-xs font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors"
                                                        >
                                                            تحرير
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={(e) => printQR(e, table)}
                                                        className="flex-1 py-2 bg-white text-orange-500 text-xs font-bold rounded-xl border border-slate-200 hover:bg-orange-50 hover:border-orange-200 transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <QrCode className="w-4 h-4"/> باركود
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>`;

c = c.replace(/<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">[\s\S]*?\{\(activeZone\?.tables \|\| \[\]\).map\(\(table: any\) => \{[\s\S]*?return \([\s\S]*?\);[\s\S]*?\}\)[\s\S]*?<\/div>/m, replacementFloor);

fs.writeFileSync('src/app/(dashboard)/restaurant-pos/page.tsx', c);
