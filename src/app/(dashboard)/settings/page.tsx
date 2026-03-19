'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { useSettings } from '@/lib/SettingsContext';

interface SettingItem { id: number; key: string; value: string; description: string; }

export const SETTING_GROUPS = [
    {
        title: '🏢 معلومات الشركة', keys: [
            { key: 'company_name', label: 'اسم الشركة', type: 'text' },
            { key: 'company_name_en', label: 'اسم الشركة بالإنجليزي', type: 'text' },
            { key: 'company_phone', label: 'هاتف الشركة', type: 'text' },
            { key: 'company_address', label: 'عنوان الشركة', type: 'text' },
            { key: 'tax_number', label: 'الرقم الضريبي (VAT)', type: 'text' },
            { key: 'currency', label: 'العملة', type: 'text' },
        ]
    },
    {
        title: '💰 الضريبة', keys: [
            { key: 'tax_rate', label: 'نسبة الضريبة %', type: 'number' },
            { key: 'zatca_enabled', label: 'تفعيل ZATCA', type: 'toggle' },
        ]
    },
    {
        title: '🔐 ربط الزكاة - المرحلة الثانية', keys: [
            { key: 'zatca_crn', label: 'رقم السجل التجاري (CRN)', type: 'text' },
            { key: 'zatca_industry', label: 'نوع النشاط (مثل: Technology, Retail)', type: 'text' },
            { key: 'zatca_street', label: 'اسم الشارع', type: 'text' },
            { key: 'zatca_building', label: 'رقم المبنى', type: 'text' },
            { key: 'zatca_district', label: 'الحي', type: 'text' },
            { key: 'zatca_city', label: 'المدينة بالعربي', type: 'text' },
            { key: 'zatca_city_en', label: 'المدينة بالإنجليزي (للشهادة)', type: 'text' },
            { key: 'zatca_postal_code', label: 'الرمز البريدي', type: 'text' },
        ]
    },
    {
        title: '🖨️ الطباعة', keys: [
            { key: 'printer_type', label: 'مقاس ورق الفواتير', type: 'select', options: [
                { value: '58mm', label: '🧾 حرارية 58mm (صغيرة)' },
                { value: '76mm', label: '🧾 حرارية 76mm (متوسطة)' },
                { value: '80mm', label: '🧾 حرارية 80mm (قياسية)' },
                { value: 'A4', label: '📄 A4 (210mm)' },
                { value: 'A5', label: '📄 A5 (148mm)' },
            ]},
            { key: 'receipt_header', label: 'رأس الفاتورة', type: 'text' },
            { key: 'receipt_footer', label: 'تذييل الفاتورة', type: 'text' },
            { key: 'barcode_label_size', label: 'مقاس ملصق الباركود', type: 'select', options: [
                { value: '30x20', label: '🏷️ 30×20mm' },
                { value: '40x30', label: '🏷️ 40×30mm' },
                { value: '50x25', label: '🏷️ 50×25mm' },
                { value: '50x30', label: '🏷️ 50×30mm (الأكثر شيوعاً)' },
                { value: '100x50', label: '🏷️ 100×50mm' },
            ]},
        ]
    },
    {
        title: '📱 واتساب API', id: 'whatsapp', keys: [
            { key: 'whatsapp_enabled', label: 'تفعيل واتساب API', type: 'toggle' },
            { key: 'whatsapp_token', label: 'WhatsApp Access Token', type: 'text' },
            { key: 'whatsapp_phone_id', label: 'Phone Number ID', type: 'text' },
            { key: 'whatsapp_business_id', label: 'Business Account ID', type: 'text' },
            { key: 'whatsapp_verify_token', label: 'Verify Token (Webhook)', type: 'text' },
        ]
    },
    {
        title: '🛒 سلة API', id: 'salla', keys: [
            { key: 'salla_enabled', label: 'تفعيل ربط سلة', type: 'toggle' },
            { key: 'salla_merchant_id', label: 'معرف المتجر (Merchant ID)', type: 'text' },
            { key: 'salla_client_id', label: 'Client ID', type: 'text' },
            { key: 'salla_client_secret', label: 'Client Secret (Webhook HMAC)', type: 'text' },
            { key: 'salla_access_token', label: 'Access Token', type: 'text' },
            { key: 'salla_webhook_url', label: 'Webhook URL (للقراءة فقط)', type: 'text' },
        ]
    },
    {
        title: '🛍️ زد API', id: 'zid', keys: [
            { key: 'zid_enabled', label: 'تفعيل ربط زد', type: 'toggle' },
            { key: 'zid_store_id', label: 'معرف المتجر (Store ID)', type: 'text' },
            { key: 'zid_client_id', label: 'Client ID', type: 'text' },
            { key: 'zid_webhook_secret', label: 'Webhook Secret (Authorization Token)', type: 'text' },
            { key: 'zid_access_token', label: 'Access Token', type: 'text' },
            { key: 'zid_webhook_url', label: 'Webhook URL (للقراءة فقط)', type: 'text' },
        ]
    },
    {
        title: '🌐 ربط منصة فاتورة (OTA)', keys: [
            { key: 'zatca_environment', label: 'البيئة', type: 'select' },
            { key: 'zatca_otp', label: 'OTP من بوابة فاتورة', type: 'text' },
        ]
    },
    {
        title: '🤖 الذكاء الاصطناعي وبوت تلجرام', id: 'ai_bots', keys: [
            { key: 'gemini_api_key', label: 'مفتاح Gemini API (لقارئ الفواتير الذكي)', type: 'text' },
            { key: 'telegram_bot_token', label: 'مفتاح بوت تلجرام (Bot Token)', type: 'text' },
            { key: 'master_telegram_chat_id', label: 'معرف دردشة المدير (Chat ID للمدقق الآلي)', type: 'text' },
        ]
    },
];

export default function SettingsPage() {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [originalSettings, setOriginalSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [generatingKeys, setGeneratingKeys] = useState(false);
    const [fatooraStep, setFatooraStep] = useState(0);
    const [fatooraLoading, setFatooraLoading] = useState(false);
    const [fatooraMessage, setFatooraMessage] = useState('');
    const [webhookLoading, setWebhookLoading] = useState(false);

    // Permission guard - redirect if no access
    // If user has permissions defined → use those (role ignored)
    // If user has NO permissions AND role is admin → legacy admin, full access
    useEffect(() => {
        try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            const perms: string[] = (u.permissions || []).map((p: { module: string }) => p.module);
            const hasPerms = perms.length > 0;
            const isAdmin = u.role === 'admin';
            const isLockedOutAdmin = !hasPerms && isAdmin;

            // Enforce strict module checking
            if (isLockedOutAdmin || perms.includes('settings')) {
                setAuthorized(true);
                setCanManageUsers(isAdmin || perms.includes('manage_users'));
                setCanManagePerms(isAdmin || perms.includes('manage_permissions'));
                setCanResetPassword(isAdmin || perms.includes('reset_password'));
                setCanDeleteAllSales(isAdmin || perms.includes('delete_all_sales'));
                setCanClearZatca(isAdmin || perms.includes('clear_zatca'));
            } else {
                router.replace('/dashboard');
            }
        } catch { router.replace('/dashboard'); }
    }, [router]);

    // User Management
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [users, setUsers] = useState<any[]>([]);
    const [showAddUser, setShowAddUser] = useState(false);
    const [branches, setBranches] = useState<any[]>([]);
    const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '', role: 'cashier', phone: '', branchId: '' as string | number });
    const [newUserModules, setNewUserModules] = useState<string[]>([]);
    const [savingUser, setSavingUser] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editPermUser, setEditPermUser] = useState<any>(null);
    const [editPermModules, setEditPermModules] = useState<string[]>([]);
    const [canManageUsers, setCanManageUsers] = useState(false);
    const [canManagePerms, setCanManagePerms] = useState(false);
    const [canResetPassword, setCanResetPassword] = useState(false);
    const [canDeleteAllSales, setCanDeleteAllSales] = useState(false);
    const [canClearZatca, setCanClearZatca] = useState(false);
    const roleLabels: Record<string, string> = { admin: 'مدير', cashier: 'كاشير', accountant: 'محاسب', data_entry: 'مدخل بيانات' };
    const ALL_MODULES = [
        { key: 'dashboard', label: '📊 لوحة التحكم' },
        { key: 'sales', label: '🧾 المبيعات' },
        { key: 'purchases', label: '🛒 المشتريات' },
        { key: 'sales-returns', label: '↩️ مرتجع مبيعات' },
        { key: 'purchase-returns', label: '↩️ مرتجع مشتريات' },
        { key: 'products', label: '📦 المنتجات' },
        { key: 'stock', label: '🏭 المخزون' },
        { key: 'customers', label: '👥 العملاء' },
        { key: 'treasury', label: '💰 الخزينة' },
        { key: 'expenses', label: '💸 المصروفات' },
        { key: 'reports', label: '📊 التقارير' },
        { key: 'employees', label: '👨‍💼 الموظفين' },
        { key: 'settings', label: '⚙️ الإعدادات' },
        { key: 'bookings', label: '📋 الحجز' },
        { key: 'promotions', label: '🎯 العروض' },
        { key: 'accounting', label: '📊 المحاسبة' },
        { key: 'manufacturing', label: '🏭 التصنيع' },
        { key: 'fixed-assets', label: '🏢 الأصول الثابتة' },
        { key: 'coupons', label: '🎟️ الكوبونات' },
        { key: 'loyalty', label: '🎁 الولاء والنقاط' },
        { key: 'gift-cards', label: '💳 بطاقات الهدايا' },
        { key: 'batches', label: '📦 التشغيلات والصلاحية' },
        { key: 'stocktake', label: '📦 عمليات الجرد' },
        { key: 'vision_inventory', label: '📸 الجرد بالذكاء الاصطناعي' },
        { key: 'whatsapp', label: '📨 واتساب الذكي API' },
        { key: 'master-panel', label: '🌐 محرك الشركات SaaS' },
        { key: 'audit-logs', label: '🛡️ سجل الحركات' },
        { key: 'branches', label: '🏢 الفروع' },
        { key: 'manage_users', label: '👤 إدارة المستخدمين' },
        { key: 'manage_permissions', label: '🔐 تعديل الصلاحيات' },
        { key: 'delete_invoices', label: '🗑️ حذف الفواتير والمشتريات' },
        { key: 'delete_expense', label: '🗑️ حذف مصروف واحد' },
        { key: 'delete_all_expenses', label: '⚠️ حذف كافة المصروفات' },
        { key: 'edit_expense', label: '✏️ تعديل المصروفات' },
        { key: 'delete_products', label: '🗑️ حذف الأصناف' },
        { key: 'reset_stock', label: '🔄 تصفير المخزون' },
        { key: 'delete_all_sales', label: '⚠️ حذف كل فواتير المبيعات' },
        { key: 'reset_password', label: '🔑 إعادة تعيين كلمة السر' },
        { key: 'clear_zatca', label: '🧹 حذف بيانات ربط الزكاة والدخل' },
    ];

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setUsers(await res.json());

            const bRes = await fetch('/api/branches', { headers: { Authorization: `Bearer ${token}` } });
            if (bRes.ok) setBranches(await bRes.json());
        } catch (err) { console.error(err); }
    };

    const saveUser = async () => {
        if (!newUser.username.trim() || !newUser.password.trim() || !newUser.fullName.trim()) { showToast('❌ جميع الحقول مطلوبة'); return; }
        setSavingUser(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...newUser, modules: newUserModules }) });
            if (res.ok) {
                showToast('✅ تم إضافة المستخدم');
                setNewUser({ username: '', password: '', fullName: '', role: 'cashier', phone: '', branchId: '' });
                setNewUserModules([]);
                setShowAddUser(false);
                fetchUsers();
            } else { const d = await res.json(); showToast(`❌ ${d.error}`); }
        } catch { showToast('❌ خطأ في الاتصال'); }
        finally { setSavingUser(false); }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toggleUserActive = async (u: any) => {
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: u.id, active: !u.active }) });
            fetchUsers();
            showToast(u.active ? '❌ تم تعطيل المستخدم' : '✅ تم تفعيل المستخدم');
        } catch { showToast('❌ خطأ'); }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateUserRole = async (u: any, role: string) => {
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: u.id, role }) });
            fetchUsers();
            showToast(`✅ تم تغيير الصلاحية إلى ${roleLabels[role]}`);
        } catch { showToast('❌ خطأ'); }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deleteUser = async (u: any) => {
        if (!confirm(`هل تريد حذف المستخدم "${u.fullName}" نهائياً؟`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/users?id=${u.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                showToast('✅ تم حذف المستخدم');
                fetchUsers();
            } else { const d = await res.json(); showToast(`❌ ${d.error}`); }
        } catch { showToast('❌ خطأ'); }
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
        } catch { showToast('❌ خطأ'); }
    };

    const deleteAllSales = async () => {
        if (!confirm('⚠️ هل أنت متأكد من حذف كل فواتير المبيعات؟ هذا لا يمكن التراجع عنه!')) return;
        if (!confirm('تأكيد نهائي: سيتم حذف جميع فواتير المبيعات وتفاصيلها وقيود الخزينة المرتبطة بها!')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/sales?action=delete_all', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const d = await res.json(); showToast(`✅ ${d.message}`); }
            else { const d = await res.json(); showToast(`❌ ${d.error || 'فشل'}`); }
        } catch { showToast('❌ خطأ في الاتصال'); }
    };

    const clearZatcaData = async () => {
        if (!confirm('⚠️ هل أنت متأكد من حذف بيانات ربط الزكاة والدخل؟ ستحتاج لإعادة الربط من جديد.')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/settings', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const d = await res.json(); showToast(`✅ ${d.message}`); setFatooraStep(0); }
            else { const d = await res.json(); showToast(`❌ ${d.error || 'فشل'}`); }
        } catch { showToast('❌ خطأ في الاتصال'); }
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

                // Check ZATCA connection status from dedicated ZATCA API (reads from zatca_settings table)
                try {
                    const zatcaRes = await fetch('/api/zatca?type=status', { headers: { Authorization: `Bearer ${token}` } });
                    if (zatcaRes.ok) {
                        const zatcaStatus = await zatcaRes.json();
                        if (zatcaStatus.status === 'connected' || zatcaStatus.has_production_csid) {
                            setFatooraStep(3);
                        } else if (zatcaStatus.status === 'compliance_passed') {
                            setFatooraStep(2);
                        } else if (zatcaStatus.status === 'compliance_csid') {
                            setFatooraStep(1);
                        }
                    }
                } catch { /* ZATCA status check failed, ignore */ }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        fetchSettingsLocal();
        fetchUsers();
    }, []);

    // Guard - must be AFTER all hooks
    if (!authorized) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', fontSize: '18px' }}>⏳ جاري التحقق...</div>;

    const handleToggle = async (key: string) => {
        const newVal = settings[key] === '1' ? '0' : '1';
        setSettings({ ...settings, [key]: newVal });
        const token = localStorage.getItem('token');
        try {
            await fetch(`/api/settings/${key}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ value: newVal }),
            });
        } catch (err) { console.error(err); }
    };

    const handleSaveAll = async () => {
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            // Find changed settings — also include keys the user typed that weren't in originalSettings
            const allKeys = new Set([...Object.keys(settings), ...Object.keys(originalSettings)]);
            const changedKeys = Array.from(allKeys).filter(key => (settings[key] || '') !== (originalSettings[key] || ''));

            if (changedKeys.length === 0) {
                showToast('ℹ️ لا توجد تغييرات للحفظ');
                setSaving(false);
                return;
            }

            // Save all changed settings and CHECK response status
            const results = await Promise.all(changedKeys.map(async (key) => {
                try {
                    const res = await fetch(`/api/settings/${key}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ value: settings[key] || '' }),
                    });
                    if (!res.ok) {
                        console.error(`Failed to save setting "${key}": ${res.status}`);
                        return { key, ok: false };
                    }
                    return { key, ok: true };
                } catch (err) {
                    console.error(`Network error saving setting "${key}":`, err);
                    return { key, ok: false };
                }
            }));

            const failed = results.filter(r => !r.ok);
            const succeeded = results.filter(r => r.ok);

            if (failed.length === 0) {
                setOriginalSettings({ ...settings });
                showToast(`✅ تم حفظ ${changedKeys.length} إعداد بنجاح`);
                refreshSettings();
            } else if (succeeded.length > 0) {
                // Partial success — update originalSettings only for succeeded keys
                const newOriginal = { ...originalSettings };
                succeeded.forEach(r => { newOriginal[r.key] = settings[r.key]; });
                setOriginalSettings(newOriginal);
                showToast(`⚠️ تم حفظ ${succeeded.length} إعداد، فشل ${failed.length}: ${failed.map(f => f.key).join(', ')}`);
            } else {
                showToast(`❌ فشل في حفظ جميع الإعدادات (${failed.length})`);
            }
        } catch (err) {
            console.error(err);
            showToast('❌ فشل في الحفظ');
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
                showToast('✅ تم رفع الشعار بنجاح');
            } else {
                const err = await res.json();
                showToast(`❌ ${err.error}`);
            }
        } catch (err) { console.error(err); showToast('❌ فشل في رفع الشعار'); }
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
            showToast('✅ تم حذف الشعار');
        } catch (err) { console.error(err); }
    };

    const hasChanges = Object.keys(settings).some(key => settings[key] !== originalSettings[key]);

    const handleGenerateKeys = async () => {
        if (!confirm('سيتم توليد مفاتيح ECDSA جديدة. المفاتيح القديمة سيتم استبدالها. متأكد؟')) return;
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
                showToast('✅ تم توليد مفاتيح ZATCA بنجاح');
            } else {
                showToast('❌ فشل في توليد المفاتيح');
            }
        } catch (err) { console.error(err); showToast('❌ فشل في توليد المفاتيح'); }
        finally { setGeneratingKeys(false); }
    };

    const handleFatooraAction = async (action: string) => {
        setFatooraLoading(true);
        setFatooraMessage('');
        try {
            const token = localStorage.getItem('token');
            // Map UI actions to new ZATCA Kit actions
            const actionMap: Record<string, string> = {
                'compliance-csid': 'onboard',
                'compliance-invoice': 'compliance-check',
                'production-csid': 'production-csid',
            };
            const apiAction = actionMap[action] || action;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const bodyData: Record<string, any> = { action: apiAction };

            // For onboard, pass OTP
            if (apiAction === 'onboard') {
                const otp = settings['zatca_otp'] || '';
                if (!otp) { showToast('❌ أدخل OTP من بوابة فاتورة أولاً'); setFatooraLoading(false); return; }
                bodyData.otp = otp;
            }

            const res = await fetch('/api/zatca', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(bodyData),
            });
            const data = await res.json();
            if (data.success) {
                setFatooraMessage(data.message);
                showToast(data.message);
                if (action === 'compliance-csid') setFatooraStep(1);
                if (action === 'compliance-invoice') setFatooraStep(2);
                if (action === 'production-csid') setFatooraStep(3);
            } else {
                setFatooraMessage(`❌ ${data.error || data.message || 'فشل'}`);
                showToast(`❌ ${data.error || data.message || 'فشل'}`);
            }
        } catch (err) { console.error(err); setFatooraMessage('❌ فشل في الاتصال'); }
        finally { setFatooraLoading(false); }
    };

    if (loading) return <><div className="page-header"><h1 className="page-title">⚙️ الإعدادات</h1></div><div className="page-content"><div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>جاري التحميل...</div></div></>;

    return (
        <>
            <div className="page-header">
                <h1 className="page-title">⚙️ الإعدادات</h1>
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
                    {saving ? '⏳ جاري الحفظ...' : '💾 حفظ الإعدادات'}
                </button>
            </div>
            <div className="page-content animate-fade-in">
                {SETTING_GROUPS.map((group, gi) => (
                    <div key={gi} className="card" style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px' }}>{group.title}</h3>
                        {gi === 0 && (
                            <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                                <label className="input-label" style={{ marginBottom: '12px', display: 'block' }}>🖼️ شعار الشركة</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="شعار الشركة" style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '12px', background: '#fff', padding: '4px', border: '1px solid var(--border)' }} />
                                    ) : (
                                        <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '1px solid var(--border)' }}>🏢</div>
                                    )}
                                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                        <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            {uploadingLogo ? '⏳ جاري الرفع...' : '📤 اختيار شعار'}
                                            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={uploadingLogo} />
                                        </label>
                                        {logoPreview && (
                                            <button className="btn btn-ghost btn-sm" onClick={handleLogoDelete} style={{ color: 'var(--danger)', fontSize: '12px' }}>🗑️ حذف الشعار</button>
                                        )}
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG, JPG — أقصى حجم 2MB</span>
                                    </div>
                                </div>
                            </div>
                        )}
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
                                                {settings[k.key] === '1' ? '✅ مفعل' : '❌ معطل'}
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
                                                    <option value="simulation">🧪 تجريبي (Simulation)</option>
                                                    <option value="production">🚀 إنتاج (Production)</option>
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
                        {group.title.includes('الطباعة') && (
                            <div style={{ marginTop: '16px', padding: '20px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>🏷️ إنشاء وطباعة باركود</h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>💡 عند الضغط على طباعة، سيظهر مربع حوار النظام لاختيار الطابعة المثبتة على جهازك</p>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                    <div style={{ flex: '1', minWidth: '200px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>باركود المنتج</label>
                                        <input
                                            className="input"
                                            id="barcode-label-input"
                                            placeholder="أدخل رقم الباركود أو اسم المنتج..."
                                            dir="ltr"
                                        />
                                    </div>
                                    <div style={{ minWidth: '80px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>الكمية</label>
                                        <input className="input" id="barcode-label-qty" type="number" defaultValue="1" min="1" max="100" style={{ width: '80px' }} dir="ltr" />
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            const barcodeInput = (document.getElementById('barcode-label-input') as HTMLInputElement)?.value;
                                            const qty = parseInt((document.getElementById('barcode-label-qty') as HTMLInputElement)?.value || '1');
                                            const labelSize = settings['barcode_label_size'] || '50x30';
                                            if (!barcodeInput) { showToast('❌ أدخل رقم الباركود'); return; }
                                            const sizes: Record<string, { w: string; h: string; fontSize: string; barcodeH: string }> = {
                                                '30x20': { w: '30mm', h: '20mm', fontSize: '7px', barcodeH: '12mm' },
                                                '40x30': { w: '40mm', h: '30mm', fontSize: '8px', barcodeH: '18mm' },
                                                '50x25': { w: '50mm', h: '25mm', fontSize: '9px', barcodeH: '16mm' },
                                                '50x30': { w: '50mm', h: '30mm', fontSize: '9px', barcodeH: '20mm' },
                                                '100x50': { w: '100mm', h: '50mm', fontSize: '12px', barcodeH: '32mm' },
                                            };
                                            const sz = sizes[labelSize] || sizes['50x30'];
                                            // Generate barcode bars using Code128-like pattern
                                            const barSvg = barcodeInput.split('').map((ch, i) => {
                                                const code = ch.charCodeAt(0);
                                                const widths = [(code >> 6) & 1, (code >> 5) & 1, (code >> 4) & 1, (code >> 3) & 1, (code >> 2) & 1, (code >> 1) & 1, code & 1, 0];
                                                return widths.map((w, j) => `<rect x="${(i * 8 + j) * 2}" y="0" width="${w ? 2 : 1}" height="100" fill="${j % 2 === 0 ? '#000' : '#fff'}"/>`).join('');
                                            }).join('');
                                            const totalBars = barcodeInput.length * 8 * 2;
                                            let labels = '';
                                            for (let i = 0; i < qty; i++) {
                                                labels += `<div class="label">
                                                    <div class="company">${settings['company_name'] || ''}</div>
                                                    <svg class="barcode" viewBox="0 0 ${totalBars} 100" preserveAspectRatio="none">${barSvg}<rect x="0" y="0" width="2" height="100" fill="#000"/><rect x="${totalBars - 2}" y="0" width="2" height="100" fill="#000"/></svg>
                                                    <div class="code">${barcodeInput}</div>
                                                </div>`;
                                            }
                                            const pw = window.open('', '_blank', 'width=400,height=400');
                                            if (!pw) return;
                                            pw.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>باركود</title>
                                            <style>
                                                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@600&display=swap');
                                                * { margin: 0; padding: 0; box-sizing: border-box; }
                                                body { font-family: 'Cairo', sans-serif; display: flex; flex-wrap: wrap; justify-content: center; padding: 2mm; }
                                                .label { width: ${sz.w}; height: ${sz.h}; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1mm; overflow: hidden; page-break-inside: avoid; }
                                                .company { font-size: ${sz.fontSize}; font-weight: 600; text-align: center; line-height: 1.1; max-height: 3mm; overflow: hidden; }
                                                .barcode { width: 90%; height: ${sz.barcodeH}; margin: 1mm 0; }
                                                .code { font-size: ${sz.fontSize}; font-weight: 600; letter-spacing: 1px; text-align: center; }
                                                @media print { @page { margin: 0; size: ${sz.w} ${sz.h}; } body { padding: 0; } }
                                            </style></head><body>${labels}
                                            <script>window.onload=function(){setTimeout(function(){window.print();window.close();},400);};</script>
                                            </body></html>`);
                                            pw.document.close();
                                        }}
                                        style={{ minWidth: '120px' }}
                                    >
                                        🖨️ طباعة ملصق
                                    </button>
                                </div>
                            </div>
                        )}
                        {group.title.includes('المرحلة الثانية') && (
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
                                                ? '🔐 المفاتيح مُعدّة — المرحلة الثانية جاهزة'
                                                : '⚠️ المفاتيح غير مُعدّة — يرجى توليد أو إدخال المفاتيح'}
                                        </span>
                                    </div>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={handleGenerateKeys}
                                        disabled={generatingKeys}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        {generatingKeys ? '⏳ جاري التوليد...' : '🔑 توليد مفاتيح تلقائي'}
                                    </button>
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '8px 0 0' }}>
                                    يمكنك توليد مفاتيح ECDSA (secp256r1) تلقائياً أو إدخال المفاتيح من بوابة ZATCA يدوياً
                                </p>
                            </div>
                        )}
                        {group.title.includes('فاتورة') && (
                            <div style={{ marginTop: '16px', padding: '20px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                {/* Connection Status Banner */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '16px', borderRadius: '10px', marginBottom: '16px',
                                    background: fatooraStep >= 3
                                        ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))'
                                        : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
                                    border: `2px solid ${fatooraStep >= 3 ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '48px', height: '48px', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '24px',
                                            background: fatooraStep >= 3 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                                            boxShadow: fatooraStep >= 3
                                                ? '0 0 20px rgba(34,197,94,0.4)'
                                                : '0 0 20px rgba(239,68,68,0.4)',
                                            animation: fatooraStep >= 3 ? 'pulse 2s infinite' : undefined,
                                        }}>
                                            {fatooraStep >= 3 ? '🟢' : '🔴'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '16px' }}>
                                                {fatooraStep >= 3 ? 'مربوط بمنصة فاتورة ✅' : 'غير مربوط بمنصة فاتورة'}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {fatooraStep >= 3
                                                    ? 'الفواتير ترسل تلقائياً لهيئة الزكاة والضريبة'
                                                    : 'أكمل خطوات الربط أدناه للتفعيل'}
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={settings['zatca_environment'] === 'production'
                                            ? 'https://fatoora.zatca.gov.sa'
                                            : 'https://fatoora.zatca.gov.sa/simulation'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary btn-sm"
                                        style={{ whiteSpace: 'nowrap', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        🌐 فتح بوابة فاتورة
                                    </a>
                                </div>

                                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px' }}>🔄 خطوات الربط مع فاتورة</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        { step: 1, label: '📋 الحصول على شهادة المطابقة', action: 'compliance-csid', desc: 'إرسال CSR مع OTP من بوابة فاتورة' },
                                        { step: 2, label: '🧪 اختبار فاتورة المطابقة', action: 'compliance-invoice', desc: 'إرسال فاتورة تجريبية للتحقق' },
                                        { step: 3, label: '🚀 الحصول على شهادة الإنتاج', action: 'production-csid', desc: 'تفعيل الربط المباشر مع منصة فاتورة' },
                                    ].map(s => (
                                        <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', background: fatooraStep >= s.step ? 'rgba(34,197,94,0.08)' : 'var(--bg-card)', border: `1px solid ${fatooraStep >= s.step ? 'var(--success-light)' : 'var(--border)'}` }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', background: fatooraStep >= s.step ? 'var(--success-light)' : 'var(--bg-card-hover)', color: fatooraStep >= s.step ? '#fff' : 'var(--text-muted)' }}>
                                                {fatooraStep >= s.step ? '✓' : s.step}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '600', fontSize: '13px' }}>{s.label}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.desc}</div>
                                            </div>
                                            <button
                                                className={`btn btn-sm ${fatooraStep >= s.step ? 'btn-success' : 'btn-primary'}`}
                                                onClick={() => handleFatooraAction(s.action)}
                                                disabled={fatooraLoading || (s.step > 1 && fatooraStep < s.step - 1)}
                                                style={{ minWidth: '80px' }}
                                            >
                                                {fatooraLoading ? '⏳' : fatooraStep >= s.step ? '✅ تم' : 'تنفيذ'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {fatooraMessage && (
                                    <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: fatooraMessage.includes('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', fontSize: '13px', fontWeight: '600' }}>
                                        {fatooraMessage}
                                    </div>
                                )}
                            </div>
                        )}
                        {group.title.includes('تلجرام') && (
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
                                                ? '🤖 البوت مضاف — اضغط لتحديث الاتصال'
                                                : '⚠️ مفتاح البوت غير موجود'}
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
                                                    showToast('❌ فشل في ربط التلجرام');
                                                }
                                            } catch { showToast('❌ خطأ بالاتصال'); }
                                            finally { setWebhookLoading(false); }
                                        }}
                                        disabled={webhookLoading || !settings['telegram_bot_token']}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        {webhookLoading ? '⏳ جاري الربط...' : '🔗 تفعيل وارتباط البوت'}
                                    </button>
                                </div>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '8px 0 0' }}>
                                    يجب عليك إدخال المفتاح وحفظ الإعدادات أولاً، ثم الضغط على "تفعيل وارتباط البوت" لكي يبدأ باستقبال الأوامر.
                                </p>
                            </div>
                        )}
                        {group.id === 'whatsapp' && (
                            <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>🤖 بوت الواتساب التفاعلي (الذكاء الاصطناعي)</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <div style={{
                                                width: '12px', height: '12px', borderRadius: '50%',
                                                background: settings['whatsapp_status'] === 'connected' ? 'var(--success-light)' : (settings['whatsapp_status'] === 'scanning' ? '#facc15' : 'var(--danger)'),
                                                boxShadow: settings['whatsapp_status'] === 'connected' ? '0 0 8px var(--success-light)' : 'none',
                                            }} />
                                            <span style={{ fontWeight: '600', fontSize: '14px' }}>
                                                {settings['whatsapp_status'] === 'connected' ? '✅ متصل (يعمل الآن)' :
                                                 settings['whatsapp_status'] === 'scanning' ? '⏳ بانتظار مسح الباركود' : '❌ مفصول أو متوقف'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            للربط، افتح واتساب في هاتفك، اذهب إلى "الأجهزة المرتبطة"، وقم بمسح الباركود. 
                                            إذا لم يظهر، تأكد من تشغيل خدمة الواتساب وإعادة تحميل الصفحة.
                                        </p>
                                    </div>
                                    {settings['whatsapp_qr'] && settings['whatsapp_status'] !== 'connected' && (
                                        <div style={{ background: '#fff', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
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
                            لديك تغييرات غير محفوظة
                        </span>
                        <button className="btn btn-primary" onClick={handleSaveAll} disabled={saving}>
                            {saving ? '⏳ جاري الحفظ...' : '💾 حفظ جميع التغييرات'}
                        </button>
                    </div>
                )}
            </div>
            {toast && <div className="toast-container"><div className={`toast ${toast.includes('✅') ? 'toast-success' : toast.includes('❌') ? 'toast-error' : 'toast-success'}`}>{toast}</div></div>}

            {/* User Management Section */}
            {canManageUsers && (
                <div className="card" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700' }}>👥 إدارة المستخدمين</h3>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowAddUser(!showAddUser)}>{showAddUser ? '✕ إلغاء' : '➕ إضافة مستخدم'}</button>
                    </div>
                    {showAddUser && (
                        <div style={{ background: 'var(--bg-card-hover)', borderRadius: '10px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <input className="input" placeholder="اسم المستخدم (للدخول) *" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} dir="ltr" />
                                <input className="input" type="password" placeholder="كلمة المرور *" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} dir="ltr" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
                                <input className="input" placeholder="الاسم الكامل *" value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} />
                                <input className="input" placeholder="رقم الجوال" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} dir="ltr" />
                                <select className="input" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                    <option value="admin">👑 مدير</option>
                                    <option value="cashier">💰 كاشير</option>
                                    <option value="accountant">📊 محاسب</option>
                                    <option value="data_entry">📝 مدخل بيانات</option>
                                </select>
                                <select className="input" value={newUser.branchId || ''} onChange={e => setNewUser({ ...newUser, branchId: e.target.value })}>
                                    <option value="">🏢 اختيار الفرع (اختياري)</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>🔐 الأقسام المسموحة</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    <button type="button" className={`btn btn-sm ${newUserModules.length === ALL_MODULES.length ? 'btn-primary' : 'btn-ghost'}`}
                                        onClick={() => setNewUserModules(newUserModules.length === ALL_MODULES.length ? [] : ALL_MODULES.map(m => m.key))} style={{ fontSize: '11px' }}>
                                        {newUserModules.length === ALL_MODULES.length ? '✖ إلغاء الكل' : '✔ تحديد الكل'}
                                    </button>
                                    {ALL_MODULES.map(m => (
                                        <button key={m.key} type="button"
                                            className={`btn btn-sm ${newUserModules.includes(m.key) ? 'btn-success' : 'btn-ghost'}`}
                                            onClick={() => setNewUserModules(prev => prev.includes(m.key) ? prev.filter(x => x !== m.key) : [...prev, m.key])}
                                            style={{ fontSize: '11px' }}>{m.label}</button>
                                    ))}
                                </div>
                            </div>
                            <button className="btn btn-primary" onClick={saveUser} disabled={savingUser}>{savingUser ? '⏳ جاري الحفظ...' : '💾 حفظ المستخدم'}</button>
                        </div>
                    )}
                    {users.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '14px' }}>لا يوجد مستخدمين</div>
                    ) : (
                        <table className="table" style={{ fontSize: '13px' }}>
                            <thead><tr><th>الاسم</th><th>اسم الدخول</th><th>الصلاحية</th><th>الفرع</th><th>الأقسام</th><th>الحالة</th><th></th></tr></thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} style={{ opacity: u.active ? 1 : 0.5 }}>
                                        <td style={{ fontWeight: '600' }}>{u.fullName}</td>
                                        <td dir="ltr">{u.username}</td>
                                        <td>
                                            <select className="input" value={u.role} onChange={e => updateUserRole(u, e.target.value)} style={{ padding: '4px 8px', fontSize: '12px', width: '120px' }}>
                                                <option value="admin">👑 مدير</option>
                                                <option value="cashier">💰 كاشير</option>
                                                <option value="accountant">📊 محاسب</option>
                                                <option value="data_entry">📝 مدخل بيانات</option>
                                            </select>
                                        </td>
                                        <td>
                                            <select className="input" value={u.branchId || ''} onChange={async e => {
                                                const val = e.target.value ? parseInt(e.target.value) : null;
                                                const token = localStorage.getItem('token');
                                                await fetch('/api/users', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ id: u.id, branchId: val }) });
                                                fetchUsers();
                                            }} style={{ padding: '4px 8px', fontSize: '12px', width: '130px' }}>
                                                <option value="">لا يوجد (الكل)</option>
                                                {branches.map(b => (
                                                    <option key={b.id} value={b.id}>{b.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            {canManagePerms && (
                                                <button className="btn btn-ghost btn-sm" onClick={() => { setEditPermUser(u); setEditPermModules((u.permissions || []).map((p: { module: string }) => p.module)); }}
                                                    style={{ fontSize: '11px' }}>
                                                    🔐 {(u.permissions || []).length} قسم
                                                </button>
                                            )}
                                        </td>
                                        <td>
                                            <button className={`btn btn-sm ${u.active ? 'btn-success' : 'btn-ghost'}`} onClick={() => toggleUserActive(u)} style={{ fontSize: '11px' }}>
                                                {u.active ? '✅ فعال' : '❌ معطل'}
                                            </button>
                                        </td>
                                        <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString('ar-SA')}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {canResetPassword && <button className="btn btn-sm" onClick={() => resetPassword(u)} style={{ fontSize: '11px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>🔑 كلمة السر</button>}
                                                <button className="btn btn-sm" onClick={() => deleteUser(u)} style={{ fontSize: '11px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                                                    🗑️ حذف
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Device Management Section */}
            {canManageUsers && (
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>📱 إدارة الأجهزة المربوطة</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        كل مستخدم (غير المدير) يُربط بجهاز واحد فقط عند أول تسجيل دخول. يمكنك فك الربط ليتمكن من الدخول من جهاز جديد.
                    </p>
                    <table className="table" style={{ fontSize: '13px' }}>
                        <thead><tr><th>المستخدم</th><th>الجهاز</th><th>تاريخ الربط</th><th>الحالة</th><th></th></tr></thead>
                        <tbody>
                            {users.filter(u => u.role !== 'admin').map(u => (
                                <tr key={u.id}>
                                    <td style={{ fontWeight: '600' }}>{u.fullName}</td>
                                    <td style={{ fontSize: '11px', color: 'var(--text-muted)', direction: 'ltr', textAlign: 'left' }}>
                                        {u.deviceName || '—'}
                                    </td>
                                    <td style={{ fontSize: '12px' }}>
                                        {u.deviceBoundAt ? new Date(u.deviceBoundAt).toLocaleDateString('ar-SA') + ' ' + new Date(u.deviceBoundAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '—'}
                                    </td>
                                    <td>
                                        {u.deviceToken ? (
                                            <span style={{ color: 'var(--success-light)', fontSize: '12px', fontWeight: '600' }}>🔒 مربوط</span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>🔓 غير مربوط</span>
                                        )}
                                    </td>
                                    <td>
                                        {u.deviceToken && (
                                            <button
                                                className="btn btn-sm"
                                                onClick={async () => {
                                                    if (!confirm(`هل تريد فك ربط الجهاز عن "${u.fullName}"؟\nسيتمكن من الدخول من جهاز جديد.`)) return;
                                                    try {
                                                        const token = localStorage.getItem('token');
                                                        const res = await fetch(`/api/users?action=unbind-device&userId=${u.id}`, {
                                                            method: 'PATCH',
                                                            headers: { Authorization: `Bearer ${token}` },
                                                        });
                                                        if (res.ok) {
                                                            showToast(`✅ تم فك ربط الجهاز عن ${u.fullName}`);
                                                            fetchUsers();
                                                        } else {
                                                            const d = await res.json();
                                                            showToast(`❌ ${d.error}`);
                                                        }
                                                    } catch { showToast('❌ خطأ في الاتصال'); }
                                                }}
                                                style={{ fontSize: '11px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}
                                            >
                                                🔓 فك الربط
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Edit Permissions Modal */}
            {editPermUser && (
                <div className="modal-overlay" onClick={() => setEditPermUser(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>🔐 صلاحيات {editPermUser.fullName}</h3>
                            <button className="modal-close" onClick={() => setEditPermUser(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>حدد الأقسام التي يمكن لهذا المستخدم الوصول إليها:</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                <button type="button" className={`btn btn-sm ${editPermModules.length === ALL_MODULES.length ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setEditPermModules(editPermModules.length === ALL_MODULES.length ? [] : ALL_MODULES.map(m => m.key))} style={{ fontSize: '11px' }}>
                                    {editPermModules.length === ALL_MODULES.length ? '✖ إلغاء الكل' : '✔ تحديد الكل'}
                                </button>
                                {ALL_MODULES.map(m => (
                                    <button key={m.key} type="button"
                                        className={`btn btn-sm ${editPermModules.includes(m.key) ? 'btn-success' : 'btn-ghost'}`}
                                        onClick={() => setEditPermModules(prev => prev.includes(m.key) ? prev.filter(x => x !== m.key) : [...prev, m.key])}
                                        style={{ fontSize: '11px' }}>{m.label}</button>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button className="btn btn-primary" onClick={async () => {
                                try {
                                    const token = localStorage.getItem('token');
                                    await fetch('/api/users', {
                                        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                        body: JSON.stringify({ id: editPermUser.id, modules: editPermModules })
                                    });
                                    showToast('✅ تم حفظ الصلاحيات');
                                    setEditPermUser(null);
                                    fetchUsers();
                                } catch { showToast('❌ خطأ'); }
                            }}>💾 حفظ</button>
                            <button className="btn btn-ghost" onClick={() => setEditPermUser(null)}>إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Danger Zone */}
            {(canDeleteAllSales || canClearZatca) && (
                <div className="card" style={{ marginBottom: '20px', borderColor: 'rgba(239,68,68,0.3)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ef4444', marginBottom: '16px' }}>⚠️ منطقة الخطر</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {canDeleteAllSales && (
                            <button className="btn" onClick={deleteAllSales} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '600' }}>
                                🗑️ حذف كل فواتير المبيعات
                            </button>
                        )}
                        {canClearZatca && (
                            <button className="btn" onClick={clearZatcaData} style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontWeight: '600' }}>
                                🧹 حذف بيانات ربط الزكاة والدخل
                            </button>
                        )}
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>هذه العمليات لا يمكن التراجع عنها. تأكد جيداً قبل التنفيذ.</p>
                </div>
            )}
        </>
    );
}
