'use client';
import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';

const DAYS_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function CalendarPage() {
  const { lang: language } = useTranslation();
  const isAr = language === 'ar';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events] = useState<Record<string, { title: string; color: string }[]>>({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div style={{ padding: 24, direction: isAr ? 'rtl' : 'ltr' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>{isAr ? '📅 التقويم' : '📅 Calendar'}</h1>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#f8f9fa' }}>
          <button onClick={prev} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>◀</button>
          <h2 style={{ margin: 0, fontSize: 18 }}>{isAr ? MONTHS_AR[month] : currentDate.toLocaleString('en', { month: 'long' })} {year}</h2>
          <button onClick={next} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>▶</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {(isAr ? DAYS_AR : DAYS_EN).map(d => (
            <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontWeight: 700, fontSize: 12, color: '#888', background: '#fafafa', borderBottom: '1px solid #eee' }}>{d}</div>
          ))}
          {cells.map((day, i) => {
            const key = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
            const isToday = key === today;
            const dayEvents = events[key] || [];
            return (
              <div key={i} style={{ minHeight: 80, padding: 6, borderBottom: '1px solid #f0f0f0', borderLeft: '1px solid #f0f0f0', background: isToday ? '#E3F2FD' : day ? '#fff' : '#fafafa' }}>
                {day && (
                  <>
                    <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? '#1565C0' : '#333', marginBottom: 4 }}>{day}</div>
                    {dayEvents.map((ev, j) => (
                      <div key={j} style={{ background: ev.color + '20', color: ev.color, fontSize: 10, padding: '2px 4px', borderRadius: 3, marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{ev.title}</div>
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
