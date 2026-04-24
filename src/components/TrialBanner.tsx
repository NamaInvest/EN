'use client';

import { useEffect, useState } from 'react';

export default function TrialBanner() {
    const [trialInfo, setTrialInfo] = useState<any>(null);

    useEffect(() => {
        fetch('/api/tenant/trial-status')
            .then(res => res.json())
            .then(data => {
                if (data.isTrialActive) {
                    setTrialInfo(data);
                }
            })
            .catch(() => {});
    }, []);

    if (!trialInfo || !trialInfo.isTrialActive) {
        return null;
    }

    const { daysRemaining, invoicesRemaining, isExpired } = trialInfo;

    if (isExpired) {
        return (
            <div className="bg-red-600 font-Noto Sans Arabic text-white px-4 py-2 text-center text-sm font-bold z-50">
                🛑 انتهت الفترة التجريبية الخاصة بك أو رصيد الفواتير المجانية المسموح. يرجى الاشتراك في إحدى باقاتنا للاستمرار في استخدام النظام بأمان!
                <a href="https://namainvist.com/pricing" className="mr-3 underline decoration-white">الاشتراك الآن</a>
            </div>
        );
    }

    return (
        <div className="bg-amber-100 border-b border-amber-300 font-Noto Sans Arabic text-amber-900 px-4 py-2 text-center text-sm font-semibold z-50">
            ⏳ النظام في الفترة التجريبية — متبقي {daysRemaining} أيام، ولديك رصيد {invoicesRemaining} فاتورة مجانية. 
            <a href="https://namainvist.com/pricing" className="bg-amber-600 text-white rounded px-2 py-1 mr-4 text-xs hover:bg-amber-700 transition">
                قم بالترقية الآن 🚀
            </a>
        </div>
    );
}
