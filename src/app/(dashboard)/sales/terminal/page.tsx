'use client';

import { useState, useEffect, useRef } from 'react';
import PosReturnsModal from '@/components/PosReturnsModal';
import Link from 'next/link';
import { FeatureGuard } from '@/hooks/FeatureGuard';
import InvoiceReceipt from '@/components/InvoiceReceipt';
import VoucherReceipt from '../../../../components/VoucherReceipt';
import { QRCodeCanvas } from 'qrcode.react';
import { RiyalLogo } from '@/components/RiyalLogo';
import { useTranslation } from "@/lib/i18n";
import { printRawESCPOS, connectQZ } from "@/lib/qz";
import { useSettings } from '@/lib/SettingsContext';
import { useToast } from '@/components/Toast';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface Product {
 id: number; name: string; barcode: string; sellPrice: number;
 currentStock: number; taxRate: number; unit?: { name: string }; categoryId?: number;
 productUnits?: {
 id: number; unitId: number; unitStock: number; factor: number;
 sellPrice: number; parentQty: number; parentUnitId: number | null;
 unit: { name: string };
 }[];
}
interface CartItem {
 productId: number; productName: string; quantity: number;
 price: number; discountRate: number; discountValue?: number; taxRate: number;
 stock: number; unitName: string; categoryId?: number;
 productUnitId?: number; // معرّف الوحدة المختارة (درزن/كرتون)
 unitFactor?: number; // كم حبة = وحدة واحدة
 totalUnitStock?: number; // إجمالي المخزون المتاح (بالحبة)
}
interface Customer { id: number; name: string; phone?: string; taxNumber?: string | null; crNo?: string | null; address?: string | null; }
interface HeldInvoice { id: string; cart: CartItem[]; customerId: string; notes: string; discountRate: number; paidAmount: string; paymentType: string; heldAt: string; label: string; }

export default function SalesPage() {
 const { t } = useTranslation();
 const { error: toastError, success: toastSuccess } = useToast();
 const { isOffline, OfflineBadge, saveInvoiceWithSync, cacheProducts } = useOfflineSync();
 const { getSetting } = useSettings();
 const discountEnabled = getSetting('POS_DISCOUNT_ENABLED', 'true') === 'true';
 const isTaxInclusive = getSetting('POS_TAX_INCLUSIVE', 'true') === 'true';

 const dispatchKitchenPrinters = async (invoice: any, cartItems: CartItem[]) => {
 try {
 const rawPrinters = getSetting('POS_KITCHEN_PRINTERS', '[]');
 const printers = JSON.parse(rawPrinters);
 if (!Array.isArray(printers) || printers.length === 0) return;

 // Group items by printer
 const printJobs = printers.map((printer: any) => {
 const targets = printer.targetCategories || [];
 const itemsToPrint = cartItems.filter(item => targets.includes(item.categoryId || 0) || targets.length === 0);
 return { printer, items: itemsToPrint };
 }).filter((job: any) => job.items.length > 0);

 for (const job of printJobs) {
 // Build ESC/POS payload for this kitchen ticket
 const escpos = [
 '\x1B\x40', // Initialize
 '\x1B\x61\x01', // Center align
 '\x1B\x21\x30', // Double height & width
 'طلب مطبخ\n\n',
 '\x1B\x21\x00', // Normal font
 '\x1B\x61\x00', // Left align
 `تاريخ: ${new Date().toLocaleTimeString('en-GB')}\n`,
 `فاتورة #: ${invoice.invoiceNo}\n`,
 '--------------------------------\n',
 ...job.items.map((i: any) => `${i.productName} x ${i.quantity}\n`),
 '--------------------------------\n\n\n\n\n',
 '\x1D\x56\x41\x00' // Cut paper
 ];
 await printRawESCPOS(job.printer, escpos);
 }
 } catch (e: any) { toastError(e?.message || 'حدث خطأ'); }
 };
 const taxEnabled = getSetting('POS_TAX_ENABLED', 'true') === 'true';
 const couponsEnabled = getSetting('POS_COUPONS_ENABLED', 'true') === 'true';
 const allowNegativeStock = getSetting('POS_ALLOW_NEGATIVE_STOCK', 'false') === 'true';
 const allowAddProduct = getSetting('POS_ALLOW_ADD_PRODUCT', 'true') === 'true';
 const rulesRaw = getSetting('POS_DISCOUNT_RULES', '[]');
 const [discountRules, setDiscountRules] = useState<{minAmount: number, maxDiscount: number, maxDiscountPercent?: number}[]>([]);

 useEffect(() => {
 try {
 const parsed = JSON.parse(rulesRaw);
 if(Array.isArray(parsed)) setDiscountRules(parsed);
 } catch(e) {}
 }, [rulesRaw]);
 const [products, setProducts] = useState<Product[]>([]);
 const [customers, setCustomers] = useState<Customer[]>([]);
 const [search, setSearch] = useState('');
 const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
 const [taxRate, setTaxRate] = useState(15);
 const [cart, setCart] = useState<CartItem[]>([]);
 const [customerId, setCustomerId] = useState('');
 const [stockId, setStockId] = useState('1');
 const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([]);
 const [currencies, setCurrencies] = useState<{ id: number; code: string; exchangeRate: number; isDefault: boolean; isActive: boolean }[]>([]);
 const [currencyId, setCurrencyId] = useState('');
 const [exchangeRate, setExchangeRate] = useState(1.0);
 const [paymentType, setPaymentType] = useState('card');
 const [splitCash, setSplitCash] = useState('');
 const [splitCard, setSplitCard] = useState('');
 const [manualInvoiceNo, setManualInvoiceNo] = useState('');
 const [manualDate, setManualDate] = useState('');
 const [isAdmin, setIsAdmin] = useState(false);
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const [posPort, setPosPort] = useState<any>(null);
 const [posStatus, setPosStatus] = useState<'disconnected' | 'connected' | 'sending'>('disconnected');
 const [retryPosAmount, setRetryPosAmount] = useState<number | null>(null);
 const [retryInvoiceNo, setRetryInvoiceNo] = useState<string>('');
 const [discountRate, setDiscountRate] = useState(0);
 const [discountValueState, setDiscountValueState] = useState(0);
 const [notes, setNotes] = useState('');
 const [paidAmount, setPaidAmount] = useState('');
 const [saving, setSaving] = useState(false);
 const [toast, setToast] = useState('');
 const [showReceipt, setShowReceipt] = useState(false);
 const [showVoucher, setShowVoucher] = useState(false);
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const [selectedVoucherData, setSelectedVoucherData] = useState<any>(null);

 const [lastInvoiceData, setLastInvoiceData] = useState<{
 invoiceId: number; invoiceNumber: string; date: string; customerName: string;
 customerTaxNo?: string | null; customerCrNo?: string | null; customerAddress?: string | null;
 paymentMethod: string; items: { name: string; quantity: number; price: number; total: number }[];
 subtotal: number; discount: number; taxRate: number; taxAmount: number; grandTotal: number;
 docType?: string;
 } | null>(null);
 const searchRef = useRef<HTMLInputElement>(null);
 const discountRef = useRef<HTMLInputElement>(null);
 const [focusedProductIndex, setFocusedProductIndex] = useState(-1);
 const [showTypeahead, setShowTypeahead] = useState(false);
 const [showReturnsModal, setShowReturnsModal] = useState(false);

 // BNPL (Tabby/Tamara) Polling State
 const [bnplProvider, setBnplProvider] = useState<'TABBY' | 'TAMARA' | null>(null);
 const [bnplUrl, setBnplUrl] = useState('');
 const [bnplOrderId, setBnplOrderId] = useState('');
 const [bnplPolling, setBnplPolling] = useState(false);
 const [checkingStatus, setCheckingStatus] = useState(false);

 // Dynamic Watcher for BNPL Status
 const initSettings = async () => { try { const res = await fetch('/api/settings'); if (res.ok) { const data = await res.json(); if (data.tax_rate !== undefined) setTaxRate(Number(data.tax_rate) || 0); } } catch (e) {} }; useEffect(() => { initSettings(); }, []);
 useEffect(() => {
 let interval: NodeJS.Timeout;
 if (bnplPolling && bnplOrderId && bnplProvider) {
 interval = setInterval(async () => {
 try {
 setCheckingStatus(true);
 const res = await fetch(`/api/pos/bnpl/status?provider=${bnplProvider.toLowerCase()}&sessionId=${bnplOrderId}`);
 const data = await res.json();
 
 if (data.isSuccess) {
 clearInterval(interval);
 setBnplPolling(false);
 // Trigger final save using the manual override trick
 document.getElementById('bnpl-force-save')?.click();
 } else if (data.status === 'REJECTED' || data.status === 'EXPIRED' || data.status === 'DECLINED') {
 clearInterval(interval);
 setBnplPolling(false);
 toastError(t('sys.str_807'));
 setBnplProvider(null); setBnplUrl(''); setBnplOrderId('');
 }
 } catch (e: any) { toastError(e?.message || 'حدث خطأ'); } finally {
 setCheckingStatus(false);
 }
 }, 3000); 
 }
 return () => { if (interval) clearInterval(interval); };
 }, [bnplPolling, bnplOrderId, bnplProvider]);

 // Coupon logic
 const [couponCode, setCouponCode] = useState('');
 const [couponApplying, setCouponApplying] = useState(false);
 const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number } | null>(null);

 // Quick Add Customer
 const [showAddCustomer, setShowAddCustomer] = useState(false);
 const [newCust, setNewCust] = useState({ name: '', phone: '', taxNumber: '', street: '', buildingNumber: '', district: '', city: '', postalCode: '', creditLimit: '', notes: '', type: '0' });
 const [savingCust, setSavingCust] = useState(false);

 // Held Invoices
 const [heldInvoices, setHeldInvoices] = useState<HeldInvoice[]>([]);
 const [showHeldPanel, setShowHeldPanel] = useState(false);

 // Quick Add Product
 const [showAddProduct, setShowAddProduct] = useState(false);
 const [newProd, setNewProd] = useState({ name: '', barcode: '', buyPrice: '', sellPrice: '', taxRate: '15', currentStock: '' });
 const [savingProd, setSavingProd] = useState(false);

 // اختيار الوحدة عند إضافة الصنف
 const [unitPickerProduct, setUnitPickerProduct] = useState<Product | null>(null);

 // Invoice History
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const [historyInvoices, setHistoryInvoices] = useState<any[]>([]);
 const [showHistory, setShowHistory] = useState(false);
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
 const [historyLoading, setHistoryLoading] = useState(false);

 // Void Mode
 const [voidMode, setVoidMode] = useState(false);

 // Permission-based delete
 const [canDelete, setCanDelete] = useState(false);

 // Auto-detect POS terminal
 const detectPosTerminal = async () => {
 if (!('serial' in navigator)) { console.warn('WebSerial not supported'); return; }
 try {
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const ports = await (navigator as any).serial.getPorts();
 if (ports.length > 0) {
 const port = ports[0];
 if (!port.readable) {
 await port.open({ baudRate: 9600 });
 }
 setPosPort(port);
 setPosStatus('connected');
 console.log('✅ POS terminal detected');
 }
 } catch (e) { console.warn('POS detect:', e); }
 };

 const connectPosManual = async () => {
 if (!('serial' in navigator)) { toastError(t('sys.str_808')); return; }
 try {
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const port = await (navigator as any).serial.requestPort();
 await port.open({ baudRate: 9600 });
 setPosPort(port);
 setPosStatus('connected');
 toastSuccess(t('sys.str_809'));
 } catch (e) { console.warn('POS connect:', e); toastError(t('sys.str_810')); }
 };

 const sendToPos = async (amount: number): Promise<'approved' | 'declined' | 'error' | 'no_device'> => {
 if (!posPort || !posPort.writable) {
 console.warn('POS not connected, skipping');
 return 'no_device';
 }
 try {
 setPosStatus('sending');
 const writer = posPort.writable.getWriter();
 // Standard POS terminal payment command (amount in halalas)
 const amountHalalas = Math.round(amount * 100);
 const cmd = `\x02P${amountHalalas.toString().padStart(12, '0')}\x03`;
 await writer.write(new TextEncoder().encode(cmd));
 writer.releaseLock();

 // Wait for response from POS terminal (up to 60 seconds)
 if (posPort.readable) {
 const reader = posPort.readable.getReader();
 let response = '';
 const timeout = setTimeout(() => { try { reader.cancel(); } catch { } }, 60000);

 try {
 while (true) {
 const { value, done } = await reader.read();
 if (done) break;
 response += new TextDecoder().decode(value);
 // Check for end-of-message marker (ETX = \x03)
 if (response.includes('\x03')) break;
 }
 } catch (e) {
 console.warn('POS read timeout or error:', e);
 } finally {
 clearTimeout(timeout);
 reader.releaseLock();
 }

 console.log('POS Response:', response);
 setPosStatus('connected');

 // Parse response: look for approval code
 // Most terminals: A = Approved, D = Declined
 if (response.includes('A') || response.includes('APPROVED') || response.includes('00')) {
 return 'approved';
 } else if (response.includes('D') || response.includes('DECLINED') || response.includes('05')) {
 return 'declined';
 }
 // If we got any response, assume approved (terminal-specific)
 return response.length > 0 ? 'approved' : 'error';
 }
 setPosStatus('connected');
 return 'approved';
 } catch (e) {
 console.error('POS send error:', e);
 setPosStatus('connected');
 return 'error';
 }
 };

 const fetchWarehouses = async () => {
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/warehouses', { headers: { Authorization: `Bearer ${token}` } });
 if (res.ok) { const d = await res.json(); setWarehouses(Array.isArray(d) ? d : []); }
 } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
 };

 useEffect(() => {
 fetchProducts();
 fetchCustomers();
 fetchWarehouses();
 const fetchCurrencies = async () => {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/settings/currencies', { headers: { Authorization: `Bearer ${token}` } });
 if (res.ok) {
 const c = await res.json();
 setCurrencies(c);
 const def = c.find((x: any) => x.isDefault);
 if (def) {
 setCurrencyId(def.id.toString());
 setExchangeRate(def.exchangeRate);
 }
 }
 };
 fetchCurrencies();
 searchRef.current?.focus();
 try {
 const u = JSON.parse(localStorage.getItem('user') || '{}');
 setIsAdmin(u.role === 'admin');
 const perms: string[] = (u.permissions || []).map((p: { module: string }) => p.module);
 setCanDelete(u.role === 'admin' || perms.includes('delete_invoices'));
 } catch { }
 detectPosTerminal();
 // Load held invoices from localStorage
 try { const held = JSON.parse(localStorage.getItem('heldInvoices') || '[]'); setHeldInvoices(held); } catch { }
 }, []);

 // Global POS Hotkeys
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (['F1', 'F2', 'F3', 'F4', 'F8', 'F9', 'F12', 'Escape'].includes(e.key)) {
 e.preventDefault();
 }
 if (e.key === 'F1') {
 searchRef.current?.focus();
 } else if (e.key === 'F8') {
 const qtyInputs = document.querySelectorAll('.qty-input');
 if (qtyInputs.length > 0) (qtyInputs[qtyInputs.length - 1] as HTMLInputElement).select();
 } else if (e.key === 'F9') {
 document.getElementById('history-btn')?.click();
 } else if (e.key === 'F4') {
 document.getElementById('recall-btn')?.click();
 } else if (e.key === 'F2') {
 document.getElementById('save-btn')?.click();
 } else if (e.key === 'F3') {
 document.getElementById('hold-btn')?.click();
 } else if (e.key === 'Escape') {
 setSearch('');
 setShowTypeahead(false);
 setShowAddCustomer(false);
 setShowAddProduct(false);
 setShowHistory(false);
 setShowHeldPanel(false);
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, []);

 const saveNewCustomer = async () => {
 if (!newCust.name.trim()) return;
 setSavingCust(true);
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/customers', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify(newCust),
 });
 if (res.ok) {
 const created = await res.json();
 await fetchCustomers();
 setCustomerId(created.id.toString());
 setShowAddCustomer(false);
 setNewCust({ name: '', phone: '', taxNumber: '', street: '', buildingNumber: '', district: '', city: '', postalCode: '', creditLimit: '', notes: '', type: '0' });
 } else {
 toastError(t('sys.str_811'));
 }
 } catch { toastError(t('sys.str_419')); }
 finally { setSavingCust(false); }
 };

 const openAddProduct = () => {
 setNewProd({ name: '', barcode: search || '', buyPrice: '', sellPrice: '', taxRate: '15', currentStock: '' });
 setShowAddProduct(true);
 };

 const saveNewProduct = async () => {
 if (!newProd.name.trim()) return;
 setSavingProd(true);
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/products', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify(newProd),
 });
 if (res.ok) {
 const created = await res.json();
 await fetchProducts();
 addToCart({ id: created.id, name: created.name, barcode: created.barcode, sellPrice: created.sellPrice, currentStock: created.currentStock, taxRate: created.taxRate, unit: undefined, categoryId: created.categoryId });
 setShowAddProduct(false);
 setNewProd({ name: '', barcode: '', buyPrice: '', sellPrice: '', taxRate: '15', currentStock: '' });
 } else {
 toastError(t('sys.str_812'));
 }
 } catch { toastError(t('sys.str_419')); }
 finally { setSavingProd(false); }
 };

 async function fetchProducts() {
 try {
 if (isOffline) {
 if (typeof window !== 'undefined' && (window as any).electron) {
 const localProducts = await (window as any).electron.invoke('offline-db-search-products');
 if (localProducts && localProducts.length > 0) {
 setProducts(localProducts);
 setFilteredProducts(localProducts.slice(0, 20));
 }
 }
 return;
 }
 const token = localStorage.getItem('token');
 const res = await fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } });
 if (res.ok) { 
 const data = await res.json(); 
 const arr = Array.isArray(data) ? data : []; 
 setProducts(arr); 
 setFilteredProducts(arr.slice(0, 20)); 
 cacheProducts(arr);
 }
 } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
 };

 const fetchCustomers = async () => {
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/customers?type=0', { headers: { Authorization: `Bearer ${token}` } });
 if (res.ok) { const d = await res.json(); setCustomers(Array.isArray(d) ? d : []); }
 } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
 };

 useEffect(() => {
 if (!search) { setFilteredProducts(products.slice(0, 20)); return; }
 const s = search.toLowerCase();
 setFilteredProducts(products.filter(p =>
 p.name.toLowerCase().includes(s) || (p.barcode && p.barcode.includes(s))
 ).slice(0, 20));
 }, [search, products]);

 const addToCart = (p: Product, selectedUnitId?: number) => {
 // حساب إجمالي المخزون (حبة + وحدات محولة لحبة)
 const unitsTotal = (p.productUnits || []).reduce((s, u) => s + (u.unitStock * u.factor), 0);
 const totalStock = p.currentStock + unitsTotal;

 // تحقق إجمالي أولاّ
 if (!allowNegativeStock && totalStock <= 0) {
 showToast('الكمية نافذة بجميع المستويات ولا يمكن البيع');
 return;
 }

 // فلترة الوحدات السليمة فقط (التي لها unit مرتبطة)
 const validUnits = (p.productUnits || []).filter(u => u.unit && u.unitId);

 // إذا لم يختر وحدة وجاء بمنتج مع وحدات صالحة → اعرض مختار الوحدة
 if (!selectedUnitId && validUnits.length > 0) {
 setUnitPickerProduct(p);
 return;
 }

 // تحديد سعر واسم وعامل الوحدة
 let price = p.sellPrice;
 let unitName = p.unit?.name || 'حبة';
 let unitFactor = 1;
 let productUnitId: number | undefined = undefined;

 if (selectedUnitId && selectedUnitId > 0) {
 const pu = (p.productUnits || []).find(u => u.id === selectedUnitId);
 if (pu) {
 price = pu.sellPrice > 0 ? pu.sellPrice : p.sellPrice;
 unitName = pu.unit?.name || 'وحدة';
 unitFactor = pu.factor;
 productUnitId = pu.id;
 }
 }

 const existing = cart.find(c => c.productId === p.id && c.productUnitId === productUnitId);
 if (existing) {
 if (!allowNegativeStock && existing.quantity + 1 > totalStock / unitFactor) {
 showToast('الكمية المطلوبة تتجاوز المخزون المتاح');
 return;
 }
 setCart([
 { ...existing, quantity: existing.quantity + 1 },
 ...cart.filter(c => !(c.productId === p.id && c.productUnitId === productUnitId))
 ]);
 } else {
 setCart([{
 productId: p.id,
 productName: p.name,
 price,
 quantity: 1,
 discountRate: 0,
 taxRate: p.taxRate ?? 15,
 stock: totalStock,
 unitName,
 categoryId: p.categoryId,
 productUnitId,
 unitFactor,
 totalUnitStock: totalStock,
 }, ...cart]);
 }
 setUnitPickerProduct(null);
 setSearch('');
 searchRef.current?.focus();
 };

 const updateCartItem = (idx: number, field: string, value: number) => {
 if (!allowNegativeStock && field === 'quantity') {
 const item = cart[idx];
 if (value > item.stock) {
 showToast('الكمية المطلوبة تتجاوز المخزون المتاح');
 return;
 }
 }
 setCart(cart.map((c, i) => i === idx ? { ...c, [field]: value } : c));
 };

 const removeCartItem = (idx: number) => {
 setCart(cart.filter((_, i) => i !== idx));
 };

 // Calculations
 const subtotal = cart.reduce((sum, item) => {
 const itemTotal = item.quantity * item.price;
 const disc = itemTotal * (item.discountRate / 100) + (item.discountValue || 0);
 return sum + Math.max(0, itemTotal - disc);
 }, 0);
 const maxAllowedDiscount = (() => {
 if (!discountEnabled) return 0;
 if (discountRules.length === 0) return Infinity;
 const applicableRules = discountRules.filter(r => r.minAmount <= subtotal);
 if (applicableRules.length === 0) return 0;
 return Math.max(...applicableRules.map(r => r.maxDiscount));
 })();
 const maxAllowedDiscountPercent = (() => {
 if (!discountEnabled) return 0;
 if (discountRules.length === 0) return 100;
 const applicableRules = discountRules.filter(r => r.minAmount <= subtotal);
 if (applicableRules.length === 0) return 0;
 return Math.max(...applicableRules.map(r => r.maxDiscountPercent || 0));
 })();
 const regularDiscountValue = subtotal * (discountRate / 100) + discountValueState;
 let afterDiscount = subtotal - regularDiscountValue;

 let couponDiscountValue = 0;
 if (appliedCoupon) {
 if (appliedCoupon.type === 'percentage') {
 couponDiscountValue = afterDiscount * (appliedCoupon.value / 100);
 } else {
 couponDiscountValue = appliedCoupon.value;
 if (couponDiscountValue > afterDiscount) couponDiscountValue = afterDiscount;
 }
 }
 afterDiscount = afterDiscount - couponDiscountValue;

 const actualTaxRate = taxEnabled ? taxRate : 0;
 // Tax Inclusive (شاملة): الضريبة مدمجة في السعر — نستخرجها
 // Tax Exclusive (غير شاملة): نضيف الضريبة فوق السعر
 const taxValue = isTaxInclusive
 ? afterDiscount * actualTaxRate / (100 + actualTaxRate)
 : afterDiscount * (actualTaxRate / 100);
 const total = isTaxInclusive ? afterDiscount : afterDiscount + taxValue;
 const totalDiscountValue = regularDiscountValue + couponDiscountValue;

 // قيمة عرض المجموع الفرعي:
 // عند الشاملة: نعرض السعر قبل الضريبة (مُستخرج) = afterDiscount - taxValue
 // عند غير الشاملة: نعرض المجموع العادي = subtotal
 const displaySubtotal = (isTaxInclusive && taxEnabled && actualTaxRate > 0)
 ? afterDiscount - taxValue // السعر قبل الضريبة (ينقص عن السعر الأصلي)
 : subtotal;

 const applyCoupon = async () => {
 if (!couponCode) return;
 setCouponApplying(true);
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/coupons/validate', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({ code: couponCode, cartTotal: subtotal - regularDiscountValue }),
 });
 const data = await res.json();
 if (res.ok) {
 setAppliedCoupon({ code: data.code, type: data.discountType, value: data.discountValue });
 showToast(t('sys.str_864'));
 } else {
 showToast(`❌ ${data.error}`);
 setAppliedCoupon(null);
 }
 } catch {
 showToast(t('sys.str_419'));
 } finally {
 setCouponApplying(false);
 }
 };

 const fmt = (v: number) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

 const handleSave = async (print = false, whatsapp = false) => {
 if (cart.length === 0) return;

 // --- BNPL INTERCEPTION STAGE ---
 if ((paymentType === 'TABBY' || paymentType === 'TAMARA') && !bnplOrderId) {
 setSaving(true);
 try {
 const token = localStorage.getItem('token');
 const reqBody = {
 provider: paymentType.toLowerCase(),
 amount: total,
 phone: customers.find(c => c.id.toString() === customerId)?.phone || '0500000000',
 customerName: customers.find(c => c.id.toString() === customerId)?.name || t('sys.str_814'),
 items: cart.map(c => ({ name: c.productName, quantity: c.quantity, price: c.price, id: c.productId }))
 };
 // Create BNPL Payment Session before saving invoice locally
 const res = await fetch(`/api/pos/bnpl`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify(reqBody)
 });
 const data = await res.json();
 if (data.success) {
 setBnplUrl(data.webUrl);
 setBnplOrderId(data.sessionId);
 setBnplProvider(paymentType === 'TABBY' ? 'TABBY' : 'TAMARA');
 setBnplPolling(true); // Begin auto polling!
 } else {
 showToast(t('sys.str_815') + (data.error || ''));
 }
 } catch (e) {
 showToast(t('sys.str_816'));
 } finally {
 setSaving(false);
 }
 return; // stop standard saving process until BNPL is cleared
 }
 // -------------------------------

 setSaving(true);
 try {
 const token = localStorage.getItem('token');
 const user = JSON.parse(localStorage.getItem('user') || '{}');

 // For card payments with POS terminal: confirm payment FIRST
 if (paymentType === 'card' && posPort) {
 showToast(t('sys.str_817'));
 const result = await sendToPos(total);
 if (result === 'declined') {
 showToast(t('sys.str_818'));
 setRetryPosAmount(total); setRetryInvoiceNo('');
 setSaving(false);
 return; // DO NOT save invoice
 } else if (result === 'error') {
 showToast(t('sys.str_819'));
 setRetryPosAmount(total); setRetryInvoiceNo('');
 setSaving(false);
 return; // DO NOT save invoice
 }
 // approved or no_device → proceed to save
 }

 const invoiceDataBody = {
 customerId: customerId || null,
 stockId: stockId || '1',
 items: cart.map(c => ({
 productId: c.productId, productName: c.productName,
 quantity: c.quantity, price: c.price, discountRate: c.discountRate,
 productUnitId: c.productUnitId,
 unitFactor: c.unitFactor,
 })),
 discountRate,
 paymentType,
 isTaxInclusive,
 taxRate: actualTaxRate,
 splitCash: paymentType === 'split' ? parseFloat(splitCash) || 0 : undefined,
 splitCard: paymentType === 'split' ? parseFloat(splitCard) || 0 : undefined,
 paid: paymentType === 'split' ? (parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0) : (paidAmount ? parseFloat(paidAmount) : total),
 userId: user.id,
 notes: bnplOrderId ? notes + `
BNPL_REF:${bnplOrderId} [${paymentType}]` : notes,
 manualInvoiceNo: manualInvoiceNo ? parseInt(manualInvoiceNo) : undefined,
 manualDate: manualDate || undefined,
 total: total, // For SQLite pending totals
 };

 const data = await saveInvoiceWithSync(invoiceDataBody, '/api/sales');
 const res = { ok: data && data.success };
 if (res.ok) {
 const invoice = data.offline ? { id: data.uuid, invoiceNo: data.uuid, date: new Date().toISOString() } : data;
 if (paymentType === 'card' && posPort) {
 showToast(`✅ تم الدفع وحفظ الفاتورة #${invoice.invoiceNo}`);
 } else if (bnplOrderId) {
 showToast(`✅ تم تأكيد الدفعة المجزأة وحفظ الفاتورة #${invoice.invoiceNo}`);
 } else {
 showToast(`✅ تم حفظ الفاتورة #${invoice.invoiceNo}`);
 }
 setBnplOrderId(''); setBnplUrl(''); setBnplProvider(null); setBnplPolling(false);
 setRetryPosAmount(null); setRetryInvoiceNo('');
 if (print) {
 await dispatchKitchenPrinters(invoice, cart);
 const cust = invoice.customer || customers.find((c: any) => c.id.toString() === customerId);
 const customerName = cust?.name || t('sys.str_752');
 setLastInvoiceData({
 invoiceId: invoice.id,
 invoiceNumber: invoice.invoiceNo,
 date: invoice.date, // Use the server-generated date
 customerName,
 customerTaxNo: cust?.taxNumber,
 customerCrNo: cust?.crNo,
 customerAddress: cust?.address,
 paymentMethod: paymentType,
 items: cart.map((c: any) => {
      const itemPrice = (isTaxInclusive && taxEnabled && actualTaxRate > 0) 
          ? c.price / (1 + actualTaxRate / 100) 
          : c.price;
      const itemTotal = (isTaxInclusive && taxEnabled && actualTaxRate > 0)
          ? (c.quantity * c.price * (1 - c.discountRate / 100)) / (1 + actualTaxRate / 100)
          : c.quantity * c.price * (1 - c.discountRate / 100);
      return {
          name: c.productName,
          quantity: c.quantity,
          price: itemPrice,
          total: itemTotal,
      };
  }),
 subtotal: displaySubtotal,
 discount: totalDiscountValue,
 taxRate: 15,
 taxAmount: taxValue,
 grandTotal: total,
 docType: cust?.taxNumber ? 'standard_invoice' : 'simplified_invoice',
 });
 setShowReceipt(true);
 }
 // Open cash drawer for cash payments
 if (paymentType === 'cash') {
 try {
 const drawerCmd = '\x1B\x70\x00\x19\xFA';
 const blob = new Blob([drawerCmd], { type: 'application/octet-stream' });
 const url = URL.createObjectURL(blob);
 const iframe = document.createElement('iframe');
 iframe.style.display = 'none';
 iframe.src = url;
 document.body.appendChild(iframe);
 setTimeout(() => { document.body.removeChild(iframe); URL.revokeObjectURL(url); }, 2000);
 } catch (e) { console.warn('Cash drawer open skipped:', e); }
 }
 // Send to WhatsApp via automated CRM bot
 if (whatsapp && customers.find(c => c.id.toString() === customerId)?.phone) {
 const customerName = customers.find(c => c.id.toString() === customerId)?.name || t('sys.str_752');
 const customerPhone = customers.find(c => c.id.toString() === customerId)?.phone || '';
 
 const itemsText = cart.map((c, i) =>
 `${i + 1}. ${c.productName} × ${c.quantity} = ${fmt(c.quantity * c.price * (1 - c.discountRate / 100))} ر.س`
 ).join('\n');
 
 const text = `🧾 *فاتورة مبيعات #${invoice.invoiceNo}*\n` +
 `📅 ${new Date().toLocaleDateString('en-GB')}\n` +
 `👤 ${customerName}\n\n` +
 `📦 *الأصناف:*\n${itemsText}\n\n` +
 `💰 المجموع: ${fmt(subtotal)} ر.س\n` +
 `📊 الضريبة: ${fmt(taxValue)} ر.س\n` +
 `✅ *الإجمالي: ${fmt(total)} ر.س*\n\n` +
 t('sys.str_865');

 // إرسال عبر الـ CRM Bot بدلاً من فتح تطبيق واتساب للمستخدم
 fetch('/api/crm/whatsapp', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({
 phone: customerPhone,
 message: text,
 invoiceId: invoice.id,
 type: 'invoice'
 })
 }).then(r => r.json()).then(res => {
 if (res.success) {
 showToast(t('sys.str_4329'));
 } else {
 // التراجع للطريقة اليدوية في حال فشل البوت
 console.warn('Bot Failed, falling back to manual whatsapp');
 const url = `https://wa.me/${customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
 window.open(url, '_blank');
 }
 }).catch(err => console.error('WhatsApp Bot Error', err));
 }
 setCart([]); setDiscountRate(0); setNotes(''); setPaidAmount(''); setCustomerId(''); setAppliedCoupon(null); setCouponCode('');
 setSplitCash(''); setSplitCard(''); 
 setManualInvoiceNo(''); setManualDate('');
 fetchProducts();
 } else {
 showToast(t('sys.str_4330'));
 }
 } catch (err) {
 console.error(err);
 showToast(t('sys.str_419'));
 } finally {
 setSaving(false);
 }
 };

 const showToast = (msg: string) => {
 setToast(msg);
 setTimeout(() => setToast(''), 3000);
 };

 const handleNewInvoice = () => {
 setCart([]); setDiscountRate(0); setNotes(''); setPaidAmount(''); setCustomerId(''); setAppliedCoupon(null); setCouponCode('');
 setSplitCash(''); setSplitCard('');
 setManualInvoiceNo(''); setManualDate('');
 setRetryPosAmount(null); setRetryInvoiceNo('');
 searchRef.current?.focus();
 };

 // Hold / Recall Invoice
 const holdInvoice = () => {
 if (cart.length === 0) { showToast(t('sys.str_822')); return; }
 const now = new Date();
 const held: HeldInvoice = {
 id: Date.now().toString(),
 cart: [...cart],
 customerId,
 notes,
 discountRate,
 paidAmount,
 paymentType,
 heldAt: now.toISOString(),
 label: `${cart.length} صنف - ${now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
 };
 const updated = [...heldInvoices, held];
 setHeldInvoices(updated);
 localStorage.setItem('heldInvoices', JSON.stringify(updated));
 setCart([]); setDiscountRate(0); setNotes(''); setPaidAmount(''); setCustomerId(''); setAppliedCoupon(null); setCouponCode('');
 showToast(`⏸️ تم تعليق الفاتورة (${held.label})`);
 searchRef.current?.focus();
 };

 const recallInvoice = (heldId: string) => {
 const held = heldInvoices.find(h => h.id === heldId);
 if (!held) return;
 // If current cart has items, hold it first
 if (cart.length > 0) {
 holdInvoice();
 }
 setCart(held.cart);
 setCustomerId(held.customerId);
 setNotes(held.notes);
 setDiscountRate(held.discountRate);
 setPaidAmount(held.paidAmount);
 setPaymentType(held.paymentType);
 const updated = heldInvoices.filter(h => h.id !== heldId);
 setHeldInvoices(updated);
 localStorage.setItem('heldInvoices', JSON.stringify(updated));
 setShowHeldPanel(false);
 showToast(t('sys.str_4331'));
 };

 const deleteHeldInvoice = (heldId: string) => {
 const updated = heldInvoices.filter(h => h.id !== heldId);
 setHeldInvoices(updated);
 localStorage.setItem('heldInvoices', JSON.stringify(updated));
 showToast(t('sys.str_4332'));
 };

 // Invoice History
 const fetchHistory = async () => {
 setHistoryLoading(true);
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/sales', { headers: { Authorization: `Bearer ${token}` } });
 if (res.ok) { const d = await res.json(); setHistoryInvoices(Array.isArray(d) ? d : []); }
 } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
 finally { setHistoryLoading(false); }
 };

 const openHistory = () => { setShowHistory(true); fetchHistory(); };

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const reprintInvoice = (inv: any) => {
 const items = (inv.details || []).map((d: { productName: string; quantity: number; price: number; discountRate: number; total: number }) => ({
 name: d.productName, quantity: d.quantity, price: d.price,
 total: d.quantity * d.price * (1 - (d.discountRate || 0) / 100),
 }));
 setLastInvoiceData({
 invoiceId: inv.id, invoiceNumber: String(inv.invoiceNo),
 date: inv.date, customerName: inv.customer?.name || t('sys.str_752'),
 customerTaxNo: inv.customer?.taxNumber,
 customerCrNo: null,
 customerAddress: inv.customer?.address,
 paymentMethod: inv.paymentType, items,
 subtotal: inv.subtotal, discount: inv.discountValue || 0,
 taxRate: actualTaxRate, taxAmount: inv.taxValue, grandTotal: inv.total,
 });
 setShowReceipt(true);
 setSelectedInvoice(null);
 };

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const printVoucher = (inv: any) => {
 setSelectedVoucherData({
 receiptNumber: String(Date.now()).slice(-6), // Optional or generated
 invoiceNumber: String(inv.invoiceNo),
 date: inv.date,
 customerName: inv.customer?.name || t('sys.str_752'),
 customerTaxNo: inv.customer?.taxNumber,
 customerCrNo: inv.customer?.crNo,
 customerAddress: inv.customer?.address,
 amount: inv.total,
 paymentMethod: inv.paymentType,
 });
 setShowVoucher(true);
 setSelectedInvoice(null);
 };

 // WhatsApp Send (CRM Bot or Manual Fallback)
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const sendWhatsApp = async (inv: any) => {
 const phone = inv.customer?.phone || '';
 if (!phone) {
 showToast(t('sys.str_825'));
 return;
 }

 const items = (inv.details || []).map((d: { productName: string; quantity: number; price: number; total: number }, i: number) =>
 `${i + 1}. ${d.productName} × ${d.quantity} = ${fmt(d.total)} ر.س`
 ).join('\n');
 const text = `🧾 *فاتورة مبيعات #${inv.invoiceNo}*\n` +
 `📅 ${new Date(inv.date).toLocaleDateString('en-GB')}\n` +
 `👤 ${inv.customer?.name || t('sys.str_752')}\n\n` +
 `📦 *الأصناف:*\n${items}\n\n` +
 `💰 المجموع: ${fmt(inv.subtotal)} ر.س\n` +
 `📊 الضريبة: ${fmt(inv.taxValue)} ر.س\n` +
 `✅ *الإجمالي: ${fmt(inv.total)} ر.س*\n\n` +
 t('sys.str_865');
 
 showToast(t('sys.str_826'));
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/crm/whatsapp', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({ phone, message: text, invoiceId: inv.id, type: 'invoice' })
 });
 const data = await res.json();
 if (data.success) {
 showToast(t('sys.str_827'));
 } else {
 throw new Error(data.error || t('sys.str_828'));
 }
 } catch (err) {
 console.warn('Falling back to manual WhatsApp link', err);
 const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
 window.open(url, '_blank');
 }
 };

 const retryPosPayment = async () => {
 if (!retryPosAmount || !posPort) return;
 setSaving(true);
 showToast(t('sys.str_829'));
 const result = await sendToPos(retryPosAmount);
 if (result === 'approved') {
 handleSave(false);
 return;
 } else {
 showToast(t('sys.str_830'));
 }
 setSaving(false);
 };

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const deleteInvoice = async (inv: any) => {
 if (!confirm(`هل أنت متأكد من حذف الفاتورة #${inv.invoiceNo}؟ سيتم استرجاع المخزون وحذف قيد الخزينة.`)) return;
 try {
 const token = localStorage.getItem('token');
 const res = await fetch(`/api/sales?id=${inv.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
 if (res.ok) {
 showToast(`✅ تم حذف الفاتورة #${inv.invoiceNo}`);
 setSelectedInvoice(null);
 fetchHistory();
 } else {
 const data = await res.json();
 showToast(`❌ ${data.error || t('sys.str_831')}`);
 }
 } catch { showToast(t('sys.str_419')); }
 };

 return (
 <>
 
 <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
 <OfflineBadge />
 <h1 className="page-title" style={{ margin: 0 }}>{t('sys.str_4321')}</h1>
 <button id="returns-btn" type="button" onClick={() => setShowReturnsModal(true)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', fontSize: '12px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
 ↩ {'استرجاع مباشر'}
 </button>
 </div>
 <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
 <button className="btn btn-ghost btn-sm" onClick={handleNewInvoice} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
 <span>✖</span> {t('sys.str_742')} <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>Esc</kbd>
 </button>
 <button id="hold-btn" className="btn btn-ghost btn-sm" onClick={holdInvoice} disabled={cart.length === 0}
 style={{ color: 'var(--warning)', display: 'flex', gap: '6px', alignItems: 'center' }}>
 <span>⏸️</span> {t('sys.str_743')} <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>F3</kbd>
 </button>
 <button id="recall-btn" className="btn btn-ghost btn-sm" onClick={() => setShowHeldPanel(true)}
 style={{ position: 'relative', color: heldInvoices.length > 0 ? 'var(--primary)' : undefined, display: 'flex', gap: '6px', alignItems: 'center' }}>
 <span>📋</span> {t('sys.str_744')} <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>F4</kbd>
 {heldInvoices.length > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--danger)', color: '#fff', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>{heldInvoices.length}</span>}
 </button>
 <button className={`btn btn-sm ${voidMode ? 'btn-primary' : 'btn-ghost'}`}
 onClick={() => { setVoidMode(!voidMode); showToast(voidMode ? t('sys.str_832') : t('sys.str_833')); }}
 style={{ color: voidMode ? '#fff' : 'var(--danger)', background: voidMode ? 'var(--danger)' : undefined, display: 'flex', gap: '6px', alignItems: 'center' }}>
 <span>🗑️</span> {t('sys.str_745')}
 </button>
 <button id="history-btn" className="btn btn-ghost btn-sm" onClick={openHistory} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
 <span>🕒</span> {t('sys.str_4322')} <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>F9</kbd>
 </button>
 </div>
 </div>

 {/* ---------- BNPL POLLING MODAL ---------- */}
 {bnplProvider && bnplUrl && (
 <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
 <div style={{ background: '#111', padding: '30px', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center', border: `2px solid ${bnplProvider === 'TABBY' ? '#3eede7' : '#ff796e'}` }}>
 <h2 style={{ color: bnplProvider === 'TABBY' ? '#3eede7' : '#ff796e', marginBottom: '10px' }}>
 {bnplProvider === 'TABBY' ? t('sys.str_834') : t('sys.str_835')}
 </h2>
 <p style={{ color: '#aaa', marginBottom: '20px' }}>{t('sys.str_747')}</p>
 
 <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', display: 'inline-block', marginBottom: '20px' }}>
 <QRCodeCanvas value={bnplUrl} size={250} level="H" includeMargin />
 </div>
 
 <div style={{ marginBottom: '20px' }}>
 {bnplPolling ? (
 <p style={{ color: '#fbbf24', fontSize: '14px', animation: 'pulse 2s infinite' }}>{t('sys.str_748')}{bnplProvider}...</p>
 ) : (
 <p style={{ color: '#ef4444', fontSize: '14px' }}>{t('sys.str_749')}</p>
 )}
 </div>

 <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
 <button 
 onClick={() => { setBnplPolling(false); setBnplProvider(null); setBnplUrl(''); setBnplOrderId(''); }}
 style={{ padding: '10px 15px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', flex: 1 }}
 >
 {t('sys.str_750')}</button>
 <button 
 id="bnpl-force-save"
 onClick={async () => {
 if(confirm(t('sys.str_836'))) {
 setBnplPolling(false);
 await handleSave();
 }
 }}
 style={{ padding: '10px 15px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', flex: 1 }}
 >
 {t('sys.str_751')}</button>
 </div>
 </div>
 </div>
 )}
 {/* -------------------------------------- */}

 <div className="page-content">
 <div className="pos-layout" style={{ gridTemplateColumns: '1fr' }}>
 {/* Invoice Panel */}
 <div className="pos-invoice" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
 {/* Invoice Header */}
 <div className="pos-invoice-header" style={{ flexWrap: 'wrap' }}>
 {/* Smart Unified Search Bar */}
 <div style={{ position: 'relative', zIndex: 20, flex: '1 1 300px', display: 'flex', gap: '8px' }}>
 <div style={{ position: 'relative', flex: 1 }}>
 <input
 ref={searchRef}
 className="input"
 placeholder={t('sys.str_846')}
 value={search}
 onChange={e => {
 setSearch(e.target.value);
 setShowTypeahead(true);
 setFocusedProductIndex(-1);
 }}
 onFocus={() => setShowTypeahead(true)}
 // Delay blur so click events on typeahead can fire
 onBlur={() => setTimeout(() => setShowTypeahead(false), 200)}
 onKeyDown={e => {
 if (e.key === 'ArrowDown') {
 e.preventDefault();
 setFocusedProductIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
 setShowTypeahead(true);
 } else if (e.key === 'ArrowUp') {
 e.preventDefault();
 setFocusedProductIndex(prev => Math.max(prev - 1, -1));
 } else if (e.key === 'Enter') {
 e.preventDefault();
 if (filteredProducts.length > 0) {
 const idxToSelect = focusedProductIndex >= 0 ? focusedProductIndex : 0;
 addToCart(filteredProducts[idxToSelect]);
 setShowTypeahead(false);
 setFocusedProductIndex(-1);
 }
 }
 }}
 style={{ width: '100%', fontSize: '15px', padding: '10px 16px', fontWeight: 'bold', borderRadius: '8px', border: '2px solid var(--primary)' }}
 />
 {/* Typeahead Dropdown */}
 {showTypeahead && search.trim() && (
 <div style={{
 position: 'absolute',
 top: '100%',
 left: 0,
 right: 0,
 marginTop: '4px',
 background: 'var(--bg-card)',
 border: '1px solid var(--border)',
 borderRadius: '8px',
 boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
 maxHeight: '300px',
 overflowY: 'auto'
 }}>
 {filteredProducts.length > 0 ? (
 filteredProducts.map((p, index) => (
 <div 
 key={p.id} 
 style={{ 
 padding: '12px 16px', 
 borderBottom: '1px solid var(--border)', 
 cursor: 'pointer',
 background: index === focusedProductIndex ? 'var(--bg-card-hover)' : 'transparent',
 display: 'flex',
 justifyContent: 'space-between',
 alignItems: 'center'
 }}
 onClick={() => { addToCart(p); setShowTypeahead(false); }}
 onMouseEnter={() => setFocusedProductIndex(index)}
 >
 <div>
 <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{p.name}</div>
 <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.barcode || t('sys.str_421')} {t('sys.str_762')}{p.currentStock}</div>
 </div>
 <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{fmt(p.sellPrice)} {t('sys.str_68')}</div>
 </div>
 ))
 ) : (
 <div style={{ padding: '24px', textAlign: 'center' }}>
 <div style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>{t('sys.str_763')}</div>
 {allowAddProduct && <button className="btn btn-primary btn-sm" onClick={openAddProduct}>{t('sys.str_764')}</button>}
 </div>
 )}
 </div>
 )}
 </div>
 <button onClick={connectPosManual} title={posStatus === 'connected' ? t('sys.str_841') : posStatus === 'sending' ? t('sys.str_842') : t('sys.str_843')}
 style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: posStatus === 'connected' ? '#22c55e15' : posStatus === 'sending' ? '#f59e0b15' : 'transparent', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
 <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: posStatus === 'connected' ? '#22c55e' : posStatus === 'sending' ? '#f59e0b' : '#ef4444', display: 'inline-block' }}></span>
 {posStatus === 'connected' ? t('sys.str_844') : posStatus === 'sending' ? '⏳' : t('sys.str_845')}
 </button>
 </div>
 <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
 <select className="input" style={{ width: '180px' }}
 value={customerId} onChange={e => setCustomerId(e.target.value)}>
 <option value="">{t('sys.str_752')}</option>
 {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
 </select>
 <button onClick={() => setShowAddCustomer(true)} title={t('sys.str_837')}
 style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '700', minWidth: '34px' }}>+</button>
 </div>
 <select className="input" style={{ width: '100px', /* removed bg */ }}
 value={currencyId} onChange={e => {
 setCurrencyId(e.target.value);
 const c = currencies.find(x => x.id.toString() === e.target.value);
 if (c) setExchangeRate(c.exchangeRate);
 }}>
 <option value="" disabled>{t('purchases.str_1013')}</option>
 {currencies.filter(c => c.isActive).map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
 </select>
 <select className="input" style={{ width: '140px' }} value={stockId} onChange={e => setStockId(e.target.value)}>
 <option value="1">{t('sys.str_753')}</option>
 {warehouses.filter(w => w.id !== 1).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
 </select>
 <select className="input" style={{ width: '140px' }}
 value={paymentType} onChange={e => setPaymentType(e.target.value)}>
 <option value="cash">{t('sys.str_754')}</option>
 <option value="card">{t('sys.str_755')}</option>
 <option value="transfer">{t('sys.str_756')}</option>
 <option value="split">{t('sys.str_757')}</option>
 <option value="TABBY">{t('sys.str_758')}</option>
 <option value="TAMARA">{t('sys.str_759')}</option>
 {isAdmin && <option value="credit">{t('sys.str_760')}</option>}
 {isAdmin && <option value="installment">{t('sys.str_761')}</option>}
 </select>
 <input className="input" type="number" placeholder={t('sys.str_4333')} value={manualInvoiceNo} onChange={e => setManualInvoiceNo(e.target.value)} style={{ width: '180px' }} title={t('sys.str_4334')} />
 <input className="input" type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} style={{ width: '150px' }} title={t('sys.str_4335')} />
 </div>

 {/* Cart Table */}
 {voidMode && <div style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid var(--danger)', borderRadius: '8px', padding: '8px 12px', marginBottom: '8px', textAlign: 'center', fontWeight: '700', color: 'var(--danger)', fontSize: '13px', animation: 'pulse 1.5s infinite' }}>{t('sys.str_765')}</div>}
 <div className="pos-invoice-table">
 <table className="table">
 <thead>
 <tr>
 <th>{t('sys.str_63')}</th>
 <th style={{ width: '80px' }}>{t('sys.str_64')}</th>
 <th style={{ width: '100px' }}>{t('sys.str_65')}</th>
 
 <th style={{ width: '100px' }}>{t('sys.str_66')}</th>
 <th style={{ width: '40px' }}></th>
 </tr>
 </thead>
 <tbody>
 {cart.length === 0 ? (
 <tr>
 <td colSpan={5}>
 <div className="empty-state" style={{ padding: '40px' }}>
 <div className="empty-state-icon">🧾</div>
 <div className="empty-state-text">{t('purchases.str_981')}</div>
 </div>
 </td>
 </tr>
 ) : cart.map((item, idx) => {
 const itemSub = item.quantity * item.price;
 const itemDisc = itemSub * (item.discountRate / 100) + (item.discountValue || 0);
 const itemTotal = Math.max(0, itemSub - itemDisc);
 return (
 <tr key={idx} onClick={() => voidMode && removeCartItem(idx)}
 style={{ cursor: voidMode ? 'pointer' : undefined, background: voidMode ? 'rgba(239,68,68,0.05)' : undefined, transition: 'all 0.2s' }}>
 <td>
 <div style={{ fontWeight: '600', fontSize: '13px', color: voidMode ? 'var(--danger)' : undefined }}>
 {voidMode && '❌ '}{item.productName}
 </div>
 </td>
 <td>
 <input className="input qty-input" type="number" min="0.01" step="0.01"
 value={item.quantity} onChange={e => updateCartItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
 style={{ textAlign: 'center', padding: '6px 8px' }} dir="ltr" />
 </td>
 <td>
 <span style={{ display: 'block', textAlign: 'center', padding: '6px 8px', fontWeight: '600', color: 'var(--text-primary)' }} dir="ltr">{fmt(item.price)}</span>
 </td>
 <td style={{ fontWeight: '600' }}>{fmt(itemTotal)}</td>
 <td>
 <button onClick={() => removeCartItem(idx)}
 style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '16px' }}>✕</button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>

 {/* Totals & Actions */}
 <div className="pos-invoice-footer">
 <div className="pos-totals">
 <div className="pos-total-row">
 <span>
 {t('sys.str_768')}
 {isTaxInclusive && taxEnabled && actualTaxRate > 0 && (
 <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '6px', fontWeight: 'normal' }}>(قبل الضريبة)</span>
 )}
 </span>
 <span>{fmt(displaySubtotal)} {t('sys.str_68')}</span>
 </div>
 {discountEnabled && (
 <div className="pos-total-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
 <span>{t('sys.str_769')}</span>
 <input className="input" type="number" min="0" step="0.01"
 id="discount-input"
 value={discountRate} onChange={e => {
 const val = parseFloat(e.target.value) || 0;
 if (discountRules.length > 0 && val > maxAllowedDiscountPercent) {
 showToast(`❌ عذراً، أقصى نسبة خصم مسموحة هي ${maxAllowedDiscountPercent}%`);
 return;
 }
 setDiscountRate(val);
 }}
 onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); showToast(`✅ تم تطبيق خصم ${discountRate}%`); } }}
 style={{ width: '70px', textAlign: 'center', padding: '6px 8px', fontWeight: '700' }} dir="ltr" />
 <span style={{ fontSize: '14px', fontWeight: '600' }}>%</span>
 <input className="input" type="number" min="0" step="0.01"
 placeholder="خصم بالريال"
 value={discountValueState} 
 onChange={e => {
 const val = parseFloat(e.target.value) || 0;
 if (discountRules.length > 0 && val > maxAllowedDiscount) {
 showToast(`❌ عذراً، أقصى خصم بالريال مسموح لهذه الفاتورة هو ${maxAllowedDiscount} ريال`);
 return;
 }
 setDiscountValueState(val);
 }}
 onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); showToast(`✅ تم تطبيق خصم ${discountValueState} ر.س`); } }}
 style={{ width: '90px', textAlign: 'center', padding: '6px 8px', fontWeight: '700', marginLeft: '10px' }} dir="ltr" />
 <span style={{ fontSize: '14px', fontWeight: '600' }}>ر.س</span>
 <button onClick={() => { if (discountRate > 0) { showToast(`✅ تم تطبيق خصم ${discountRate}% = ${fmt(regularDiscountValue)} ر.س`); } }}
 style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: discountRate > 0 ? 'var(--primary)' : 'var(--bg-card-hover)', color: discountRate > 0 ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s' }}>
 {t('sys.str_770')}</button>
 {(discountRate > 0 || discountValueState > 0) && (
 <button onClick={() => { setDiscountRate(0); setDiscountValueState(0); showToast(t('sys.str_847')); }}
 style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
 {t('sys.str_771')}</button>
 )}
 <span style={{ marginRight: 'auto', fontWeight: '600', color: discountRate > 0 ? '#ef4444' : 'var(--text-muted)' }}>
 {(discountRate > 0 || discountValueState > 0) ? `- ${fmt(regularDiscountValue)}` : '0.00'} {t('sys.str_68')}</span>
 </div>
 )}
 {couponsEnabled && (
 <div className="pos-total-row" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
 <span>{t('sys.str_772')}</span>
 <input className="input" type="text"
 value={couponCode} onChange={e => setCouponCode(e.target.value)}
 onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
 placeholder={t('sys.str_848')}
 style={{ width: '100px', textAlign: 'center', padding: '6px 8px', fontWeight: '700', textTransform: 'uppercase' }} dir="ltr" disabled={!!appliedCoupon} />
 
 {!appliedCoupon ? (
 <button onClick={applyCoupon} disabled={couponApplying || !couponCode}
 style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', background: couponCode ? 'var(--primary)' : 'var(--bg-card-hover)', color: couponCode ? '#fff' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s' }}>
 {couponApplying ? '⏳' : t('sys.str_849')}
 </button>
 ) : (
 <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); showToast(t('sys.str_850')); }}
 style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
 {t('sys.str_771')}</button>
 )}
 <span style={{ marginRight: 'auto', fontWeight: '600', color: appliedCoupon ? '#ef4444' : 'var(--text-muted)' }}>
 {appliedCoupon ? `- ${fmt(couponDiscountValue)}` : '0.00'} {t('sys.str_68')}</span>
 </div>
 )}
 {taxEnabled && (
 <div className="pos-total-row">
 <span>
 {t('sys.str_773')} ({actualTaxRate}%)
 {isTaxInclusive && (
 <span style={{ fontSize: '11px', color: '#f59e0b', marginRight: '6px', fontWeight: '600' }}>مستخرجة</span>
 )}
 </span>
 <span>{fmt(taxValue)} {t('sys.str_68')}</span>
 </div>
 )}
 <div className="pos-total-row grand">
 <span>{t('sys.str_66')}</span>
 <span style={{ color: 'var(--primary-light)' }}>{fmt(total)} {t('sys.str_68')}</span>
 </div>
 {(paymentType === 'cash' || paymentType === 'credit' || paymentType === 'installment') && (
 <>
 <div className="pos-total-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <span>{t('sys.str_774')}</span>
 <input className="input" type="number" min="0" step="0.01"
 value={paidAmount} onChange={e => setPaidAmount(e.target.value)}
 placeholder={fmt(total)} style={{ width: '120px', textAlign: 'center', padding: '4px 8px' }} dir="ltr" />
 </div>
 {paymentType === 'cash' && paidAmount && parseFloat(paidAmount) > total && (
 <div className="pos-total-row" style={{ background: 'rgba(34,197,94,0.1)', borderRadius: '6px', padding: '8px' }}>
 <span style={{ fontWeight: '700', color: '#22c55e' }}>{t('sys.str_775')}</span>
 <span style={{ fontWeight: '700', fontSize: '18px', color: '#22c55e', fontFamily: 'monospace' }}>{fmt(parseFloat(paidAmount) - total)} {t('sys.str_68')}</span>
 </div>
 )}
 </>
 )}
 {paymentType === 'split' && (
 <>
 <div className="pos-total-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <span>{t('sys.str_776')}</span>
 <input className="input" type="number" min="0" step="0.01"
 value={splitCash} onChange={e => {
 const val = parseFloat(e.target.value) || 0;
 setSplitCash(e.target.value);
 if (val < total) {
 setSplitCard((total - val).toFixed(2));
 } else {
 setSplitCard('0');
 }
 }}
 style={{ width: '120px', textAlign: 'center', padding: '4px 8px' }} dir="ltr" />
 </div>
 <div className="pos-total-row" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
 <span>{t('sys.str_777')}</span>
 <input className="input" type="number" min="0" step="0.01" disabled
 value={splitCard} 
 style={{ width: '120px', textAlign: 'center', padding: '4px 8px', background: '#f1f5f9', cursor: 'not-allowed' }} dir="ltr" />
 </div>
 {((parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0)) < total && (
 <div className="pos-total-row" style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: 'bold' }}>
 {t('sys.str_778')}</div>
 )}
 {((parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0)) > total && (
 <div className="pos-total-row" style={{ color: '#22c55e', fontSize: '13px', fontWeight: 'bold' }}>
 {t('sys.str_779')}{fmt(((parseFloat(splitCash) || 0) + (parseFloat(splitCard) || 0)) - total)} {t('sys.str_68')}</div>
 )}
 </>
 )}
 </div>

 <div className="pos-actions">
 {retryPosAmount ? (
 <>
 <button className="btn" onClick={retryPosPayment} disabled={saving}
 style={{ background: '#f59e0b', color: '#fff', fontWeight: '700', flex: 1, animation: 'pulse 1.5s infinite' }}>
 {saving ? t('sys.str_851') : `🔄 إعادة إرسال ${fmt(retryPosAmount)} لمدى`}
 </button>
 <button className="btn btn-ghost" onClick={() => { setRetryPosAmount(null); setRetryInvoiceNo(''); }}>{t('sys.str_780')}</button>
 </>
 ) : (
 <>
 <button id="save-btn" className="btn btn-primary" onClick={() => handleSave(false)} disabled={saving || cart.length === 0} style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
 {saving ? t('sys.str_852') : t('sys.str_455')} <kbd style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>F2</kbd>
 </button>
 <button className="btn btn-success" onClick={() => handleSave(true)} disabled={saving || cart.length === 0}>
 {t('sys.str_781')}</button>
 <button className="btn" onClick={() => handleSave(false, true)} disabled={saving || cart.length === 0}
 style={{ background: '#25D366', color: '#fff', fontWeight: '600' }}>
 {t('sys.str_782')}</button>
 <button className="btn btn-ghost" onClick={handleNewInvoice}>{t('sys.str_742')}</button>
 </>
 )}
 </div>

 <div style={{ marginTop: '12px' }}>
 <input className="input" value={notes} onChange={e => setNotes(e.target.value)}
 placeholder={t('sys.str_4336')} />
 </div>
 </div>
 </div>
 </div>
 </div>

 {toast && (
 <div className="toast-container">
 <div className={`toast ${toast.includes('✅') ? 'toast-success' : 'toast-error'}`}>
 {toast}
 </div>
 </div>
 )}

 {showReceipt && lastInvoiceData && (
 <InvoiceReceipt
 invoiceId={lastInvoiceData.invoiceId}
 invoiceData={lastInvoiceData}
 autoPrint={true}
 onClose={() => setShowReceipt(false)}
 />
 )}

 {/* Quick Add Customer Modal */}
 {showAddCustomer && (
 <div className="modal-overlay" onClick={() => setShowAddCustomer(false)}>
 <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
 <div className="modal-header">
 <h3>{t('sys.str_783')}</h3>
 <button className="modal-close" onClick={() => setShowAddCustomer(false)}>✕</button>
 </div>
 <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
 <input className="input" placeholder={t('sys.str_854')} value={newCust.name} onChange={e => setNewCust({ ...newCust, name: e.target.value })} autoFocus />
 <input className="input" placeholder={t('sys.str_855')} value={newCust.phone} onChange={e => setNewCust({ ...newCust, phone: e.target.value })} dir="ltr" />
 <input className="input" placeholder={t('sys.str_529')} value={newCust.taxNumber} onChange={e => setNewCust({ ...newCust, taxNumber: e.target.value })} dir="ltr" />
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
 <input className="input" placeholder={t('sys.str_537')} value={newCust.street} onChange={e => setNewCust({ ...newCust, street: e.target.value })} />
 <input className="input" placeholder={t('sys.str_538')} value={newCust.buildingNumber} onChange={e => setNewCust({ ...newCust, buildingNumber: e.target.value })} dir="ltr" />
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
 <input className="input" placeholder={t('sys.str_536')} value={newCust.district} onChange={e => setNewCust({ ...newCust, district: e.target.value })} />
 <input className="input" placeholder={t('sys.str_528')} value={newCust.city} onChange={e => setNewCust({ ...newCust, city: e.target.value })} />
 <input className="input" placeholder={t('sys.str_539')} value={newCust.postalCode} onChange={e => setNewCust({ ...newCust, postalCode: e.target.value })} dir="ltr" />
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
 <input className="input" type="number" placeholder={t('sys.str_540')} value={newCust.creditLimit} onChange={e => setNewCust({ ...newCust, creditLimit: e.target.value })} dir="ltr" />
 <select className="input" value={newCust.type} onChange={e => setNewCust({ ...newCust, type: e.target.value })}>
 <option value="0">{t('sys.str_532')}</option>
 <option value="1">{t('sys.str_533')}</option>
 <option value="2">{t('sys.str_784')}</option>
 </select>
 </div>
 <input className="input" placeholder={t('sys.str_465')} value={newCust.notes} onChange={e => setNewCust({ ...newCust, notes: e.target.value })} />
 </div>
 <div className="modal-footer">
 <button className="btn btn-ghost" onClick={() => setShowAddCustomer(false)}>{t('fin.str_206')}</button>
 <button className="btn btn-primary" onClick={saveNewCustomer} disabled={savingCust || !newCust.name.trim()}>
 {savingCust ? t('sys.str_852') : t('sys.str_455')}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Quick Add Product Modal */}
 {showAddProduct && (
 <div className="modal-overlay" onClick={() => setShowAddProduct(false)}>
 <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
 <div className="modal-header">
 <h3>{t('sys.str_764')}</h3>
 <button className="modal-close" onClick={() => setShowAddProduct(false)}>✕</button>
 </div>
 <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
 <input className="input" placeholder={t('sys.str_856')} value={newProd.name} onChange={e => setNewProd({ ...newProd, name: e.target.value })} autoFocus />
 <input className="input" placeholder={t('sys.str_857')} value={newProd.barcode} onChange={e => setNewProd({ ...newProd, barcode: e.target.value })} dir="ltr" />
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
 <div>
 <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t('sys.str_785')}</label>
 <input className="input" type="number" placeholder="0.00" value={newProd.buyPrice} onChange={e => setNewProd({ ...newProd, buyPrice: e.target.value })} dir="ltr" />
 </div>
 <div>
 <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t('sys.str_786')}</label>
 <input className="input" type="number" placeholder="0.00" value={newProd.sellPrice} onChange={e => setNewProd({ ...newProd, sellPrice: e.target.value })} dir="ltr" />
 </div>
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
 <div>
 <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t('sys.str_787')}</label>
 <input className="input" type="number" placeholder="15" value={newProd.taxRate} onChange={e => setNewProd({ ...newProd, taxRate: e.target.value })} dir="ltr" />
 </div>
 <div>
 <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{t('sys.str_788')}</label>
 <input className="input" type="number" placeholder="0" value={newProd.currentStock} onChange={e => setNewProd({ ...newProd, currentStock: e.target.value })} dir="ltr" />
 </div>
 </div>
 </div>
 <div className="modal-footer">
 <button className="btn btn-ghost" onClick={() => setShowAddProduct(false)}>{t('fin.str_206')}</button>
 <button className="btn btn-primary" onClick={saveNewProduct} disabled={savingProd || !newProd.name.trim() || !newProd.sellPrice}>
 {savingProd ? t('sys.str_852') : t('purchases.str_1040')}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Held Invoices Panel */}
 {showHeldPanel && (
 <div className="modal-overlay" onClick={() => setShowHeldPanel(false)}>
 <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
 <div className="modal-header">
 <h3>{t('sys.str_4323')}{heldInvoices.length})</h3>
 <button className="modal-close" onClick={() => setShowHeldPanel(false)}>✕</button>
 </div>
 <div className="modal-body">
 {heldInvoices.length === 0 ? (
 <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
 <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
 <div>{t('sys.str_4324')}</div>
 </div>
 ) : (
 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
 {heldInvoices.map(held => {
 const heldTotal = held.cart.reduce((s, item) => {
 const t = item.quantity * item.price;
 return s + (t - t * (item.discountRate / 100));
 }, 0);
 const heldWithTax = heldTotal + (heldTotal * (taxRate / 100));
 return (
 <div key={held.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div>
 <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>⏸️ {held.label}</div>
 <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
 {held.cart.map(c => c.productName).join(t('sys.str_859')).substring(0, 60)}{held.cart.map(c => c.productName).join(t('sys.str_859')).length > 60 ? '...' : ''}
 </div>
 <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary)', marginTop: '4px' }}>
 {t('sys.str_71')}{fmt(heldWithTax)} {t('sys.str_68')}</div>
 </div>
 <div style={{ display: 'flex', gap: '6px' }}>
 <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}
 onClick={() => recallInvoice(held.id)}>{t('sys.str_744')}</button>
 <button className="btn btn-ghost" style={{ padding: '8px 10px', fontSize: '13px', color: 'var(--danger)' }}
 onClick={() => deleteHeldInvoice(held.id)}>🗑️</button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 {/* Invoice History Modal */}
 {showHistory && !selectedInvoice && (
 <div className="modal-overlay" onClick={() => setShowHistory(false)}>
 <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
 <div className="modal-header">
 <h3>{t('sys.str_4325')}</h3>
 <button className="modal-close" onClick={() => setShowHistory(false)}>✕</button>
 </div>
 <div className="modal-body" style={{ overflow: 'auto', flex: 1 }}>
 {historyLoading ? (
 <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>{t('sys.str_792')}</div>
 ) : historyInvoices.length === 0 ? (
 <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
 <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
 <div>{t('sys.str_4326')}</div>
 </div>
 ) : (
 <table className="table" style={{ fontSize: '13px' }}>
 <thead>
 <tr>
 <th>#</th>
 <th>{t('fin.str_232')}</th>
 <th>{t('sys.str_794')}</th>
 <th>{t('sys.str_460')}</th>
 <th>{t('sys.str_795')}</th>
 <th>{t('sys.str_66')}</th>
 <th></th>
 </tr>
 </thead>
 <tbody>
 {historyInvoices.map((inv: any) => (
 <tr key={inv.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedInvoice(inv)}>
 <td style={{ fontWeight: '700' }}>#{inv.invoiceNo}</td>
 <td>{new Date(inv.date).toLocaleDateString('en-GB')}</td>
 <td>{new Date(inv.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
 <td>{inv.customer?.name || t('sys.str_752')}</td>
 <td>{inv.paymentType === 'cash' ? '💵' : inv.paymentType === 'card' ? '💳' : inv.paymentType === 'transfer' ? '🏦' : '📝'}</td>
 <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{fmt(inv.total)} {t('sys.str_68')}</td>
 <td><span style={{ fontSize: '16px' }}>◀</span></td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 </div>
 </div>
 )}

 {/* Invoice Detail Modal */}
 {selectedInvoice && (
 <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
 <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px' }}>
 <div className="modal-header">
 <h3>{t('sys.str_4327')}{selectedInvoice.invoiceNo}</h3>
 <button className="modal-close" onClick={() => setSelectedInvoice(null)}>✕</button>
 </div>
 <div className="modal-body">
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px', fontSize: '13px' }}>
 <div><strong>{t('sys.str_797')}</strong> {new Date(selectedInvoice.date).toLocaleDateString('en-GB')}</div>
 <div><strong>{t('sys.str_798')}</strong> {new Date(selectedInvoice.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
 <div><strong>{t('sys.str_799')}</strong> {selectedInvoice.customer?.name || t('sys.str_752')}</div>
 <div><strong>{t('sys.str_800')}</strong> {selectedInvoice.paymentType === 'cash' ? t('sys.str_860') : selectedInvoice.paymentType === 'card' ? t('sys.str_861') : selectedInvoice.paymentType === 'transfer' ? t('sys.str_862') : t('sys.str_863')}</div>
 </div>
 <table className="table" style={{ fontSize: '13px', marginBottom: '16px' }}>
 <thead><tr><th>{t('sys.str_801')}</th><th>{t('sys.str_64')}</th><th>{t('sys.str_65')}</th><th>{t('sys.str_66')}</th></tr></thead>
 <tbody>
 {(selectedInvoice.details || []).map((d: { id: number; productName: string; quantity: number; price: number; total: number }, i: number) => (
 <tr key={d.id || i}>
 <td>{d.productName}</td>
 <td>{d.quantity}</td>
 <td>{fmt(d.price)}</td>
 <td style={{ fontWeight: '600' }}>{fmt(d.total)}</td>
 </tr>
 ))}
 </tbody>
 </table>
 <div style={{ background: 'var(--bg-card-hover)', borderRadius: '10px', padding: '14px', fontSize: '13px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span>{t('sys.str_768')}</span><span>{fmt(selectedInvoice.subtotal)} {t('sys.str_68')}</span></div>
 {selectedInvoice.discountValue > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--danger)' }}><span>{t('sys.str_494')}</span><span>-{fmt(selectedInvoice.discountValue)} {t('sys.str_68')}</span></div>}
 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}><span>{t('sys.str_802')}</span><span>{fmt(selectedInvoice.taxValue)} {t('sys.str_68')}</span></div>
 <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '16px', borderTop: '1px solid var(--border)', paddingTop: '8px', color: 'var(--primary)' }}><span>{t('sys.str_66')}</span><span>{fmt(selectedInvoice.total)} {t('sys.str_68')}</span></div>
 </div>
 </div>
 <div className="modal-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
 <button className="btn btn-primary" onClick={() => reprintInvoice(selectedInvoice)}>{t('sys.str_4328')}</button>
 <button className="btn btn-primary" onClick={() => printVoucher(selectedInvoice)} style={{ background: '#3b82f6', borderColor: '#3b82f6' }}>{t('sys.str_804')}</button>
 <button className="btn btn-success" onClick={() => sendWhatsApp(selectedInvoice)} style={{ background: '#25D366' }}>{t('sys.str_805')}</button>
 {canDelete && (
 <FeatureGuard featureKey="sales_delete_invoice_btn">
 <button className="btn" onClick={() => deleteInvoice(selectedInvoice)} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '600' }}>{t('sys.str_806')}</button>
 </FeatureGuard>
 )}
 <button className="btn btn-ghost" onClick={() => setSelectedInvoice(null)}>{t('sys.str_77')}</button>
 </div>
 </div>
 </div>
 )}
 
 <PosReturnsModal isOpen={showReturnsModal} onClose={() => setShowReturnsModal(false)} />

 {/* Receipt Modal */}
 {showReceipt && lastInvoiceData && (
 <InvoiceReceipt
 invoiceData={lastInvoiceData}
 autoPrint={true}
 onClose={() => setShowReceipt(false)}
 />
 )}

 {/* Voucher Modal */}
 {showVoucher && selectedVoucherData && (
 <VoucherReceipt
 voucherData={selectedVoucherData}
 autoPrint={true}
 onClose={() => setShowVoucher(false)}
 />
 )}
 {/* مختار الوحدة عند إضافة صنف بوحدات متعددة */}
 {unitPickerProduct && (
 <div style={{
 position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
 zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
 }} onClick={() => setUnitPickerProduct(null)}>
 <div style={{
 background: 'var(--bg-card)', borderRadius: '16px', padding: '24px',
 minWidth: '320px', maxWidth: '440px', width: '90%',
 boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
 border: '1px solid var(--border)'
 }} onClick={e => e.stopPropagation()}>
 <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>
 📦 اختر وحدة البيع
 </h3>
 <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
 {unitPickerProduct.name}
 </p>
 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
 {/* بيع بالحبة (الوحدة الأساسية) */}
 <button
 className="btn btn-outline"
 style={{ justifyContent: 'space-between', padding: '12px 16px', fontSize: '15px' }}
 onClick={() => { addToCart(unitPickerProduct, -1); }}
 >
 <span>حبة (وحدة أساسية)</span>
 <span style={{ color: 'var(--primary)', fontWeight: '700' }}>
 {unitPickerProduct.sellPrice.toFixed(2)} ر.س
 </span>
 </button>
 {/* وحدات التعبئة الصالحة فقط */}
 {(unitPickerProduct.productUnits || []).filter(pu => pu.unit && pu.factor > 0).map(pu => {
 const totalAvail = unitPickerProduct.currentStock +
 (unitPickerProduct.productUnits || []).reduce((s,u) => s+u.unitStock*u.factor, 0);
 const unitAvailQty = Math.floor(totalAvail / pu.factor);
 return (
 <button
 key={pu.id}
 className="btn btn-outline"
 style={{ justifyContent: 'space-between', padding: '12px 16px', fontSize: '15px',
 opacity: unitAvailQty <= 0 && !allowNegativeStock ? 0.4 : 1 }}
 disabled={unitAvailQty <= 0 && !allowNegativeStock}
 onClick={() => addToCart(unitPickerProduct, pu.id)}
 >
 <span>
 📦 {pu.unit?.name || 'وحدة'}
 <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '6px' }}>
 ({pu.factor} حبة) • متاح: {unitAvailQty}
 </span>
 </span>
 <span style={{ color: 'var(--success)', fontWeight: '700' }}>
 {pu.sellPrice > 0 ? pu.sellPrice.toFixed(2) : unitPickerProduct.sellPrice.toFixed(2)} ر.س
 </span>
 </button>
 );
 })}
 </div>
 <button className="btn btn-ghost" style={{ width: '100%', marginTop: '12px', color: 'var(--text-muted)' }}
 onClick={() => setUnitPickerProduct(null)}>إلغاء</button>
 </div>
 </div>
 )}
 </>

 );
}
