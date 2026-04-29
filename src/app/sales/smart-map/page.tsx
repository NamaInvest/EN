'use client';
import { useState, useEffect } from 'react';

// محاكاة بيانات العملاء الجغرافية للمندوب الميداني
const MOCK_CLIENTS = [
    { id: 1, name: 'أسواق التميمي - فرع الياسمين', lat: 24.8134, lng: 46.6234, status: 'active', lastOrder: 'قبل يومين', distance: '1.2 كم', value: 4500 },
    { id: 2, name: 'مخبز السعادة', lat: 24.7950, lng: 46.6500, status: 'danger', lastOrder: 'قبل 35 يوم', distance: '2.5 كم', value: 1200 },
    { id: 3, name: 'كافيه هاف مليون', lat: 24.8200, lng: 46.6100, status: 'warning', lastOrder: 'قبل 18 يوم', distance: '3.1 كم', value: 8500 },
    { id: 4, name: 'سوبر ماركت بنده', lat: 24.7800, lng: 46.6700, status: 'danger', lastOrder: 'قبل 42 يوم', distance: '4.8 كم', value: 15000 },
    { id: 5, name: 'بقالة الركن', lat: 24.8050, lng: 46.6350, status: 'active', lastOrder: 'اليوم', distance: '0.8 كم', value: 300 },
];

export default function SmartSalesMap() {
    const [selectedClient, setSelectedClient] = useState<typeof MOCK_CLIENTS[0] | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [voiceText, setVoiceText] = useState('');
    const [simulationState, setSimulationState] = useState<'idle' | 'processing' | 'success'>('idle');

    // محاكاة الأوامر الصوتية
    const handleVoiceCommand = () => {
        setIsListening(true);
        setVoiceText('جاري الاستماع...');
        
        setTimeout(() => {
            setVoiceText('"نزل 10 كراتين قهوة مختصة لمخبز السعادة"');
            setIsListening(false);
            setSimulationState('processing');
            
            setTimeout(() => {
                setSimulationState('success');
                setTimeout(() => {
                    setSimulationState('idle');
                    setVoiceText('');
                }, 4000);
            }, 1500);
        }, 2000);
    };

    return (
        <div className="min-h-screen p-6" dir="rtl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        🗺️ الخريطة الذكية للمندوب (Smart Field Map)
                    </h1>
                    <p className="text-[var(--text-muted)] text-sm mt-1">
                        توجيه بالذكاء الاصطناعي بناءً على ركود العملاء والمسافة الجغرافية
                    </p>
                </div>
                
                {/* Voice Command Button */}
                <button 
                    onClick={handleVoiceCommand}
                    disabled={isListening || simulationState !== 'idle'}
                    className={`btn ${isListening ? 'btn-danger animate-pulse' : 'btn-primary'} flex items-center gap-2 rounded-full px-6 py-3 shadow-lg`}
                >
                    {isListening ? '🎙️ نتنصت...' : '🎙️ طلب صوتي سريع'}
                </button>
            </div>

            {/* Voice Command Feedback overlay/banner */}
            {voiceText && (
                <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between transition-all ${
                    simulationState === 'success' ? 'bg-[var(--success)] text-white border-[var(--success-light)]' : 
                    simulationState === 'processing' ? 'bg-[var(--warning)] text-white border-[var(--warning-light)] animate-pulse' : 
                    'card border-[var(--primary)]'
                }`}>
                    <div className="flex items-center gap-3 font-medium">
                        <span className="text-2xl">{simulationState === 'success' ? '✅' : simulationState === 'processing' ? '⚙️' : '🗣️'}</span>
                        <span>{voiceText}</span>
                    </div>
                    {simulationState === 'success' && (
                        <span className="text-sm bg-white/20 px-3 py-1 rounded-full">تم تحويل الصوت إلى أمر بيع بنجاح!</span>
                    )}
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                
                {/* Map Area Simulation */}
                <div className="lg:col-span-2 card p-0 overflow-hidden relative" style={{ height: '600px' }}>
                    {/* Mock Map Background */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none" 
                         style={{ 
                             backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54.627 0l.83.83-5.59 5.592-5.63-5.63-1.414 1.414 5.63 5.63-5.592 5.59-.83-.83v5.656h5.657l.83-.83 5.59 5.592 5.63 5.63 1.414-1.414-5.63-5.63 5.592-5.59.83.83V0h-5.657z\' fill=\'%236C63FF\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
                             backgroundSize: '100px'
                         }}>
                    </div>
                    
                    {/* Map UI Elements */}
                    <div className="absolute top-4 right-4 z-10 flex gap-2">
                        <span className="badge badge-danger">🔴 خطر الانسحاب (Churn)</span>
                        <span className="badge badge-success">🟢 نشط</span>
                    </div>

                    {/* Client Markers */}
                    <div className="relative w-full h-full p-10">
                        {MOCK_CLIENTS.map((client, i) => {
                            const isDanger = client.status === 'danger';
                            // Positioning simulation
                            const top = `${15 + (i * 18)}%`;
                            const left = `${20 + (i % 2 === 0 ? 40 : 10)}%`;
                            
                            return (
                                <button
                                    key={client.id}
                                    onClick={() => setSelectedClient(client)}
                                    className={`absolute flex flex-col items-center group transition-transform ${selectedClient?.id === client.id ? 'scale-125 z-20' : 'hover:scale-110 z-10'}`}
                                    style={{ top, left }}
                                >
                                    <div className={`text-3xl mb-1 filter drop-shadow-lg ${isDanger ? 'animate-bounce' : ''}`}>
                                        {isDanger ? '🚨' : client.status === 'warning' ? '⚠️' : '📍'}
                                    </div>
                                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg whitespace-nowrap transition-colors ${
                                        isDanger ? 'bg-[var(--danger)] text-white' : 
                                        'bg-[var(--bg-card)] text-[var(--text)] border border-[var(--border)] group-hover:border-[var(--primary)]'
                                    }`}>
                                        {client.name}
                                        {isDanger && <div className="text-[10px] opacity-90 mt-0.5">لم يطلب منذ {client.lastOrder.split(' ')[1]} يوماً!</div>}
                                    </div>
                                </button>
                            );
                        })}
                        
                        {/* Current Location Marker */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-0">
                            <div className="w-16 h-16 rounded-full bg-[var(--primary)] opacity-20 animate-ping absolute"></div>
                            <div className="w-6 h-6 rounded-full bg-[var(--primary)] border-4 border-white shadow-xl relative"></div>
                            <span className="mt-2 text-xs font-bold text-[var(--primary)] bg-white/80 px-2 rounded backdrop-blur-sm">موقعك الحالي</span>
                        </div>
                    </div>
                </div>

                {/* AI Recommendations Panel */}
                <div className="flex flex-col gap-4">
                    <div className="card border-[var(--danger)] shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-[var(--danger)]">
                            ⚡ تدخل عاجل مطلوب!
                        </h2>
                        <div className="space-y-3">
                            {MOCK_CLIENTS.filter(c => c.status === 'danger').map(c => (
                                <div key={c.id} className="p-3 bg-[var(--bg-dark)] rounded-lg border border-[var(--border-light)] hover:border-[var(--danger)] transition-colors cursor-pointer" onClick={() => setSelectedClient(c)}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-[var(--text)] text-sm">{c.name}</span>
                                        <span className="text-xs bg-[var(--danger)] text-white px-2 py-0.5 rounded-full">{c.distance}</span>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] mb-2">قيمة العميل: {c.value.toLocaleString()} ر.س</p>
                                    <button className="w-full btn btn-sm btn-danger text-xs">
                                        🚗 توجيه مسار الآن
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedClient ? (
                        <div className="card flex-1 animate-fade-in">
                            <div className="flex items-center justify-between mb-4 border-b border-[var(--border-light)] pb-4">
                                <h3 className="font-bold text-[var(--text)]">{selectedClient.name}</h3>
                                <span className="text-2xl cursor-pointer" onClick={() => setSelectedClient(null)}>✖️</span>
                            </div>
                            
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-muted)]">آخر طلب:</span>
                                    <span className={`font-bold ${selectedClient.status === 'danger' ? 'text-[var(--danger)]' : 'text-[var(--text)]'}`}>{selectedClient.lastOrder}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-muted)]">قيمة العميل السنوية:</span>
                                    <span className="font-bold text-[var(--success)]">{selectedClient.value.toLocaleString()} ر.س</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-muted)]">احتمالية التجاوب:</span>
                                    <span className="font-bold text-[var(--primary)]">85%</span>
                                </div>
                                
                                <div className="mt-6 pt-4 border-t border-[var(--border-light)]">
                                    <p className="text-xs font-bold text-[var(--primary)] mb-2">🤖 مقترح الذكاء الاصطناعي للمندوب:</p>
                                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic bg-[var(--primary)]/5 p-3 rounded-lg border border-[var(--primary)]/20">
                                        "العميل انقطع منذ فترة بسبب تأخر التسليم في آخر طلب. اذهب إليه الآن (على بُعد {selectedClient.distance}) وقدم له اعتذاراً مع خصم 10% مجدول على النظام. فرص الإغلاق عالية جداً."
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <button className="btn btn-sm btn-primary">📝 إنشاء عرض</button>
                                    <button className="btn btn-sm btn-ghost">📞 اتصال</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card flex-1 flex flex-col items-center justify-center text-center opacity-60">
                            <span className="text-4xl mb-3">🧭</span>
                            <p className="text-sm font-bold text-[var(--text)]">اختر عميلاً من الخريطة</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">أو اتبع التوجيهات الحمراء العاجلة</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
