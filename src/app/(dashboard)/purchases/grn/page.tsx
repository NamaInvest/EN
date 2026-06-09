'use client';
import { useState, useEffect } from 'react';
import { Box, Plus, CheckCircle, Package, RefreshCw, Eye } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePagePermission } from '@/lib/usePagePermission';

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
  const allowed = usePagePermission(['purchase_grn', 'grn', 'purchases']);
  const { error: toastError, success: toastSuccess } = useToast();
  const [grns, setGrns] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [poList, setPoList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewDetailsGrn, setViewDetailsGrn] = useState<any | null>(null);

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
  const supplierIdWatch = watch('supplierId');

  useEffect(() => {
    if (allowed) {
      loadData();
    }
  }, [allowed]);

  // Fetch approved POs when supplier changes
  useEffect(() => {
    if (supplierIdWatch) {
      fetchPurchaseOrders(supplierIdWatch);
    } else {
      setPoList([]);
    }
  }, [supplierIdWatch]);

  // Check for PO redirect params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPoId = params.get('poId');
    if (urlPoId && allowed) {
      const token = localStorage.getItem('token') || '';
      fetch(`/api/purchase-orders/${urlPoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(async (po) => {
          if (po && po.id) {
            // Load suppliers list if not loaded yet
            if (suppliers.length === 0) {
              const sRes = await fetch('/api/customers?type=1', { headers: { Authorization: `Bearer ${token}` } });
              if (sRes.ok) setSuppliers(await sRes.json());
            }
            // Populate form values
            setValue('supplierId', po.supplierId.toString());
            await fetchPurchaseOrders(po.supplierId.toString());

            const grnItems = (po.details || []).map((d: any) => ({
              productId: d.productId.toString(),
              productName: d.productName || d.product?.name || '',
              quantity: Number(d.quantity) || 0,
              acceptedQty: Number(d.quantity) || 0,
              rejectedQty: 0,
              batchNumber: '',
              productionDate: '',
              expiryDate: ''
            }));

            reset({
              supplierId: po.supplierId.toString(),
              orderId: po.id.toString(),
              stockId: '1',
              notes: `مستند استلام البضائع لأمر الشراء #${po.orderNo}`,
              items: grnItems
            });
            setShowModal(true);
          }
        })
        .catch(() => {});
    }
  }, [allowed, suppliers.length]);

  async function fetchPurchaseOrders(sId: string) {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/purchase-orders?status=approved&supplierId=${sId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setPoList(json.data || []);
      }
    } catch (e) {}
  }

  const handlePOChange = (poId: string) => {
    setValue('orderId', poId);
    if (!poId) return;
    const selectedPo = poList.find(x => x.id.toString() === poId.toString());
    if (selectedPo && selectedPo.details) {
      const grnItems = selectedPo.details.map((d: any) => ({
        productId: d.productId.toString(),
        productName: d.productName || d.product?.name || '',
        quantity: Number(d.quantity) || 0,
        acceptedQty: Number(d.quantity) || 0,
        rejectedQty: 0,
        batchNumber: '',
        productionDate: '',
        expiryDate: ''
      }));
      reset({
        supplierId: selectedPo.supplierId.toString(),
        orderId: poId,
        stockId: '1',
        notes: `مستند استلام البضائع لأمر الشراء #${selectedPo.orderNo}`,
        items: grnItems
      });
    }
  };

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
      const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36);

      const res = await fetch('/api/purchases/grn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-idempotency-key': idempotencyKey
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toastSuccess('تم الحفظ بنجاح');
        closeAndReset();
        loadData();
      } else {
        const errorData = await res.json();
        toastError(errorData.error || t('purchases.str_2266'));
      }
    } catch (e) {
      toastError('حدث خطأ');
    }
  };

  if (allowed === null) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center font-[Fira_Sans]">
        <div className="text-center space-y-4">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin mx-auto" />
          <p className="text-slate-500 font-bold">جاري التحقق من صلاحيات الوصول...</p>
        </div>
      </div>
    );
  }

  if (allowed === false) return null;

  return (<>
    <div className="page-header"><h1 className="page-title">{t('purchases.str_2241')}</h1></div>

    <div className="page-content animate-fade-in font-[Fira_Sans]">
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
                <td>
                  <span style={{
                    padding: '6px 12px',
                    backgroundColor: g.status === 'pending_qc' ? '#f59e0b20' : '#10b98120',
                    color: g.status === 'pending_qc' ? '#f59e0b' : '#10b981',
                    borderRadius: '20px',
                    fontSize: '12px'
                  }}>
                    <CheckCircle size={12} style={{display:'inline', marginRight:'4px'}}/>
                    {g.status === 'pending_qc' ? 'بانتظار فحص الجودة' : t('purchases.str_2249')}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => setViewDetailsGrn(g)} className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 8px' }}>
                      <Eye size={12} style={{display:'inline', marginRight:'4px'}}/> {t('purchases.str_2250') || 'عرض'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Detail View Modal */}
    {viewDetailsGrn && (
      <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
        <div className="modal" style={{ maxWidth: '800px', width: '95%', backgroundColor: 'var(--bg-card, white)', borderRadius: '12px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>تفاصيل مستند الاستلام GRN-{viewDetailsGrn.grnNo}</h2>
            <button onClick={() => setViewDetailsGrn(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', fontSize: '14px' }}>
            <div><strong>المورد:</strong> {viewDetailsGrn.supplier?.name || '-'}</div>
            <div><strong>المستودع:</strong> {viewDetailsGrn.stock?.name || '-'}</div>
            <div><strong>تاريخ الاستلام:</strong> {new Date(viewDetailsGrn.date).toLocaleDateString('en-GB')}</div>
            <div><strong>المستلم:</strong> {viewDetailsGrn.receiver?.fullName || '-'}</div>
            {viewDetailsGrn.order?.orderNo && <div><strong>أمر الشراء المرتبط:</strong> PO-{viewDetailsGrn.order.orderNo}</div>}
            <div style={{ gridColumn: 'span 2' }}><strong>ملاحظات:</strong> {viewDetailsGrn.notes || '--'}</div>
          </div>
          <h4>البنود والمواد المستلمة:</h4>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>الصنف المطلوب</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>الكمية</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>المقبولة</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>المرفوضة</th>
                </tr>
              </thead>
              <tbody>
                {viewDetailsGrn.details?.map((item: any) => (
                  <tr key={item.id}>
                    <td>{item.product?.name || item.productName || 'صنف غير معروف'}</td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'center', color: '#10b981', fontWeight: 'bold' }}>{item.acceptedQty}</td>
                    <td style={{ textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>{item.rejectedQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button onClick={() => setViewDetailsGrn(null)} className="btn btn-outline">إغلاق</button>
          </div>
        </div>
      </div>
    )}

    {/* Create Modal */}
    {showModal && (
      <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
        <div className="modal animate-scale-in" style={{ maxWidth: '900px', width: '95%', backgroundColor: 'var(--bg-card, white)', borderRadius: '12px', padding: '24px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
          <h2>{t('purchases.str_2252')}</h2>
          <form onSubmit={handleSubmit(handleCreate)} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
              <div className="input-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
                <label className="input-label">{t('purchases.str_2253')}</label>
                <select className="input" {...register('supplierId')}>
                  <option value="">{t('sys.str_1498')}</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errors.supplierId && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.supplierId.message}</p>}
              </div>

              <div className="input-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
                <label className="input-label">أمر الشراء المرتبط</label>
                <select className="input" {...register('orderId')} onChange={(e) => handlePOChange(e.target.value)}>
                  <option value="">اختر أمر الشراء (اختياري)</option>
                  {poList.map(po => (
                    <option key={po.id} value={po.id}>PO-{po.orderNo} (الإجمالي: {po.total} SAR)</option>
                  ))}
                </select>
                {errors.orderId && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.orderId.message}</p>}
              </div>

              <div className="input-group" style={{ margin: 0, flex: 1, minWidth: '200px' }}>
                <label className="input-label">{t('purchases.str_2254')}</label>
                <select className="input" {...register('stockId')}>
                  {stocks.length > 0 ? stocks.map(s => <option key={s.id} value={s.id}>{s.name}</option>) : <option value="1">{t('sys.str_753')}</option>}
                </select>
                {errors.stockId && <p style={{color: '#ef4444', fontSize: '12px', margin: 0}}>{errors.stockId.message}</p>}
              </div>
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">ملاحظات المستند</label>
              <input type="text" className="input" placeholder="ملاحظات تظهر في مستند الاستلام..." {...register('notes')} />
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
