'use client';
import { useState, useEffect } from 'react';
import { Box, Plus, CheckCircle, Package } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const itemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  productName: z.string(),
  quantity: z.number().min(0.1, 'Quantity must be positive'),
  acceptedQty: z.number().min(0, 'Accepted quantity must be positive'),
  rejectedQty: z.number().min(0, 'Rejected quantity must be positive'),
  batchNumber: z.string().optional().nullable(),
  productionDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable()
});

const formSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  orderId: z.string().optional().nullable(),
  stockId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1, 'At least one item is required')
});

type FormValues = z.infer<typeof formSchema>;

export default function GoodsReceiptNotePage() {
  const { t } = useTranslation();
  const { error: toastError, success: toastSuccess } = useToast();
  const [grns, setGrns] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const { register, handleSubmit, control, setValue, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierId: '',
      orderId: '',
      stockId: '1',
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
      const [gRes, sRes, pRes, stRes] = await Promise.all([
        fetch('/api/purchases/grn', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/customers?type=1', { headers: { Authorization: `Bearer ${token}` } }), // suppliers
        fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/warehouses', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (gRes.ok) setGrns(await gRes.json());
      if (sRes.ok) setSuppliers(await sRes.json());
      if (pRes.ok) setProducts(await pRes.json());
      if (stRes.ok) setStocks(await stRes.json());
    } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
    setLoading(false);
  }

  const closeAndReset = () => {
    setShowModal(false);
    reset({ supplierId: '', orderId: '', stockId: '1', notes: '', items: [] });
  };

  const addItem = () => append({ productId: '', productName: '', quantity: 1, acceptedQty: 1, rejectedQty: 0, batchNumber: '', productionDate: '', expiryDate: '' });

  const handleProductChange = (index: number, productId: string) => {
    setValue(`items.${index}.productId`, productId);
    const p = products.find(x => x.id.toString() === productId.toString());
    if (p) setValue(`items.${index}.productName`, p.name);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    setValue(`items.${index}.quantity`, quantity);
    setValue(`items.${index}.acceptedQty`, quantity);
    setValue(`items.${index}.rejectedQty`, 0);
  };

  const handleAcceptedQtyChange = (index: number, acceptedQty: number) => {
    setValue(`items.${index}.acceptedQty`, acceptedQty);
    const qty = itemsWatch[index]?.quantity || 0;
    const rej = qty - acceptedQty;
    setValue(`items.${index}.rejectedQty`, rej > 0 ? rej : 0);
  };

  const handleCreate = async (data: FormValues) => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/purchases/grn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toastSuccess('تم الحفظ بنجاح');
        closeAndReset();
        loadData();
      } else {
        toastError(t('purchases.str_2266'));
      }
    } catch (e) {
      toastError('حدث خطأ');
    }
  };

  return (<>
    <div className="page-header"><h1 className="page-title">{t('purchases.str_2241')}</h1></div>
    
    <div className="page-content animate-fade-in">
      <div className="toolbar">
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('purchases.str_2242')}</span>
        <div className="toolbar-spacer" />
        <button onClick={() => setShowModal(true)} className="primary-btn">
          <Plus size={16} /> {t('purchases.str_2243')}
        </button>
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>{t('sys.str_1045')}</th>
              <th>{t('purchases.str_2244')}</th>
              <th>{t('sys.str_953')}</th>
              <th>{t('sys.str_2227')}</th>
              <th>{t('purchases.str_2245')}</th>
              <th>{t('purchases.str_2246')}</th>
              <th>{t('purchases.str_2247')}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>{t('sys.str_168')}</td></tr> : grns.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>{t('purchases.str_2248')}</td></tr> : grns.map(g => (
              <tr key={g.id}>
                <td><strong style={{color: '#6366f1'}}>GRN-{g.grnNo}</strong></td>
                <td>{new Date(g.date).toLocaleDateString('en-GB')}</td>
                <td>{g.supplier?.name || '-'}</td>
                <td>{g.stock?.name || t('purchases.str_2267')}</td>
                <td>{g.receiver?.fullName || '-'}</td>
                <td><span style={{ padding: '6px 12px', backgroundColor: '#10b98120', color: '#10b981', borderRadius: '20px', fontSize: '12px' }}><CheckCircle size={12} style={{display:'inline', marginRight:'4px'}}/> {t('purchases.str_2249')}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px' }}>{t('purchases.str_2250')}</button>
                    <button className="btn" style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: '#3b82f6', color: 'white' }}>{t('purchases.str_2251')}</button>
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
        <div className="modal animate-scale-in" style={{ maxWidth: '900px', width: '95%', backgroundColor: 'var(--bg-card, white)', borderRadius: '12px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
          <h2>{t('purchases.str_2252')}</h2>
          <form onSubmit={handleSubmit(handleCreate)} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div className="input-group" style={{ margin: 0, flex: 1 }}>
                <label className="input-label">{t('purchases.str_2253')}</label>
                <select className="input" {...register('supplierId')}>
                  <option value="">{t('sys.str_1498')}</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errors.supplierId && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.supplierId.message}</p>}
              </div>
              <div className="input-group" style={{ margin: 0, flex: 1 }}>
                <label className="input-label">{t('purchases.str_2254')}</label>
                <select className="input" {...register('stockId')}>
                  {stocks.length > 0 ? stocks.map(s => <option key={s.id} value={s.id}>{s.name}</option>) : <option value="1">{t('sys.str_753')}</option>}
                </select>
                {errors.stockId && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.stockId.message}</p>}
              </div>
            </div>
            
            <div style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '8px' }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h4>{t('purchases.str_2255')}</h4>
                <button type="button" onClick={addItem} className="btn btn-outline" style={{fontSize: '12px'}}>{t('purchases.str_2256')}</button>
              </div>
              {errors.items?.root && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.items.root.message}</p>}
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', marginTop: '10px', minWidth: '700px' }}>
                  <thead>
                    <tr>
                      <th>{t('purchases.str_2257')}</th>
                      <th style={{width: '90px'}}>{t('purchases.str_2258')}</th>
                      <th style={{width: '90px'}}>{t('purchases.str_2259')}</th>
                      <th style={{width: '80px'}}>{t('purchases.str_2260')}</th>
                      <th style={{width: '120px'}}>رقم الدفعة (Batch)</th>
                      <th style={{width: '130px'}}>تاريخ الإنتاج</th>
                      <th style={{width: '130px'}}>تاريخ الانتهاء</th>
                      <th style={{width: '40px'}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={field.id}>
                        <td>
                          <select className="input" value={itemsWatch[index]?.productId || ''} onChange={e => handleProductChange(index, e.target.value)}>
                            <option value="">{t('purchases.str_2262')}</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          {errors.items?.[index]?.productId && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.items[index]?.productId?.message}</p>}
                        </td>
                        <td>
                          <input type="number" min="0.1" step="any" className="input" value={itemsWatch[index]?.quantity || ''} onChange={e => handleQuantityChange(index, parseFloat(e.target.value))} />
                          {errors.items?.[index]?.quantity && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.items[index]?.quantity?.message}</p>}
                        </td>
                        <td>
                          <input type="number" step="any" className="input" style={{ borderColor: '#10b981' }} value={itemsWatch[index]?.acceptedQty || ''} onChange={e => handleAcceptedQtyChange(index, parseFloat(e.target.value))} />
                        </td>
                        <td>
                          <input type="number" step="any" className="input" value={itemsWatch[index]?.rejectedQty || 0} readOnly style={{ backgroundColor: '#ef444410', color: '#ef4444' }} />
                        </td>
                        <td>
                          <input type="text" className="input" placeholder="اختياري" {...register(`items.${index}.batchNumber`)} />
                        </td>
                        <td>
                          <input type="date" className="input" {...register(`items.${index}.productionDate`)} />
                        </td>
                        <td>
                          <input type="date" className="input" {...register(`items.${index}.expiryDate`)} />
                        </td>
                        <td>
                          <button type="button" onClick={() => remove(index)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '5px' }}>✖</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={closeAndReset} className="btn btn-outline">{t('purchases.str_2263')}</button>
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#10b981' }}><Package size={16} style={{display:'inline', marginRight:'5px'}}/> {t('purchases.str_2264')}</button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>);
}
