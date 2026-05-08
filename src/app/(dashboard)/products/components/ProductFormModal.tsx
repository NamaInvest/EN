'use client';

import React, { useState, useRef } from 'react';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { z } from 'zod';
import { Form, FormField, FormSelect, FormTextarea } from '@/components/forms';
import { useFormContext } from 'react-hook-form';

export const productUnitSchema = z.object({
  unitId: z.string().min(1, 'الوحدة مطلوبة'),
  barcode: z.string().optional(),
  sellPrice: z.coerce.number().min(0).default(0),
  buyPrice: z.coerce.number().min(0).default(0),
  factor: z.coerce.number().min(1).default(1),
  unitStock: z.coerce.number().min(0).default(0),
  parentQty: z.coerce.number().min(0.001).default(12),
  parentUnitId: z.string().optional(),
  length: z.string().optional(),
  width: z.string().optional(),
  weight: z.string().optional()
});

export const productSchema = z.object({
  name: z.string().min(2, 'الاسم مطلوب'),
  nameEn: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.string().min(1, 'التصنيف مطلوب'),
  unitId: z.string().min(1, 'الوحدة الأساسية مطلوبة'),
  buyPrice: z.coerce.number().min(0, 'يجب أن يكون أكبر من أو يساوي 0'),
  sellPrice: z.coerce.number().min(0, 'يجب أن يكون أكبر من أو يساوي 0'),
  taxRate: z.coerce.number().default(15),
  taxType: z.string().default('VAT'),
  minQuantity: z.coerce.number().min(0).default(0),
  currentStock: z.coerce.number().min(0).default(0),
  description: z.string().optional(),
  sellByWeight: z.boolean().default(false),
  sizeInfo: z.string().optional(),
  addVat: z.boolean().default(true),
  expiryDate: z.string().optional(),
  binLocation: z.string().optional()
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormInnerProps {
  categories: any[];
  units: any[];
  formUnits: any[];
  setFormUnits: (v: any) => void;
  showAddCategory: boolean;
  setShowAddCategory: (v: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (v: string) => void;
  handleAddCategory: (setValue: any) => void;
  savingCategory: boolean;
  showAddBaseUnit: boolean;
  setShowAddBaseUnit: (v: boolean) => void;
  newBaseUnitName: string;
  setNewBaseUnitName: (v: string) => void;
  handleAddBaseUnit: (setValue: any) => void;
  savingBaseUnit: boolean;
  handleTransliterate: (val: string, setValue: any) => void;
  handleGenerateBarcode: (setValue: any) => void;
  showAddUnit: boolean;
  setShowAddUnit: (v: boolean) => void;
  newUnitName: string;
  setNewUnitName: (v: string) => void;
  handleAddUnit: () => void;
  savingUnit: boolean;
  imagePreview: string;
  editProduct: any;
  setImageFile: (f: File | null) => void;
  setImagePreview: (url: string) => void;
  saving: boolean;
  onClose: () => void;
}

function ProductFormInner({
  categories, units, formUnits, setFormUnits, showAddCategory, setShowAddCategory,
  newCategoryName, setNewCategoryName, handleAddCategory, savingCategory,
  showAddBaseUnit, setShowAddBaseUnit, newBaseUnitName, setNewBaseUnitName,
  handleAddBaseUnit, savingBaseUnit, handleTransliterate, handleGenerateBarcode,
  showAddUnit, setShowAddUnit, newUnitName, setNewUnitName, handleAddUnit, savingUnit,
  imagePreview, editProduct, setImageFile, setImagePreview, saving, onClose
}: ProductFormInnerProps) {
  const { watch, setValue } = useFormContext<ProductFormValues>();
  const { t } = useTranslation();

  const addVat = watch('addVat');
  const buyPrice = watch('buyPrice') || 0;
  const sellPrice = watch('sellPrice') || 0;
  const taxRate = watch('taxRate') || 15;
  const sellByWeight = watch('sellByWeight');

  return (
    <div className="space-y-4 px-2">
      <div className="grid-2">
        <div className="input-group">
          <FormField 
            name="name" 
            label={t('sys.str_856')} 
            placeholder={t('sys.str_919')} 
            onChange={(e: any) => {
              const val = e.target.value;
              setValue('name', val);
              handleTransliterate(val, setValue);
            }} 
          />
        </div>
        <div className="input-group">
          <FormField name="nameEn" label={t('sys.str_888')} placeholder="Product Name" dir="ltr" />
        </div>
        <div className="input-group">
          <label className="input-label font-medium">{t('sys.str_857')}</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
            <div className="flex-1">
              <FormField name="barcode" label="" placeholder={t('sys.str_400')} dir="ltr" />
            </div>
            <button
              type="button"
              className="btn btn-primary h-10 px-4 mt-1"
              onClick={() => handleGenerateBarcode(setValue)}
              title={t('sys.str_920')}
            >
              {t('sys.str_401')}
            </button>
          </div>
        </div>
        
        <div className="input-group">
          <label className="input-label font-medium">{t('sys.str_875')}</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
            <div className="flex-1">
              <FormSelect 
                name="categoryId" 
                label=""
                options={[
                  { label: t('sys.str_889'), value: '' },
                  ...categories.map(c => ({ label: c.name, value: c.id.toString() }))
                ]}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary h-10 px-3 mt-1"
              onClick={() => { setShowAddCategory(!showAddCategory); setNewCategoryName(''); }}
              title={t('sys.str_921')}
            >
              {showAddCategory ? '✕' : '➕'}
            </button>
          </div>
          {showAddCategory && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
              <input
                className="input flex-1"
                placeholder={t('sys.str_922')}
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(setValue); } }}
                autoFocus
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleAddCategory(setValue)}
                disabled={savingCategory || !newCategoryName.trim()}
              >
                {savingCategory ? '⏳' : t('sys.str_923')}
              </button>
            </div>
          )}
        </div>

        <div className="input-group">
          <label className="input-label font-medium">الوحدة الأساسية</label>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
            <div className="flex-1">
              <FormSelect 
                name="unitId" 
                label=""
                options={[
                  { label: '-- اختر الوحدة --', value: '' },
                  ...units.map((u: any) => ({ label: u.name, value: u.id.toString() }))
                ]}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary h-10 px-3 mt-1"
              onClick={() => { setShowAddBaseUnit(!showAddBaseUnit); setNewBaseUnitName(''); }}
              title="إضافة وحدة جديدة"
            >
              {showAddBaseUnit ? '✕' : '➕'}
            </button>
          </div>
          {showAddBaseUnit && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center' }}>
              <input
                className="input flex-1"
                placeholder="اسم الوحدة الجديدة (مثال: كيلو)"
                value={newBaseUnitName}
                onChange={e => setNewBaseUnitName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddBaseUnit(setValue); } }}
                autoFocus
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleAddBaseUnit(setValue)}
                disabled={savingBaseUnit || !newBaseUnitName.trim()}
              >
                {savingBaseUnit ? '⏳' : 'حفظ'}
              </button>
            </div>
          )}
        </div>

        <div className="input-group">
          <FormField name="buyPrice" type="number" step="0.01" label={t('sys.str_785')} placeholder="0.00" dir="ltr" />
          {addVat && buyPrice > 0 && (
            <div className="text-xs text-green-600 mt-1 font-bold">
              {t('sys.str_890')}{(buyPrice * (1 + taxRate / 100)).toFixed(2)} {t('sys.str_68')}
            </div>
          )}
        </div>
        <div className="input-group">
          <FormField name="sellPrice" type="number" step="0.01" label={t('sys.str_877')} placeholder="0.00" dir="ltr" />
          {addVat && sellPrice > 0 && (
            <div className="text-xs text-green-600 mt-1 font-bold">
              {t('sys.str_890')}{(sellPrice * (1 + taxRate / 100)).toFixed(2)} {t('sys.str_68')}
            </div>
          )}
        </div>

        <div className="input-group">
          <FormField name="minQuantity" type="number" label={t('sys.str_893')} dir="ltr" />
        </div>
        <div className="input-group">
          <FormField name="currentStock" type="number" label={t('sys.str_894')} dir="ltr" />
        </div>
        <div className="input-group">
          <FormField name="binLocation" label={t('sys.str_895')} placeholder={t('sys.str_924')} dir="ltr" />
        </div>
        <div className="input-group">
          <FormField name="expiryDate" type="date" label={t('sys.str_432')} dir="ltr" />
        </div>

        <div className="input-group flex flex-col gap-2 justify-center mt-6">
          <FormField name="sellByWeight" type="checkbox" label="يباع بالوزن (ميزان)" className="font-bold text-sm" />
        </div>
        {sellByWeight && (
          <div className="input-group">
            <FormField name="sizeInfo" label="الوزن الافتراضي (اختياري - KG)" placeholder="مثال: 1.5" dir="ltr" />
          </div>
        )}
      </div>

      <div className="col-span-full mt-4 p-4 border rounded-xl bg-gray-50">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <label className="text-base font-bold text-primary m-0">{t('sys.str_4265')}</label>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAddUnit(!showAddUnit)}>
              {showAddUnit ? t('sys.str_771') : t('sys.str_4272')}
            </button>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setFormUnits([...formUnits, { unitId: '', barcode: '', sellPrice: '', buyPrice: '', factor: '1', unitStock: '0', parentQty: '12', parentUnitId: '', length: '', width: '' }])}>
            {t('sys.str_4266')}
          </button>
        </div>
        
        {showAddUnit && (
          <div className="flex gap-2 mb-4 items-center bg-white p-3 rounded-lg border">
            <input
              className="input flex-1"
              placeholder={t('sys.str_4273')}
              value={newUnitName}
              onChange={e => setNewUnitName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddUnit(); } }}
              autoFocus
            />
            <button type="button" className="btn btn-primary btn-sm whitespace-nowrap" onClick={handleAddUnit} disabled={savingUnit || !newUnitName.trim()}>
              {savingUnit ? '⏳' : t('sys.str_4274')}
            </button>
          </div>
        )}

        {formUnits.length === 0 ? (
          <div className="text-sm text-gray-500">{t('sys.str_4267')}</div>
        ) : (
          <div className="flex flex-col gap-4">
            {formUnits.map((fu, idx) => {
              const prevUnits = formUnits.slice(0, idx);
              const parentName = fu.parentUnitId
                ? (units.find((u: any) => u.id === parseInt(fu.parentUnitId))?.name || 'وحدة')
                : 'حبة (أساسية)';
              return (
                <div key={idx} className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-primary">
                      📦 وحدة #{idx + 1}
                      {fu.unitId && units.find((u:any) => u.id === parseInt(fu.unitId))
                        ? ` — ${units.find((u:any) => u.id === parseInt(fu.unitId))?.name}`
                        : ''}
                    </span>
                    <button type="button" className="text-red-500 hover:bg-red-50 p-1 rounded" onClick={() => {
                      const newArr = formUnits.filter((_, i) => i !== idx); setFormUnits(newArr);
                    }}>🗑️</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block font-bold">🏷️ اسم الوحدة</label>
                      <select className="input w-full p-2" value={fu.unitId} onChange={e => {
                        const newArr = [...formUnits]; newArr[idx].unitId = e.target.value; setFormUnits(newArr);
                      }}>
                        <option value="">-- اختر --</option>
                        {units.map((u:any) => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1 block font-bold">📊 كم عندي</label>
                      <input className="input w-full p-2" type="number" min="0" placeholder="0" value={fu.unitStock ?? '0'} onChange={e => {
                        const newArr = [...formUnits]; newArr[idx].unitStock = e.target.value; setFormUnits(newArr);
                      }} />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block font-bold">🔢 التعبئة ({parentName})</label>
                      <div className="flex gap-1 items-center flex-wrap">
                        <input className="input flex-1 min-w-[60px] p-2" type="number" min="0.001" step="any" placeholder="12" value={fu.parentQty ?? '12'} onChange={e => {
                          const newArr = [...formUnits]; newArr[idx].parentQty = e.target.value; setFormUnits(newArr);
                        }} />
                        {prevUnits.length > 0 && (
                          <select className="input flex-1 min-w-[80px] p-2 text-xs" value={fu.parentUnitId || ''} onChange={e => {
                            const newArr = [...formUnits]; newArr[idx].parentUnitId = e.target.value; setFormUnits(newArr);
                          }}>
                            <option value="">حبة (أساسية)</option>
                            {prevUnits.map((pu, pi) => {
                              const pUnit = units.find((u:any) => u.id === parseInt(pu.unitId));
                              return pUnit ? <option key={pi} value={pu.unitId}>{pUnit.name}</option> : null;
                            })}
                          </select>
                        )}
                        <div className="w-full flex gap-1 mt-1">
                          <input className="input flex-1 p-2 text-xs" type="number" step="any" placeholder="الوزن (كجم)" value={fu.weight || ''} onChange={e => {
                            const newArr = [...formUnits]; newArr[idx].weight = e.target.value;
                            if (newArr[idx].weight && !newArr[idx].length) newArr[idx].parentQty = newArr[idx].weight;
                            setFormUnits(newArr);
                          }} />
                          <input className="input flex-1 p-2 text-xs" type="number" step="any" placeholder="الطول" value={fu.length || ''} onChange={e => {
                            const newArr = [...formUnits]; newArr[idx].length = e.target.value;
                            if (newArr[idx].length && newArr[idx].width) newArr[idx].parentQty = (parseFloat(newArr[idx].length) * parseFloat(newArr[idx].width)).toFixed(3);
                            setFormUnits(newArr);
                          }} />
                          <input className="input flex-1 p-2 text-xs" type="number" step="any" placeholder="العرض" value={fu.width || ''} onChange={e => {
                            const newArr = [...formUnits]; newArr[idx].width = e.target.value;
                            if (newArr[idx].length && newArr[idx].width) newArr[idx].parentQty = (parseFloat(newArr[idx].length) * parseFloat(newArr[idx].width)).toFixed(3);
                            setFormUnits(newArr);
                          }} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1 block font-bold">💰 سعر البيع</label>
                      <input className="input w-full p-2" type="number" step="0.01" value={fu.sellPrice} onChange={e => {
                        const newArr = [...formUnits]; newArr[idx].sellPrice = e.target.value; setFormUnits(newArr);
                      }} />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1 block font-bold">🛒 سعر الشراء</label>
                      <input className="input w-full p-2" type="number" step="0.01" value={fu.buyPrice ?? ''} onChange={e => {
                        const newArr = [...formUnits]; newArr[idx].buyPrice = e.target.value; setFormUnits(newArr);
                      }} />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block font-bold">🔖 باركود (اختياري)</label>
                      <input className="input w-full p-2" dir="ltr" value={fu.barcode} onChange={e => {
                        const newArr = [...formUnits]; newArr[idx].barcode = e.target.value; setFormUnits(newArr);
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="col-span-full mt-4 p-4 border rounded-xl bg-gray-50">
        <label className="text-sm font-bold text-primary mb-2 block">📷 صورة الصنف</label>
        <div className="flex gap-4 items-center flex-wrap">
          {(imagePreview || editProduct?.imagePath) && (
            <img
              src={imagePreview || editProduct?.imagePath}
              alt="صورة الصنف"
              className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setImageFile(file);
                  const reader = new FileReader();
                  reader.onloadend = () => setImagePreview(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
              className="text-sm"
            />
            <div className="text-xs text-gray-500 mt-1">PNG, JPG أو WEBP — الحد الأقصى 2MB</div>
          </div>
          {imagePreview && (
            <button type="button" className="btn btn-ghost btn-sm text-red-500" onClick={() => { setImageFile(null); setImagePreview(''); }}>
              🗑️ إزالة
            </button>
          )}
        </div>
      </div>

      <div className="col-span-full">
        <FormTextarea name="description" label={t('fin.str_212')} placeholder={t('sys.str_925')} rows={2} />
      </div>

      <div className="modal-footer sticky bottom-0 bg-white border-t pt-4 mt-6">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'جاري الحفظ...' : t('sys.str_455')}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>{t('fin.str_206')}</button>
      </div>
    </div>
  );
}

interface ProductFormModalProps {
  editProduct: any | null;
  categories: any[];
  units: any[];
  onClose: () => void;
  onSaved: () => void;
  fetchCategories: () => void;
  fetchUnits: () => void;
}

export default function ProductFormModal({
  editProduct,
  categories,
  units,
  onClose,
  onSaved,
  fetchCategories,
  fetchUnits
}: ProductFormModalProps) {
  const { t } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();

  const [saving, setSaving] = useState(false);
  const [formUnits, setFormUnits] = useState<any[]>(editProduct?.productUnits ? editProduct.productUnits.map((u: any) => ({
    id: u.id, unitId: u.unitId?.toString(),
    barcode: u.barcode || '', sellPrice: u.sellPrice?.toString() || '0',
    buyPrice: u.buyPrice?.toString() || '0', factor: u.factor?.toString() || '1',
    unitStock: u.unitStock?.toString() || '0',
    parentQty: u.parentQty?.toString() || '12',
    parentUnitId: u.parentUnitId?.toString() || '',
    sortOrder: u.sortOrder?.toString() || '0',
  })) : []);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const [showAddUnit, setShowAddUnit] = useState(false);
  const [newUnitName, setNewUnitName] = useState('');
  const [savingUnit, setSavingUnit] = useState(false);
  const [showAddBaseUnit, setShowAddBaseUnit] = useState(false);
  const [newBaseUnitName, setNewBaseUnitName] = useState('');
  const [savingBaseUnit, setSavingBaseUnit] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(editProduct?.imagePath || '');

  const handleAddCategory = async (setValue: any) => {
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        await fetchCategories();
        setValue('categoryId', created.id.toString());
        setNewCategoryName('');
        setShowAddCategory(false);
      }
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
    finally { setSavingCategory(false); }
  };

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) return;
    setSavingUnit(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newUnitName.trim() }),
      });
      if (res.ok) {
        await fetchUnits();
        setNewUnitName('');
        setShowAddUnit(false);
      }
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
    finally { setSavingUnit(false); }
  };

  const handleAddBaseUnit = async (setValue: any) => {
    if (!newBaseUnitName.trim()) return;
    setSavingBaseUnit(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newBaseUnitName.trim() }),
      });
      if (res.ok) {
        const created = await res.json();
        await fetchUnits();
        setValue('unitId', created.id.toString());
        setNewBaseUnitName('');
        setShowAddBaseUnit(false);
      }
    } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
    finally { setSavingBaseUnit(false); }
  };

  const handleGenerateBarcode = async (setValue: any) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings/generate-barcode', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setValue('barcode', data.barcode);
      } else {
        setValue('barcode', '1000');
      }
    } catch { setValue('barcode', '1000'); }
  };

  const handleTransliterate = async (val: string, setValue: any) => {
    if (val.trim()) {
      fetch('/api/transliterate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: val }) })
        .then(r => r.json())
        .then(d => { if (d.result) setValue('nameEn', d.result); })
        .catch(() => {});
    } else {
      setValue('nameEn', '');
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    setSaving(true);
    const token = localStorage.getItem('token');
    const url = editProduct ? `/api/products/${editProduct.id}` : '/api/products';
    const method = editProduct ? 'PUT' : 'POST';
    try {
      // Upload image first if exists
      let imagePath = editProduct?.imagePath || '';
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const upRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (upRes.ok) {
          const upData = await upRes.json();
          imagePath = upData.url;
        }
      }

      // Sync custom product units with validation
      const safeProductUnits = formUnits.filter(u => u.unitId).map(u => {
        const parsed = productUnitSchema.safeParse(u);
        return parsed.success ? parsed.data : null;
      }).filter(Boolean);

      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...data, imagePath, productUnits: safeProductUnits }),
      });
      if (res.ok) { 
        toastSuccess('✅ تم الحفظ بنجاح');
        onSaved();
      } else {
        const errData = await res.json().catch(() => ({}));
        toastError(`❌ ${errData.error || 'حدث خطأ في الحفظ'}`);
      }
    } catch (err: any) { toastError(`❌ ${err?.message || 'حدث خطأ'}`); }
    finally { setSaving(false); }
  };

  const defaultValues: Partial<ProductFormValues> = editProduct ? {
    name: editProduct.name, barcode: editProduct.barcode || '', categoryId: editProduct.categoryId?.toString() || '',
    unitId: editProduct.unitId?.toString() || '1', buyPrice: editProduct.buyPrice || 0,
    sellPrice: editProduct.sellPrice || 0, taxRate: editProduct.taxRate || 15,
    minQuantity: editProduct.minQuantity || 0, currentStock: editProduct.currentStock || 0,
    description: editProduct.description || '', nameEn: editProduct.nameEn || '', sellByWeight: editProduct.sellByWeight || false, sizeInfo: editProduct.sizeInfo || '',
    addVat: true, expiryDate: editProduct.expiryDate || '', binLocation: editProduct.binLocation || '', taxType: editProduct.taxType || 'VAT'
  } : {
    name: '', barcode: '', categoryId: '', unitId: '1', buyPrice: 0, sellPrice: 0, taxRate: 15, minQuantity: 0,
    currentStock: 0, description: '', nameEn: '', sellByWeight: false, sizeInfo: '', addVat: true, expiryDate: '', binLocation: '', taxType: 'VAT'
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="modal-header sticky top-0 bg-white z-10 shadow-sm border-b pb-4 mb-4">
          <div className="modal-title">{editProduct ? t('sys.str_918') : t('sys.str_764')}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <Form schema={productSchema} defaultValues={defaultValues} onSubmit={onSubmit}>
          <ProductFormInner 
            categories={categories}
            units={units}
            formUnits={formUnits}
            setFormUnits={setFormUnits}
            showAddCategory={showAddCategory}
            setShowAddCategory={setShowAddCategory}
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            handleAddCategory={handleAddCategory}
            savingCategory={savingCategory}
            showAddBaseUnit={showAddBaseUnit}
            setShowAddBaseUnit={setShowAddBaseUnit}
            newBaseUnitName={newBaseUnitName}
            setNewBaseUnitName={setNewBaseUnitName}
            handleAddBaseUnit={handleAddBaseUnit}
            savingBaseUnit={savingBaseUnit}
            handleTransliterate={handleTransliterate}
            handleGenerateBarcode={handleGenerateBarcode}
            showAddUnit={showAddUnit}
            setShowAddUnit={setShowAddUnit}
            newUnitName={newUnitName}
            setNewUnitName={setNewUnitName}
            handleAddUnit={handleAddUnit}
            savingUnit={savingUnit}
            imagePreview={imagePreview}
            editProduct={editProduct}
            setImageFile={setImageFile}
            setImagePreview={setImagePreview}
            saving={saving}
            onClose={onClose}
          />
        </Form>
      </div>
    </div>
  );
}
