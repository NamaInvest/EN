'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

interface Booking { id: number; bookingNo: number; date: string; total: number; deposit: number; status: string; customer?: { name: string } }

export default function BookingsCalendarPage() {
 const { t } = useTranslation();
 const { error: toastError, success: toastSuccess } = useToast();
 const [bookings, setBookings] = useState<Booking[]>([]);
 const [currentDate, setCurrentDate] = useState(new Date());
 const router = useRouter();

 useEffect(() => {
 loadBookings();
 }, []);

 const loadBookings = async () => {
 const token = localStorage.getItem('token');
 if (!token) return;
 try {
 const r = await fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } });
 if (r.ok) setBookings(await r.json());
 } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
 };

 const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
 const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
 const today = () => setCurrentDate(new Date());

 const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
 const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

 const monthName = currentDate.toLocaleString('en-GB', { month: 'long', year: 'numeric' });
 const weekDays = [t('sys.str_1733'), t('sys.str_1734'), t('sys.str_1735'), t('sys.str_1736'), t('sys.str_1737'), t('sys.str_1738'), t('sys.str_1739')];

 const getBookingsForDay = (day: number) => {
 return bookings.filter(b => {
 const bDate = new Date(b.date);
 return bDate.getDate() === day && bDate.getMonth() === currentDate.getMonth() && bDate.getFullYear() === currentDate.getFullYear();
 });
 };

 const statusColor: Record<string, { bg: string, border: string, text: string }> = {
 pending: { bg: '#fef3c7', border: '#f59e0b', text: '#b45309' },
 confirmed: { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' },
 completed: { bg: '#dcfce7', border: '#22c55e', text: '#15803d' },
 invoiced: { bg: '#ede9fe', border: '#8b5cf6', text: '#6d28d9' },
 cancelled: { bg: '#fee2e2', border: '#ef4444', text: '#b91c1c' }
 };

 return (
 <>
 <div className="page-header flex justify-between items-center mb-6">
 <div>
 <h1 className="page-title text-2xl font-bold">{t('sys.str_1729')}</h1>
 <p className="text-slate-500 text-sm mt-1">{t('sys.str_1730')}</p>
 </div>
 <button onClick={() => router.push('/bookings')} className="btn bg-white border border-slate-200 shadow-sm hover:bg-slate-50">{t('sys.str_1731')}</button>
 </div>

 <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
 <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
 <div className="flex gap-2">
 <button onClick={prevMonth} className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100">&lt;</button>
 <button onClick={today} className="px-4 py-1 bg-white border border-slate-300 rounded font-bold hover:bg-slate-100">{t('sys.str_1732')}</button>
 <button onClick={nextMonth} className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100">&gt;</button>
 </div>
 <h2 className="text-xl font-bold text-slate-800">{monthName}</h2>
 </div>

 <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100 text-slate-600 font-bold text-center text-sm">
 {weekDays.map(d => <div key={d} className="p-3 border-l border-slate-200 last:border-0">{d}</div>)}
 </div>

 <div className="grid grid-cols-7 bg-slate-50">
 {Array.from({ length: firstDay }).map((_, i) => (
 <div key={`empty-${i}`} className="min-h-[120px] p-2 border-b border-l border-slate-200 opacity-50 bg-slate-100"></div>
 ))}
 
 {Array.from({ length: daysInMonth }).map((_, i) => {
 const day = i + 1;
 const dayBookings = getBookingsForDay(day);
 const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
 
 return (
 <div key={`day-${day}`} className={`min-h-[120px] p-2 border-b border-l border-slate-200 relative bg-white transition hover:bg-slate-50 ${isToday ? 'bg-blue-50/30' : ''}`}>
 <div className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mb-2 ${isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'}`}>
 {day}
 </div>
 <div className="space-y-1.5 overflow-y-auto max-h-[80px] custom-scrollbar">
 {dayBookings.map(b => {
 const theme = statusColor[b.status] || statusColor.pending;
 return (
 <div key={b.id} title={`العميل: ${b.customer?.name} | المبلغ: ${b.total}`} style={{ backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }} className="text-[10px] p-1.5 rounded border border-l-4 font-semibold shadow-sm truncate cursor-pointer hover:opacity-80 transition">
 #{b.bookingNo} {b.customer?.name}
 </div>
 );
 })}
 </div>
 </div>
 );
 })}

 {Array.from({ length: (7 - ((firstDay + daysInMonth) % 7)) % 7 }).map((_, i) => (
 <div key={`empty-end-${i}`} className="min-h-[120px] p-2 border-b border-l border-slate-200 opacity-50 bg-slate-100"></div>
 ))}
 </div>
 </div>
 <style jsx>{`
 .custom-scrollbar::-webkit-scrollbar { width: 4px; }
 .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
 .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
 `}</style>
 </>
 );
}
