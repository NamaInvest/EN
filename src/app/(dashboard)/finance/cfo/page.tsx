'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { 
 LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { Activity, DollarSign, Percent, AlertCircle, RefreshCw } from 'lucide-react';
const _t = (ar: string, en: string) => ar; // i18n helper

export default function CFODashboardPage() {
 const { t } = useTranslation();
 const { success, error } = useToast();
 const [data, setData] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [generatingECL, setGeneratingECL] = useState(false);

 useEffect(() => { loadData(); }, []);

 async function loadData() {
 setLoading(true);
 try {
 const token = localStorage.getItem('token') || '';
 const res = await fetch('/api/finance/cfo-dashboard', {
 headers: { Authorization: `Bearer ${token}` }
 });
 const responseData = await res.json();
 if (res.ok) {
 setData(responseData);
 } else {
 setData({ _error: responseData.error || 'فشل في جلب البيانات' });
 }
 } catch (e) {
 console.error(e);
 setData({ _error: 'تعذر الاتصال بالخادم' });
 }
 setLoading(false);
 }

 const handleAutoECL = async () => {
 if (!confirm('سيتم إنشاء مخصص ديون مشكوك فيها آلياً بناءً على أعمار الديون (+90 يوماً). هل أنت متأكد؟')) return;
 setGeneratingECL(true);
 try {
 const token = localStorage.getItem('token') || '';
 const res = await fetch('/api/finance/auto-ecl', {
 method: 'POST',
 headers: { Authorization: `Bearer ${token}` }
 });
 const d = await res.json();
 if (res.ok) {
 success(d.message);
 if (d.provisionAmount > 0) {
 // refresh data
 loadData();
 }
 } else {
 error(d.error || 'حدث خطأ أثناء التوليد');
 }
 } catch (e) {
 error('Network error');
 }
 setGeneratingECL(false);
 };

 if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>جاري تحميل لوحة القيادة...</div>;
 if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>فشل في جلب البيانات</div>;
 if (data._error) return (
 <div style={{ padding: '40px', textAlign: 'center', marginTop: '50px' }}>
 <AlertCircle size={48} color="#ef4444" style={{ marginBottom: '20px' }} />
 <h2 style={{ color: '#ef4444' }}>غير مصرح</h2>
 <p>{data._error}</p>
 </div>
 );

 const { kpis, agingData, cashFlowTrend, budgetVsActual } = data;

 return (
 <>
 <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <h1 className="page-title">CFO Command Center (لوحة تحكم المدير المالي)</h1>
 <div style={{ display: 'flex', gap: '10px' }}>
 <button className="btn btn-outline" onClick={loadData}><RefreshCw size={16} style={{display:'inline', marginRight:'5px'}} /> تحديث</button>
 <button className="btn btn-primary" onClick={handleAutoECL} disabled={generatingECL} style={{ backgroundColor: '#6366f1' }}>
 <AlertCircle size={16} style={{display:'inline', marginRight:'5px'}} /> {generatingECL ? 'جاري التوليد...' : 'توليد مخصص الديون (Auto-ECL)'}
 </button>
 </div>
 </div>

 <div className="page-content animate-fade-in">
 {/* KPIs Layer */}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
 <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: parseFloat(kpis.currentRatio) < 1 ? '4px solid #ef4444' : '4px solid #10b981' }}>
 <div style={{ padding: '15px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '12px' }}>
 <Activity size={24} />
 </div>
 <div>
 <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>Current Ratio (نسبة التداول)</p>
 <h3 style={{ margin: '5px 0 0 0', fontSize: '24px', color: parseFloat(kpis.currentRatio) < 1 ? '#ef4444' : '#10b981' }}>{kpis.currentRatio}</h3>
 </div>
 </div>

 <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: parseFloat(kpis.quickRatio) < 1 ? '4px solid #f59e0b' : '4px solid #10b981' }}>
 <div style={{ padding: '15px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '12px' }}>
 <DollarSign size={24} />
 </div>
 <div>
 <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>Quick Ratio (نسبة السيولة)</p>
 <h3 style={{ margin: '5px 0 0 0', fontSize: '24px' }}>{kpis.quickRatio}</h3>
 </div>
 </div>

 <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '4px solid #3b82f6' }}>
 <div style={{ padding: '15px', backgroundColor: '#eff6ff', color: '#3b82f6', borderRadius: '12px' }}>
 <Percent size={24} />
 </div>
 <div>
 <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>{_t('هامش صافي الربح', 'Net Profit Margin')}</p>
 <h3 style={{ margin: '5px 0 0 0', fontSize: '24px', color: '#3b82f6' }}>{kpis.netProfitMargin}%</h3>
 </div>
 </div>

 <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: parseFloat(kpis.dso) > 60 ? '4px solid #ef4444' : '4px solid #10b981' }}>
 <div style={{ padding: '15px', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '12px' }}>
 <AlertCircle size={24} />
 </div>
 <div>
 <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>DSO (متوسط تحصيل الديون)</p>
 <h3 style={{ margin: '5px 0 0 0', fontSize: '24px', color: parseFloat(kpis.dso) > 60 ? '#ef4444' : '#10b981' }}>{kpis.dso} <span style={{fontSize:'14px'}}>يوم</span></h3>
 </div>
 </div>
 </div>

 {/* Charts Layer */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
 <div className="card">
 <h3 style={{ marginBottom: '20px', fontSize: '16px', color: 'var(--text-muted)' }}>أعمار الديون (AR Aging) - IFRS 9</h3>
 <div style={{ height: '300px', width: '100%' }}>
 <ResponsiveContainer>
 <BarChart data={agingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
 <XAxis dataKey="name" axisLine={false} tickLine={false} />
 <YAxis axisLine={false} tickLine={false} />
 <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
 <Bar dataKey="value" radius={[4, 4, 0, 0]}>
 {agingData.map((entry: any, index: number) => (
 <Cell key={'cell-' + index} fill={entry.fill} />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="card">
 <h3 style={{ marginBottom: '20px', fontSize: '16px', color: 'var(--text-muted)' }}>التدفقات النقدية (Cash Flow Trend)</h3>
 <div style={{ height: '300px', width: '100%' }}>
 <ResponsiveContainer>
 <LineChart data={cashFlowTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
 <XAxis dataKey="name" axisLine={false} tickLine={false} />
 <YAxis axisLine={false} tickLine={false} />
 <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
 <Legend iconType="circle" />
 <Line type="monotone" name="تدفقات داخلة (In)" dataKey="in" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
 <Line type="monotone" name="تدفقات خارجة (Out)" dataKey="out" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>

 <div className="card">
 <h3 style={{ marginBottom: '20px', fontSize: '16px', color: 'var(--text-muted)' }}>مقارنة الموازنة بالأداء الفعلي (Budget vs Actual)</h3>
 <div style={{ height: '300px', width: '100%' }}>
 <ResponsiveContainer>
 <BarChart data={budgetVsActual} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
 <XAxis dataKey="name" axisLine={false} tickLine={false} />
 <YAxis axisLine={false} tickLine={false} />
 <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
 <Legend iconType="circle" />
 <Bar dataKey="budget" name="الموازنة المعتمدة" fill="#93c5fd" radius={[4, 4, 0, 0]} />
 <Bar dataKey="actual" name="الفعلي" fill="#3b82f6" radius={[4, 4, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 </div>
 </>
 );
}
