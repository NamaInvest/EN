'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { 
 Briefcase, Plus, Users, Search, Target, CheckCircle, 
 Clock, AlertTriangle, ChevronRight, Edit3, Trash2
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function EnterpriseProjects() {
 const { t } = useTranslation();
 const { error: toastError, success: toastSuccess } = useToast();
 const router = useRouter();
 const [projects, setProjects] = useState<any[]>([]);
 const [customers, setCustomers] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [showModal, setShowModal] = useState(false);
 const [saving, setSaving] = useState(false);
 
 const [formData, setFormData] = useState({
 id: '', name: '', description: '', customerId: '', budget: '', startDate: '', endDate: '', status: 'ACTIVE'
 });

 useEffect(() => {
 fetchData();
 }, []);

 const fetchData = async () => {
 setLoading(true);
 try {
 const token = localStorage.getItem('token');
 const res = await fetch(`/api/enterprise/projects?search=${search}`, {
 headers: { Authorization: `Bearer ${token}` }
 });
 if (res.ok) {
 const data = await res.json();
 setProjects(data);
 }
 // Fetch customers for the dropdown
 const custRes = await fetch(`/api/customers`, {
 headers: { Authorization: `Bearer ${token}` }
 });
 if (custRes.ok) {
 const custData = await custRes.json();
 setCustomers(custData);
 }
 } catch (error: any) { toastError(error?.message || 'حدث خطأ'); } finally {
 setLoading(false);
 }
 };

 const handleSave = async (e: React.FormEvent) => {
 e.preventDefault();
 setSaving(true);
 const token = localStorage.getItem('token');
 const isUpdate = !!formData.id;

 try {
 const res = await fetch('/api/enterprise/projects', {
 method: isUpdate ? 'PUT' : 'POST',
 headers: { 
 'Content-Type': 'application/json',
 Authorization: `Bearer ${token}` 
 },
 body: JSON.stringify(formData)
 });

 if (res.ok) {
 setShowModal(false);
 fetchData();
 } else {
 alert(t('sys.str_1889'));
 }
 } catch (error) {
 alert(t('sys.str_1890'));
 } finally {
 setSaving(false);
 }
 };

 const handleDelete = async (id: number) => {
 if (!confirm(t('sys.str_1891'))) return;
 const token = localStorage.getItem('token');
 try {
 const res = await fetch(`/api/enterprise/projects?id=${id}`, {
 method: 'DELETE',
 headers: { Authorization: `Bearer ${token}` }
 });
 if (res.ok) {
 fetchData();
 }
 } catch (error) {
 alert(t('sys.str_446'));
 }
 };

 const getStatusColor = (status: string) => {
 switch (status) {
 case 'ACTIVE': return 'var(--primary)';
 case 'COMPLETED': return 'var(--success)';
 case 'ON_HOLD': return 'var(--warning)';
 default: return 'var(--text-muted)';
 }
 };

 return (
 <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
 {/* Header */}
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
 <div>
 <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
 <Briefcase size={28} color="var(--primary)" />
 {t('sys.str_1866')}</h1>
 <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
 {t('sys.str_1867')}</p>
 </div>
 <button 
 className="btn btn-primary"
 onClick={() => {
 setFormData({ id: '', name: '', description: '', customerId: '', budget: '', startDate: '', endDate: '', status: 'ACTIVE' });
 setShowModal(true);
 }}
 style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
 >
 <Plus size={20} />
 {t('sys.str_1868')}</button>
 </div>

 {/* Stats KPI */}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px', marginBottom: '30px' }}>
 <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
 <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', borderRadius: '12px' }}><Briefcase size={24} /></div>
 <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)' }}>{t('sys.str_1869')}</span>
 </div>
 <span style={{ fontSize: '28px', fontWeight: '900' }}>{projects.filter(p => p.status === 'ACTIVE').length}</span>
 </div>
 
 <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
 <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', borderRadius: '12px' }}><CheckCircle size={24} /></div>
 <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)' }}>{t('sys.str_1870')}</span>
 </div>
 <span style={{ fontSize: '28px', fontWeight: '900' }}>{projects.filter(p => p.status === 'COMPLETED').length}</span>
 </div>

 <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
 <div style={{ padding: '10px', background: 'rgba(234, 179, 8, 0.1)', color: '#EAB308', borderRadius: '12px' }}><Target size={24} /></div>
 <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-muted)' }}>{t('sys.str_1871')}</span>
 </div>
 <span style={{ fontSize: '28px', fontWeight: '900' }}>
 {projects.reduce((acc, p) => acc + (p.budget || 0), 0).toFixed(2)} SAR
 </span>
 </div>
 </div>

 {/* List */}
 {loading ? (
 <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('sys.str_1872')}</div>
 ) : (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
 {projects.map(project => (
 <div key={project.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', borderTop: `4px solid ${getStatusColor(project.status)}` }}>
 
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
 <div>
 <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '6px' }}>{project.name}</h3>
 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '13px' }}>
 <Users size={14} />
 {t('sys.str_1873')}{project.customer?.name || t('sys.str_1892')}
 </div>
 </div>
 <div style={{ display: 'flex', gap: '8px' }}>
 <button 
 className="btn btn-ghost btn-sm"
 onClick={() => { setFormData({...project, startDate: project.startDate?.split('T')[0] || '', endDate: project.endDate?.split('T')[0] || ''}); setShowModal(true); }}
 >
 <Edit3 size={16} />
 </button>
 <button 
 className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
 onClick={() => handleDelete(project.id)}
 >
 <Trash2 size={16} />
 </button>
 </div>
 </div>

 <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', flex: 1 }}>
 {project.description || t('sys.str_1893')}
 </p>

 <div style={{ background: 'var(--bg-body)', padding: '16px', borderRadius: '10px', marginBottom: '16px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
 <span style={{ color: 'var(--text-muted)' }}>{t('sys.str_1874')}</span>
 <span style={{ fontWeight: 'bold' }}>{project.budget.toFixed(2)} SAR</span>
 </div>
 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
 <span style={{ color: 'var(--text-muted)' }}>{t('sys.str_1875')}</span>
 <span style={{ fontWeight: 'bold', color: project.budgetHealth === 'danger' ? 'var(--danger)' : 'var(--success)' }}>
 {project.consumedBudget.toFixed(2)} SAR
 </span>
 </div>

 {/* Progress Bar */}
 <div style={{ height: '6px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
 <div style={{ 
 height: '100%', 
 width: `${Math.min(100, (project.consumedBudget / (project.budget || 1)) * 100)}%`,
 background: project.budgetHealth === 'danger' ? 'var(--danger)' : (project.budgetHealth === 'warning' ? 'var(--warning)' : 'var(--success)'),
 transition: 'width 1s ease'
 }} />
 </div>
 </div>

 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '12px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
 <Clock size={14} />
 {t('sys.str_1876')}{project.startDate ? new Date(project.startDate).toLocaleDateString('en-GB') : t('sys.str_1894')}
 </div>
 
 <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--primary)' }}>
 {t('sys.str_1877')}<ChevronRight size={14} />
 </button>
 <button className="btn btn-primary btn-sm" onClick={() => router.push(`/enterprise/projects/${project.id}`)} title={t('sys.str_1895')} style={{ padding: '6px' }}>
 {t('sys.str_1878')}</button>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Modal */}
 {showModal && (
 <div className="modal-overlay">
 <div className="modal-content" style={{ maxWidth: '600px', animation: 'slideUp 0.3s ease' }}>
 <div className="modal-header">
 <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>
 {formData.id ? t('sys.str_1896') : t('sys.str_1897')}
 </h2>
 <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
 </div>
 <div className="modal-body">
 <form onSubmit={handleSave}>
 <div className="grid-2">
 <div className="input-group">
 <label className="input-label">{t('sys.str_1879')}</label>
 <input 
 className="input" required placeholder={t('sys.str_1898')}
 value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
 />
 </div>
 <div className="input-group">
 <label className="input-label">{t('sys.str_1880')}</label>
 <select className="input" value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})}>
 <option value="">{t('sys.str_1881')}</option>
 {customers.map(c => (
 <option key={c.id} value={c.id}>{c.name}</option>
 ))}
 </select>
 </div>
 <div className="input-group" style={{ gridColumn: '1 / -1' }}>
 <label className="input-label">{t('sys.str_1882')}</label>
 <textarea 
 className="input" rows={3}
 value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
 />
 </div>
 <div className="input-group">
 <label className="input-label">{t('sys.str_1883')}</label>
 <input 
 className="input" type="number" required step="0.01" min="0" dir="ltr"
 value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})}
 />
 </div>
 <div className="input-group">
 <label className="input-label">{t('sys.str_1884')}</label>
 <select className="input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
 <option value="ACTIVE">{t('sys.str_1885')}</option>
 <option value="ON_HOLD">{t('sys.str_1886')}</option>
 <option value="COMPLETED">{t('sys.str_1887')}</option>
 </select>
 </div>
 <div className="input-group">
 <label className="input-label">{t('sys.str_1860')}</label>
 <input 
 className="input" type="date"
 value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
 />
 </div>
 <div className="input-group">
 <label className="input-label">{t('sys.str_1888')}</label>
 <input 
 className="input" type="date"
 value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
 />
 </div>
 </div>

 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
 <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>{t('fin.str_206')}</button>
 <button type="submit" className="btn btn-primary" disabled={saving}>
 {saving ? t('sys.str_852') : t('sys.str_1899')}
 </button>
 </div>
 </form>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
