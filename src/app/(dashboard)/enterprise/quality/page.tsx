'use client';
import { useState, useEffect } from 'react';
import { Settings, Plus, Beaker, CheckCircle2, XCircle, Search, X, Save, ScanBarcode, User } from 'lucide-react';

export default function QualityControlView() {
    const [inspections, setInspections] = useState<any[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Form
    const [batchNumber, setBatchNumber] = useState('');
    const [inspector, setInspector] = useState('Ahmed');
    const [result, setResult] = useState('PASS');
    const [notes, setNotes] = useState('');

    useEffect(() => { fetchInspections(); }, []);

    const fetchInspections = async () => {
        try {
            const res = await fetch('/api/enterprise/quality');
            if(res.ok) {
                const data = await res.json();
                setInspections(data);
            }
        } catch(e) {
            console.error(e);
        } finally {
            setIsLoaded(true);
        }
    };

    const handleSave = async () => {
        try {
            const res = await fetch('/api/enterprise/quality', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batchNumber, inspector, result, notes, status: 'COMPLETED' })
            });
            if(res.ok) {
                setShowModal(false);
                fetchInspections();
            }
        } catch(e) {
            console.error(e);
        }
    };

    return (
        <div className="p-6 animate-in slide-in-from-left-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span>🔎</span> فحص الجودة والمطابقة (Quality Control)
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        إدارة الفحوصات المخبرية للاستلامات، والتأكد من مطابقة المعايير لخطوط الإنتاج.
                    </p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 flex items-center gap-2 rounded-lg font-bold shadow-md transition"
                >
                    <Plus size={20} /> تسجيل عملية فحص
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border p-6 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition">
                    <div className="bg-indigo-100 p-4 rounded-xl text-indigo-600"><Beaker size={28}/></div>
                    <div>
                        <p className="text-sm font-bold text-gray-500">العينات المفحوصة</p>
                        <p className="text-3xl font-black">{inspections.length}</p>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 border p-6 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition">
                    <div className="bg-emerald-100 p-4 rounded-xl text-emerald-600"><CheckCircle2 size={28}/></div>
                    <div>
                        <p className="text-sm font-bold text-gray-500">العينات المجتازة بنجاح</p>
                        <p className="text-3xl font-black text-emerald-600">{inspections.filter(i=>i.result==='PASS').length}</p>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 border p-6 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition">
                    <div className="bg-red-100 p-4 rounded-xl text-red-600"><XCircle size={28}/></div>
                    <div>
                        <p className="text-sm font-bold text-gray-500">العينات المرفوضة والمتلفة</p>
                        <p className="text-3xl font-black text-red-600">{inspections.filter(i=>i.result==='REJECT').length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                {!isLoaded ? (
                    <div className="p-16 text-center text-gray-400">
                        <Settings className="animate-spin mx-auto mb-4" size={32} /> جاري تحميل نتائج المختبر...
                    </div>
                ) : inspections.length === 0 ? (
                    <div className="p-20 text-center text-gray-500">
                        <Beaker size={48} className="mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-bold mb-2">سجل الفحوصات فارغ</h3>
                        <p className="max-w-md mx-auto text-sm text-gray-400">ابدأ بتسجيل نتائج فحص شحنات ومشتريات المصنع لضمان أعلى معايير الجودة.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-right">
                        <thead className="bg-[#f8f9fa] border-b">
                            <tr>
                                <th className="p-4 font-bold text-gray-600">رقم المرجع التسلسلي</th>
                                <th className="p-4 font-bold text-gray-600">رقم التشغيلة (Batch)</th>
                                <th className="p-4 font-bold text-gray-600">المفتش / الفني</th>
                                <th className="p-4 font-bold text-gray-600">تاريخ ووقت الفحص</th>
                                <th className="p-4 font-bold text-gray-600">النتيجة النهائية</th>
                                <th className="p-4 font-bold text-gray-600">ملاحظات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-gray-700">
                            {inspections.map((qc) => (
                                <tr key={qc.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4 font-mono font-bold text-indigo-700 bg-indigo-50/50">{qc.referenceNumber}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 font-bold"><ScanBarcode size={16} className="text-gray-400"/> {qc.batchNumber || 'N/A'}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2"><User size={16} className="text-blue-500"/> {qc.inspector}</div>
                                    </td>
                                    <td className="p-4">{new Date(qc.inspectionDate).toLocaleString('ar-SA')}</td>
                                    <td className="p-4">
                                        {qc.result === 'PASS' 
                                            ? <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1 rounded w-max font-bold"><CheckCircle2 size={16}/> مقبول ومطابق</span>
                                            : <span className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded w-max font-bold"><XCircle size={16}/> مرفوض للإتلاف</span>
                                        }
                                    </td>
                                    <td className="p-4 text-xs text-gray-500 max-w-[200px] truncate">{qc.notes || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="bg-indigo-600 text-white p-5 flex justify-between items-center">
                            <h2 className="font-bold text-lg flex items-center gap-2"><Beaker size={20}/> تسجيل فحص جديد</h2>
                            <button onClick={()=>setShowModal(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4 text-right">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><ScanBarcode size={16}/> رقم التشغيلة/الدفعة</label>
                                    <input value={batchNumber} onChange={e=>setBatchNumber(e.target.value)} type="text" placeholder="BCH-2024..." className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-600 outline-none dir-ltr text-left font-mono font-bold text-gray-700" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><User size={16}/> الفني المسؤول</label>
                                    <input value={inspector} onChange={e=>setInspector(e.target.value)} type="text" className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-indigo-600 outline-none" />
                                </div>
                            </div>
                            
                            <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                <label className="block text-sm font-bold text-gray-700 mb-3">نتيجة الفحص المخبري / الظاهري</label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 cursor-pointer flex items-center justify-center p-3 rounded-lg border-2 font-bold transition ${result==='PASS' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500'}`}>
                                        <input type="radio" value="PASS" checked={result==='PASS'} onChange={()=>setResult('PASS')} className="hidden"/>
                                        <CheckCircle2 size={18} className="ml-2"/> مطابق للاشتراطات
                                    </label>
                                    <label className={`flex-1 cursor-pointer flex items-center justify-center p-3 rounded-lg border-2 font-bold transition ${result==='REJECT' ? 'bg-red-50 border-red-500 text-red-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500'}`}>
                                        <input type="radio" value="REJECT" checked={result==='REJECT'} onChange={()=>setResult('REJECT')} className="hidden"/>
                                        <XCircle size={18} className="ml-2"/> غير مطابق (مرفوض)
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">تقرير الفحص (ملاحظات الجودة)</label>
                                <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-indigo-600 outline-none h-24 resize-none" placeholder="اكتب نتائج الفحص وظروف الاعتماد أو أسباب الرفض بدقة..."></textarea>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 mt-4">
                                <button onClick={()=>setShowModal(false)} className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition">إلغاء</button>
                                <button onClick={handleSave} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-600/30">
                                    <Save size={18}/> اعتماد النتيجة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}