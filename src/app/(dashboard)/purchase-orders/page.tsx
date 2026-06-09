'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePagePermission } from '@/lib/usePagePermission';
import {
  FileText, Search, Plus, ShoppingCart, Clock, CheckCircle, AlertCircle, X,
  Trash2, Package, PauseCircle, History, Banknote, CreditCard, SplitSquareHorizontal,
  ChevronDown, ChevronUp, RefreshCw, Eye, Edit2, Copy, Printer, Calendar, User,
  Building, Check, Ban
} from 'lucide-react';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

// Validation Schemas for creation modal matching CreatePOSchema in route.ts
const itemSchema = z.object({
  productId: z.string().min(1, 'Product selection is required'),
  productName: z.string().optional(),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  price: z.number().min(0, 'Price must be positive'),
});

const formSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  branchId: z.string().min(1, 'Branch is required'),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, 'At least one item is required')
});

type FormValues = z.infer<typeof formSchema>;

interface OrderDetail {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  taxValue: number;
  total: number;
}

interface Order {
  id: number;
  orderNo: number;
  date: string;
  promisedDate?: string;
  total: number;
  taxValue: number;
  subtotal: number;
  status: string;
  notes: string;
  supplier?: { id: number; name: string };
  user?: { fullName: string };
  branchId?: number;
  branch?: { id: number; name: string };
  details: OrderDetail[];
}

export default function PurchaseOrdersPage() {
  const { t, lang } = useTranslation();
  const allowed = usePagePermission('purchases');
  const { error: toastError, success: toastSuccess } = useToast();
  const router = useRouter();

  // Primary Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [delayedOnly, setDelayedOnly] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Options State
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [userSession, setUserSession] = useState<any>(null);

  // Modals & Confirmation States
  const [showModal, setShowModal] = useState(false);
  const [showPosPanel, setShowPosPanel] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ id: number; action: string; label: string } | null>(null);

  // POS Additions Simulation
  const [paymentType, setPaymentType] = useState('cash'); // 'cash' | 'card' | 'split'
  const [splitCash, setSplitCash] = useState('');
  const [splitCard, setSplitCard] = useState('');
  const [posStatus, setPosStatus] = useState<'disconnected' | 'connected' | 'sending'>('disconnected');
  const [posPort, setPosPort] = useState<any>(null);
  const [heldInvoices, setHeldInvoices] = useState<any[]>([]);
  const [showHeldPanel, setShowHeldPanel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierId: '',
      branchId: '',
      notes: '',
      items: [{ productId: '', productName: '', quantity: 1, price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // Load Session and Options
  useEffect(() => {
    if (allowed) {
      try {
        setUserSession(JSON.parse(localStorage.getItem('user') || '{}'));
      } catch(e){}
      fetchSuppliers();
      fetchBranches();
      fetchProducts();
    }
  }, [allowed]);

  // Load Orders when filters change
  useEffect(() => {
    if (allowed) {
      load();
    }
  }, [allowed, page, limit, statusFilter, supplierFilter, fromDate, toDate]);

  // Hotkey & Serial Connections Setup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showModal) return;
      if (['F2', 'F3', 'F4', 'F9', 'Escape'].includes(e.key)) e.preventDefault();
      if (e.key === 'F2') document.getElementById('save-btn')?.click();
      else if (e.key === 'F3') holdInvoice();
      else if (e.key === 'F4') setShowHeldPanel(true);
      else if (e.key === 'F9') setShowHistory(true);
      else if (e.key === 'Escape') {
        setShowHeldPanel(false);
        setShowHistory(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, heldInvoices]);

  // Permission Check Helper
  const hasPermission = (action: 'canView' | 'canAdd' | 'canEdit' | 'canDelete' | 'canPrint') => {
    if (!userSession) return false;
    if (userSession.role === 'admin' || userSession.role === 'owner' || userSession.role === 'CFO') return true;
    const purchasesPerm = (userSession.permissions || []).find((p: any) => p.module === 'purchases');
    if (!purchasesPerm) return false;
    return !!purchasesPerm[action];
  };

  async function fetchSuppliers() {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/customers?type=1', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setSuppliers(await res.json());
    } catch(e){}
  }

  async function fetchBranches() {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/branches', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setBranches(await res.json());
    } catch(e){}
  }

  async function fetchProducts() {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setProductsList(await res.json());
    } catch(e){}
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (supplierFilter && supplierFilter !== 'all') params.append('supplierId', supplierFilter);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      const r = await fetch(`/api/purchase-orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (r.status === 401 || r.status === 403) {
        setError(t('sys.str_960') || 'غير مصرح لك بعرض أوامر الشراء');
        setLoading(false);
        return;
      }
      if (r.ok) {
        const json = await r.json();
        const data = Array.isArray(json) ? json : (json.data || []);
        const totalCount = typeof json.total === 'number' ? json.total : data.length;
        setOrders(data);
        setTotal(totalCount);
      } else {
        setError(t('pos.error_occurred') || 'حدث خطأ أثناء تحميل البيانات من الخادم');
      }
    } catch (e: any) {
      setError(e?.message || t('pos.error_occurred') || 'حدث خطأ غير متوقع');
    }
    setLoading(false);
  };

  // Create Purchase Order with Data Normalization
  const handleCreateOrder = async (data: FormValues) => {
    if (!hasPermission('canAdd')) {
      toastError(t('sys.str_960') || 'غير مسموح لك بإجراء هذه العملية');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token') || '';

      const normalizedItems = data.items.map(item => {
        const pId = parseInt(item.productId, 10);
        return {
          productId: isNaN(pId) ? 1 : pId,
          quantity: Number(item.quantity) || 1,
          unitCost: Number(item.price) || 0, // Form price maps to unitCost
          taxRate: 15
        };
      });

      const payload = {
        supplierId: parseInt(data.supplierId, 10),
        branchId: parseInt(data.branchId, 10),
        date: new Date().toISOString().split('T')[0],
        items: normalizedItems,
        notes: data.notes || '',
        requireApproval: true // Enable workflow approval routing by default
      };

      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowModal(false);
        reset({
          supplierId: '',
          branchId: '',
          notes: '',
          items: [{ productId: '', productName: '', quantity: 1, price: 0 }]
        });
        toastSuccess(t('pos.po_created') || 'تم إنشاء أمر الشراء وإرساله للاعتماد بنجاح');
        load();
      } else {
        const errorJson = await res.json();
        toastError(errorJson.error || errorJson.message || t('sys.str_962') || 'فشل في حفظ أمر الشراء');
      }
    } catch (err: any) {
      toastError(err?.message || t('pos.error_occurred') || 'حدث خطأ أثناء الاتصال بالخادم');
    }
    setSaving(false);
  };

  // Update status with validation and confirmation
  const executeStatusUpdate = async (id: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/purchase-orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        load();
        toastSuccess(t('pos.status_updated') || 'تم تحديث حالة الأمر بنجاح');
      } else {
        const errJson = await res.json();
        toastError(errJson.error || t('sys.str_960') || 'فشل في تحديث حالة المستند');
      }
    } catch (e) {
      toastError(t('sys.str_961') || 'حدث خطأ في الشبكة');
    }
    setConfirmAction(null);
  };

  const triggerStatusUpdate = (id: number, status: string, label: string) => {
    setConfirmAction({ id, action: status, label });
  };

  // Client-side sub-filtering for extra parameters (searchQuery, branch, delayed)
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return orders.filter(o => {
      // 1. Search Query (Number, Supplier Name, notes)
      const matchesSearch = searchQuery === '' ||
        o.orderNo?.toString().includes(searchQuery) ||
        (o.supplier?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.notes || '').toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Branch Filter
      const matchesBranch = branchFilter === 'all' || o.branchId?.toString() === branchFilter;

      // 3. Delayed Only (promisedDate passed and status is not completed)
      let matchesDelayed = true;
      if (delayedOnly) {
        const isCompleted = o.status === 'completed';
        const hasPassed = o.promisedDate ? new Date(o.promisedDate) < new Date() : false;
        matchesDelayed = !isCompleted && hasPassed;
      }

      return matchesSearch && matchesBranch && matchesDelayed;
    });
  }, [orders, searchQuery, branchFilter, delayedOnly]);

  // KPIs Calculations
  const kpiTotalCount = useMemo(() => total, [total]);
  const kpiPendingCount = useMemo(() => orders.filter(o => o.status === 'pending').length, [orders]);
  const kpiCompletedCount = useMemo(() => orders.filter(o => o.status === 'completed').length, [orders]);
  const kpiTotalValue = useMemo(() => orders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0), [orders]);

  // Helpers
  const fmt = (n: number) => n.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-900/40">{t('pos.pending') || 'بانتظار الاعتماد'}</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-200 dark:border-blue-900/40">معتمد</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-full text-xs font-bold border border-red-200 dark:border-red-900/40">مرفوض</span>;
      case 'completed':
        return <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-900/40">مكتمل</span>;
      default:
        return <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 rounded-full text-xs font-bold border border-slate-200">{status}</span>;
    }
  };

  // Serial/POS simulation functions
  const connectPosManual = async () => {
    if (!('serial' in navigator)) {
      toastError(t('pos.not_supported') || 'غير مدعوم في هذا المتصفح');
      return;
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      setPosPort(port);
      setPosStatus('connected');
      toastSuccess(t('pos.mada_success') || 'تم ربط جهاز مدى بنجاح');
    } catch (e) {
      toastError(t('pos.mada_fail') || 'فشل ربط جهاز مدى');
    }
  };

  const holdInvoice = () => {
    const data = control._formValues;
    if (!data.items || data.items.length === 0 || !data.items[0].productId) {
      return toastError(t('pos.empty_invoice_hold') || 'لا يمكن تعليق فاتورة فارغة');
    }
    const newHeld = {
      id: Date.now().toString(),
      label: `فاتورة معلقة - ${new Date().toLocaleTimeString('ar-SA')}`,
      data
    };
    setHeldInvoices([...heldInvoices, newHeld]);
    reset({
      supplierId: '',
      branchId: '',
      notes: '',
      items: [{ productId: '', productName: '', quantity: 1, price: 0 }]
    });
    toastSuccess(t('pos.hold_success') || 'تم تعليق الفاتورة بنجاح');
  };

  const recallInvoice = (held: any) => {
    reset(held.data);
    setHeldInvoices(heldInvoices.filter(h => h.id !== held.id));
    setShowHeldPanel(false);
    toastSuccess(t('pos.recall_success') || 'تم استرجاع الفاتورة');
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-4 lg:p-8 transition-colors duration-300 font-[Fira_Sans] text-slate-800 dark:text-slate-200" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <style dangerouslySetInnerHTML={{ __html: fontImport }} />

      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header Title Board */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 gap-4 transition-all duration-300">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="p-3.5 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-xl relative overflow-hidden group border border-indigo-500/20">
              <ShoppingCart className="w-8 h-8 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">{t('sys.str_942') || 'أوامر الشراء'}</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{t('pos.po_manage') || 'إدارة وفلاتر واعتمادات أوامر الشراء والربط المخزني للفرع'}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPosPanel(!showPosPanel)}
              className="flex items-center px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 rounded-xl transition-all font-bold text-sm border border-slate-200 dark:border-slate-700"
            >
              <PauseCircle className="w-4 h-4 ml-1.5" />
              محاكاة جهاز مدى / POS
            </button>

            {hasPermission('canAdd') && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold text-sm shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4 ml-1.5" /> {t('sys.str_944') || 'أمر شراء جديد'}
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Secondary POS Sim Panel */}
        {showPosPanel && (
          <div className="bg-slate-100/60 dark:bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center text-sm">
                <CreditCard className="w-4 h-4 ml-2 text-indigo-500" />
                محاكاة الربط مع أجهزة المبيعات ونقاط البيع (POS Connectivity & Serial Connect)
              </h3>
              <button onClick={() => setShowPosPanel(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-800/70 p-4 rounded-xl border dark:border-slate-700/50 space-y-2">
                <p className="text-xs text-slate-500 font-bold">جهاز مدى المحلي (Serial API)</p>
                <button
                  type="button"
                  onClick={connectPosManual}
                  className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all ${posStatus === 'connected' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/20' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                >
                  <CreditCard className="w-4 h-4" />
                  {posStatus === 'connected' ? 'متصل بنجاح مع منفذ مدى' : 'ربط جهاز مدى يدوياً'}
                </button>
              </div>

              <div className="bg-white dark:bg-slate-800/70 p-4 rounded-xl border dark:border-slate-700/50 space-y-2">
                <p className="text-xs text-slate-500 font-bold">تعليق الفواتير المؤقتة (POS Hold)</p>
                <div className="flex gap-2">
                  <button type="button" onClick={holdInvoice} className="flex-1 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/25 border border-amber-300 dark:border-amber-900/40 rounded-lg text-xs font-bold">
                    تعليق الفاتورة الحالية (F3)
                  </button>
                  <button type="button" onClick={() => setShowHeldPanel(true)} className="px-3 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 border border-indigo-200 rounded-lg text-xs font-bold relative">
                    استرجاع {heldInvoices.length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4.5 h-4.5 text-[9px] flex items-center justify-center">{heldInvoices.length}</span>}
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800/70 p-4 rounded-xl border dark:border-slate-700/50 space-y-2">
                <p className="text-xs text-slate-500 font-bold">سجل الفواتير السريعة</p>
                <button type="button" onClick={() => setShowHistory(true)} className="w-full py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5">
                  <History className="w-4 h-4" />
                  عرض الفواتير السابقة (F9)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global ERP KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border-r-4 border-r-indigo-500 border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-300 hover:scale-[1.01]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{t('pos.total_orders') || 'إجمالي الأوامر المفوترة'}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">{kpiTotalCount}</h3>
              </div>
              <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border-r-4 border-r-amber-500 border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-300 hover:scale-[1.01]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">بانتظار الموافقة والاعتماد</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">{kpiPendingCount}</h3>
              </div>
              <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border-r-4 border-r-emerald-500 border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-300 hover:scale-[1.01]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">الأوامر المكتملة والمستلمة</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">{kpiCompletedCount}</h3>
              </div>
              <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border-r-4 border-r-blue-500 border border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-300 hover:scale-[1.01]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">{t('pos.total_value') || 'القيمة الإجمالية الصافية'}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">{fmt(kpiTotalValue)} <span className="text-xs font-bold">SAR</span></h3>
              </div>
              <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                <ShoppingCart className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar Board */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Quick Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم الأمر، المورد، أو الملاحظات..."
                className="pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/55 transition-all w-full"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/55 transition-all"
              >
                <option value="all">كل الحالات</option>
                <option value="pending">بانتظار الاعتماد</option>
                <option value="approved">معتمد</option>
                <option value="completed">مكتمل</option>
                <option value="rejected">مرفوض</option>
              </select>
            </div>

            {/* Supplier Filter */}
            <div>
              <select
                value={supplierFilter}
                onChange={(e) => { setSupplierFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/55 transition-all"
              >
                <option value="all">كل الموردين</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Branch Filter */}
            <div>
              <select
                value={branchFilter}
                onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/55 transition-all"
              >
                <option value="all">كل الفروع</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-4">

              {/* Date pickers */}
              <div className="flex items-center space-x-2 space-x-reverse text-xs">
                <span className="text-slate-500 font-bold">من تاريخ:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <span className="text-slate-500 font-bold">إلى:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                  className="px-2.5 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              {/* Delayed Only Checkbox */}
              <label className="flex items-center text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={delayedOnly}
                  onChange={(e) => setDelayedOnly(e.target.checked)}
                  className="ml-2 w-4 h-4 text-indigo-600 bg-slate-50 border-slate-300 rounded focus:ring-indigo-500"
                />
                الأوامر المتأخرة فقط
              </label>
            </div>

            {/* Limit selector */}
            <div className="flex items-center space-x-2 space-x-reverse text-xs">
              <span className="text-slate-500 font-bold">حجم الصفحة:</span>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg font-bold text-slate-800 dark:text-white"
              >
                <option value={10}>10 أسطر</option>
                <option value={20}>20 سطر</option>
                <option value={50}>50 سطر</option>
              </select>
            </div>
          </div>
        </div>

        {/* Master Purchase Orders Table List */}
        <div className="bg-white dark:bg-[#0F172A] border border-slate-200/60 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-sm">

          {loading ? (
            /* Premium shimmer skeleton state */
            <div className="p-8 space-y-4">
              <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/4 animate-pulse"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-slate-50 dark:bg-slate-800/40 rounded-xl animate-pulse flex items-center justify-between px-6">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/6"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-12"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            /* Error State block with Retry action */
            <div className="p-10 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-bold text-red-600">فشل في جلب البيانات</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">{error}</p>
              <button
                onClick={load}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            /* Centered Arabic Empty State graphic */
            <div className="p-16 text-center space-y-4 border-2 border-dashed border-slate-200/60 dark:border-slate-800/60 m-6 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-slate-400">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">لا توجد أوامر شراء مطابقة</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">
                لم نجد أي أوامر شراء تطابق خيارات التصفية الحالية. يرجى إزالة الفلاتر أو إنشاء أمر شراء جديد.
              </p>
              {hasPermission('canAdd') && (
                <button
                  onClick={() => setShowModal(true)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
                >
                  إنشاء أول أمر شراء
                </button>
              )}
            </div>
          ) : (
            /* Table Data Rows */
            <div className="p-4 space-y-3">
              {filteredOrders.map(o => {
                // Calculate delay locally
                const isDelayed = o.promisedDate && o.status !== 'completed' ? new Date(o.promisedDate) < new Date() : false;

                return (
                  <div
                    key={o.id}
                    className={`bg-white dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 rounded-xl overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-700/80 hover:shadow-md transition-all duration-200 cursor-pointer group ${expanded === o.id ? 'ring-1 ring-indigo-500/25' : ''}`}
                    onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  >
                    <div className="p-4 flex flex-wrap items-center gap-4">

                      {/* Document Details Column */}
                      <div className="flex-1 flex items-center gap-4 min-w-[200px]">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-indigo-500/10 transition-colors duration-300">
                          <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 dark:text-white font-[Fira_Code]">#{o.orderNo}</span>
                            {getStatusBadge(o.status)}
                            {isDelayed && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400 rounded-md text-[10px] font-extrabold border border-red-200/50">متأخر</span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            {o.supplier?.name || t('sys.str_963') || 'مورد عام'}
                          </p>
                        </div>
                      </div>

                      {/* Info columns */}
                      <div className="flex items-center gap-5 flex-wrap text-xs font-bold">
                        <div>
                          <p className="text-slate-400 mb-0.5">الفرع</p>
                          <p className="text-slate-700 dark:text-slate-300">{o.branch?.name || 'الفرع الرئيسي'}</p>
                        </div>

                        <div>
                          <p className="text-slate-400 mb-0.5">عدد المواد</p>
                          <p className="text-slate-700 dark:text-slate-300 text-center font-[Fira_Code]">{o.details?.length || 0}</p>
                        </div>

                        <div>
                          <p className="text-slate-400 mb-0.5">تاريخ الطلب</p>
                          <p className="text-slate-700 dark:text-slate-300 font-[Fira_Code]">{new Date(o.date).toLocaleDateString('en-GB')}</p>
                        </div>

                        <div>
                          <p className="text-slate-400 mb-0.5">تاريخ التسليم</p>
                          <p className={`font-[Fira_Code] ${isDelayed ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-slate-700 dark:text-slate-300'}`}>
                            {o.promisedDate ? new Date(o.promisedDate).toLocaleDateString('en-GB') : '--'}
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-400 mb-0.5">أنشئ بواسطة</p>
                          <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {o.user?.fullName || '--'}
                          </p>
                        </div>

                        <div className="text-left rtl:text-right ml-2 rtl:ml-0 rtl:mr-2">
                          <p className="text-slate-400 mb-0.5">{t('pos.total') || 'الإجمالي'}</p>
                          <p className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 font-[Fira_Code]">{fmt(o.total)} SAR</p>
                        </div>
                      </div>

                      {/* Expand indicator arrow */}
                      <div className="text-slate-400 group-hover:text-indigo-500 p-1">
                        {expanded === o.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>

                    {/* Expand Detail Drawer */}
                    {expanded === o.id && (
                      <div className="bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-200/50 dark:border-slate-800/80 p-5 cursor-default" onClick={(e) => e.stopPropagation()}>
                        <h4 className="font-extrabold text-sm mb-3 text-slate-700 dark:text-slate-300">تفاصيل بنود أمر الشراء:</h4>

                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#0b1120]">
                          <table className="w-full text-right text-xs">
                            <thead className="text-slate-400 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                <th className="p-3 font-bold">{t('sys.str_63') || 'اسم الصنف'}</th>
                                <th className="p-3 font-bold text-center w-20">{t('sys.str_64') || 'الكمية'}</th>
                                <th className="p-3 font-bold text-center w-28">{t('sys.str_65') || 'سعر الوحدة'}</th>
                                <th className="p-3 font-bold text-center w-24">{t('sys.str_946') || 'مبلغ الضريبة'}</th>
                                <th className="p-3 font-bold text-center w-28">{t('sys.str_947') || 'الإجمالي الكلي'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-[Fira_Code] font-bold text-slate-700 dark:text-slate-300">
                              {o.details?.map((item, i) => (
                                <tr key={i} className="hover:bg-slate-50/50">
                                  <td className="p-3 text-slate-900 dark:text-slate-100">{item.productName || `منتج #${item.productId}`}</td>
                                  <td className="p-3 text-center">{item.quantity}</td>
                                  <td className="p-3 text-center">{fmt(item.price)}</td>
                                  <td className="p-3 text-center text-slate-500">{fmt(item.taxValue)}</td>
                                  <td className="p-3 text-center text-indigo-600 dark:text-indigo-400">{fmt(item.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {o.notes && (
                          <div className="mt-4 p-3 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-xs">
                            <span className="font-extrabold text-slate-500 dark:text-slate-400">ملاحظات الطلب: </span>
                            <span className="text-slate-700 dark:text-slate-300">{o.notes}</span>
                          </div>
                        )}

                        {/* Dynamic Action Buttons with permission gate guards */}
                        <div className="mt-5 flex flex-wrap gap-2.5 justify-end border-t border-slate-200/50 dark:border-slate-800/80 pt-4">

                          {/* Print Action always allowed with canPrint permission */}
                          {hasPermission('canPrint') && (
                            <button
                              onClick={() => toastSuccess('جاري إرسال المستند للطباعة...')}
                              className="flex items-center px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg font-bold text-xs transition-colors border border-slate-200 dark:border-slate-700"
                            >
                              <Printer className="w-3.5 h-3.5 ml-1.5" />
                              {t('fin.str_202') || 'طباعة PDF'}
                            </button>
                          )}

                          {/* Approval / Rejection transition actions */}
                          {o.status === 'pending' && hasPermission('canEdit') && (
                            <>
                              <button
                                onClick={() => triggerStatusUpdate(o.id, 'rejected', 'رفض أمر الشراء')}
                                className="flex items-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400 rounded-lg font-bold text-xs transition-colors border border-red-200 dark:border-red-900/40"
                              >
                                <Ban className="w-3.5 h-3.5 ml-1.5" />
                                {t('sys.str_948') || 'رفض الطلب'}
                              </button>

                              <button
                                onClick={() => triggerStatusUpdate(o.id, 'approved', 'اعتماد وقبول أمر الشراء')}
                                className="flex items-center px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-lg font-bold text-xs transition-colors border border-emerald-200 dark:border-emerald-900/40"
                              >
                                <Check className="w-3.5 h-3.5 ml-1.5" />
                                {t('sys.str_949') || 'اعتماد وقبول'}
                              </button>
                            </>
                          )}

                          {/* Landed costs / Complete transitions */}
                          {o.status === 'approved' && hasPermission('canEdit') && (
                            <>
                              <button
                                onClick={() => router.push(`/purchase-orders/${o.id}/landed-costs`)}
                                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-lg font-bold text-xs transition-colors border border-indigo-200 dark:border-indigo-800/40"
                              >
                                {t('sys.str_950') || 'إثبات تكاليف مضافة'}
                              </button>

                              <button
                                onClick={() => triggerStatusUpdate(o.id, 'completed', 'إكمال وإصدار الفاتورة المولدّة وتحديث مستويات المخزون')}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm shadow-indigo-500/10"
                              >
                                {t('sys.str_951') || 'إكمال وتحديث المخزون'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Simple Pagination Board */}
          {!loading && total > limit && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between font-bold text-xs">
              <span className="text-slate-500">
                عرض {filteredOrders.length} من أصل {total} سجلات
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 transition-colors border dark:border-slate-700"
                >
                  السابق
                </button>
                <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-lg font-[Fira_Code]">
                  {page}
                </span>
                <button
                  disabled={page * limit >= total}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 transition-colors border dark:border-slate-700"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Order Modal Sheet */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 transition-all duration-300">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center">
                  <Package className="w-5.5 h-5.5 ml-2 text-indigo-600 dark:text-indigo-400" />
                  {t('sys.str_952') || 'تفاصيل طلب الشراء الجديد'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleCreateOrder)} className="flex-1 overflow-y-auto p-6 space-y-6">

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Supplier Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">{t('sys.str_953') || 'المورد المسؤول'}</label>
                  <select
                    {...register('supplierId')}
                    className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.supplierId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                    <option value="">{t('sys.str_954') || 'اختر المورد'}</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  {errors.supplierId && <span className="text-red-500 text-[10px] font-bold mt-1 block">{errors.supplierId.message}</span>}
                </div>

                {/* Branch Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">فرع المنشأة المستلم</label>
                  <select
                    {...register('branchId')}
                    className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.branchId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                    <option value="">اختر فرع الاستلام</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  {errors.branchId && <span className="text-red-500 text-[10px] font-bold mt-1 block">{errors.branchId.message}</span>}
                </div>

                {/* Notes Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">{t('sys.str_955') || 'ملاحظات وتوجيهات الشراء'}</label>
                  <input
                    type="text"
                    {...register('notes')}
                    placeholder="ملاحظات تظهر للمورد أو الإدارة المالية..."
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Line Items List Board */}
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-850 pb-2 mb-4">{t('sys.str_956') || 'بنود ومواد الطلب'}</h3>
                {errors.items?.root && <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold mb-4">{errors.items.root.message}</div>}

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs">
                      <tr>
                        <th className="px-4 py-3 font-bold">{t('sys.str_957') || 'الصنف المطلوب'}</th>
                        <th className="px-4 py-3 font-bold w-28 text-center">{t('sys.str_64') || 'الكمية'}</th>
                        <th className="px-4 py-3 font-bold w-36 text-center">{t('sys.str_958') || 'سعر الوحدة الصافي'}</th>
                        <th className="px-4 py-3 font-bold w-16 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-[#0b1120]">
                      {fields.map((field, idx) => (
                        <tr key={field.id}>
                          {/* Product Selection select option */}
                          <td className="px-4 py-3">
                            <select
                              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.items?.[idx]?.productId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'}`}
                              {...register(`items.${idx}.productId` as const)}
                              onChange={(e) => {
                                const selectedProd = productsList.find(p => p.id === parseInt(e.target.value, 10));
                                if (selectedProd) {
                                  setValue(`items.${idx}.productName`, selectedProd.name);
                                  setValue(`items.${idx}.price`, Number(selectedProd.buyPrice || 0));
                                }
                              }}
                            >
                              <option value="">اختر الصنف من قائمة المواد...</option>
                              {productsList.map(p => <option key={p.id} value={p.id}>{p.name} (بوابة {p.barcode || 'عام'})</option>)}
                            </select>
                            {errors.items?.[idx]?.productId && <span className="text-red-500 text-[9px] mt-0.5 block">{errors.items[idx]?.productId?.message}</span>}
                          </td>

                          {/* Quantity */}
                          <td className="px-4 py-3">
                            <input
                              type="number" step="0.01"
                              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.items?.[idx]?.quantity ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'}`}
                              {...register(`items.${idx}.quantity` as const, { valueAsNumber: true })}
                            />
                            {errors.items?.[idx]?.quantity && <span className="text-red-500 text-[9px] mt-0.5 block text-center">{errors.items[idx]?.quantity?.message}</span>}
                          </td>

                          {/* Buy Price / Net cost */}
                          <td className="px-4 py-3">
                            <input
                              type="number" step="0.01"
                              className={`w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-indigo-500 transition-colors ${errors.items?.[idx]?.price ? 'border-red-500' : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'}`}
                              {...register(`items.${idx}.price` as const, { valueAsNumber: true })}
                            />
                            {errors.items?.[idx]?.price && <span className="text-red-500 text-[9px] mt-0.5 block text-center">{errors.items[idx]?.price?.message}</span>}
                          </td>

                          {/* Trash action */}
                          <td className="px-4 py-3 text-center">
                            <button type="button" onClick={() => remove(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={() => append({ productId: '', productName: '', quantity: 1, price: 0 })} className="flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
                      <Plus className="w-4 h-4 ml-1" /> {t('sys.str_959') || 'إضافة سطر جديد'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons inside creation modal */}
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6 font-bold text-xs">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-all">
                  {t('fin.str_206') || 'إلغاء'}
                </button>

                <button type="submit" id="save-btn" disabled={saving} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-50">
                  {saving ? 'جاري الحفظ والتحقق...' : 'حفظ وإرسال للاعتماد (F2)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Overlays Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm z-70 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 text-right space-y-4">
            <div className="flex items-center gap-3 border-b pb-3 border-slate-100 dark:border-slate-855 text-slate-900 dark:text-white">
              <AlertCircle className="w-6 h-6 text-indigo-500" />
              <h3 className="font-extrabold text-sm">تأكيد الإجراء المالي / الإداري</h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-bold leading-relaxed">
              هل أنت متأكد من رغبتك في تنفيذ إجرء <span className="text-indigo-600 font-extrabold">"{confirmAction.label}"</span> على أمر الشراء الحالي؟ قد يترتب على هذا الإجراء إعداد دفاتر إدخال مالية تلقائية أو تحديث مستويات المخازن.
            </p>

            <div className="flex justify-end gap-2.5 pt-2 font-bold text-xs">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border dark:border-slate-700"
              >
                إلغاء الأمر
              </button>

              <button
                type="button"
                onClick={() => executeStatusUpdate(confirmAction.id, confirmAction.action)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
              >
                تأكيد ومتابعة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hold / Recall simulation modals */}
      {showHeldPanel && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 text-right">
            <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-extrabold text-sm flex items-center text-slate-900 dark:text-white"><PauseCircle className="w-5 h-5 ml-2 text-amber-500"/> الفواتير المعلقة مؤقتاً</h3>
              <button onClick={() => setShowHeldPanel(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto font-bold text-xs">
              {heldInvoices.length === 0 ? <p className="text-center text-slate-500 p-5">لا توجد أي فواتير معلقة حالياً</p> :
                heldInvoices.map(h => (
                  <div key={h.id} className="p-4 border dark:border-slate-700 rounded-xl flex justify-between items-center bg-slate-50 dark:bg-slate-900/40">
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white">{h.label}</p>
                      <p className="text-xs text-slate-500 mt-1">{h.data.items?.length || 0} بنود مضافة</p>
                    </div>
                    <button onClick={() => recallInvoice(h)} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200">استرجاع</button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* History simulation modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 dark:border-slate-800 text-right font-bold">
            <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-sm flex items-center text-slate-900 dark:text-white"><History className="w-5 h-5 ml-2 text-indigo-500"/> سجل الأوامر السابقة المنجزة</h3>
              <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-y-auto text-xs">
              <table className="w-full text-right">
                 <thead className="text-slate-400 border-b dark:border-slate-850">
                   <tr>
                     <th className="pb-3 font-bold">رقم المستند</th>
                     <th className="pb-3 font-bold">المورد المعتمد</th>
                     <th className="pb-3 font-bold">التاريخ</th>
                     <th className="pb-3 font-bold">الحالة</th>
                     <th className="pb-3 font-bold">الإجمالي</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-[Fira_Code] text-slate-700 dark:text-slate-300">
                    {orders.slice(0, 15).map(o => (
                      <tr key={o.id} className="hover:bg-slate-50/50">
                        <td className="py-3 font-bold">#{o.orderNo}</td>
                        <td className="py-3">{o.supplier?.name || '--'}</td>
                        <td className="py-3">{new Date(o.date).toLocaleDateString()}</td>
                        <td className="py-3">{getStatusBadge(o.status)}</td>
                        <td className="py-3 text-indigo-600 dark:text-indigo-400">{fmt(o.total)}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
