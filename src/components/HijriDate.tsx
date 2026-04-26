'use client';
import { useEffect, useState } from 'react';

/**
 * HijriDate Component — عرض التاريخ الهجري في الـ Header
 * يعمل client-side فقط لتجنب hydration mismatch
 */
export default function HijriDate() {
  const [hijriText, setHijriText] = useState('');

  useEffect(() => {
    const MONTHS = [
      'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
      'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
      'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];

    const now = new Date();
    const gd = now.getTime();
    const julianDay = Math.floor(gd / 86400000) + 2440587.5;

    const l = Math.floor(julianDay) - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719)
      + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
    const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
      - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const hMonth = Math.floor((24 * l3) / 709);
    const hDay = l3 - Math.floor((709 * hMonth) / 24);
    const hYear = 30 * n + j - 30;

    const greg = now.toLocaleDateString('en-GB');
    setHijriText(`${greg} — ${hDay} ${MONTHS[hMonth - 1] || ''} ${hYear} هـ`);
  }, []);

  if (!hijriText) return null;

  return (
    <span style={{
      fontSize: '12px',
      color: 'var(--text-muted)',
      fontFamily: "'Noto Sans Arabic', sans-serif",
      whiteSpace: 'nowrap',
    }}>
      📅 {hijriText}
    </span>
  );
}
