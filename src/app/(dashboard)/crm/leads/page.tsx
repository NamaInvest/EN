'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, User, Phone, Mail, DollarSign, Target, Settings, X, Save } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function LeadsPipelineView() {
    const { t } = useTranslation();
    const [leads, setLeads] = useState<any[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Form
    const [companyName, setCompany] = useState('');
    const [contactPerson, setContact] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [expectedRevenue, setExpectedRev] = useState('0');
    const [probability, setProbability] = useState('10');

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const res = await fetch('/api/crm/leads');
            if(res.ok) {
                const data = await res.json();
                setLeads(data);
            }
        } catch(e) {
            console.error(e);
        } finally {
            setIsLoaded(true);
        }
    };

    const handleSave = async () => {
        try {
            const res = await fetch('/api/crm/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyName, contactPerson, phone, email, expectedRevenue, probability
                })
            });
            if(res.ok) {
                setShowModal(false);
                fetchLeads();
            }
        } catch(e) {
            console.error(e);
        }
    };

    const getStatusColor = (status: string) => {
        switch(status) {
            case 'NEW': return 'bg-blue-100 text-blue-700';
            case 'CONTACTED': return 'bg-yellow-100 text-yellow-700';
            case 'QUALIFIED': return 'bg-orange-100 text-orange-700';
            case 'CONVERTED': return 'bg-emerald-100 text-emerald-700';
            case 'LOST': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch(status) {
            case 'NEW': return t('sys.str_1764');
            case 'CONTACTED': return t('sys.str_1765');
            case 'QUALIFIED': return t('sys.str_1766');
            case 'CONVERTED': return t('sys.str_1767');
            case 'LOST': return t('sys.str_1768');
            default: return status;
        }
    };

    return (
        <div className="p-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <span>📊</span> {t('sys.str_1740')}</h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        {t('sys.str_1741')}</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 flex items-center gap-2 rounded-lg font-semibold shadow-md transition"
                >
                    <Plus size={20} />
                    {t('sys.str_1742')}</button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-2xl border flex items-center gap-4">
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-xl"><Target size={24}/></div>
                    <div>
                        <p className="text-xs text-blue-600 font-bold mb-1">{t('sys.str_1743')}</p>
                        <p className="text-2xl font-black">{leads.filter(x => x.status !== 'LOST' && x.status !== 'CONVERTED').length}</p>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-6 rounded-2xl border flex items-center gap-4">
                    <div className="bg-orange-100 text-orange-600 p-3 rounded-xl"><DollarSign size={24}/></div>
                    <div>
                        <p className="text-xs text-orange-600 font-bold mb-1">{t('sys.str_1744')}</p>
                        <p className="text-2xl font-black">{leads.reduce((sum, l) => sum + (l.expectedRevenue * (l.probability/100)), 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Sub Nav */}
            <div className="flex bg-white rounded-lg p-1 border shadow-sm w-max mb-6">
                <button className="px-6 py-2 rounded-md bg-gray-100/80 font-bold text-gray-800 text-sm">{t('sys.str_1745')}</button>
                <button className="px-6 py-2 text-gray-500 hover:bg-gray-50 rounded-md font-semibold text-sm transition" onClick={() => alert('Kanban Boards are part of the next component iteration!')}>{t('sys.str_1746')}</button>
            </div>

            {/* The List Data Grid */}
            <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
                {!isLoaded ? (
                    <div className="p-16 text-center text-gray-400">
                        <Settings className="animate-spin mx-auto mb-4" size={32} />
                        {t('sys.str_1747')}</div>
                ) : leads.length === 0 ? (
                    <div className="p-20 text-center text-gray-500">
                        <Target size={48} className="mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-bold mb-2">{t('sys.str_1748')}</h3>
                        <p className="max-w-md mx-auto text-sm text-gray-400">{t('sys.str_1749')}</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-right">
                        <thead className="bg-[#f8f9fa] border-b">
                            <tr>
                                <th className="p-4 text-gray-600">{t('sys.str_1750')}</th>
                                <th className="p-4 text-gray-600">{t('sys.str_1751')}</th>
                                <th className="p-4 text-gray-600">{t('sys.str_1752')}</th>
                                <th className="p-4 text-gray-600">{t('sys.str_1753')}</th>
                                <th className="p-4 text-gray-600">{t('sys.str_1754')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-gray-700">
                            {leads.map((l) => (
                                <tr key={l.id} className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <div className="font-bold text-gray-900 text-base">{l.companyName}</div>
                                        <div className="flex items-center gap-1 text-gray-500 mt-1 max-w-[150px] truncate">
                                            <User size={14} /> {l.contactPerson}
                                        </div>
                                    </td>
                                    <td className="p-4 text-xs space-y-1">
                                        {l.phone && <div className="flex items-center gap-2"><Phone size={12}/> <span className="dir-ltr inline-block">{l.phone}</span></div>}
                                        {l.email && <div className="flex items-center gap-2 text-blue-500"><Mail size={12}/> {l.email}</div>}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusColor(l.status)}`}>
                                            {getStatusLabel(l.status)}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-gray-800">
                                        {l.expectedRevenue.toLocaleString()} <span className="text-xs font-normal text-gray-400">{t('sys.str_68')}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-full bg-gray-200 rounded-full h-2.5 flex-grow">
                                                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${l.probability}%` }}></div>
                                            </div>
                                            <span className="font-bold text-gray-600 tabular-nums">{l.probability}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-primary p-5 text-white flex justify-between items-center">
                            <h2 className="font-bold text-lg">{t('sys.str_1755')}</h2>
                            <button onClick={() => setShowModal(false)} className="hover:bg-white/20 p-1.5 rounded-md transition"><X size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4 text-right">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">{t('sys.str_1756')}</label>
                                    <input value={companyName} onChange={e=>setCompany(e.target.value)} type="text" className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">{t('sys.str_1757')}</label>
                                    <input value={contactPerson} onChange={e=>setContact(e.target.value)} type="text" className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">{t('sys.str_1758')}</label>
                                    <input value={phone} onChange={e=>setPhone(e.target.value)} type="text" className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none dir-ltr text-left" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">{t('sys.str_1759')}</label>
                                    <input value={email} onChange={e=>setEmail(e.target.value)} type="text" className="w-full border rounded-lg p-2.5 bg-gray-50 focus:bg-white outline-none dir-ltr text-left" />
                                </div>
                            </div>
                            <div className="border-t pt-4 mt-6">
                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><DollarSign size={18} className="text-emerald-500"/> {t('sys.str_1760')}</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold mb-1">{t('sys.str_1761')}</label>
                                        <input value={expectedRevenue} onChange={e=>setExpectedRev(e.target.value)} type="number" className="w-full border rounded-lg p-2.5 font-bold text-orange-600 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">{t('sys.str_1762')}{probability}%)</label>
                                        <input value={probability} onChange={e=>setProbability(e.target.value)} type="range" min="0" max="100" step="10" className="w-full accent-primary" />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 mt-6 flex justify-end gap-3">
                                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-bold">{t('fin.str_206')}</button>
                                <button onClick={handleSave} className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition flex items-center gap-2 font-bold shadow-lg shadow-primary/30">
                                    <Target size={18} /> {t('sys.str_1763')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}