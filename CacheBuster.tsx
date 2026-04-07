
'use client';
import { useEffect } from 'react';

export default function CacheBuster() {
    useEffect(() => {
        // Very obvious cache buster so user sees if new code loaded
        console.log("CACHE BUSTER LOADED: VERSION 999");
        if (!localStorage.getItem('alerted_v999')) {
            alert("N2 System Updated! If you see this, cache is broken. Click OK.");
            localStorage.setItem('alerted_v999', '1');
        }
    }, []);
    return null;
}
