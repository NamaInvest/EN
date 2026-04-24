'use client';
import React from 'react';
import { useTranslation } from "@/lib/i18n";

export default function OfflineFallback() {
    const { t } = useTranslation();
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', fontFamily: 'Noto Sans Arabic, sans-serif', backgroundColor: '#0B0E14', color: '#FFF' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{t('sys.str_4008')}</h1>
      <p style={{ fontSize: '1.2rem', color: '#A0AEC0' }}>{t('sys.str_4009')}</p>
    </div>
  );
}

