'use client';
import { useState, useEffect } from 'react';
import { Settings, Plus, Building2, Key, Home, MapPin, Search, X, Save } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

export default function PropertyManagementView() {
    const { t } = useTranslation();
    const { error: toastError, success: toastSuccess } = useToast();
    const [properties, setProperties] = useState<any[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Form
    const [name, setName] = useState('');
    const [type, setType] = useState('COMMERCIAL_BUILDING');
    const [address, setAddress] = useState('');
    const [totalUnits, setTotalUnits] = useState('10');
    const [unitType, setUnitType] = useState('OFFICE');
    const [areaSqm, setAreaSqm] = useState('80');
    const [rentYearly, setRentYearly] = useState('45000');

    useEffect(() => { fetchProperties(); }, []);

    const fetchProperties = async () => {
        try {
            const res = await fetch('/api/enterprise/property');
            if(res.ok) {
                const data = await res.json();
                setProperties(data);
            }
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); } finally {
            setIsLoaded(true);
        }
    };

    const handleSave = async () => {
        try {
            const res = await fetch('/api/enterprise/property', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, type, address, totalUnits, unitType, areaSqm, rentYearly })
            });
            if(res.ok) {
                setShowModal(false);
                fetchProperties();
            }
        } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
    };

    return (
        <div className="p-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span>🏢</span> {t('sys.str_1900')}</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        {t('sys.str_1901')}</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 flex items-center gap-2 rounded-lg font-bold shadow transition"
                >
                    <Plus size={20} /> {t('sys.str_1902')}</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-card text-card-foreground p-5 rounded-2xl border flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-sm font-semibold text-gray-500 mb-1">{t('sys.str_1903')}</p>
                        <p className="text-2xl font-black">{properties.length}</p>
                    </div>
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-xl"><Building2 size={24}/></div>
                </div>
                <div className="bg-card text-card-foreground p-5 rounded-2xl border flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-sm font-semibold text-gray-500 mb-1">{t('sys.str_1904')}</p>
                        <p className="text-2xl font-black">{properties.reduce((sum, p) => sum + p.units?.length, 0)}</p>
                    </div>
                    <div className="bg-orange-100 text-orange-600 p-3 rounded-xl"><Home size={24}/></div>
                </div>
                <div className="bg-card text-card-foreground p-5 rounded-2xl border flex items-center justify-between shadow-sm col-span-2">
                    <div>
                        <p className="text-sm font-semibold text-gray-500 mb-1">{t('sys.str_1905')}</p>
                        <p className="text-2xl font-black text-emerald-600">
                        {properties.reduce((sum, p) => sum + p.units?.reduce((uSum:number, u:any) => uSum + u.rentYearly, 0), 0).toLocaleString()} <span className="text-sm font-normal">{t('sys.str_68')}</span>
                        </p>
                    </div>
                    <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl"><Key size={24}/></div>
                </div>
            </div>

            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
                {!isLoaded ? (
                    <div className="p-16 text-center text-gray-400">
                        <Settings className="animate-spin mx-auto mb-4" size={32} /> {t('sys.str_1906')}</div>
                ) : properties.length === 0 ? (
                    <div className="p-20 text-center text-gray-500">
                        <Building2 size={48} className="mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-bold mb-2">{t('sys.str_1907')}</h3>
                        <p className="text-sm">{t('sys.str_1908')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {properties.map(prop => (
                            <div key={prop.id} className="border rounded-2xl p-5 hover:shadow-lg transition bg-gray-50/50">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 text-blue-700 p-3 rounded-xl">
                                            {prop.type === 'COMMERCIAL_BUILDING' ? <Building2 size={24} /> : <Home size={24} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">{prop.name}</h3>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1"><MapPin size={12}/> {prop.address || t('sys.str_1930')}</p>
                                        </div>
                                    </div>
                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">{t('sys.str_180')}</span>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                                    <div className="bg-white border p-3 rounded-xl shadow-sm">
                                        <p className="text-xs text-gray-500 font-bold mb-1">{t('sys.str_1909')}</p>
                                        <p className="font-black text-gray-800">{prop.units?.length} {t('sys.str_1910')}</p>
                                    </div>
                                    <div className="bg-white border p-3 rounded-xl shadow-sm">
                                        <p className="text-xs text-gray-500 font-bold mb-1">{t('sys.str_1911')}</p>
                                        <p className="font-black text-emerald-600">
                                            {(prop.units?.reduce((uSum:number, u:any) => uSum + u.rentYearly, 0) / 1000).toFixed(1)}K
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-3 border-t">
                                    <h4 className="text-xs font-bold text-gray-500 mb-2">{t('sys.str_1912')}{prop.units?.filter((u:any) => u.status === 'VACANT').length} {t('sys.str_1913')}</h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {prop.units?.slice(0, 10).map((u:any) => (
                                            <div key={u.id} className={`text-[10px] font-bold px-2 py-1 rounded border shadow-sm ${u.status === 'VACANT' ? 'bg-white text-gray-600 border-gray-300' : 'bg-primary text-white border-primary'}`}>
                                                {u.unitNumber}
                                            </div>
                                        ))}
                                        {prop.units?.length > 10 && <div className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-500">+{prop.units.length - 10} {t('sys.str_1914')}</div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                            <h2 className="font-bold text-lg flex items-center gap-2"><Building2 size={20}/> {t('sys.str_1915')}</h2>
                            <button onClick={()=>setShowModal(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-5 text-right bg-gray-50">
                            
                            <div className="bg-white p-5 border rounded-xl shadow-sm space-y-4">
                                <h3 className="font-bold border-b pb-2 text-primary flex items-center gap-2">{t('sys.str_1916')}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('sys.str_1917')}</label>
                                        <input value={name} onChange={e=>setName(e.target.value)} type="text" placeholder={t('sys.str_1931')} className="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-primary outline-none transition" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('sys.str_1918')}</label>
                                        <select value={type} onChange={e=>setType(e.target.value)} className="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-primary outline-none transition">
                                            <option value="COMMERCIAL_BUILDING">{t('sys.str_1919')}</option>
                                            <option value="RESIDENTIAL_COMPLEX">{t('sys.str_1920')}</option>
                                            <option value="LAND">{t('sys.str_1921')}</option>
                                            <option value="SHOPPING_MALL">{t('sys.str_1922')}</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('sys.str_1923')}</label>
                                        <input value={address} onChange={e=>setAddress(e.target.value)} type="text" placeholder={t('sys.str_1932')} className="w-full border-2 border-gray-200 rounded-lg p-2.5 focus:border-primary outline-none transition" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-5 border rounded-xl shadow-sm space-y-4">
                                <h3 className="font-bold border-b pb-2 text-orange-600 flex items-center gap-2">{t('sys.str_1924')}</h3>
                                <p className="text-xs text-gray-500">{t('sys.str_1925')}</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('sys.str_1926')}</label>
                                        <input value={totalUnits} onChange={e=>setTotalUnits(e.target.value)} type="number" className="w-full border-2 border-gray-200 rounded-lg p-2.5 outline-none font-bold" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('sys.str_1927')}</label>
                                        <input value={areaSqm} onChange={e=>setAreaSqm(e.target.value)} type="number" className="w-full border-2 border-gray-200 rounded-lg p-2.5 outline-none font-bold" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">{t('sys.str_1928')}</label>
                                        <input value={rentYearly} onChange={e=>setRentYearly(e.target.value)} type="number" className="w-full border-2 border-gray-200 rounded-lg p-2.5 outline-none font-bold text-emerald-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 px-2">
                                <button onClick={()=>setShowModal(false)} className="px-6 py-2.5 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition shadow-sm">{t('sys.str_1795')}</button>
                                <button onClick={handleSave} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition flex items-center gap-2 shadow-lg">
                                    <Save size={18}/> {t('sys.str_1929')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
