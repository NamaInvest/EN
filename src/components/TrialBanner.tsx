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
            <div className="bg-red-600 font-Lateef text-white px-4 py-2 text-center text-sm font-bold z-50">
                ًں›‘ ط§ظ†طھظ‡طھ ط§ظ„ظپطھط±ط© ط§ظ„طھط¬ط±ظٹط¨ظٹط© ط§ظ„ط®ط§طµط© ط¨ظƒ ط£ظˆ ط±طµظٹط¯ ط§ظ„ظپظˆط§طھظٹط± ط§ظ„ظ…ط¬ط§ظ†ظٹط© ط§ظ„ظ…ط³ظ…ظˆط­. ظٹط±ط¬ظ‰ ط§ظ„ط§ط´طھط±ط§ظƒ ظپظٹ ط¥ط­ط¯ظ‰ ط¨ط§ظ‚ط§طھظ†ط§ ظ„ظ„ط§ط³طھظ…ط±ط§ط± ظپظٹ ط§ط³طھط®ط¯ط§ظ… ط§ظ„ظ†ط¸ط§ظ… ط¨ط£ظ…ط§ظ†!
                <a href="https://namainvist.com/pricing" className="mr-3 underline decoration-white">ط§ظ„ط§ط´طھط±ط§ظƒ ط§ظ„ط¢ظ†</a>
            </div>
        );
    }

    return (
        <div className="bg-amber-100 border-b border-amber-300 font-Lateef text-amber-900 px-4 py-2 text-center text-sm font-semibold z-50">
            âڈ³ ط§ظ„ظ†ط¸ط§ظ… ظپظٹ ط§ظ„ظپطھط±ط© ط§ظ„طھط¬ط±ظٹط¨ظٹط© â€” ظ…طھط¨ظ‚ظٹ {daysRemaining} ط£ظٹط§ظ…طŒ ظˆظ„ط¯ظٹظƒ ط±طµظٹط¯ {invoicesRemaining} ظپط§طھظˆط±ط© ظ…ط¬ط§ظ†ظٹط©. 
            <a href="https://namainvist.com/pricing" className="bg-amber-600 text-white rounded px-2 py-1 mr-4 text-xs hover:bg-amber-700 transition">
                ظ‚ظ… ط¨ط§ظ„طھط±ظ‚ظٹط© ط§ظ„ط¢ظ† ًںڑ€
            </a>
        </div>
    );
}

