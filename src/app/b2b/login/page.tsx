'use client';

import { useState } from 'react';

export default function B2BLoginPage() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setError('');
        try {
            const res = await fetch('/api/b2b/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                window.location.href = '/b2b/shop';
            } else {
                setError(data.error || 'فشل تسجيل الدخول');
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '100px auto', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '20px', textAlign: 'center', color: '#333' }}>تسجيل دخول الوكلاء</h1>
            <input 
                type="text" 
                placeholder="رقم الجوال المسجل لدينا" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '8px' }}
                dir="ltr"
            />
            <input 
                type="password" 
                placeholder="كلمة المرور (إن وجدت)" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '8px' }}
                dir="ltr"
            />
            {error && <div style={{ color: '#e74c3c', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>{error}</div>}
            <button 
                onClick={handleLogin}
                style={{ width: '100%', padding: '15px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', transition: '0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#2980b9'}
                onMouseOut={e => e.currentTarget.style.background = '#3498db'}
            >
                دخول البوابة
            </button>
        </div>
    );
}
