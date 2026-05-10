import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.hijri.ts' });

/**
 * Hijri Date Converter — التاريخ الهجري
 * تحويل التاريخ الميلادي إلى هجري باستخدام خوارزمية Kuwaiti
 */

const ARABIC_MONTHS = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

interface HijriDate {
  year: number;
  month: number;
  day: number;
  monthName: string;
  dayName: string;
}

/**
 * تحويل تاريخ ميلادي إلى هجري (خوارزمية Kuwaiti المعدلة)
 */
export function toHijri(date: Date = new Date()): HijriDate {
  const d = date.getDate();
  const m = date.getMonth();
  const y = date.getFullYear();
  const dayOfWeek = date.getDay();

  let jd = Math.floor((11 * y + 3) / 30) + 354 * y + 30 * m
    - Math.floor((m - 1) / 2) + d + 1948440 - 385;

  if (m < 2) {
    // no adjustment needed
  } else if (m < 8) {
    jd -= Math.floor((m + 1) / 2);
  } else {
    jd -= Math.floor(m / 2);
  }

  // Recalculate using the standard formula
  const gd = date.getTime();
  const julianDay = Math.floor(gd / 86400000) + 2440587.5;

  // Hijri calculation from Julian Day
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

  return {
    year: hYear,
    month: hMonth,
    day: hDay,
    monthName: ARABIC_MONTHS[hMonth - 1] || '',
    dayName: ARABIC_DAYS[dayOfWeek] || '',
  };
}

/**
 * تنسيق التاريخ الهجري كنص
 * مثال: "29 شوال 1448"
 */
export function formatHijri(date: Date = new Date()): string {
  const h = toHijri(date);
  return `${h.day} ${h.monthName} ${h.year}`;
}

/**
 * تنسيق مزدوج (هجري + ميلادي)
 * مثال: "26/04/2026 — 29 شوال 1448"
 */
export function formatDualDate(date: Date = new Date()): string {
  const gregorian = date.toLocaleDateString('en-GB'); // DD/MM/YYYY
  const hijri = formatHijri(date);
  return `${gregorian} — ${hijri}`;
}

/**
 * تنسيق التاريخ الهجري بالأرقام فقط
 * مثال: "29/10/1448"
 */
export function formatHijriNumeric(date: Date = new Date()): string {
  const h = toHijri(date);
  return `${h.day.toString().padStart(2, '0')}/${h.month.toString().padStart(2, '0')}/${h.year}`;
}
