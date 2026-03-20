import React from 'react';

export default function OfflineFallback() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', fontFamily: 'Cairo, sans-serif', backgroundColor: '#0B0E14', color: '#FFF' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>أنت غير متصل بالإنترنت</h1>
      <p style={{ fontSize: '1.2rem', color: '#A0AEC0' }}>يرجى التحقق من اتصال الشبكة وسيعاود النظام المزامنة فوراً.</p>
    </div>
  );
}
