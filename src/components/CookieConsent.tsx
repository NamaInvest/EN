import React, { useState, useEffect } from 'react';

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('pdpl_consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const acceptAll = async () => {
        // Here we would ideally POST to an API to save in PdplConsent model
        localStorage.setItem('pdpl_consent', 'all');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 w-full bg-gray-900 text-white p-4 shadow-lg z-50 flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
                <p className="text-sm">
                    نحن نستخدم ملفات تعريف الارتباط (Cookies) لتحسين تجربتك وفقاً لنظام حماية البيانات الشخصية (PDPL). 
                    بالضغط على "موافق"، أنت توافق على سياسة الخصوصية الخاصة بنا.
                </p>
            </div>
            <div className="flex gap-2">
                <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm">
                    تخصيص الخيارات
                </button>
                <button onClick={acceptAll} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold">
                    موافق
                </button>
            </div>
        </div>
    );
}
