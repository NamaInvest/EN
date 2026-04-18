'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import {
    Building2, Phone, FileText, MapPin, ChevronRight,
    ChevronLeft, CheckCircle, Loader2, Globe, Layers,
} from 'lucide-react';

// ── Business Domain Options (English only) ──────────────────────────────────
const BUSINESS_DOMAINS = [
    'Pharmacy', 'Grocery & Supermarket', 'Restaurant & Cafe',
    'Electronics & Appliances', 'Clothing & Fashion', 'Furniture & Home Decor',
    'Bakery & Sweets', 'Automotive & Spare Parts', 'Perfumes & Cosmetics',
    'Jewelry & Watches', 'Medical Clinic', 'Dental Clinic', 'Optometry & Eyewear',
    'Veterinary Clinic', 'Real Estate', 'Construction & Contracting',
    'Manufacturing & Production', 'Wholesale & Distribution', 'Import & Export',
    'Logistics & Freight', 'Printing & Advertising', 'IT Services & Software',
    'Cleaning & Maintenance', 'Laundry & Dry Cleaning', 'Tailoring & Alterations',
    'Education & Training', 'Gym & Fitness Center', 'Hotel & Hospitality',
    'Travel & Tourism', 'General Trading', 'Other',
];

type Step = 1 | 2 | 3;
type Status = 'IDLE' | 'SUBMITTING' | 'PROVISIONING' | 'READY' | 'ERROR';

const STEP_LABELS = ['بيانات المنشأة', 'بيانات الموقع', 'التأكيد والإرسال'];

// ── Google Translate (free, no API key) ────────────────────────────────────
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

// ── Field inline-error helper ────────────────────────────────────────────────
function fieldError(val: string, rules: { pattern?: RegExp; msg: string; minLen?: number }[]): string {
    for (const rule of rules) {
        if (rule.minLen && val.trim().length < rule.minLen) return rule.msg;
        if (rule.pattern && !rule.pattern.test(val)) return rule.msg;
    }
    return '';
}

export default function CompanyInfoPage() {
    const { user, isLoaded } = useUser();

    // ── Form State ────────────────────────────────────────────────────────
    const [checkingExisting, setCheckingExisting] = useState(true);
    const [step, setStep] = useState<Step>(1);
    const [status, setStatus] = useState<Status>('IDLE');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [provisionedSubdomain, setProvisionedSubdomain] = useState('');
    const [statusMessages, setStatusMessages] = useState<string[]>([]);

    // Step 1
    const [companyNameAr, setCompanyNameAr] = useState('');
    const [companyNameEn, setCompanyNameEn] = useState('');
    const [branchNameEn, setBranchNameEn] = useState('');
    const [businessDomain, setBusinessDomain] = useState('');
    const [mobile, setMobile] = useState('');
    const [country, setCountry] = useState('SA');

    // Step 2
    const [vatNumber, setVatNumber] = useState('');
    const [crnNumber, setCrnNumber] = useState('');
    const [streetName, setStreetName] = useState('');
    const [buildingNo, setBuildingNo] = useState('');
    const [district, setDistrict] = useState('');
    const [city, setCity] = useState('');
    const [cityEn, setCityEn] = useState('');
    const [postalCode, setPostalCode] = useState('');

    // Inline errors
    const [mobileErr, setMobileErr] = useState('');
    const [vatErr, setVatErr] = useState('');
    const [crnErr, setCrnErr] = useState('');
    const [buildingErr, setBuildingErr] = useState('');
    const [postalErr, setPostalErr] = useState('');

    const isSaudi = country === 'SA';
    const [previewSubdomain, setPreviewSubdomain] = useState('');

    // Translation debounce refs
    const companyTimer = useRef<any>(null);
    const cityTimer    = useRef<any>(null);
    const [translating, setTranslating] = useState(false);
    const [cityTranslating, setCityTranslating] = useState(false);

    // ── Check if already provisioned ──────────────────────────────────────
    useEffect(() => {
        if (!isLoaded) return;
        if (!user) { setCheckingExisting(false); return; }
        fetch(`/api/tenant/check-status?userId=${user.id}`)
            .then(r => r.json())
            .then(data => {
                if (data.provisioned && data.subdomain) {
                    window.location.href = `https://${data.subdomain}.namainvist.com/login`;
                } else {
                    setCheckingExisting(false);
                }
            })
            .catch(() => setCheckingExisting(false));
    }, [user, isLoaded]);

    // ── Auto-Translate: companyNameAr → companyNameEn + branchNameEn + slug ──
    useEffect(() => {
        if (!companyNameAr.trim()) {
            setCompanyNameEn('');
            setBranchNameEn('');
            setPreviewSubdomain('');
            return;
        }
        clearTimeout(companyTimer.current);
        companyTimer.current = setTimeout(async () => {
            setTranslating(true);
            const en = await translateToEn(companyNameAr);
            setCompanyNameEn(prev => prev || en);       // لا تكتب فوق تعديل المستخدم
            setBranchNameEn(prev => prev || en);        // نفس الشيء
            setPreviewSubdomain(toSlug(en));
            setTranslating(false);
        }, 600);
    }, [companyNameAr]);

    // ── Auto-Translate: city (AR) → cityEn ────────────────────────────────
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

    // ── Inline Validations ────────────────────────────────────────────────
    const handleMobileChange = (v: string) => {
        setMobile(v);
        if (v && !/^\d{10}$/.test(v)) setMobileErr('رقم الهاتف يجب أن يتكون من 10 أرقام بالضبط');
        else setMobileErr('');
    };

    const handleVatChange = (v: string) => {
        setVatNumber(v);
        if (isSaudi && v && !/^3\d{13}3$/.test(v))
            setVatErr('الرقم الضريبي يجب أن يتكون من 15 رقماً (يبدأ بـ 3 وينتهي بـ 3)');
        else setVatErr('');
    };

    const handleCrnChange = (v: string) => {
        setCrnNumber(v);
        if (isSaudi && v && !/^7\d{9}$/.test(v))
            setCrnErr('السجل التجاري يجب أن يتكون من 10 أرقام (يبدأ بـ 7)');
        else setCrnErr('');
    };

    const handleBuildingChange = (v: string) => {
        setBuildingNo(v);
        if (isSaudi && v && !/^\d{4}$/.test(v)) setBuildingErr('رقم المبنى يجب أن يتكون من 4 أرقام بالضبط');
        else setBuildingErr('');
    };

    const handlePostalChange = (v: string) => {
        setPostalCode(v);
        if (isSaudi && v && !/^\d{5}$/.test(v)) setPostalErr('الرمز البريدي يجب أن يتكون من 5 أرقام بالضبط');
        else setPostalErr('');
    };

    // ── Validation per step ───────────────────────────────────────────────
    const validateStep = (s: Step): string => {
        if (s === 1) {
            if (!companyNameAr.trim()) return 'اسم المنشأة بالعربية مطلوب.';
            if (!companyNameEn.trim()) return 'اسم المنشأة بالإنجليزية مطلوب (يُملأ تلقائياً أو يمكن كتابته يدوياً).';
            if (!businessDomain) return 'مجال العمل مطلوب.';
            if (!mobile.trim()) return 'رقم الهاتف مطلوب.';
            if (!/^\d{10}$/.test(mobile)) return 'رقم الهاتف يجب أن يتكون من 10 أرقام بالضبط.';
            if (!country) return 'يرجى اختيار الدولة.';
        }
        if (s === 2) {
            if (!city.trim()) return 'المدينة مطلوبة.';
            if (isSaudi) {
                if (!district.trim()) return 'الحي مطلوب.';
                if (!streetName.trim()) return 'اسم الشارع مطلوب.';
                if (!buildingNo.trim()) return 'رقم المبنى مطلوب.';
                if (!/^\d{4}$/.test(buildingNo)) return 'رقم المبنى يجب أن يتكون من 4 أرقام بالضبط.';
                if (!postalCode.trim()) return 'الرمز البريدي مطلوب.';
                if (!/^\d{5}$/.test(postalCode)) return 'الرمز البريدي يجب أن يتكون من 5 أرقام بالضبط.';
                if (!vatNumber.trim()) return 'الرقم الضريبي مطلوب.';
                if (!/^3\d{13}3$/.test(vatNumber))
                    return 'الرقم الضريبي غير صحيح — يجب أن يكون 15 رقماً يبدأ وينتهي بـ 3.';
                if (!crnNumber.trim()) return 'السجل التجاري مطلوب.';
                if (!/^7\d{9}$/.test(crnNumber))
                    return 'السجل التجاري غير صحيح — يجب أن يتكون من 10 أرقام يبدأ بـ 7.';
            }
        }
        return '';
    };

    const nextStep = () => {
        const err = validateStep(step);
        if (err) { setErrorMsg(err); return; }
        setErrorMsg('');
        setStep(s => (s < 3 ? ((s + 1) as Step) : s));
    };

    const prevStep = () => { setErrorMsg(''); setStep(s => (s > 1 ? ((s - 1) as Step) : s)); };

    // ── Submit ────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        const err = validateStep(2);
        if (err) { setErrorMsg(err); return; }
        setErrorMsg('');
        setStatus('SUBMITTING');
        setIsSubmitting(true);
        setStatusMessages(['⏳ جاري إرسال بيانات المنشأة...']);

        const userEmail = user?.primaryEmailAddress?.emailAddress || '';
        if (userEmail) localStorage.setItem('clerkEmail', userEmail);

        try {
            const res = await fetch('/api/tenant/provision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    companyNameAr,
                    companyNameEn,
                    businessDomain,
                    branchName: branchNameEn,
                    branchNameEn,
                    mobile,
                    city,
                    cityEn,
                    address: streetName,
                    buildingNo,
                    district,
                    postalCode,
                    vatNumber,
                    crnNumber,
                    clerkUserId: user?.id,
                    clerkEmail: userEmail,
                }),
            });

            const data = await res.json();
            if (!data.success) {
                setErrorMsg(data.message || 'حدث خطأ غير متوقع.');
                setStatus('ERROR');
                setIsSubmitting(false);
                return;
            }

            const subdomain = data.subdomain;
            const ssoToken  = data.ssoToken || '';
            setProvisionedSubdomain(subdomain);
            setStatus('PROVISIONING');
            setStatusMessages(prev => [...prev,
                `✅ تم إنشاء النطاق: ${subdomain}.namainvist.com`,
                '🔧 جاري تهيئة قاعدة البيانات...',
                '⚙️ جاري بناء نظامك السحابي...',
                '🔐 جاري إصدار شهادة الحماية...',
            ]);

            // Poll for readiness
            let attempts = 0;
            const poll = setInterval(async () => {
                attempts++;
                try {
                    const ping = await fetch(`https://${subdomain}.namainvist.com/api/health`);
                    if (ping.ok) {
                        clearInterval(poll);
                        setStatusMessages(prev => [...prev, '🚀 نظامك جاهز! جاري تسجيل الدخول...']);
                        setStatus('READY');
                        setTimeout(() => {
                            const dest = ssoToken
                                ? `https://${subdomain}.namainvist.com/auto-login?token=${encodeURIComponent(ssoToken)}`
                                : `https://${subdomain}.namainvist.com/login`;
                            window.location.href = dest;
                        }, 1500);
                    }
                } catch { /* still booting */ }
                if (attempts >= 40) {
                    clearInterval(poll);
                    setStatusMessages(prev => [...prev, `✅ يمكنك الدخول الآن على: ${subdomain}.namainvist.com`]);
                    setStatus('READY');
                }
            }, 5000);

        } catch (e: any) {
            setErrorMsg('خطأ في الاتصال: ' + e.message);
            setStatus('ERROR');
            setIsSubmitting(false);
        }
    };

    // ── Loading states ────────────────────────────────────────────────────
    if (checkingExisting) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center" dir="rtl">
                <Loader2 size={40} className="text-white animate-spin" />
            </div>
        );
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
                    <h2 className="text-2xl font-black text-white mb-2">
                        {status === 'READY' ? 'نظامك جاهز!' : 'جاري إنشاء نظامك السحابي'}
                    </h2>
                    {provisionedSubdomain && (
                        <p className="text-indigo-300 font-bold mb-6 text-sm">{provisionedSubdomain}.namainvist.com</p>
                    )}
                    <div className="space-y-2 text-right">
                        {statusMessages.map((msg, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-slate-300 bg-white/5 rounded-xl px-4 py-2">
                                <span>{msg}</span>
                            </div>
                        ))}
                    </div>
                    {status !== 'READY' && (
                        <p className="text-slate-400 text-xs mt-6">العملية تستغرق من 2 إلى 5 دقائق، يرجى الانتظار...</p>
                    )}
                </div>
            </div>
        );
    }

    // ── Main Form ─────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4 py-12" dir="rtl">
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            <div className="relative z-10 w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-2xl mb-4">
                        <Layers className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-1">إعداد منشأتك</h1>
                    <p className="text-slate-400 text-sm">أدخل بيانات منشأتك لإنشاء نظامك السحابي الخاص</p>

                    {/* Live Subdomain Banner */}
                    <div className={`mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border transition-all duration-500 ${
                        previewSubdomain
                            ? 'bg-indigo-500/20 border-indigo-400/40 scale-100 opacity-100'
                            : 'bg-white/5 border-white/10 opacity-60'
                    }`}>
                        <Globe size={15} className={previewSubdomain ? 'text-indigo-300' : 'text-slate-500'} />
                        {translating && <Loader2 size={12} className="text-indigo-300 animate-spin" />}
                        <span className="text-xs font-bold text-slate-400 ml-1">رابط نظامك:</span>
                        <span className={`text-sm font-black tracking-wide ${previewSubdomain ? 'text-white' : 'text-slate-600'}`}>
                            {previewSubdomain
                                ? <><span className="text-indigo-300">{previewSubdomain}</span>.namainvist.com</>
                                : 'سيظهر بعد إدخال اسم المنشأة'}
                        </span>
                        {previewSubdomain && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {STEP_LABELS.map((label, i) => {
                        const stepNum = (i + 1) as Step;
                        const isActive = step === stepNum;
                        const isDone = step > stepNum;
                        return (
                            <div key={i} className="flex items-center gap-2">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    isDone ? 'bg-emerald-500 text-white' :
                                    isActive ? 'bg-indigo-500 text-white' :
                                    'bg-white/10 text-slate-400'
                                }`}>
                                    {isDone ? <CheckCircle size={12} /> : <span>{stepNum}</span>}
                                    {label}
                                </div>
                                {i < 2 && <ChevronLeft size={14} className="text-slate-600" />}
                            </div>
                        );
                    })}
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                    {errorMsg && (
                        <div className="mb-6 bg-red-500/20 border border-red-400/40 text-red-300 rounded-xl px-4 py-3 text-sm font-bold">
                            ⚠️ {errorMsg}
                        </div>
                    )}

                    {/* ── Step 1: Company Info ── */}
                    {step === 1 && (
                        <div className="space-y-5">
                            <SectionTitle icon={<Building2 size={18}/>} title="بيانات المنشأة" />

                            {/* الدولة */}
                            <Field label="الدولة *">
                                <select value={country} onChange={e => setCountry(e.target.value)}
                                    className={INPUT_CLASS} style={{ colorScheme: 'dark' }}>
                                    <option value="SA" style={{ background: '#1e293b' }}>🇸🇦 المملكة العربية السعودية</option>
                                    <option value="AE" style={{ background: '#1e293b' }}>🇦🇪 الإمارات العربية المتحدة</option>
                                    <option value="KW" style={{ background: '#1e293b' }}>🇰🇼 الكويت</option>
                                    <option value="BH" style={{ background: '#1e293b' }}>🇧🇭 البحرين</option>
                                    <option value="QA" style={{ background: '#1e293b' }}>🇶🇦 قطر</option>
                                    <option value="OM" style={{ background: '#1e293b' }}>🇴🇲 عمان</option>
                                    <option value="JO" style={{ background: '#1e293b' }}>🇯🇴 الأردن</option>
                                    <option value="EG" style={{ background: '#1e293b' }}>🇪🇬 مصر</option>
                                    <option value="IQ" style={{ background: '#1e293b' }}>🇮🇶 العراق</option>
                                    <option value="LB" style={{ background: '#1e293b' }}>🇱🇧 لبنان</option>
                                    <option value="OTHER" style={{ background: '#1e293b' }}>🌍 دولة أخرى</option>
                                </select>
                                {isSaudi && (
                                    <p className="mt-1.5 text-xs text-amber-400">⚠️ السعودية: جميع البيانات إجبارية (متطلبات ZATCA)</p>
                                )}
                            </Field>

                            {/* اسم المنشأة عربي */}
                            <Field label="اسم المنشأة بالعربية *">
                                <input
                                    type="text" value={companyNameAr}
                                    onChange={e => setCompanyNameAr(e.target.value)}
                                    placeholder="مثال: مؤسسة نما للتجارة"
                                    className={INPUT_CLASS}
                                />
                                {translating && (
                                    <p className="mt-1 text-xs text-indigo-400 flex items-center gap-1">
                                        <Loader2 size={10} className="animate-spin" /> جاري الترجمة...
                                    </p>
                                )}
                            </Field>

                            {/* اسم المنشأة إنجليزي — auto-filled */}
                            <Field label="اسم المنشأة بالإنجليزية *">
                                <div className="relative">
                                    <input
                                        type="text" value={companyNameEn}
                                        onChange={e => setCompanyNameEn(e.target.value)}
                                        placeholder="Auto-filled from translation"
                                        className={INPUT_CLASS}
                                        dir="ltr"
                                    />
                                    {!companyNameEn && (
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                                            🤖 يُملأ تلقائياً
                                        </span>
                                    )}
                                </div>
                                {previewSubdomain && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-400/20 rounded-lg px-3 py-2">
                                        <Globe size={12} />
                                        <span>رابط نظامك: <strong className="text-indigo-200">{previewSubdomain}.namainvist.com</strong></span>
                                    </div>
                                )}
                            </Field>

                            {/* اسم الفرع إنجليزي */}
                            <Field label="اسم الفرع (إنجليزي) *">
                                <div className="relative">
                                    <input
                                        type="text" value={branchNameEn}
                                        onChange={e => setBranchNameEn(e.target.value)}
                                        placeholder="Auto-filled from translation"
                                        className={INPUT_CLASS}
                                        dir="ltr"
                                    />
                                    {!branchNameEn && (
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                                            🤖 يُملأ تلقائياً
                                        </span>
                                    )}
                                </div>
                            </Field>

                            {/* مجال العمل */}
                            <Field label="مجال العمل *">
                                <select value={businessDomain} onChange={e => setBusinessDomain(e.target.value)}
                                    className={INPUT_CLASS} style={{ colorScheme: 'dark' }}>
                                    <option value="" style={{ background: '#1e293b' }}>-- اختر مجال العمل --</option>
                                    {BUSINESS_DOMAINS.map(d => (
                                        <option key={d} value={d} style={{ background: '#1e293b' }}>{d}</option>
                                    ))}
                                </select>
                            </Field>

                            {/* رقم الهاتف — 10 أرقام */}
                            <Field label="رقم الهاتف * (10 أرقام)">
                                <input
                                    type="tel" value={mobile}
                                    onChange={e => handleMobileChange(e.target.value)}
                                    placeholder="05xxxxxxxx"
                                    dir="ltr" maxLength={10}
                                    className={`${INPUT_CLASS} ${mobileErr ? 'border-red-400/60 focus:border-red-400' : ''}`}
                                />
                                {mobileErr && <p className="mt-1 text-xs text-red-400">⚠️ {mobileErr}</p>}
                            </Field>
                        </div>
                    )}

                    {/* ── Step 2: Location & Legal ── */}
                    {step === 2 && (
                        <div className="space-y-5">
                            <SectionTitle icon={<MapPin size={18}/>} title="الموقع والبيانات القانونية" />

                            <div className="grid grid-cols-2 gap-4">
                                {/* المدينة عربي */}
                                <Field label="المدينة (عربي) *">
                                    <input type="text" value={city}
                                        onChange={e => setCity(e.target.value)}
                                        placeholder="الرياض" className={INPUT_CLASS} />
                                    {cityTranslating && (
                                        <p className="mt-1 text-xs text-indigo-400 flex items-center gap-1">
                                            <Loader2 size={10} className="animate-spin" /> جاري الترجمة...
                                        </p>
                                    )}
                                </Field>

                                {/* المدينة إنجليزي — auto-filled */}
                                <Field label="المدينة (إنجليزي) *">
                                    <div className="relative">
                                        <input type="text" value={cityEn}
                                            onChange={e => setCityEn(e.target.value)}
                                            placeholder="Riyadh" className={INPUT_CLASS} dir="ltr" />
                                        {!cityEn && (
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                                                🤖 يُملأ تلقائياً
                                            </span>
                                        )}
                                    </div>
                                </Field>

                                <Field label={isSaudi ? 'الحي *' : 'الحي / المنطقة'}>
                                    <input type="text" value={district}
                                        onChange={e => setDistrict(e.target.value)}
                                        placeholder="العليا" className={INPUT_CLASS} />
                                </Field>

                                <Field label={isSaudi ? 'اسم الشارع *' : 'العنوان'}>
                                    <input type="text" value={streetName}
                                        onChange={e => setStreetName(e.target.value)}
                                        placeholder="شارع الملك فهد" className={INPUT_CLASS} />
                                </Field>

                                {/* رقم المبنى — 4 أرقام */}
                                <Field label={isSaudi ? 'رقم المبنى * (4 أرقام)' : 'رقم المبنى'}>
                                    <input type="text" value={buildingNo}
                                        onChange={e => handleBuildingChange(e.target.value)}
                                        placeholder="1234" dir="ltr" maxLength={4}
                                        className={`${INPUT_CLASS} ${buildingErr ? 'border-red-400/60' : ''}`} />
                                    {buildingErr && <p className="mt-1 text-xs text-red-400">⚠️ {buildingErr}</p>}
                                </Field>

                                {/* الرمز البريدي — 5 أرقام */}
                                <Field label={isSaudi ? 'الرمز البريدي * (5 أرقام)' : 'الرمز البريدي'}>
                                    <input type="text" value={postalCode}
                                        onChange={e => handlePostalChange(e.target.value)}
                                        placeholder="12345" dir="ltr" maxLength={5}
                                        className={`${INPUT_CLASS} ${postalErr ? 'border-red-400/60' : ''}`} />
                                    {postalErr && <p className="mt-1 text-xs text-red-400">⚠️ {postalErr}</p>}
                                </Field>
                            </div>

                            {/* البيانات الضريبية */}
                            <div className="pt-2 border-t border-white/10">
                                <SectionTitle icon={<FileText size={18}/>} title={isSaudi ? 'البيانات الضريبية (إجبارية)' : 'البيانات الضريبية (اختياري)'} />
                                <div className="grid grid-cols-1 gap-4 mt-4">

                                    {/* الرقم الضريبي */}
                                    <Field label={isSaudi ? 'الرقم الضريبي VAT * — 15 رقماً (يبدأ وينتهي بـ 3)' : 'الرقم الضريبي VAT'}>
                                        <input type="text" value={vatNumber}
                                            onChange={e => handleVatChange(e.target.value)}
                                            placeholder={isSaudi ? '3XXXXXXXXXXXXX3' : 'VAT Number'}
                                            maxLength={isSaudi ? 15 : 50} dir="ltr"
                                            className={`${INPUT_CLASS} font-mono tracking-widest ${vatErr ? 'border-red-400/60' : vatNumber.length === 15 && !vatErr ? 'border-emerald-400/60' : ''}`} />
                                        {vatErr && (
                                            <div className="mt-2 bg-red-500/15 border border-red-400/30 rounded-lg px-3 py-2">
                                                <p className="text-xs text-red-400 font-bold">❌ {vatErr}</p>
                                            </div>
                                        )}
                                        {vatNumber.length === 15 && !vatErr && (
                                            <p className="mt-1 text-xs text-emerald-400">✅ الرقم الضريبي صحيح</p>
                                        )}
                                        {isSaudi && <p className="mt-1 text-xs text-slate-500">مثال: 300XXXXXXXXXX003</p>}
                                    </Field>

                                    {/* السجل التجاري */}
                                    <Field label={isSaudi ? 'السجل التجاري CRN * — 10 أرقام (يبدأ بـ 7)' : 'السجل التجاري CRN'}>
                                        <input type="text" value={crnNumber}
                                            onChange={e => handleCrnChange(e.target.value)}
                                            placeholder={isSaudi ? '7XXXXXXXXX' : 'Commercial Reg. No.'}
                                            maxLength={isSaudi ? 10 : 50} dir="ltr"
                                            className={`${INPUT_CLASS} font-mono tracking-widest ${crnErr ? 'border-red-400/60' : crnNumber.length === 10 && !crnErr ? 'border-emerald-400/60' : ''}`} />
                                        {crnErr && (
                                            <div className="mt-2 bg-red-500/15 border border-red-400/30 rounded-lg px-3 py-2">
                                                <p className="text-xs text-red-400 font-bold">❌ {crnErr}</p>
                                            </div>
                                        )}
                                        {crnNumber.length === 10 && !crnErr && (
                                            <p className="mt-1 text-xs text-emerald-400">✅ السجل التجاري صحيح</p>
                                        )}
                                    </Field>

                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Step 3: Confirm ── */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <SectionTitle icon={<CheckCircle size={18}/>} title="مراجعة البيانات قبل الإرسال" />

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 text-sm">
                                <ConfirmRow label="الدولة" value={country === 'SA' ? '🇸🇦 السعودية' : country} />
                                <ConfirmRow label="اسم المنشأة (عربي)" value={companyNameAr} />
                                <ConfirmRow label="اسم المنشأة (إنجليزي)" value={companyNameEn} />
                                <ConfirmRow label="اسم الفرع (إنجليزي)" value={branchNameEn} />
                                <ConfirmRow label="مجال العمل" value={businessDomain} />
                                <ConfirmRow label="الهاتف" value={mobile} />
                                <ConfirmRow label="المدينة" value={`${city}${cityEn ? ` / ${cityEn}` : ''}`} />
                                {streetName && <ConfirmRow label="الشارع" value={streetName} />}
                                {district && <ConfirmRow label="الحي" value={district} />}
                                {buildingNo && <ConfirmRow label="رقم المبنى" value={buildingNo} />}
                                {postalCode && <ConfirmRow label="الرمز البريدي" value={postalCode} />}
                                {vatNumber && <ConfirmRow label="الرقم الضريبي" value={vatNumber} />}
                                {crnNumber && <ConfirmRow label="السجل التجاري" value={crnNumber} />}
                            </div>

                            {previewSubdomain && (
                                <div className="bg-indigo-500/20 border border-indigo-400/30 rounded-2xl p-4 text-center">
                                    <p className="text-slate-300 text-sm mb-1">رابط نظامك بعد التأسيس:</p>
                                    <p className="text-indigo-300 font-black text-lg">{previewSubdomain}.namainvist.com</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Navigation ── */}
                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                        <button onClick={prevStep} disabled={step === 1}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-slate-300 font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                            <ChevronRight size={16} /> السابق
                        </button>

                        {step < 3 ? (
                            <button onClick={nextStep}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all">
                                التالي <ChevronLeft size={16} />
                            </button>
                        ) : (
                            <button onClick={handleSubmit} disabled={isSubmitting}
                                className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-60">
                                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> جاري الإرسال...</> : <>🚀 تأسيس النظام</>}
                            </button>
                        )}
                    </div>
                </div>

                <p className="text-center text-slate-600 text-xs mt-6">
                    مسجل كـ: {user?.primaryEmailAddress?.emailAddress}
                </p>
            </div>
        </div>
    );
}

// ── Sub-components ──────────────────────────────────────────────────────────
const INPUT_CLASS = "w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-bold text-slate-300 mb-1.5">{label}</label>
            {children}
        </div>
    );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
    return (
        <div className="flex items-center gap-2 text-indigo-300 font-black text-base mb-2">
            {icon} {title}
        </div>
    );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-slate-400">{label}</span>
            <span className="text-white font-bold">{value}</span>
        </div>
    );
}
