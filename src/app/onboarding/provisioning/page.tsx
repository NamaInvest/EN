'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function ProvisioningPage() {
    const { user } = useUser(); // non-blocking - user may be null initially

    const [subdomain, setSubdomain] = useState('');
    const [companyNameAr, setCompanyNameAr] = useState('');
    const [businessDomain, setBusinessDomain] = useState('');
    const [branchName, setBranchName] = useState('');
    const [mobile, setMobile] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [buildingNo, setBuildingNo] = useState('');
    const [district, setDistrict] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [vatNumber, setVatNumber] = useState('');
    const [crnNumber, setCrnNumber] = useState('');

    const [error, setError] = useState('');
    const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS'>('IDLE');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        const cleanSubdomain = subdomain.trim().toLowerCase();
        if (!/^[a-z0-9]+$/.test(cleanSubdomain)) {
            setError('اسم الموقع الفرعي يمكن أن يحتوي فقط على أحرف إنجليزية وأرقام.');
            return;
        }

        if (!/^3\d{13}3$/.test(vatNumber)) {
            setError('الرقم الضريبي يجب أن يتكون من 15 رقماً بالضبط، ويبدأ بـ 3 وينتهي بـ 3.');
            return;
        }

        if (!/^7\d{9}$/.test(crnNumber)) {
            setError('السجل التجاري يجب أن يتكون من 10 أرقام بالضبط، ويبدأ برقم 7.');
            return;
        }

        setStatus('LOADING');

        try {
            const res = await fetch('/api/tenant/provision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subdomain: cleanSubdomain,
                    companyNameAr,
                    businessDomain,
                    branchName,
                    mobile,
                    city,
                    address,
                    buildingNo,
                    district,
                    postalCode,
                    vatNumber,
                    crnNumber,
                    clerkUserId: user?.id,
                    clerkEmail: user?.primaryEmailAddress?.emailAddress
                })
            });

            const data = await res.json();
            if (!data.success) {
                setError(data.message || 'حدث خطأ غير متوقع أثناء المعالجة!');
                setStatus('IDLE');
                return;
            }

            setStatus('SUCCESS');
            
            // Poll for readiness
            const checkReadiness = setInterval(async () => {
                try {
                    const ping = await fetch(`https://${cleanSubdomain}.namainvist.com/api/health`);
                    if (ping.ok) {
                        clearInterval(checkReadiness);
                        window.location.href = `https://${cleanSubdomain}.namainvist.com`; // Redirect to new ERP
                    }
                } catch {
                    // still booting...
                }
            }, 3000);

        } catch (err: any) {
            setError('طراز غير متوقع: ' + err.message);
            setStatus('IDLE');
        }
    };


    if (status === 'SUCCESS' || status === 'LOADING') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center font-cairo" dir="rtl">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                    <div className="mb-6 relative">
                        <div className="w-20 h-20 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {status === 'SUCCESS' ? 'تهيئة قاعدة البيانات جارية...' : 'جاري إنشاء المخدم الخاص بك...'}
                    </h2>
                    <p className="text-gray-500 mb-6 text-sm">
                        يرجى الانتظار لحوالي دقيقة، نحن نقوم الآن بإنشاء قاعدة بياناتك السحابية، وترجمة البيانات، وإصدار شهادة الحماية ليكون نظامك جاهزاً بإعدادات مؤسستك.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-cairo" dir="rtl">
            <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                        مرحباً بك في نما إنفست!
                    </h2>
                    <p className="mt-3 text-center text-sm text-gray-600">
                        لإكمال إعداد النظام المحاسبي السحابي الخاص بك، يرجى تعبئة التفاصيل بدقة. سيتم ترجمة الحقول المطلوبة باللغة الإنجليزية تلقائياً لتسهيل الأمر بفضل سياسة الصفر إنجليزي!
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">اسم الموقع (الدومين) الفرعي المطلوب *</label>
                            <div className="flex rounded-md shadow-sm">
                                <span className="inline-flex items-center px-4 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm dir-ltr">
                                    .namainvist.com
                                </span>
                                <input
                                    type="text"
                                    required
                                    className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-none rounded-l-md text-left dir-ltr focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                                    value={subdomain}
                                    placeholder="naidi"
                                    onChange={(e) => setSubdomain(e.target.value)}
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">حروف انجليزية وأرقام بدون فواصل.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">اسم المنشأة بالعربية *</label>
                            <input required type="text" className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={companyNameAr} onChange={e => setCompanyNameAr(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">مجال العمل / الصناعة بالعربية *</label>
                            <input required type="text" placeholder="مثال: متجر أدوات تجميل" className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={businessDomain} onChange={e => setBusinessDomain(e.target.value)} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">الرقم الضريبي (VAT) *</label>
                            <input required type="text" placeholder="3xxxxxxxxxxx003" maxLength={15} minLength={15} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={vatNumber} onChange={e => setVatNumber(e.target.value)} />
                            <p className="mt-1 text-xs text-gray-400">مثال: 311985620700003</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">رقم السجل التجاري (CRN) *</label>
                            <input required type="text" placeholder="7xxxxxxxxx" maxLength={10} minLength={10} className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={crnNumber} onChange={e => setCrnNumber(e.target.value)} />
                            <p className="mt-1 text-xs text-gray-400">يجب أن يبدأ بـ 7</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال *</label>
                            <input required type="text" className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={mobile} onChange={e => setMobile(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">اسم الفرع بالعربية *</label>
                            <input required type="text" placeholder="مثال: الفرع الرئيسي" className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={branchName} onChange={e => setBranchName(e.target.value)} />
                        </div>

                        <div className="md:col-span-2 grid grid-cols-4 gap-6">
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">المدينة *</label>
                                <input required type="text" className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={city} onChange={e => setCity(e.target.value)} />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">الحي</label>
                                <input type="text" className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={district} onChange={e => setDistrict(e.target.value)} />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">الشارع/العنوان *</label>
                                <input required type="text" className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={address} onChange={e => setAddress(e.target.value)} />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">رقم المبنى</label>
                                <input type="text" className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={buildingNo} onChange={e => setBuildingNo(e.target.value)} />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <div className="w-48">
                                <label className="block text-sm font-medium text-gray-700 mb-1">الرمز البريدي</label>
                                <input type="text" className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <button
                            type="submit"
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                        >
                            تأسيس قاعدة البيانات واستكمال التسجيل
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
