'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Megaphone, Plus, Send, Eye, TrendingUp, Edit3, Trash2, Users, CheckCircle, Mail, MessageSquare, Share2 } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const statusColors: any = { DRAFT: '#94A3B8', SCHEDULED: '#3B82F6', ACTIVE: '#22C55E', PAUSED: '#EAB308', COMPLETED: '#8B5CF6' };

const formSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, 'الاسم مطلوب'),
    type: z.string().min(1, 'النوع مطلوب'),
    budget: z.any(),
    targetCount: z.any(),
    description: z.string().optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable()
});

type FormValues = z.infer<typeof formSchema>;

export default function CrmCampaigns() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { error: toastError, success: toastSuccess } = useToast();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
          name: '',
          type: 'EMAIL',
          budget: '',
          targetCount: '',
          description: ''
      }
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const t = localStorage.getItem('token');
      const r = await fetch('/api/crm/campaigns', { headers: { Authorization: `Bearer ${t}` } });
      if (r.ok) setCampaigns(await r.json());
    } catch (e: any) { toastError(e?.message); } finally { setLoading(false); }
  };

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    const t = localStorage.getItem('token');
    try {
      const payload = {
        ...data,
        budget: data.budget ? Number(data.budget) : 0,
        targetCount: data.targetCount ? Number(data.targetCount) : 0
      };
      
      const r = await fetch('/api/crm/campaigns', {
        method: data.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify(payload)
      });
      if (r.ok) { 
          toastSuccess('تم الحفظ'); 
          setShowModal(false); 
          reset();
          fetchData(); 
      }
    } catch (e: any) { 
        toastError(e?.message); 
    } finally {
        setSaving(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm('حذف؟')) return;
    await fetch(`/api/crm/campaigns?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    fetchData();
  };

  const openModal = (campaign?: any) => {
      if (campaign) {
          setValue('id', campaign.id);
          setValue('name', campaign.name || '');
          setValue('type', campaign.type || 'EMAIL');
          setValue('budget', campaign.budget || '');
          setValue('targetCount', campaign.targetCount || '');
          setValue('description', campaign.description || '');
          setValue('startDate', campaign.startDate?.split('T')[0] || '');
          setValue('endDate', campaign.endDate?.split('T')[0] || '');
      } else {
          reset({
              name: '',
              type: 'EMAIL',
              budget: '',
              targetCount: '',
              description: ''
          });
      }
      setShowModal(true);
  };

  const tot = campaigns.reduce((a, c) => a + (c.budget || 0), 0);
  const sent = campaigns.reduce((a, c) => a + (c.sentCount || 0), 0);
  const conv = campaigns.reduce((a, c) => a + (c.convertCount || 0), 0);

  return (
    <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}><Megaphone size={28} color="var(--primary)" /> الحملات التسويقية</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>إدارة الحملات عبر جميع القنوات</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Plus size={20} /> حملة جديدة</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { icon: Megaphone, label: 'الحملات', value: campaigns.length, color: '#3B82F6' },
          { icon: Send, label: 'المرسل', value: sent, color: '#8B5CF6' },
          { icon: TrendingUp, label: 'التحويل', value: `${sent > 0 ? ((conv/sent)*100).toFixed(1) : 0}%`, color: '#22C55E' },
          { icon: Eye, label: 'الميزانية', value: `${tot.toLocaleString()} SAR`, color: '#EAB308' }
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ padding: '10px', background: k.color+'15', color: k.color, borderRadius: '12px' }}><k.icon size={22} /></div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{k.label}</span>
            </div>
            <span style={{ fontSize: '26px', fontWeight: '900' }}>{k.value}</span>
          </div>
        ))}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>جاري التحميل...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))', gap: '20px' }}>
          {campaigns.map(c => (
            <div key={c.id} className="card" style={{ padding: '20px', borderTop: `4px solid ${statusColors[c.status]}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 'bold', marginBottom: '4px' }}>{c.name}</h3>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '12px', background: (statusColors[c.status]||'#94A3B8')+'20', color: statusColors[c.status], fontWeight: '700' }}>{c.status}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openModal(c)}><Edit3 size={15} /></button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => del(c.id)}><Trash2 size={15} /></button>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', background: 'var(--bg-body)', padding: '12px', borderRadius: '10px' }}>
                {[{ l: 'مستهدف', v: c.targetCount }, { l: 'مرسل', v: c.sentCount }, { l: 'مفتوح', v: c.openCount }, { l: 'محوّل', v: c.convertCount }].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}><div style={{ fontSize: '16px', fontWeight: '800' }}>{s.v}</div><div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{s.l}</div></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay"><div className="modal-content" style={{ maxWidth: '550px', animation: 'slideUp 0.3s ease' }}>
          <div className="modal-header"><h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>تعديل / حملة جديدة</h2><button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button></div>
          <div className="modal-body"><form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid-2">
              <div className="input-group">
                  <label className="input-label">الاسم *</label>
                  <input className={`input ${errors.name ? 'border-red-500' : ''}`} {...register('name')} />
                  {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name.message}</span>}
              </div>
              <div className="input-group">
                  <label className="input-label">النوع</label>
                  <select className="input" {...register('type')}>
                      <option value="EMAIL">بريد</option>
                      <option value="SMS">{_t('SMS', 'SMS')}</option>
                      <option value="WHATSAPP">واتساب</option>
                      <option value="SOCIAL">سوشل</option>
                      <option value="EVENT">فعالية</option>
                  </select>
              </div>
              <div className="input-group">
                  <label className="input-label">الميزانية</label>
                  <input className="input" type="number" step="0.01" dir="ltr" {...register('budget')} />
              </div>
              <div className="input-group">
                  <label className="input-label">المستهدف</label>
                  <input className="input" type="number" dir="ltr" {...register('targetCount')} />
              </div>
              <div className="input-group" style={{ gridColumn: '1/-1' }}>
                  <label className="input-label">الوصف</label>
                  <textarea className="input" rows={2} {...register('description')} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
            </div>
          </form></div>
        </div></div>
      )}
    </div>
  );
}
