'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building2, FileText, MapPin, ChevronRight,
    ChevronLeft, CheckCircle, Loader2, Globe, Layers,
} from 'lucide-react';

const BUSINESS_DOMAINS = [
    'صيدلية', 'بقالة وسوبرماركت', 'مطعم ومقهى',
    'إلكترونيات وأجهزة', 'ملابس وأزياء', 'أثاث وديكور',
    'مخبز وحلويات', 'سيارات وقطع غيار', 'عطور ومستحضرات تجميل',
    'مجوهرات وساعات', 'عيادة طبية', 'عيادة أسنان', 'بصريات ونظارات',
    'عيادة بيطرية', 'عقارات', 'مقاولات وبناء',
    'تصنيع وإنتاج', 'جملة وتوزيع', 'استيراد وتصدير',
    'نقل ولوجستيات', 'طباعة وإعلان', 'خدمات تقنية',
    'نظافة وصيانة', 'مغسلة ملابس', 'خياطة',
    'تعليم وتدريب', 'نادي رياضي', 'فندقة وضيافة',
    'سفر وسياحة', 'تجارة عامة', 'أخرى',
];

type Step = 1 | 2 | 3;
type Status = 'IDLE' | 'SUBMITTING' | 'PROVISIONING' | 'READY' | 'ERROR';

const STEP_LABELS = ['بيانات المنشأة', 'بيانات الموقع', 'التأكيد والإرسال'];

async function translateToEn(text: string): Promise<string> {
    if (!text.trim()) return '';
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ar&tl=en&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        const data = await res.json();
        return (data?.[0]?.[0]?.[0] || text).trim();
    } catch {
        return text;
    }
}

function toSlug(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20);
}

export default function CompanySetupPage() {
    const router = useRouter();

    const [step, setStep] = useState<Step>(1);
    const [status, setStatus] = useState<Status>('IDLE');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [provisionedSubdomain, setProvisionedSubdomain] = useState('');
    const [statusMessages, setStatusMessages] = useState<string[]>([]);
    const [checkingExisting, setCheckingExisting] = useState(true);

    const [companyNameAr, setCompanyNameAr] = useState('');
    const [companyNameEn, setCompanyNameEn] = useState('');
    const [businessDomain, setBusinessDomain] = useState('');
    const [mobile, setMobile] = useState('');
    const [country, setCountry] = useState('SA');

    const [vatNumber, setVatNumber] = useState('');
    const [crnNumber, setCrnNumber] = useState('');
    const [streetName, setStreetName] = useState('');
    const [buildingNo, setBuildingNo] = useState('');
    const [district, setDistrict] = useState('');
    const [city, setCity] = useState('');
    const [cityEn, setCityEn] = useState('');
    const [postalCode, setPostalCode] = useState('');

    const [mobileErr, setMobileErr] = useState('');
    const [vatErr, setVatErr] = useState('');
    const [crnErr, setCrnErr] = useState('');
    const [buildingErr, setBuildingErr] = useState('');
    const [postalErr, setPostalErr] = useState('');

    const isSaudi = country === 'SA';
    const [previewSubdomain, setPreviewSubdomain] = useState('');

    const companyTimer = useRef<any>(null);
    const cityTimer    = useRef<any>(null);
    const [translating, setTranslating] = useState(false);
    const [cityTranslating, setCityTranslating] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('/api/settings', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data) return;
                const defaultNames = ['نما إنفست', 'Nama Invest', 'شركتي', 'نماء سوفت', 'الشركة الرئيسية', 'Nama Invest ERP', ''];
                const name = Array.isArray(data) ? data.find((s: any) => s.key === 'company_name')?.value : data?.company_name;
                if (name && !defaultNames.includes(name)) {
                    router.replace('/dashboard');
                } else {
                    setCheckingExisting(false);
                }
            })
            .catch(() => setCheckingExisting(false));
    }, [router]);

    useEffect(() => {
        if (!companyNameAr.trim()) {
            setCompanyNameEn('');
            setPreviewSubdomain('');
            return;
        }
        clearTimeout(companyTimer.current);
        companyTimer.current = setTimeout(async () => {
            setTranslating(true);
            const en = await translateToEn(companyNameAr);
            setCompanyNameEn(prev => prev || en);
            setPreviewSubdomain(toSlug(en));
            setTranslating(false);
        }, 600);
    }, [companyNameAr]);

    useEffect(() => {
        if (!city.trim()) { setCityEn(''); return; }
        clearTimeout(cityTimer.current);
        cityTimer.current = setTimeout(async () => {
            setCityTranslating(true);
            const en = await translateToEn(city);
            setCityEn(prev => prev || en);
            setCityTranslating(false);
        }, 600);
    }, [city]);

    const handleMobileChange = (v: string) => { setMobile(v); if (v && !/^\d{10}$/.test(v)) setMobileErr('10 أرقام'); else setMobileErr(''); };
    const handleVatChange = (v: string) => { setVatNumber(v); if (isSaudi && v && !/^3\d{13}3$/.test(v)) setVatErr('15 رقم يبدأ وينتهي بـ 3'); else setVatErr(''); };
    const handleCrnChange = (v: string) => { setCrnNumber(v); if (isSaudi && v && !/^7\d{9}$/.test(v)) setCrnErr('10 أرقام تبدأ بـ 7'); else setCrnErr(''); };
    const handleBuildingChange = (v: string) => { setBuildingNo(v); if (isSaudi && v && !/^\d{4}$/.test(v)) setBuildingErr('4 أرقام'); else setBuildingErr(''); };
    const handlePostalChange = (v: string) => { setPostalCode(v); if (isSaudi && v && !/^\d{5}$/.test(v)) setPostalErr('5 أرقام'); else setPostalErr(''); };

    const validateStep = (s: Step): string => {
        if (s === 1) {
            if (!companyNameAr.trim()) return 'اسم المنشأة بالعربية مطلوب.';
            if (!businessDomain) return 'مجال العمل مطلوب.';
            if (!mobile.trim()) return 'رقم الهاتف مطلوب.';
            if (!/^\d{10}$/.test(mobile)) return 'رقم الهاتف يجب أن يتكون من 10 أرقام بالضبط.';
        }
        if (s === 2) {
            if (!city.trim()) return 'المدينة مطلوبة.';
            if (isSaudi) {
                if (!vatNumber.trim()) return 'الرقم الضريبي مطلوب.';
                if (!/^3\d{13}3$/.test(vatNumber)) return 'الرقم الضريبي غير صحيح.';
                if (!crnNumber.trim()) return 'السجل التجاري مطلوب.';
                if (!/^7\d{9}$/.test(crnNumber)) return 'السجل التجاري غير صحيح.';
            }
        }
        return '';
    };

    const nextStep = () => { const err = validateStep(step); if (err) { setErrorMsg(err); return; } setErrorMsg(''); setStep(s => (s < 3 ? ((s + 1) as Step) : s)); };
    const prevStep = () => { setErrorMsg(''); setStep(s => (s > 1 ? ((s - 1) as Step) : s)); };

    function getHardwareId(): string {
        let id = localStorage.getItem('nama-hardware-id');
        if (!id) { id = 'HW-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8); localStorage.setItem('nama-hardware-id', id); }
        return id;
    }

    const handleSubmit = async () => {
        const err = validateStep(2);
        if (err) { setErrorMsg(err); return; }
        setErrorMsg('');
        setStatus('SUBMITTING');
        setIsSubmitting(true);
        setStatusMessages(['⏳ جاري حفظ البيانات محلياً في معلومات المنشأة...']);

        try {
            const token = localStorage.getItem('token');
            // Save to local Settings
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({
                    company_name: companyNameAr, company_name_en: companyNameEn,
                    company_phone: mobile, company_address: `${streetName}${streetName ? '، ' : ''}${district}${district ? '، ' : ''}${city}`,
                    tax_number: vatNumber, business_domain: businessDomain,
                    zatca_crn: crnNumber, zatca_street: streetName, zatca_building: buildingNo,
                    zatca_district: district, zatca_city: city, zatca_postal_code: postalCode,
                }),
            });

            setStatusMessages(prev => [...prev, '☁️ جاري تسجيل المنشأة سحابياً وتوليد رابط النسخ الاحتياطي...']);
            let cloudSubdomain = previewSubdomain;

            try {
                const cloudRes = await fetch('https://namainvist.com/api/ice/desktop-register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        companyNameAr, companyNameEn, businessDomain, mobile, vatNumber, crnNumber,
                        city, cityEn, district, streetName, buildingNo, postalCode, subdomain: previewSubdomain,
                        hardwareId: getHardwareId(), deviceName: navigator.userAgent.substring(0, 80), appVersion: '1.0.0',
                    }),
                });

                const cloudData = await cloudRes.json();
                if (cloudData.success) {
                    if (cloudData.license_key) localStorage.setItem('nama-desktop-license', cloudData.license_key);
                    if (cloudData.subdomain) cloudSubdomain = cloudData.subdomain;
                }
            } catch (cloudErr) {
                console.warn('Cloud registration deferred', cloudErr);
            }

            setProvisionedSubdomain(cloudSubdomain);
            setStatus('PROVISIONING');
            setStatusMessages(prev => [...prev,
                `✅ تم دمج البيانات مع معلومات المنشأة بنجاح!`,
                `🌐 رابط النسخ الاحتياطي المحجوز لك: ${cloudSubdomain}.namainvist.com`,
                '🚀 نظامك المكتبي جاهز للعمل بالكامل...',
            ]);

            setTimeout(() => {
                setStatus('READY');
                setTimeout(() => { router.replace('/dashboard'); }, 2000);
            }, 3000);

        } catch (e: any) {
            setErrorMsg('خطأ في الاتصال: ' + e.message);
            setStatus('ERROR');
            setIsSubmitting(false);
        }
    };

    if (checkingExisting) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 size={40} className="text-white animate-spin" /></div>;
    }

    if (status === 'PROVISIONING' || status === 'READY' || status === 'SUBMITTING') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4" dir="rtl">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 border-4 border-indigo-300/30 rounded-full" />
                        <div className="absolute inset-0 border-4 border-t-indigo-400 rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center text-3xl">🚀</div>
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">{status === 'READY' ? 'نظامك جاهز!' : 'جاري إعداد المنشأة'}</h2>
                    {provisionedSubdomain && <p className="text-indigo-300 font-bold mb-6 text-sm">{provisionedSubdomain}.namainvist.com</p>}
                    <div className="space-y-2 text-right">
                        {statusMessages.map((msg, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-slate-300 bg-white/5 rounded-xl px-4 py-2">
                                <span>{msg}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const INPUT_CLASS = "w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all";

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4 py-12" dir="rtl">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            <div className="relative z-10 w-full max-w-2xl">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-2xl mb-4">
                        <Layers className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-1">إعداد المنشأة (للنسخة المكتبية)</h1>
                    <p className="text-slate-400 text-sm">أدخل بيانات منشأتك لتهيئة النظام المحلي السحابي</p>
                    
                    <div className={`mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all duration-500 ${previewSubdomain ? 'bg-indigo-500/20 border-indigo-400/40' : 'bg-white/5 border-white/10 opacity-60'}`}>
                        <Globe size={15} className={previewSubdomain ? 'text-indigo-300' : 'text-slate-500'} />
                        {translating && <Loader2 size={12} className="text-indigo-300 animate-spin" />}
                        <span className="text-xs font-bold text-slate-400 ml-1">رابطك المخصص:</span>
                        <span className={`text-sm font-black tracking-wide ${previewSubdomain ? 'text-white' : 'text-slate-600'}`}>
                            {previewSubdomain ? <><span className="text-indigo-300">{previewSubdomain}</span>.namainvist.com</> : 'يُولد تلقائياً'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEP_LABELS.map((label, i) => {
                        const stepNum = (i + 1) as Step;
                        const isActive = step === stepNum;
                        const isDone = step > stepNum;
                        return (
                            <div key={i} className="flex items-center gap-2">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                                    {isDone ? <CheckCircle size={12} /> : <span>{stepNum}</span>} {label}
                                </div>
                                {i < 2 && <ChevronLeft size={14} className="text-slate-600" />}
                            </div>
                        );
                    })}
                </div>

                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                    {errorMsg && <div className="mb-6 bg-red-500/20 border border-red-400/40 text-red-300 rounded-xl px-4 py-3 text-sm font-bold">⚠️ {errorMsg}</div>}

                    {step === 1 && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 text-indigo-300 font-black text-base mb-2"><Building2 size={18}/> بيانات المنشأة</div>
                            
                            <div><label className="block text-sm font-bold text-slate-300 mb-1.5">الدولة *</label>
                            <select value={country} onChange={e => setCountry(e.target.value)} className={INPUT_CLASS} style={{ colorScheme: 'dark' }}>
                                <option value="SA" style={{ background: '#1e293b' }}>🇸🇦 السعودية</option>
                            </select></div>

                            <div><label className="block text-sm font-bold text-slate-300 mb-1.5">اسم المنشأة بالعربية *</label>
                            <input type="text" value={companyNameAr} onChange={e => setCompanyNameAr(e.target.value)} placeholder="مثال: مؤسسة نما" className={INPUT_CLASS} /></div>

                            <div><label className="block text-sm font-bold text-slate-300 mb-1.5">اسم المنشأة بالإنجليزية *</label>
                            <input type="text" value={companyNameEn} onChange={e => setCompanyNameEn(e.target.value)} className={INPUT_CLASS} dir="ltr" /></div>

                            <div><label className="block text-sm font-bold text-slate-300 mb-1.5">مجال العمل *</label>
                            <select value={businessDomain} onChange={e => setBusinessDomain(e.target.value)} className={INPUT_CLASS} style={{ colorScheme: 'dark' }}>
                                <option value="" style={{ background: '#1e293b' }}>-- اختر مجال العمل --</option>
                                {BUSINESS_DOMAINS.map(d => <option key={d} value={d} style={{ background: '#1e293b' }}>{d}</option>)}
                            </select></div>

                            <div><label className="block text-sm font-bold text-slate-300 mb-1.5">رقم الهاتف *</label>
                            <input type="tel" value={mobile} onChange={e => handleMobileChange(e.target.value)} placeholder="05xxxxxxxx" dir="ltr" maxLength={10} className={`${INPUT_CLASS} ${mobileErr ? 'border-red-400/60' : ''}`} />
                            {mobileErr && <p className="mt-1 text-xs text-red-400">{mobileErr}</p>}</div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-2 text-indigo-300 font-black text-base mb-2"><MapPin size={18}/> الموقع والبيانات الضريبية</div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-sm font-bold text-slate-300 mb-1.5">المدينة (عربي) *</label><input type="text" value={city} onChange={e => setCity(e.target.value)} className={INPUT_CLASS} /></div>
                                <div><label className="block text-sm font-bold text-slate-300 mb-1.5">المدينة (إنجليزي)</label><input type="text" value={cityEn} onChange={e => setCityEn(e.target.value)} className={INPUT_CLASS} dir="ltr" /></div>
                                <div><label className="block text-sm font-bold text-slate-300 mb-1.5">الحي *</label><input type="text" value={district} onChange={e => setDistrict(e.target.value)} className={INPUT_CLASS} /></div>
                                <div><label className="block text-sm font-bold text-slate-300 mb-1.5">الشارع *</label><input type="text" value={streetName} onChange={e => setStreetName(e.target.value)} className={INPUT_CLASS} /></div>
                                <div><label className="block text-sm font-bold text-slate-300 mb-1.5">رقم المبنى *</label><input type="text" value={buildingNo} onChange={e => handleBuildingChange(e.target.value)} className={INPUT_CLASS} dir="ltr" maxLength={4} /></div>
                                <div><label className="block text-sm font-bold text-slate-300 mb-1.5">الرمز البريدي *</label><input type="text" value={postalCode} onChange={e => handlePostalChange(e.target.value)} className={INPUT_CLASS} dir="ltr" maxLength={5} /></div>
                            </div>
                            <div className="pt-2 border-t border-white/10 mt-4">
                                <div className="flex items-center gap-2 text-indigo-300 font-black text-base mb-2"><FileText size={18}/> البيانات الضريبية (إجبارية)</div>
                                <div className="grid grid-cols-1 gap-4 mt-4">
                                    <div><label className="block text-sm font-bold text-slate-300 mb-1.5">الرقم الضريبي VAT *</label><input type="text" value={vatNumber} onChange={e => handleVatChange(e.target.value)} className={`${INPUT_CLASS} font-mono tracking-widest`} dir="ltr" maxLength={15} /></div>
                                    <div><label className="block text-sm font-bold text-slate-300 mb-1.5">السجل التجاري CRN *</label><input type="text" value={crnNumber} onChange={e => handleCrnChange(e.target.value)} className={`${INPUT_CLASS} font-mono tracking-widest`} dir="ltr" maxLength={10} /></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-indigo-300 font-black text-base mb-2"><CheckCircle size={18}/> مراجعة البيانات</div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 text-sm">
                                <div className="flex items-center justify-between"><span className="text-slate-400">المنشأة</span><span className="text-white font-bold">{companyNameAr}</span></div>
                                <div className="flex items-center justify-between"><span className="text-slate-400">المجال</span><span className="text-white font-bold">{businessDomain}</span></div>
                                <div className="flex items-center justify-between"><span className="text-slate-400">الرقم الضريبي</span><span className="text-white font-bold">{vatNumber}</span></div>
                                <div className="flex items-center justify-between"><span className="text-slate-400">السجل التجاري</span><span className="text-white font-bold">{crnNumber}</span></div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                        <button onClick={prevStep} disabled={step === 1} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-slate-300 font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-30">
                            <ChevronRight size={16} /> السابق
                        </button>
                        {step < 3 ? (
                            <button onClick={nextStep} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 text-white font-bold text-sm shadow-lg transition-all">
                                التالي <ChevronLeft size={16} />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black text-sm shadow-lg transition-all">
                                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> جاري الحفظ...</> : <>🚀 تفعيل النظام</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
