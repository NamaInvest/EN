'use client';

import { useEffect } from 'react';

export default function SessionGuard() {
    useEffect(() => {
        // Check for ERP token in localStorage or cookie
        const token = localStorage.getItem('token') || 
            document.cookie.split(';').find(c => c.trim().startsWith('token='));
        
        if (!token) {
            // No session → redirect to login
            window.location.href = '/login';
        }
    }, []);

    return null;
}
