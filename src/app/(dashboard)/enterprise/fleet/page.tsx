'use client';
import { useState, useEffect } from 'react';
import { Settings, Plus, Truck, Calendar, MapPin, GaugeCircle, X, Save } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function FleetManagementView() {
    const { t } = useTranslation();
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Form
    const [plateNumber, setPlateNumber] = useState('');
    const [make, setMake] = useState('Isuzu');
    const [model, setModel] = useState('');
    const [year, setYear] = useState('2024');
    const [type, setType] = useState('VAN');
    const [currentOdometer, setOdometer] = useState('0');
    const [licenseExpiry, setLicenseExpiry] = useState('');

    useEffect(() => { fetchVehicles(); }, []);

    const fetchVehicles = async () => {
        try {
            const res = await fetch('/api/enterprise/fleet');
            if(res.ok) {
                const data = await res.json();
                setVehicles(data);
            }
        } catch(e) {
            console.error(e);
        } finally {
            setIsLoaded(true);
        }
    };

    const handleSave = async () => {
        try {
            const res = await fetch('/api/enterprise/fleet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plateNumber, make, model, year, type, currentOdometer, licenseExpiry })
            });
            if(res.ok) {
                setShowModal(false);
                fetchVehicles();
            }
        } catch(e) {
            console.error(e);
        }
    };

    const getStatusStyle = (status: string) => {
        if (status === 'AVAILABLE') return 'bg-emerald-100 text-emerald-700';
        if (status === 'ON_TRIP') return 'bg-blue-100 text-blue-700';
        if (status === 'IN_MAINTENANCE') return 'bg-orange-100 text-orange-700';
        return 'bg-gray-100 text-gray-700';
    };

    const getStatusLabel = (status: string) => {
        if (status === 'AVAILABLE') return t('sys.str_1797');
        if (status === 'ON_TRIP') return t('sys.str_1798');
        if (status === 'IN_MAINTENANCE') return t('sys.str_1799');
        return t('sys.str_1800');
    };

    return (
        <div className="p-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span>🚚</span> {t('sys.str_1769')}</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        {t('sys.str_1770')}</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 flex items-center gap-2 rounded-lg font-bold shadow-md transition"
                >
                    <Plus size={20} /> {t('sys.str_1771')}</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-card border p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition">
                    <div className="bg-primary/10 p-3 rounded-full text-primary"><Truck size={24}/></div>
                    <div>
                        <p className="text-xs font-bold text-gray-500">{t('sys.str_1772')}</p>
                        <p className="text-2xl font-black">{vehicles.length}</p>
                    </div>
                </div>
                <div className="bg-card border p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition">
                    <div className="bg-emerald-100 p-3 rounded-full text-emerald-600"><MapPin size={24}/></div>
                    <div>
                        <p className="text-xs font-bold text-gray-500">{t('sys.str_1773')}</p>
                        <p className="text-2xl font-black text-emerald-600">{vehicles.filter(v=>v.status==='AVAILABLE').length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                {!isLoaded ? (
                    <div className="p-16 text-center text-gray-400">
                        <Settings className="animate-spin mx-auto mb-4" size={32} />
                        {t('sys.str_1774')}</div>
                ) : vehicles.length === 0 ? (
                    <div className="p-20 text-center text-gray-500">
                        <Truck size={48} className="mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-bold mb-2">{t('sys.str_1775')}</h3>
                        <p className="text-sm text-gray-400">{t('sys.str_1776')}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="p-4 font-bold text-gray-600">{t('sys.str_1777')}</th>
                                <th className="p-4 font-bold text-gray-600">{t('sys.str_1778')}</th>
                                <th className="p-4 font-bold text-gray-600">{t('sys.str_1779')}</th>
                                <th className="p-4 font-bold text-gray-600">{t('sys.str_1780')}</th>
                                <th className="p-4 font-bold text-gray-600">{t('sys.str_1781')}</th>
                                <th className="p-4 font-bold text-gray-600">{t('sys.str_1782')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {vehicles.map((v) => (
                                <tr key={v.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <div className="bg-white border-2 border-gray-800 rounded px-3 py-1 text-center font-bold text-lg w-max shadow-sm tracking-widest dir-ltr">
                                            {v.plateNumber}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800 text-base">{v.make} - {v.model}</div>
                                        <div className="text-xs text-gray-500">{v.type}</div>
                                    </td>
                                    <td className="p-4 font-bold text-gray-600">{v.year}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 font-bold text-blue-700">
                                            <GaugeCircle size={16}/> {v.currentOdometer.toLocaleString()} {t('sys.str_1783')}</div>
                                    </td>
                                    <td className="p-4 font-semibold text-gray-700">
                                        {v.licenseExpiry ? new Date(v.licenseExpiry).toLocaleDateString('ar-SA') : '-'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${getStatusStyle(v.status)}`}>
                                            {getStatusLabel(v.status)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden translate-y-0 scale-100 transition-all">
                        <div className="bg-gray-900 text-white p-5 flex justify-between items-center">
                            <h2 className="font-bold text-lg flex items-center gap-2"><Truck size={20}/> {t('sys.str_1784')}</h2>
                            <button onClick={()=>setShowModal(false)} className="hover:bg-white/20 p-1 rounded-lg"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4 text-right">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">{t('sys.str_1785')}</label>
                                <input value={plateNumber} onChange={e=>setPlateNumber(e.target.value)} type="text" placeholder={t('sys.str_1801')} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:outline-none focus:border-gray-900 transition text-center font-bold text-lg dir-ltr uppercase" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('sys.str_1786')}</label>
                                    <input value={make} onChange={e=>setMake(e.target.value)} type="text" className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-gray-900 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('sys.str_1787')}</label>
                                    <input value={model} onChange={e=>setModel(e.target.value)} type="text" placeholder="Dina, Hilux, Elantra..." className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-gray-900 outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('sys.str_1779')}</label>
                                    <input value={year} onChange={e=>setYear(e.target.value)} type="number" className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-gray-900 outline-none" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('sys.str_1788')}</label>
                                    <select value={type} onChange={e=>setType(e.target.value)} className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-gray-900 outline-none">
                                        <option value="VAN">{t('sys.str_1789')}</option>
                                        <option value="TRUCK">{t('sys.str_1790')}</option>
                                        <option value="SEDAN">{t('sys.str_1791')}</option>
                                        <option value="REFRIGERATED">{t('sys.str_1792')}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">{t('sys.str_1793')}</label>
                                    <input value={currentOdometer} onChange={e=>setOdometer(e.target.value)} type="number" className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-gray-900 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-1"><Calendar size={14}/> {t('sys.str_1794')}</label>
                                    <input value={licenseExpiry} onChange={e=>setLicenseExpiry(e.target.value)} type="date" className="w-full border-2 border-gray-200 rounded-xl p-2.5 focus:border-gray-900 outline-none font-sans" />
                                </div>
                            </div>
                            <div className="pt-6 flex justify-end gap-3 mt-4 border-t border-gray-100">
                                <button onClick={()=>setShowModal(false)} className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition">{t('sys.str_1795')}</button>
                                <button onClick={handleSave} className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition flex items-center gap-2 shadow-lg">
                                    <Save size={18}/> {t('sys.str_1796')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}