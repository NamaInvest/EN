'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { useSettings } from '@/lib/SettingsContext';
import { useTranslation } from "@/lib/i18n";
import { translate } from "@/lib/translations";
import { useToast } from '@/components/Toast';

interface SettingItem { id: number; key: string; value: string; description: string; }

function getSettingGroups(t: (key: string) => string) {
 return [
 {
 title: t('sys.str_4418'), id: 'whatsapp', keys: [
 { key: 'whatsapp_enabled', label: t('sys.str_4419'), type: 'toggle' },
 { key: 'whatsapp_token', label: 'WhatsApp Access Token', type: 'text' },
 { key: 'whatsapp_phone_id', label: 'Phone Number ID', type: 'text' },
 { key: 'whatsapp_business_id', label: 'Business Account ID', type: 'text' },
 { key: 'whatsapp_verify_token', label: 'Verify Token (Webhook)', type: 'text' },
 ]
 },
 {
 title: t('sys.str_4420'), id: 'sms_gateways', keys: [
 { key: 'sms_enabled', label: t('sys.str_4421'), type: 'toggle' },
 { key: 'sms_provider', label: t('sys.str_4422'), type: 'select', options: [
 { value: 'taqnyat', label: t('sys.str_4423') },
 { value: 'unifonic', label: t('sys.str_4424') }
 ]},
 { key: 'sms_api_key', label: t('sys.str_4425'), type: 'text' },
 { key: 'sms_sender_id', label: t('sys.str_4426'), type: 'text' },
 ]
 },
 {
 title: t('sys.str_4427'), id: 'salla', keys: [
 { key: 'salla_enabled', label: t('sys.str_4428'), type: 'toggle' },
 { key: 'salla_merchant_id', label: t('sys.str_4429'), type: 'text' },
 { key: 'salla_client_id', label: 'Client ID', type: 'text' },
 { key: 'salla_client_secret', label: 'Client Secret (Webhook HMAC)', type: 'text' },
 { key: 'salla_access_token', label: 'Access Token', type: 'text' },
 { key: 'salla_webhook_url', label: t('sys.str_4430'), type: 'text' },
 ]
 },
 {
 title: t('sys.str_4431'), id: 'zid', keys: [
 { key: 'zid_enabled', label: t('sys.str_4432'), type: 'toggle' },
 { key: 'zid_store_id', label: t('sys.str_4433'), type: 'text' },
 { key: 'zid_client_id', label: 'Client ID', type: 'text' },
 { key: 'zid_webhook_secret', label: 'Webhook Secret (Authorization Token)', type: 'text' },
 { key: 'zid_access_token', label: 'Access Token', type: 'text' },
 { key: 'zid_webhook_url', label: t('sys.str_4430'), type: 'text' },
 ]
 },
 
 {
 title: t('sys.str_4437'), id: 'bnpl', keys: [
 { key: 'tabby_api_key', label: t('sys.str_4438'), type: 'text' },
 { key: 'tabby_merchant_code', label: t('sys.str_4439'), type: 'text' },
 { key: 'tamara_bearer_token', label: t('sys.str_4440'), type: 'text' },
 ]
 },
 {
 title: t('sys.str_4441'), id: 'ai_bots', keys: [
 { key: 'gemini_api_key', label: t('sys.str_4442'), type: 'text' },
 { key: 'telegram_bot_token', label: t('sys.str_4443'), type: 'text' },
 { key: 'master_telegram_chat_id', label: t('sys.str_4444'), type: 'text' },
 ]
 },
 ];
}
export default function SettingsPage() {
 
 const { lang } = useTranslation();
 const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
 const { error: toastError, success: toastSuccess } = useToast();
 const router = useRouter();
 // Create fresh t fn from translate + lang every render - bypasses any context reference issues
 const t = useMemo(() => (key: string) => translate(key, lang as any), [lang]);
 const settingGroups = useMemo(() => getSettingGroups(t), [lang]); // eslint-disable-line react-hooks/exhaustive-deps
 const [authorized, setAuthorized] = useState(false);
 const [settings, setSettings] = useState<Record<string, string>>({});
 const [originalSettings, setOriginalSettings] = useState<Record<string, string>>({});
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [toast, setToast] = useState('');
 const [logoPreview, setLogoPreview] = useState<string | null>(null);
 const [uploadingLogo, setUploadingLogo] = useState(false);
 const [generatingKeys, setGeneratingKeys] = useState(false);
 
 const [webhookLoading, setWebhookLoading] = useState(false);
 const [fatooraStep, setFatooraStep] = useState(0);


 // Permission guard - redirect if no access
 // If user has permissions defined → use those (role ignored)
 // If user has NO permissions AND role is admin → legacy admin, full access
 useEffect(() => {
 try {
 const u = JSON.parse(localStorage.getItem('user') || '{}');
 const perms: string[] = (u.permissions || []).map((p: { module: string }) => p.module);
 const hasPerms = perms.length > 0;
 const isAdmin = u.role === 'admin' || u.role === 'owner';

 // Admin always has universal access
 if (isAdmin || perms.includes('settings')) {
 setAuthorized(true);
 setCanManageUsers(isAdmin || perms.includes('manage_users'));
 setCanManagePerms(isAdmin || perms.includes('manage_permissions'));
 setCanResetPassword(isAdmin || perms.includes('reset_password'));
 setCanDeleteAllSales(isAdmin || perms.includes('delete_all_sales'));
 setCanClearZatca(isAdmin || perms.includes('clear_zatca'));
 setIsOwner(u.role === 'admin' || u.role === 'owner');
 } else {
 router.replace('/dashboard');
 }
 } catch { router.replace('/dashboard'); }
 // Fetch hidden_modules (ICE feature flags) - danger zone hidden by default
 const DEFAULT_HIDDEN = ['btn_danger_zone', 'btn_factory_reset'];
 fetch('/api/settings/hidden_modules').then(r => r.ok ? r.json() : { value: '' }).then(d => {
 try {
 const saved: string[] = d.value ? JSON.parse(d.value) : [];
 const merged = [...new Set([...DEFAULT_HIDDEN.filter(k => !saved.includes('SHOW_' + k)), ...saved])];
 setHiddenModules(merged);
 } catch { setHiddenModules(DEFAULT_HIDDEN); }
 }).catch(() => setHiddenModules(DEFAULT_HIDDEN));
 }, [router]);

 // User Management
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const [users, setUsers] = useState<any[]>([]);
 const [showAddUser, setShowAddUser] = useState(false);
 const [branches, setBranches] = useState<any[]>([]);
 // ── Default modules per role (must match backend DEFAULT_ROLE_MODULES) ──
 const DEFAULT_ROLE_MODULES: Record<string, string[]> = {
 cashier: ['pos', 'sales', 'products', 'customers', 'shifts'],
 owner: [],
 general_manager: ['pos', 'sales', 'products', 'customers', 'shifts', 'purchases', 'purchase_orders',
 'stock', 'warehouses', 'employees', 'attendance', 'salaries', 'vacations', 'reports',
 'accounting', 'treasury', 'banks', 'expenses', 'manufacturing', 'loyalty', 'settings'],
 system_admin: [],
 auditor: ['accounting', 'treasury', 'banks', 'expenses', 'reports', 'fixed_assets', 'petty_cash'],
 accountant: ['accounting', 'treasury', 'banks', 'expenses', 'petty_cash', 'receipt_vouchers',
 'fixed_assets', 'installments', 'reports'],
 hr: ['employees', 'attendance', 'salaries', 'vacations', 'hr_loans', 'reports'],
 sales_rep: ['pos', 'sales', 'price_quotes', 'sales_orders', 'products', 'customers',
 'loyalty', 'sales_routes', 'sales_targets'],
 data_entry: ['products', 'stock', 'warehouses', 'purchases', 'purchase_orders', 'barcode', 'batches'],
 manager: ['pos', 'sales', 'products', 'customers', 'shifts', 'purchases', 'stock', 'warehouses',
 'employees', 'reports', 'accounting', 'treasury', 'banks', 'expenses'],
 admin: [],
 };
 const FULL_ACCESS_ROLES = ['owner', 'admin', 'system_admin'];
 const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '', role: 'cashier', phone: '', branchId: '' as string | number, defaultPage: '' });
 const [newUserModules, setNewUserModules] = useState<string[]>(DEFAULT_ROLE_MODULES['cashier'] || []);
 const [moduleSearch, setModuleSearch] = useState('');
 const [editModuleSearch, setEditModuleSearch] = useState('');
 const [savingUser, setSavingUser] = useState(false);
 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const [editPermUser, setEditPermUser] = useState<any>(null);
 const [editPermMatrix, setEditPermMatrix] = useState<Record<string, { canView: boolean, canAdd: boolean, canEdit: boolean, canDelete: boolean, canPrint: boolean }>>({});
 const [canManageUsers, setCanManageUsers] = useState(false);
 const [canManagePerms, setCanManagePerms] = useState(false);
 const [canResetPassword, setCanResetPassword] = useState(false);
 const [canDeleteAllSales, setCanDeleteAllSales] = useState(false);
 const [canClearZatca, setCanClearZatca] = useState(false);
 const [isOwner, setIsOwner] = useState(false);
 const [hiddenModules, setHiddenModules] = useState<string[]>([]);
 const roleLabels: Record<string, string> = { owner: 'المالك', admin: 'مدير النظام', manager: 'مدير عام', auditor: 'مُراجع / مدقق', accountant: 'محاسب', cashier: 'كاشير', data_entry: 'مدخل بيانات', hr: 'موارد بشرية', sales_rep: 'مندوب مبيعات' };
 const ALL_MODULES = [
 // ═══ الرئيسية ═══
 { key: 'dashboard', label: '🏠 لوحة التحكم' },

 // ═══ المبيعات ═══
 { key: 'pos', label: '🛒 نقطة البيع (POS)' },
 { key: 'restaurant_pos', label: '🍽️ POS المطاعم' },
 { key: 'shifts', label: '🕐 الوردات' },
 { key: 'sales_orders', label: '📋 أوامر البيع' },
 { key: 'sales', label: '🧾 فواتير المبيعات' },
 { key: 'sales_history', label: '📜 تاريخ فواتير المبيعات' },
 { key: 'sales_routes', label: '🚚 مسارات التوزيع' },
 { key: 'sales_targets', label: '🎯 أهداف المبيعات' },
 { key: 'delivery_notes', label: '📦 مذكرات التسليم' },
 { key: 'sales_returns', label: '↩️ مرتجعات المبيعات' },
 { key: 'price_quotes', label: '💬 عروض الأسعار' },
 { key: 'recurring_invoices', label: '🔄 الفواتير المتكررة' },

 // ═══ المشتريات ═══
 { key: 'purchases', label: '🛍️ فواتير المشتريات' },
 { key: 'purchase_orders', label: '📋 أوامر الشراء' },
 { key: 'purchase_rfq', label: '📨 طلبات عروض الأسعار (RFQ)' },
 { key: 'purchase_requisitions', label: '📝 طلبات الشراء' },
 { key: 'purchase_grn', label: '📥 استلام البضاعة (GRN)' },
 { key: 'letters_of_credit', label: '🏦 خطابات الاعتماد' },
 { key: 'purchase_returns', label: '↩️ مرتجعات المشتريات' },

 // ═══ المنتجات والمخزون ═══
 { key: 'products', label: '📦 المنتجات' },
 { key: 'stock', label: '🏭 المخزون' },
 { key: 'stock_movements', label: '📊 حركات المخزون' },
 { key: 'stock_adjustments', label: '⚖️ تسويات المخزون' },
 { key: 'stock_transfers', label: '🔀 تحويلات المخزون' },
 { key: 'stocktake', label: '📋 الجرد' },
 { key: 'vision_inventory', label: '👁️ جرد الرؤية الذكية' },
 { key: 'warehouses', label: '🏪 المستودعات' },
 { key: 'warehouses_alerts', label: '🔔 تنبيهات المستودعات' },
 { key: 'barcode', label: '🏷️ الباركود' },
 { key: 'batches', label: '📦 الدفعات' },
 { key: 'inv_serials', label: '🔢 الأرقام التسلسلية' },

 // ═══ المحاسبة والمالية ═══
 { key: 'accounting', label: '📒 الحسابات العامة' },
 { key: 'accounting_banks', label: '🏦 بنوك المحاسبة' },
 { key: 'accounting_lc', label: '📜 خطابات اعتماد المحاسبة' },
 { key: 'accounting_trial_balance', label: '⚖️ ميزان المراجعة' },
 { key: 'treasury', label: '💰 الخزينة' },
 { key: 'treasury_checks', label: '📝 الشيكات' },
 { key: 'bank_reconciliation', label: '🏦 مطابقة البنك' },
 { key: 'petty_cash', label: '💵 الصندوق الصغير' },
 { key: 'fng_petty_cash', label: '💵 صناديق الصرف' },
 { key: 'banks', label: '🏦 البنوك' },
 { key: 'receipt_vouchers', label: '🧾 سندات القبض' },
 { key: 'expenses', label: '💸 المصروفات' },
 { key: 'fixed_assets', label: '🏗️ الأصول الثابتة' },
 { key: 'finance_assets', label: '📈 الأصول المالية' },
 { key: 'fng_budgets', label: '📊 الميزانيات' },
 { key: 'smart_transfers', label: '💸 الحوالات الذكية' },
 { key: 'installments', label: '📅 الأقساط' },

 // ═══ العملاء ═══
 { key: 'customers', label: '👤 العملاء' },
 { key: 'crm_leads', label: '🎯 العملاء المحتملون (CRM)' },
 { key: 'loyalty', label: '⭐ نقاط الولاء' },
 { key: 'coupons', label: '🎟️ الكوبونات' },
 { key: 'promotions', label: '🎁 العروض الترويجية' },
 { key: 'gift_cards', label: '🎴 بطاقات الهدايا' },
 { key: 'affiliates', label: '🤝 التسويق بالعمولة' },
 { key: 'bookings', label: '📅 الحجوزات' },
 { key: 'bookings_calendar', label: '📆 تقويم الحجوزات' },

 // ═══ الموارد البشرية ═══
 { key: 'employees', label: '👥 الموظفون' },
 { key: 'attendance', label: '⏰ الحضور والانصراف' },
 { key: 'hr_loans', label: '💳 قروض الموظفين' },
 { key: 'hr_jobs', label: '💼 الوظائف' },
 { key: 'hr_training', label: '📚 التدريب' },
 { key: 'hr_evaluations', label: '📊 تقييم الأداء' },
 { key: 'hr_ai_enrollment', label: '🤖 التسجيل الذكي' },
 { key: 'salaries', label: '💰 الرواتب' },
 { key: 'vacations', label: '🏖️ الإجازات' },

 // ═══ الأصول والأسطول ═══
 { key: 'assets', label: '🏗️ الأصول' },
 { key: 'fleet', label: '🚗 أسطول المركبات' },
 { key: 'fleet_fuel', label: '⛽ الوقود' },
 { key: 'fleet_trips', label: '🗺️ الرحلات' },
 { key: 'maintenance', label: '🔧 الصيانة' },

 // ═══ التصنيع والمشاريع ═══
 { key: 'manufacturing', label: '🏭 التصنيع' },
 { key: 'mrp', label: '📋 تخطيط الموارد (MRP)' },
 { key: 'mrp_recipes', label: '📖 وصفات التصنيع' },
 { key: 'projects', label: '📁 المشاريع' },
 { key: 'quality', label: '✅ ضبط الجودة' },
 { key: 'wms', label: '🏪 إدارة المستودعات المتقدمة (WMS)' },
 { key: 'enterprise_fleet', label: '🚛 أسطول المنشأة' },
 { key: 'legal', label: '⚖️ الشؤون القانونية' },
 { key: 'property', label: '🏢 إدارة العقارات' },
 { key: 'rem_installments', label: '📅 أقساط الإيجار' },
 { key: 'rem_leases', label: '📜 عقود الإيجار' },

 // ═══ الذكاء الاصطناعي ═══
 { key: 'ai_bank', label: '🤖 البنك الذكي' },
 { key: 'ai_cfo', label: '🤖 المدير المالي الذكي' },
 { key: 'ai_copilot', label: '🤖 المساعد الذكي' },
 { key: 'ai_scm', label: '🤖 سلسلة التوريد الذكية' },

 // ═══ التعليم ═══
 { key: 'shl_classes', label: '🎓 الفصول الدراسية' },
 { key: 'shl_students', label: '👨‍🎓 الطلاب' },

 // ═══ التقارير ═══
 { key: 'reports', label: '📊 التقارير' },
 { key: 'reports_73', label: '📈 تقارير 73 وحدة' },
 { key: 'reports_fraud', label: '🔍 كشف الاحتيال بالذكاء الاصطناعي' },

 // ═══ التواصل ═══
 { key: 'whatsapp', label: '💬 مركز واتساب' },
 { key: 'com_rules', label: '📋 قواعد التواصل' },
 { key: 'salla', label: '🛒 متجر سلة' },

 // ═══ النظام والإعدادات ═══
 { key: 'settings', label: '⚙️ الإعدادات' },
 { key: 'settings_approvals', label: '✅ إعدادات الموافقات' },
 { key: 'settings_currencies', label: '💱 العملات' },
 { key: 'settings_whatsapp', label: '📱 إعدادات واتساب' },
 { key: 'branches', label: '🏢 الفروع' },
 { key: 'audit_logs', label: '📋 سجل المراجعة' },
 { key: 'sys_alerts', label: '🔔 تنبيهات النظام' },
 { key: 'sys_health', label: '💊 صحة النظام' },
 { key: 'master-panel', label: '🎛️ لوحة المدير' },

 // ═══ صلاحيات خاصة ═══
 { key: 'manage_users', label: '👥 إدارة المستخدمين' },
 { key: 'manage_permissions', label: '🔐 إدارة الصلاحيات' },
 { key: 'delete_invoices', label: '🗑️ حذف الفواتير' },
 { key: 'delete_expense', label: '🗑️ حذف مصروف' },
 { key: 'delete_all_expenses', label: '🗑️ حذف كل المصروفات' },
 { key: 'edit_expense', label: '✏️ تعديل المصروفات' },
 { key: 'delete_products', label: '🗑️ حذف المنتجات' },
 { key: 'reset_stock', label: '🔄 تصفير المخزون' },
 { key: 'delete_all_sales', label: '🗑️ حذف كل المبيعات' },
 { key: 'reset_password', label: '🔑 تغيير كلمة المرور' },
 { key: 'clear_zatca', label: '🧹 مسح بيانات زاتكا' },
 ];

 const fetchUsers = async () => {
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
 if (res.ok) setUsers(await res.json());

 const bRes = await fetch('/api/branches', { headers: { Authorization: `Bearer ${token}` } });
 if (bRes.ok) setBranches(await bRes.json());
 } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
 };

 const saveUser = async () => {
 if (!newUser.username.trim() || !newUser.password.trim() || !newUser.fullName.trim()) { showToast(t('sys.str_4517')); return; }
 setSavingUser(true);
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...newUser, modules: newUserModules }) });
 if (res.ok) {
 showToast(t('sys.str_4518'));
 setNewUser({ username: '', password: '', fullName: '', role: 'cashier', phone: '', branchId: '', defaultPage: '' });
 setNewUserModules([]);
 setShowAddUser(false);
 fetchUsers();
 } else { const d = await res.json(); showToast(`❌ ${d.error}`); }
 } catch { showToast(t('sys.str_4162')); }
 finally { setSavingUser(false); }
 };

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const toggleUserActive = async (u: any) => {
 try {
 const token = localStorage.getItem('token');
 await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: u.id, active: !u.active }) });
 fetchUsers();
 showToast(u.active ? t('sys.str_4519') : t('sys.str_4520'));
 } catch { showToast(t('sys.str_4199')); }
 };

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const updateUserRole = async (u: any, role: string) => {
 try {
 const token = localStorage.getItem('token');
 await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: u.id, role }) });
 fetchUsers();
 showToast(`✅ تم تغيير الصلاحية إلى ${roleLabels[role]}`);
 } catch { showToast(t('sys.str_4199')); }
 };

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const deleteUser = async (u: any) => {
 if (!confirm(`هل تريد حذف المستخدم "${u.fullName}" نهائياً؟`)) return;
 try {
 const token = localStorage.getItem('token');
 const res = await fetch(`/api/users?id=${u.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
 if (res.ok) {
 showToast(t('sys.str_4521'));
 fetchUsers();
 } else { const d = await res.json(); showToast(`❌ ${d.error}`); }
 } catch { showToast(t('sys.str_4199')); }
 };

 // eslint-disable-next-line @typescript-eslint/no-explicit-any
 const resetPassword = async (u: any) => {
 const newPass = prompt(`أدخل كلمة السر الجديدة للمستخدم "${u.fullName}"`);
 if (!newPass || !newPass.trim()) return;
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: u.id, password: newPass }) });
 if (res.ok) showToast(`✅ تم تغيير كلمة سر ${u.fullName}`);
 else { const d = await res.json(); showToast(`❌ ${d.error}`); }
 } catch { showToast(t('sys.str_4199')); }
 };

 const deleteAllSales = async () => {
 if (!confirm(t('sys.str_4522'))) return;
 if (!confirm(t('sys.str_4523'))) return;
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/sales?action=delete_all', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
 if (res.ok) { const d = await res.json(); showToast(`✅ ${d.message}`); }
 else { const d = await res.json(); showToast(`❌ ${d.error || t('sys.str_4198')}`); }
 } catch { showToast(t('sys.str_4162')); }
 };

 const clearZatcaData = async () => {
 if (!confirm(t('sys.str_4524'))) return;
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/settings', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
 if (res.ok) { const d = await res.json(); showToast(`✅ ${d.message}`); setFatooraStep(0); }
 else { const d = await res.json(); showToast(`❌ ${d.error || t('sys.str_4198')}`); }
 } catch { showToast(t('sys.str_4162')); }
 };

 const { refreshSettings } = useSettings();

 useEffect(() => {
 const fetchSettingsLocal = async () => {
 const token = localStorage.getItem('token');
 try {
 const res = await fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } });
 if (res.ok) {
 const data: SettingItem[] = await res.json();
 const map: Record<string, string> = {};
 data.forEach(s => { map[s.key] = s.value; });
 setSettings(map);
 setOriginalSettings(map);
 if (map['company_logo']) setLogoPreview(map['company_logo']);
 }

 
 } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
 finally { setLoading(false); }
 };
 fetchSettingsLocal();
 fetchUsers();
 }, []);

 // Guard - must be AFTER all hooks
 if (!authorized) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontSize: '18px' }}>{t('sys.str_4337')}</div>;

 const handleToggle = async (key: string) => {
 const newVal = settings[key] === '1' ? '0' : '1';
 setSettings({ ...settings, [key]: newVal });
 const token = localStorage.getItem('token');
 try {
 await fetch(`/api/settings/${key}`, {
 method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({ value: newVal }),
 });
 } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
 };

 const handleSaveAll = async () => {
 setSaving(true);
 const token = localStorage.getItem('token');
 try {
 const allKeys = new Set([...Object.keys(settings), ...Object.keys(originalSettings)]);
 const changedKeys = Array.from(allKeys).filter(key => (settings[key] || '') !== (originalSettings[key] || ''));

 if (changedKeys.length === 0) {
 showToast(t('sys.str_4525'));
 setSaving(false);
 return;
 }

 const payload: Record<string, string> = {};
 changedKeys.forEach(key => {
 payload[key] = settings[key] || '';
 });

 const res = await fetch('/api/settings', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify(payload),
 });

 if (res.ok) {
 setOriginalSettings({ ...settings });
 showToast(`✅ تم حفظ ${changedKeys.length} إعداد بنجاح`);
 refreshSettings();
 } else {
 const errorData = await res.json().catch(() => ({}));
 showToast(`❌ فشل في الحفظ: ${errorData.error || t('sys.str_4526')}`);
 }
 } catch (err) {
 console.error(err);
 showToast(t('sys.str_4527'));
 } finally {
 setSaving(false);
 }
 };

 const showToast = (msg: string) => {
 setToast(msg);
 setTimeout(() => setToast(''), 3000);
 };

 const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setUploadingLogo(true);
 const formData = new FormData();
 formData.append('logo', file);
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/settings/upload-logo', {
 method: 'POST',
 headers: { Authorization: `Bearer ${token}` },
 body: formData,
 });
 if (res.ok) {
 const data = await res.json();
 setLogoPreview(data.logo);
 showToast(t('sys.str_4528'));
 } else {
 const err = await res.json();
 showToast(`❌ ${err.error}`);
 }
 } catch (err) { console.error(err); showToast(t('sys.str_4529')); }
 finally { setUploadingLogo(false); e.target.value = ''; }
 };

 const handleLogoDelete = async () => {
 const token = localStorage.getItem('token');
 try {
 await fetch('/api/settings/company_logo', {
 method: 'PUT',
 headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
 body: JSON.stringify({ value: '' }),
 });
 setLogoPreview(null);
 showToast(t('sys.str_4530'));
 } catch (err: any) { toastError(err?.message || 'حدث خطأ'); }
 };

 const hasChanges = Object.keys(settings).some(key => settings[key] !== originalSettings[key]);

 const handleGenerateKeys = async () => {
 if (!confirm(t('sys.str_4531'))) return;
 setGeneratingKeys(true);
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/settings/generate-keys', {
 method: 'POST',
 headers: { Authorization: `Bearer ${token}` },
 });
 if (res.ok) {
 // Reload settings to get new keys
 const settingsRes = await fetch('/api/settings', { headers: { Authorization: `Bearer ${token}` } });
 if (settingsRes.ok) {
 const data: SettingItem[] = await settingsRes.json();
 const map: Record<string, string> = {};
 data.forEach(s => { map[s.key] = s.value; });
 setSettings(map);
 setOriginalSettings(map);
 }
 showToast(t('sys.str_4532'));
 } else {
 showToast(t('sys.str_4533'));
 }
 } catch (err) { console.error(err); showToast(t('sys.str_4533')); }
 finally { setGeneratingKeys(false); }
 };

 

 if (loading) return <><div className="page-header"><h1 className="page-title">{t('sys.str_4338')}</h1></div><div className="page-content"><div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>{t('sys.str_4107')}</div></div></>;

 return (
 <>
 <div className="page-header">
 <h1 className="page-title">{t('sys.str_4338')}</h1>
 <button
 className={`btn ${hasChanges ? 'btn-primary' : 'btn-ghost'}`}
 onClick={handleSaveAll}
 disabled={saving || !hasChanges}
 style={{
 minWidth: '140px',
 fontSize: '15px',
 fontWeight: '700',
 transition: 'all 0.2s ease',
 ...(hasChanges ? { animation: 'pulse 2s infinite' } : {}),
 }}
 >
 {saving ? t('sys.str_4536') : t('sys.str_4537')}
 </button>
 </div>
 <div className="page-content animate-fade-in">
 {settingGroups.map((group, gi) => (
 <div key={gi} className="card" style={{ marginBottom: '20px' }}>
 <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>{group.title}</h3>
 <div className="grid-2">
 {group.keys.map(k => (
 <div key={k.key} className="input-group" style={k.type === 'textarea' ? { gridColumn: '1 / -1' } : {}}>
 <label className="input-label">{k.label}</label>
 {k.type === 'toggle' ? (
 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
 <button
 className={`btn btn-sm ${settings[k.key] === '1' ? 'btn-success' : 'btn-ghost'}`}
 onClick={() => handleToggle(k.key)}
 >
 {settings[k.key] === '1' ? t('sys.str_4541') : t('sys.str_4542')}
 </button>
 </div>
 ) : k.type === 'textarea' ? (
 <textarea
 className="input"
 value={settings[k.key] || ''}
 onChange={e => setSettings({ ...settings, [k.key]: e.target.value })}
 rows={3}
 dir="ltr"
 style={{
 fontFamily: 'monospace', fontSize: '12px',
 ...(settings[k.key] !== originalSettings[k.key]
 ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary)' }
 : {}),
 }}
 placeholder={k.key === 'zatca_private_key' ? 'MHQ...' : 'MII...'}
 />
 ) : k.type === 'select' ? (
 <select
 className="input"
 value={settings[k.key] || ((k as any).options ? (k as any).options[0]?.value : 'simulation')}
 onChange={e => setSettings({ ...settings, [k.key]: e.target.value })}
 >
 {(k as any).options ? (
 (k as any).options.map((opt: { value: string; label: string }) => (
 <option key={opt.value} value={opt.value}>{opt.label}</option>
 ))
 ) : (
 <>
 <option value="simulation">{t('sys.str_4342')}</option>
 <option value="production">{t('sys.str_4343')}</option>
 </>
 )}
 </select>
 ) : (
 <input
 className="input"
 type={k.type}
 value={settings[k.key] || ''}
 onChange={e => setSettings({ ...settings, [k.key]: e.target.value })}
 dir={k.type === 'number' ? 'ltr' : undefined}
 style={{
 ...(settings[k.key] !== originalSettings[k.key]
 ? { borderColor: 'var(--primary)', boxShadow: '0 0 0 1px var(--primary)' }
 : {}),
 }}
 />
 )}
 </div>
 ))}
 </div>
 {group.title.includes(t('sys.str_4546')) && (
 <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px solid var(--border)' }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
 <div style={{
 width: '12px', height: '12px', borderRadius: '50%',
 background: settings['zatca_private_key'] && settings['zatca_certificate'] ? 'var(--success-light)' : 'var(--danger)',
 boxShadow: settings['zatca_private_key'] && settings['zatca_certificate'] ? '0 0 8px var(--success-light)' : '0 0 8px var(--danger)',
 }} />
 <span style={{ fontWeight: '600', fontSize: '14px' }}>
 {settings['zatca_private_key'] && settings['zatca_certificate']
 ? t('sys.str_4547')
 : t('sys.str_4548')}
 </span>
 </div>
 <button
 className="btn btn-primary btn-sm"
 onClick={handleGenerateKeys}
 disabled={generatingKeys}
 style={{ whiteSpace: 'nowrap' }}
 >
 {generatingKeys ? t('sys.str_4549') : t('sys.str_4550')}
 </button>
 </div>
 <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '8px 0 0' }}>
 {t('sys.str_4347')}</p>
 </div>
 )}
 {group.title.includes(t('sys.str_4561')) && (
 <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px solid var(--border)' }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
 <div style={{
 width: '12px', height: '12px', borderRadius: '50%',
 background: settings['telegram_bot_token'] ? 'var(--success-light)' : 'var(--danger)',
 boxShadow: settings['telegram_bot_token'] ? '0 0 8px var(--success-light)' : '0 0 8px var(--danger)',
 }} />
 <span style={{ fontWeight: '600', fontSize: '14px' }}>
 {settings['telegram_bot_token']
 ? t('sys.str_4562')
 : t('sys.str_4563')}
 </span>
 </div>
 <button
 className="btn btn-primary btn-sm"
 onClick={async () => {
 setWebhookLoading(true);
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/telegram/webhook?action=set', { headers: { Authorization: `Bearer ${token}` } });
 if (res.ok) {
 const data = await res.json();
 showToast(`✅ تم ربط البوت بنجاح! URL: ${data.webhookUrl}`);
 } else {
 showToast(t('sys.str_4564'));
 }
 } catch { showToast(t('sys.str_4565')); }
 finally { setWebhookLoading(false); }
 }}
 disabled={webhookLoading || !settings['telegram_bot_token']}
 style={{ whiteSpace: 'nowrap' }}
 >
 {webhookLoading ? t('sys.str_4566') : t('sys.str_4567')}
 </button>
 </div>
 <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '8px 0 0' }}>
 {t('sys.str_4350')}</p>
 </div>
 )}
 {group.id === 'whatsapp' && (
 <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px solid var(--border)' }}>
 <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>{t('sys.str_4351')}</h4>
 <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
 <div style={{ flex: 1, minWidth: '200px' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
 <div style={{
 width: '12px', height: '12px', borderRadius: '50%',
 background: settings['whatsapp_status'] === 'connected' ? 'var(--success-light)' : (settings['whatsapp_status'] === 'scanning' ? '#facc15' : 'var(--danger)'),
 boxShadow: settings['whatsapp_status'] === 'connected' ? '0 0 8px var(--success-light)' : 'none',
 }} />
 <span style={{ fontWeight: '600', fontSize: '14px' }}>
 {settings['whatsapp_status'] === 'connected' ? t('sys.str_4568') :
 settings['whatsapp_status'] === 'scanning' ? t('sys.str_4569') : t('sys.str_4570')}
 </span>
 </div>
 <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
 {t('sys.str_4352')}</p>
 </div>
 {settings['whatsapp_qr'] && settings['whatsapp_status'] !== 'connected' && (
 <div style={{ background: 'var(--bg-card-hover)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
 <QRCodeCanvas value={settings['whatsapp_qr']} size={140} level="H" />
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 ))}

 {hasChanges && (
 <div style={{
 position: 'sticky', bottom: '20px', textAlign: 'center',
 padding: '12px', background: 'var(--bg-card)',
 borderRadius: '12px', border: '1px solid var(--primary)',
 boxShadow: 'var(--shadow-lg)',
 }}>
 <span style={{ color: 'var(--text-secondary)', marginLeft: '12px' }}>
 {t('sys.str_4353')}</span>
 <button className="btn btn-primary" onClick={handleSaveAll} disabled={saving}>
 {saving ? t('sys.str_4536') : t('sys.str_4571')}
 </button>
 </div>
 )}
 </div>
 {toast && <div className="toast-container"><div className={`toast ${toast.includes('✅') ? 'toast-success' : toast.includes('❌') ? 'toast-error' : 'toast-success'}`}>{toast}</div></div>}

 {/* User Management Section */}
 {canManageUsers && (
 <div className="card" style={{ marginBottom: '20px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
 <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{t('sys.str_4354')}</h3>
 <button className="btn btn-primary btn-sm" onClick={() => setShowAddUser(!showAddUser)}>{showAddUser ? t('sys.str_4572') : t('sys.str_4573')}</button>
 </div>
 {showAddUser && (
 <div style={{ background: 'var(--bg-card-hover)', borderRadius: '10px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
 <input className="input" placeholder={t('sys.str_4574')} value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} dir="ltr" />
 <input className="input" type="password" placeholder={t('sys.str_4575')} value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} dir="ltr" />
 </div>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
 <input className="input" placeholder={t('sys.str_4576')} value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} />
 <input className="input" placeholder={t('sys.str_4577')} value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} dir="ltr" />
 <select className="input" value={newUser.role} onChange={e => {
 const role = e.target.value;
 setNewUser({ ...newUser, role });
 // Auto-assign default modules for the selected role
 if (FULL_ACCESS_ROLES.includes(role)) {
 setNewUserModules(ALL_MODULES.map(m => m.key));
 } else {
 setNewUserModules(DEFAULT_ROLE_MODULES[role] || []);
 }
 }}>
 <option value="owner">{t('sys.str_4355')}</option>
 <option value="manager">{t('sys.str_4356')}</option>
 <option value="admin">{t('sys.str_4357')}</option>
 <option value="auditor">{t('sys.str_4358')}</option>
 <option value="accountant">{t('sys.str_4359')}</option>
 <option value="hr">{t('sys.str_4360')}</option>
 <option value="sales_rep">{t('sys.str_4361')}</option>
 <option value="cashier">{t('sys.str_4362')}</option>
 <option value="data_entry">{t('sys.str_4363')}</option>
 </select>
 <select className="input" value={newUser.branchId || ''} onChange={e => setNewUser({ ...newUser, branchId: e.target.value })}>
 <option value="">{t('sys.str_4364')}</option>
 {branches.map(b => (
 <option key={b.id} value={b.id}>{b.name}</option>
 ))}
 </select>
 </div>
 {/* الصفحة الافتراضية بعد تسجيل الدخول */}
 <div>
 <label className="input-label" style={{ marginBottom: '6px', display: 'block' }}>🏠 الصفحة الافتراضية بعد الدخول</label>
 <select className="input" value={newUser.defaultPage || ''} onChange={e => setNewUser({ ...newUser, defaultPage: e.target.value })}>
 <option value="">-- لوحة التحكم (افتراضي) --</option>
 <option value="/pos">🛒 نقطة البيع (POS)</option>
 <option value="/sales">🧾 فواتير المبيعات</option>
 <option value="/purchases">🛍️ المشتريات</option>
 <option value="/products">📦 الأصناف والمنتجات</option>
 <option value="/stock">🏭 المخزون</option>
 <option value="/customers">👤 العملاء</option>
 <option value="/expenses">💸 المصروفات</option>
 <option value="/employees">👥 الموظفون</option>
 <option value="/attendance">⏰ الحضور والانصراف</option>
 <option value="/salaries">💰 الرواتب</option>
 <option value="/reports">📊 التقارير</option>
 <option value="/treasury">💵 الخزينة</option>
 <option value="/warehouses">🏪 المستودعات</option>
 <option value="/accounting">📒 شجرة الحسابات</option>
 <option value="/shifts">🕐 الورديات</option>
 <option value="/receipt-vouchers">🧾 سندات القبض</option>
 <option value="/sales-returns">↩️ مرتجعات المبيعات</option>
 <option value="/manufacturing">🏭 التصنيع</option>
 </select>
 </div>
 <div>
 <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>🔐 الصلاحيات</label>
 <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)' }}>
 <p style={{ marginBottom: '8px' }}>سيتم منح صلاحيات افتراضية بناءً على الدور المختار.</p>
 <a href="/settings/roles" className="btn btn-ghost btn-sm" style={{ fontSize: '12px', textDecoration: 'none' }}>⚙️ تخصيص متقدم للصلاحيات (مصفوفة الصلاحيات)</a>
 </div>
 </div>
 <button className="btn btn-primary" onClick={saveUser} disabled={savingUser}>{savingUser ? t('sys.str_4536') : t('sys.str_4580')}</button>
 </div>
 )}
 {users.length === 0 ? (
 <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>{t('sys.str_4366')}</div>
 ) : (
 <table className="table" style={{ fontSize: '13px' }}>
 <thead><tr><th>{t('sys.str_4367')}</th><th>{t('sys.str_4368')}</th><th>{t('sys.str_4369')}</th><th>{t('sys.str_4370')}</th><th>{t('sys.str_4371')}</th><th>{t('sys.str_4215')}</th><th></th></tr></thead>
 <tbody>
 {users.map(u => (
 <tr key={u.id} style={{ opacity: u.active ? 1 : 0.5 }}>
 <td style={{ fontWeight: '600' }}>{u.fullName}</td>
 <td dir="ltr">{u.username}</td>
 <td>
 <select className="input" value={u.role} onChange={e => updateUserRole(u, e.target.value)} style={{ padding: '4px 8px', fontSize: '12px', width: '120px' }}>
 <option value="owner">{t('sys.str_4355')}</option>
 <option value="manager">{t('sys.str_4356')}</option>
 <option value="admin">{t('sys.str_4357')}</option>
 <option value="auditor">{t('sys.str_4358')}</option>
 <option value="accountant">{t('sys.str_4359')}</option>
 <option value="hr">{t('sys.str_4360')}</option>
 <option value="sales_rep">{t('sys.str_4361')}</option>
 <option value="cashier">{t('sys.str_4362')}</option>
 <option value="data_entry">{t('sys.str_4363')}</option>
 </select>
 </td>
 <td>
 <select className="input" value={u.branchId || ''} onChange={async e => {
 const val = e.target.value ? parseInt(e.target.value) : null;
 const token = localStorage.getItem('token');
 await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: u.id, branchId: val }) });
 fetchUsers();
 }} style={{ padding: '4px 8px', fontSize: '12px', width: '130px' }}>
 <option value="">{t('sys.str_4372')}</option>
 {branches.map(b => (
 <option key={b.id} value={b.id}>{b.name}</option>
 ))}
 </select>
 </td>
 <td>
 {canManagePerms && (
 <a href="/settings/roles" className="btn btn-ghost btn-sm" style={{ fontSize: '11px', textDecoration: 'none' }}>
 🔐 تخصيص الصلاحيات
 </a>
 )}
 </td>
 <td>
 <button className={`btn btn-sm ${u.active ? 'btn-success' : 'btn-ghost'}`} onClick={() => toggleUserActive(u)} style={{ fontSize: '11px' }}>
 {u.active ? t('sys.str_4581') : t('sys.str_4542')}
 </button>
 </td>
 <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
 <td>
 <div style={{ display: 'flex', gap: '4px' }}>
 {canResetPassword && <button className="btn btn-sm" onClick={() => resetPassword(u)} style={{ fontSize: '11px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>{t('sys.str_4374')}</button>}
 <button className="btn btn-sm" onClick={() => deleteUser(u)} style={{ fontSize: '11px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
 {t('sys.str_4375')}</button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>
 )}




 {/* Danger Zone */}
 {(canDeleteAllSales || canClearZatca) && !hiddenModules.includes('btn_danger_zone') && (
 <div className="card" style={{ marginBottom: '20px', borderColor: 'rgba(239,68,68,0.3)' }}>
 <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ef4444', marginBottom: '16px' }}>{t('sys.str_4386')}</h3>
 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
 {canDeleteAllSales && (
 <button className="btn" onClick={deleteAllSales} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '600' }}>
 {t('sys.str_4387')}</button>
 )}
 {canClearZatca && (
 <button className="btn" onClick={clearZatcaData} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '600' }}>
 {t('sys.str_4388')}</button>
 )}
 {isOwner && !hiddenModules.includes('btn_factory_reset') && (
 <button className="btn" onClick={async () => {
 const code = prompt('تنبيه خطير جداً!\nهذا الزر سيقوم بمسح كافة الفواتير، المخزون، المنتجات، التصنيفات والعملاء، والرجوع لوضع المصنع.\nاكتب WIPE_SYSTEM_N11 للتأكيد:');
 if (code !== 'WIPE_SYSTEM_N11') { if (code) alert('كلمة التأكيد غير صحيحة.'); return; }
 try {
 const token = localStorage.getItem('token');
 const res = await fetch('/api/system/reset', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ confirmation: code }) });
 if (res.ok) { alert('✅ تم مسح وتهيئة النظام بنجاح!'); window.location.reload(); }
 else { const d = await res.json(); alert(`❌ ${d.error}`); }
 } catch (e) { alert('فشل الاتصال الخادم'); }
 }} style={{ background: '#dc2626', color: '#fff', border: '1px solid #991b1b', fontWeight: '800' }}>
 فرمتة وتهيئة النظام بالكامل (الرجوع لضبط المصنع)
 </button>
 )}
 </div>
 <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>{t('sys.str_4389')}</p>
 </div>
 )}
 </>
 );
}
