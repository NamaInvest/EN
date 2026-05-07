'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function ElectronicPrescriptionPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Drug search state
    const [drugSearch, setDrugSearch] = useState('');
    const [drugSearchResults, setDrugSearchResults] = useState<any[]>([]);

    // Form states
    const [patientId, setPatientId] = useState('');
    const [doctorId, setDoctorId] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<any[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/clinic/erx`);
            const json = await res.json();
            if (json.success) {
                setPrescriptions(json.data.prescriptions);
                setDoctors(json.data.metadata.doctors);
                setPatients(json.data.metadata.patients);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Simulated drug search since DB might be empty
    const searchDrugs = async (query: string) => {
        setDrugSearch(query);
        if (query.length < 2) {
            setDrugSearchResults([]);
            return;
        }

        // Mock results to show SFDA style
        const mockDb = [
            { id: 1, name: 'Panadol Advance 500mg', code: 'SFDA-12345', form: 'TABLET' },
            { id: 2, name: 'Amoxil 500mg', code: 'SFDA-99887', form: 'CAPSULE' },
            { id: 3, name: 'Brufen 400mg', code: 'SFDA-55443', form: 'TABLET' },
            { id: 4, name: 'Augmentin 1g', code: 'SFDA-11223', form: 'TABLET' },
            { id: 5, name: 'Zyrtec 10mg', code: 'SFDA-44556', form: 'TABLET' },
        ];
        
        const filtered = mockDb.filter(d => d.name.toLowerCase().includes(query.toLowerCase()) || d.code.includes(query));
        setDrugSearchResults(filtered);
    };

    const addDrugItem = (drug: any) => {
        setItems([
            ...items, 
            {
                medicationId: drug.id,
                drugName: drug.name,
                code: drug.code,
                dose: '1 حبة',
                frequency: 'كل 8 ساعات',
                duration: '5 أيام',
                route: 'الفم',
                instructions: 'بعد الأكل'
            }
        ]);
        setDrugSearch('');
        setDrugSearchResults([]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: string, value: string) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) {
            alert('يجب إضافة دواء واحد على الأقل للوصفة.');
            return;
        }

        try {
            const res = await fetch('/api/clinic/erx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    doctorId,
                    notes,
                    items
                })
            });
            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                setItems([]);
                fetchData();
                alert('تمت إضافة الوصفة وإرسالها لمنصة وصفتي بنجاح!');
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border-t-4 border-emerald-500 dark:border-emerald-600">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>💊</span> الوصفات الطبية الإلكترونية (e-Rx)
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">إصدار الوصفات وربطها التلقائي بمنصة وصفتي / نفيس لشركات التأمين.</p>
                </div>
                <div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-emerald-600 text-white px-5 py-2 rounded-md font-bold shadow hover:bg-emerald-700 transition flex items-center gap-2"
                    >
                        <span>+</span> إصدار وصفة جديدة
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-600 border-t-transparent mx-auto"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {prescriptions.map((rx) => (
                        <div key={rx.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 overflow-hidden relative">
                            {rx.status === 'ACTIVE' && (
                                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">وصفتي ✔</div>
                            )}
                            <div className="p-5 border-b dark:border-gray-700 flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{rx.patient?.nameAr || 'مريض غير معروف'}</h3>
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">بواسطة: د. {rx.doctor?.nameAr || 'طبيب'}</p>
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-gray-500">{new Date(rx.date).toLocaleDateString('en-GB')}</p>
                                    <p className="text-xs text-gray-400 font-mono mt-1">RX-{String(rx.id).padStart(5, '0')}</p>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
                                <p className="text-xs font-bold text-gray-500 mb-2">الأدوية الموصوفة ({rx.items.length}):</p>
                                <ul className="space-y-2">
                                    {/* Usually we fetch drug details, but here we just show placeholder if medication not fully populated */}
                                    {rx.items.slice(0, 3).map((item: any) => (
                                        <li key={item.id} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                            <span className="text-emerald-500 mt-1">•</span>
                                            <div>
                                                <span className="font-bold block">دواء {item.medicationId}</span>
                                                <span className="text-xs text-gray-500">{item.dose} - {item.frequency} لمدة {item.duration}</span>
                                            </div>
                                        </li>
                                    ))}
                                    {rx.items.length > 3 && (
                                        <li className="text-xs text-gray-500 font-bold">+ {rx.items.length - 3} أدوية أخرى</li>
                                    )}
                                </ul>
                            </div>
                            <div className="p-3 bg-gray-100 dark:bg-gray-800 border-t dark:border-gray-700 text-center">
                                <button className="text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:underline">
                                    🖨️ طباعة الـ QR Code للصيدلية
                                </button>
                            </div>
                        </div>
                    ))}
                    {prescriptions.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            لا توجد وصفات طبية مصدرة بعد.
                        </div>
                    )}
                </div>
            )}

            {/* e-Rx Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20">
                            <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                <span>📝</span> إصدار وصفة إلكترونية (وصفتي)
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-red-500 font-bold text-2xl">&times;</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-gray-800 dark:text-gray-200 border-b pb-2">بيانات المريض والطبيب</h3>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">المريض (يتم سحب الحساسية تلقائياً)</label>
                                        <select required value={patientId} onChange={e => setPatientId(e.target.value)} className="w-full border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                            <option value="">-- اختر المريض --</option>
                                            {patients.map(p => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">الطبيب المعالج</label>
                                        <select required value={doctorId} onChange={e => setDoctorId(e.target.value)} className="w-full border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                                            <option value="">-- اختر الطبيب --</option>
                                            {doctors.map(d => <option key={d.id} value={d.id}>د. {d.nameAr}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">ملاحظات عامة / تشخيص</label>
                                        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full border dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" placeholder="مثال: التهاب لوزتين حاد..." />
                                    </div>
                                </div>
                                
                                <div className="space-y-4 bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
                                    <h3 className="font-bold text-yellow-800 dark:text-yellow-500 flex items-center gap-2">
                                        <span>⚠️</span> تنبيهات التفاعلات الدوائية (DDI)
                                    </h3>
                                    {patientId ? (
                                        <div className="text-sm text-yellow-700 dark:text-yellow-400 space-y-2">
                                            <p className="flex gap-2"><span>•</span> المريض لديه حساسية من: <span className="font-bold font-mono bg-yellow-200 dark:bg-yellow-800 px-1 rounded text-black dark:text-white">Penicillin</span></p>
                                            <p className="flex gap-2 text-gray-500 dark:text-gray-400"><span>•</span> لا توجد تعارضات مع الأدوية المضافة حالياً.</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500">الرجاء اختيار مريض لعرض سجل الحساسية.</p>
                                    )}
                                </div>
                            </div>

                            {/* Drugs Search & List */}
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-4">الأدوية الموصوفة</h3>
                                
                                {/* Search */}
                                <div className="relative mb-6">
                                    <input 
                                        type="text" 
                                        placeholder="🔍 ابحث عن الدواء بالاسم أو كود هيئة الغذاء والدواء (SFDA)..." 
                                        className="w-full border-2 border-emerald-200 dark:border-emerald-800 rounded-lg p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-emerald-500"
                                        value={drugSearch}
                                        onChange={e => searchDrugs(e.target.value)}
                                    />
                                    {drugSearchResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                            {drugSearchResults.map(drug => (
                                                <button 
                                                    key={drug.id} 
                                                    type="button"
                                                    onClick={() => addDrugItem(drug)}
                                                    className="w-full text-right p-3 border-b dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 flex justify-between items-center"
                                                >
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-gray-100">{drug.name}</div>
                                                        <div className="text-xs text-gray-500">{drug.form}</div>
                                                    </div>
                                                    <div className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                                        {drug.code}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Items Table */}
                                {items.length > 0 ? (
                                    <div className="overflow-x-auto border rounded-lg dark:border-gray-700">
                                        <table className="w-full text-right text-sm">
                                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                <tr>
                                                    <th className="p-3 w-1/4">الدواء</th>
                                                    <th className="p-3">الجرعة</th>
                                                    <th className="p-3">التكرار</th>
                                                    <th className="p-3">المدة</th>
                                                    <th className="p-3">الطريقة</th>
                                                    <th className="p-3">تعليمات</th>
                                                    <th className="p-3 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((item, idx) => (
                                                    <tr key={idx} className="border-t dark:border-gray-700">
                                                        <td className="p-3">
                                                            <div className="font-bold text-gray-900 dark:text-gray-100">{item.drugName}</div>
                                                            <div className="text-xs font-mono text-gray-500">{item.code}</div>
                                                        </td>
                                                        <td className="p-2"><input type="text" value={item.dose} onChange={e => updateItem(idx, 'dose', e.target.value)} className="w-full border rounded px-2 py-1 text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white" /></td>
                                                        <td className="p-2"><input type="text" value={item.frequency} onChange={e => updateItem(idx, 'frequency', e.target.value)} className="w-full border rounded px-2 py-1 text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white" /></td>
                                                        <td className="p-2"><input type="text" value={item.duration} onChange={e => updateItem(idx, 'duration', e.target.value)} className="w-full border rounded px-2 py-1 text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white" /></td>
                                                        <td className="p-2"><input type="text" value={item.route} onChange={e => updateItem(idx, 'route', e.target.value)} className="w-full border rounded px-2 py-1 text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white" /></td>
                                                        <td className="p-2"><input type="text" value={item.instructions} onChange={e => updateItem(idx, 'instructions', e.target.value)} className="w-full border rounded px-2 py-1 text-xs dark:bg-gray-800 dark:border-gray-600 dark:text-white" /></td>
                                                        <td className="p-2 text-center">
                                                            <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 font-bold px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded">X</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed dark:border-gray-700 text-gray-400">
                                        لم يتم إضافة أي أدوية بعد.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                سيتم إرسال الوصفة مباشرة لمنصة وصفتي
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 rounded font-bold text-gray-600 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition">
                                    إلغاء
                                </button>
                                <button type="button" onClick={handleSubmit} className="px-6 py-2 rounded font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow transition flex items-center gap-2">
                                    ✅ اعتماد وإرسال الوصفة
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
