'use client';
import { useState, useEffect } from 'react';
import { Mail, Plus, ShieldCheck, Inbox } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const itemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  productName: z.string(),
  quantity: z.number().min(0.1, 'Quantity must be positive'),
  targetPrice: z.number().optional().nullable()
});

const formSchema = z.object({
  supplierId: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'At least one item is required')
});

type FormValues = z.infer<typeof formSchema>;

export default function RequestForQuotationPage() {
  const { t } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const { register, handleSubmit, control, setValue, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierId: '',
      dueDate: '',
      notes: '',
      items: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const itemsWatch = watch('items');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || '';
      const [rRes, sRes, pRes] = await Promise.all([
        fetch('/api/purchases/rfq', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/customers?type=1', { headers: { Authorization: `Bearer ${token}` } }), // suppliers
        fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (rRes.ok) setRfqs(await rRes.json());
      if (sRes.ok) setSuppliers(await sRes.json());
      if (pRes.ok) setProducts(await pRes.json());
    } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
    setLoading(false);
  }

  const closeAndReset = () => {
    setShowModal(false);
    reset({ supplierId: '', dueDate: '', notes: '', items: [] });
  };

  const addItem = () => append({ productId: '', productName: '', quantity: 1, targetPrice: null });

  const handleProductChange = (index: number, productId: string) => {
    setValue(`items.${index}.productId`, productId);
    const p = products.find(x => x.id.toString() === productId.toString());
    if (p) setValue(`items.${index}.productName`, p.name);
  };

  const handleCreate = async (data: FormValues) => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/purchases/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toastSuccess('تم الإنشاء بنجاح');
        closeAndReset();
        loadData();
      } else {
        toastError(t('purchases.str_2349'));
      }
    } catch (e) {
      toastError('حدث خطأ');
    }
  };

  const statusBadge = (s: string) => {
    if (s === 'draft') return <span style={{ padding: '6px 12px', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '20px', fontSize: '12px' }}><Inbox size={12} style={{display:'inline', marginRight:'4px'}}/> {t('purchases.str_2325')}</span>;
    if (s === 'sent') return <span style={{ padding: '6px 12px', backgroundColor: '#3b82f620', color: '#3b82f6', borderRadius: '20px', fontSize: '12px' }}><Mail size={12} style={{display:'inline', marginRight:'4px'}}/> {t('purchases.str_2326')}</span>;
    if (s === 'received') return <span style={{ padding: '6px 12px', backgroundColor: '#10b98120', color: '#10b981', borderRadius: '20px', fontSize: '12px' }}><ShieldCheck size={12} style={{display:'inline', marginRight:'4px'}}/> {t('purchases.str_2327')}</span>;
    if (s === 'closed') return <span style={{ padding: '6px 12px', backgroundColor: '#ef444420', color: '#ef4444', borderRadius: '20px', fontSize: '12px' }}>{t('purchases.str_2328')}</span>;
    return <span>{s}</span>;
  }

  return (<>
    <div className="page-header"><h1 className="page-title">{t('purchases.str_2329')}</h1></div>
    
    <div className="page-content animate-fade-in">
      <div className="toolbar">
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('purchases.str_2330')}</span>
        <div className="toolbar-spacer" />
        <button onClick={() => setShowModal(true)} className="primary-btn">
          <Plus size={16} /> {t('purchases.str_2331')}
        </button>
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>{t('purchases.str_2332')}</th>
              <th>{t('sys.str_2103')}</th>
              <th>{t('purchases.str_2333')}</th>
              <th>{t('purchases.str_2334')}</th>
              <th>{t('purchases.str_2307')}</th>
              <th>{t('purchases.str_2247')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>{t('sys.str_168')}</td></tr> : rfqs.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>{t('purchases.str_2335')}</td></tr> : rfqs.map(r => (
              <tr key={r.id}>
                <td><strong style={{color: '#6366f1'}}>RFQ-{r.rfqNo}</strong></td>
                <td>{new Date(r.date).toLocaleDateString('en-GB')}</td>
                <td>{r.supplier?.name || <span style={{color: 'var(--text-muted)'}}>{t('purchases.str_2336')}</span>}</td>
                <td>{r.dueDate ? new Date(r.dueDate).toLocaleDateString('en-GB') : t('purchases.str_2350')}</td>
                <td>{statusBadge(r.status)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px' }}>{t('purchases.str_2337')}</button>
                    {r.status === 'draft' && <button className="btn" style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#3b82f6', color: 'white' }}>{t('purchases.str_2338')}</button>}
                    {r.status === 'received' && <button className="btn" style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#10b981', color: 'white' }}>{t('purchases.str_2339')}</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Create Modal */}
    {showModal && (
      <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
        <div className="modal animate-scale-in bg-white" style={{ maxWidth: '850px', width: '95%', borderRadius: '12px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
          <h2>{t('purchases.str_2340')}</h2>
          <form onSubmit={handleSubmit(handleCreate)} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="input-group" style={{ margin: 0, flex: 1 }}>
                <label className="input-label">{t('purchases.str_2341')}</label>
                <select className="input" {...register('supplierId')}>
                  <option value="">{t('purchases.str_2342')}</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.phone || '-'})</option>)}
                </select>
                {errors.supplierId && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.supplierId.message}</p>}
              </div>
              <div className="input-group" style={{ margin: 0, flex: 1 }}>
                <label className="input-label">{t('purchases.str_2343')}</label>
                <input type="date" className="input" {...register('dueDate')} />
                {errors.dueDate && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.dueDate.message}</p>}
              </div>
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">{t('purchases.str_2344')}</label>
              <input className="input" {...register('notes')} placeholder={t('purchases.str_2351')} />
            </div>
            
            <div style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h4>{t('purchases.str_2345')}</h4>
                <button type="button" onClick={addItem} className="btn btn-outline" style={{fontSize: '12px'}}>{t('purchases.str_2256')}</button>
              </div>
              {errors.items?.root && <p style={{color: '#ef4444', fontSize: '12px'}}>{errors.items.root.message}</p>}
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', marginTop: '10px', minWidth: '600px' }}>
                  <thead>
                    <tr>
                      <th>{t('sys.str_801')}</th>
                      <th style={{width: '120px'}}>{t('purchases.str_2317')}</th>
                      <th style={{width: '150px'}}>{t('purchases.str_2346')}</th>
                      <th style={{width: '50px'}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={field.id}>
                        <td>
                          <select className="input" value={itemsWatch[index]?.productId || ''} onChange={e => handleProductChange(index, e.target.value)}>
                            <option value="">{t('purchases.str_2347')}</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          {errors.items?.[index]?.productId && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.items[index]?.productId?.message}</p>}
                        </td>
                        <td>
                          <input type="number" min="0.1" step="any" className="input" {...register(`items.${index}.quantity`)} />
                          {errors.items?.[index]?.quantity && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.items[index]?.quantity?.message}</p>}
                        </td>
                        <td>
                          <input type="number" step="any" className="input" {...register(`items.${index}.targetPrice`)} placeholder={t('purchases.str_2352')} />
                        </td>
                        <td>
                          <button type="button" onClick={() => remove(index)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>✖</button>
                        </td>
                      </tr>
                    ))}
                    {fields.length === 0 && <tr><td colSpan={4} style={{textAlign:'center', color:'var(--text-muted)'}}>{t('purchases.str_2348')}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={closeAndReset} className="btn btn-outline">{t('fin.str_206')}</button>
              <button type="submit" className="btn btn-primary">{t('purchases.str_2320')}</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>);
}
