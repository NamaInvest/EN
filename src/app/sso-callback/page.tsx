'use client';

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: 'white',
        fontFamily: 'Cairo, sans-serif',
      }}
      dir="rtl"
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #6366f1',
          borderTop: '4px solid transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{ color: '#94a3b8', fontWeight: 'bold' }}>جاري التحقق من الحساب...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
