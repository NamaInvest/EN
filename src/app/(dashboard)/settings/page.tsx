'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { useSettings } from '@/lib/SettingsContext';
import { useTranslation } from "@/lib/i18n";
import { translate } from "@/lib/translations";

interface SettingItem { id: number; key: string; value: string; description: string; }

export function getSettingGroups(t: (key: string) => string) {
    return [
    {
        title: t('sys.str_4390'), keys: [
            { key: 'company_name', label: t('sys.str_4391'), type: 'text' },
            { key: 'company_name_en', label: t('sys.str_4392'), type: 'text' },
            { key: 'company_phone', label: t('sys.str_4393'), type: 'text' },
            { key: 'company_address', label: t('sys.str_4394'), type: 'text' },
            { key: 'tax_number', label: t('sys.str_4395'), type: 'text' },
            { key: 'currency', label: t('sys.str_4396'), type: 'text' },
        ]
    },
    {
        title: t('sys.str_4397'), keys: [
            { key: 'tax_rate', label: t('sys.str_4398'), type: 'number' },
            { key: 'zatca_enabled', label: t('sys.str_4399'), type: 'toggle' },
        ]
    },
    {
        title: t('sys.str_4400'), keys: [
            { key: 'zatca_crn', label: t('sys.str_4401'), type: 'text' },
            { key: 'zatca_industry', label: t('sys.str_4402'), type: 'text' },
            { key: 'branch_name_en', label: t('sys.str_4403'), type: 'text' },
            { key: 'zatca_street', label: t('sys.str_4404'), type: 'text' },
            { key: 'zatca_building', label: t('sys.str_4405'), type: 'text' },
            { key: 'zatca_district', label: t('sys.str_4406'), type: 'text' },
            { key: 'zatca_city', label: t('sys.str_4407'), type: 'text' },
            { key: 'zatca_city_en', label: t('sys.str_4408'), type: 'text' },
            { key: 'zatca_postal_code', label: t('sys.str_4409'), type: 'text' },
        ]
    },
    {
        title: t('sys.str_4410'), keys: [
            { key: 'printer_type', label: t('sys.str_4411'), type: 'select', options: [
                { value: '58mm', label: t('sys.str_4412') },
                { value: '76mm', label: t('sys.str_4413') },
                { value: '80mm', label: t('sys.str_4414') },
                { value: 'A4', label: '📄 A4 (210mm)' },
                { value: 'A5', label: '📄 A5 (148mm)' },
            ]},
            { key: 'receipt_header', label: t('sys.str_4415'), type: 'text' },
            { key: 'receipt_footer', label: t('sys.str_4416'), type: 'text' },
            { key: 'barcode_label_size', label: t('sys.str_4417'), type: 'select', options: [
                { value: '30x20', label: '🏷️ 30×20mm' },
                { value: '40x30', label: '🏷️ 40×30mm' },
                { value: '50x25', label: '🏷️ 50×25mm' },
                { value: '50x30', label: '🏷️ 50×30mm (مخصص)' },
                { value: '100x50', label: '🏷️ 100×50mm' },
            ]},
        ]
    },
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
        title: t('sys.str_4434'), keys: [
            { key: 'zatca_environment', label: t('sys.str_4435'), type: 'select' },
            { key: 'zatca_otp', label: t('sys.str_4436'), type: 'text' },
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
            const isAdmin = u.role === 'admin' || u.role === 'owner';

            // Admin always has universal access
            if (isAdmin || perms.includes('settings')) {
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
    const roleLabels: Record<string, string> = { owner: 'المالك', admin: 'مدير النظام', manager: 'مدير عام', auditor: 'مُراجع / مدقق', accountant: 'محاسب', cashier: 'كاشير', data_entry: 'مدخل بيانات', hr: 'موارد بشرية', sales_rep: 'مندوب مبيعات' };
    const ALL_MODULES = [
        { key: 'dashboard', label: t('sys.str_4445') },
        { key: 'pos', label: t('sys.str_4446') },
        { key: 'restaurant_pos', label: t('sys.str_4447') },
        { key: 'shifts', label: t('sys.str_4448') },
        { key: 'sales_orders', label: t('sys.str_4449') },
        { key: 'sales', label: t('sys.str_4450') },
        { key: 'sales_routes', label: t('sys.str_4451') },
        { key: 'sales_targets', label: t('sys.str_4452') },
        { key: 'purchases', label: t('sys.str_4453') },
        { key: 'purchase_orders', label: t('sys.str_4454') },
        { key: 'letters_of_credit', label: t('sys.str_4455') },
        { key: 'sales_returns', label: t('sys.str_4456') },
        { key: 'purchase_returns', label: t('sys.str_4457') },
        { key: 'bookings', label: t('sys.str_4458') },
        { key: 'price_quotes', label: t('sys.str_4459') },
        { key: 'coupons', label: t('sys.str_4460') },
        { key: 'products', label: t('sys.str_4461') },
        { key: 'stock', label: t('sys.str_4462') },
        { key: 'manufacturing', label: t('sys.str_4463') },
        { key: 'warehouses', label: t('sys.str_4464') },
        { key: 'stock_transfers', label: t('sys.str_4465') },
        { key: 'barcode', label: t('sys.str_4466') },
        { key: 'batches', label: t('sys.str_4467') },
        { key: 'customers', label: t('sys.str_4468') },
        { key: 'loyalty', label: t('sys.str_4469') },
        { key: 'treasury', label: t('sys.str_4470') },
        { key: 'treasury_checks', label: t('sys.str_4471') },
        { key: 'bank_reconciliation', label: t('sys.str_4472') },
        { key: 'petty_cash', label: t('sys.str_4473') },
        { key: 'banks', label: t('sys.str_4474') },
        { key: 'receipt_vouchers', label: t('sys.str_4475') },
        { key: 'expenses', label: t('sys.str_4169') },
        { key: 'reports', label: t('sys.str_4476') },
        { key: 'installments', label: t('sys.str_4477') },
        { key: 'gift_cards', label: t('sys.str_4478') },
        { key: 'employees', label: t('sys.str_4479') },
        { key: 'attendance', label: t('sys.str_4480') },
        { key: 'hr_loans', label: t('sys.str_4481') },
        { key: 'salaries', label: t('sys.str_4482') },
        { key: 'vacations', label: t('sys.str_4483') },
        { key: 'whatsapp', label: t('sys.str_4484') },
        { key: 'salla', label: t('sys.str_4485') },
        { key: 'maintenance', label: t('sys.str_4486') },
        { key: 'promotions', label: t('sys.str_4487') },
        { key: 'stocktake', label: t('sys.str_4488') },
        { key: 'vision_inventory', label: t('sys.str_4489') },
        { key: 'master-panel', label: t('sys.str_4490') },
        { key: 'mrp', label: t('sys.str_4491') },
        { key: 'projects', label: t('sys.str_4492') },
        { key: 'wms', label: t('sys.str_4493') },
        { key: 'legal', label: t('sys.str_4494') },
        { key: 'accounting', label: t('sys.str_4495') },
        { key: 'fixed_assets', label: t('sys.str_4496') },
        { key: 'crm_leads', label: t('sys.str_4497') },
        { key: 'fleet', label: t('sys.str_4498') },
        { key: 'property', label: t('sys.str_4499') },
        { key: 'quality', label: t('sys.str_4500') },
        { key: 'branches', label: t('sys.str_4501') },
        { key: 'currencies', label: t('sys.str_4502') },
        { key: 'approvals', label: t('sys.str_4503') },
        { key: 'settings', label: t('sys.str_4504') },
        { key: 'audit_logs', label: t('sys.str_4505') },
        { key: 'manage_users', label: t('sys.str_4506') },
        { key: 'manage_permissions', label: t('sys.str_4507') },
        { key: 'delete_invoices', label: t('sys.str_4508') },
        { key: 'delete_expense', label: t('sys.str_4509') },
        { key: 'delete_all_expenses', label: t('sys.str_4510') },
        { key: 'edit_expense', label: t('sys.str_4511') },
        { key: 'delete_products', label: t('sys.str_4512') },
        { key: 'reset_stock', label: t('sys.str_4513') },
        { key: 'delete_all_sales', label: t('sys.str_4514') },
        { key: 'reset_password', label: t('sys.str_4515') },
        { key: 'clear_zatca', label: t('sys.str_4516') },
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
        if (!newUser.username.trim() || !newUser.password.trim() || !newUser.fullName.trim()) { showToast(t('sys.str_4517')); return; }
        setSavingUser(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...newUser, modules: newUserModules }) });
            if (res.ok) {
                showToast(t('sys.str_4518'));
                setNewUser({ username: '', password: '', fullName: '', role: 'cashier', phone: '', branchId: '' });
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
        } catch (err) { console.error(err); }
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
        } catch (err) { console.error(err); }
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

    const handleFatooraAction = async (action: string) => {
        setFatooraLoading(true);
        setFatooraMessage('');
        try {
            const token = localStorage.getItem('token');
            const bodyData: Record<string, any> = { action };

            // For compliance-csid, pass OTP
            if (action === 'compliance-csid') {
                const otp = settings['zatca_otp'] || '';
                if (!otp) { showToast(t('sys.str_4534')); setFatooraLoading(false); return; }
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
                setFatooraMessage(`❌ ${data.error || data.message || t('sys.str_4198')}`);
                showToast(`❌ ${data.error || data.message || t('sys.str_4198')}`);
            }
        } catch (err) { console.error(err); setFatooraMessage(t('sys.str_4535')); }
        finally { setFatooraLoading(false); }
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
                        {gi === 0 && (
                            <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                                <label className="input-label" style={{ marginBottom: '12px', display: 'block' }}>{t('sys.str_4339')}</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                    {logoPreview ? (
                                        <img src={logoPreview} alt={t('sys.str_4538')} style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '12px', background: '#fff', padding: '4px', border: '1px solid var(--border)' }} />
                                    ) : (
                                        <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '1px solid var(--border)' }}>🏢</div>
                                    )}
                                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                                        <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                            {uploadingLogo ? t('sys.str_4539') : t('sys.str_4540')}
                                            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={uploadingLogo} />
                                        </label>
                                        {logoPreview && (
                                            <button className="btn btn-ghost btn-sm" onClick={handleLogoDelete} style={{ color: 'var(--danger)', fontSize: '12px' }}>{t('sys.str_4340')}</button>
                                        )}
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('sys.str_4341')}</span>
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
                        {group.title.includes(t('sys.str_4543')) && (
                            <div style={{ marginTop: '16px', padding: '20px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>{t('sys.str_4139')}</h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{t('sys.str_4344')}</p>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                    <div style={{ flex: '1', minWidth: '200px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>{t('sys.str_4345')}</label>
                                        <input
                                            className="input"
                                            id="barcode-label-input"
                                            placeholder={t('sys.str_4544')}
                                            dir="ltr"
                                        />
                                    </div>
                                    <div style={{ minWidth: '80px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', display: 'block' }}>{t('sys.str_4093')}</label>
                                        <input className="input" id="barcode-label-qty" type="number" defaultValue="1" min="1" max="100" style={{ width: '80px' }} dir="ltr" />
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            const barcodeInput = (document.getElementById('barcode-label-input') as HTMLInputElement)?.value;
                                            const qty = parseInt((document.getElementById('barcode-label-qty') as HTMLInputElement)?.value || '1');
                                            const labelSize = settings['barcode_label_size'] || '50x30';
                                            if (!barcodeInput) { showToast(t('sys.str_4545')); return; }
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
                                        {t('sys.str_4346')}</button>
                                </div>
                            </div>
                        )}
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
                        {group.title.includes(t('sys.str_4551')) && (
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
                                                {fatooraStep >= 3 ? t('sys.str_4552') : t('sys.str_4553')}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {fatooraStep >= 3
                                                    ? t('sys.str_4554')
                                                    : t('sys.str_4555')}
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
                                        {t('sys.str_4348')}</a>
                                </div>

                                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '16px' }}>{t('sys.str_4349')}</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        { step: 1, label: t('sys.str_4556'), action: 'compliance-csid', desc: 'إرسال CSR مع OTP من بوابة فاتورة' },
                                        { step: 2, label: t('sys.str_4557'), action: 'compliance-invoice', desc: 'إرسال فاتورة تجريبية للتحقق' },
                                        { step: 3, label: t('sys.str_4558'), action: 'production-csid', desc: 'تفعيل الربط المباشر مع منصة فاتورة' },
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
                                                {fatooraLoading ? '⏳' : fatooraStep >= s.step ? t('sys.str_4559') : t('sys.str_4560')}
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
                                <select className="input" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
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
                            <div>
                                <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>{t('sys.str_4365')}</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    <button type="button" className={`btn btn-sm ${newUserModules.length === ALL_MODULES.length ? 'btn-primary' : 'btn-ghost'}`}
                                        onClick={() => setNewUserModules(newUserModules.length === ALL_MODULES.length ? [] : ALL_MODULES.map(m => m.key))} style={{ fontSize: '11px' }}>
                                        {newUserModules.length === ALL_MODULES.length ? t('sys.str_4578') : t('sys.str_4579')}
                                    </button>
                                    {ALL_MODULES.map(m => (
                                        <button key={m.key} type="button"
                                            className={`btn btn-sm ${newUserModules.includes(m.key) ? 'btn-success' : 'btn-ghost'}`}
                                            onClick={() => setNewUserModules(prev => prev.includes(m.key) ? prev.filter(x => x !== m.key) : [...prev, m.key])}
                                            style={{ fontSize: '11px' }}>{m.label}</button>
                                    ))}
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
                                                <button className="btn btn-ghost btn-sm" onClick={() => { setEditPermUser(u); setEditPermModules((u.permissions || []).map((p: { module: string }) => p.module)); }}
                                                    style={{ fontSize: '11px' }}>
                                                    🔐 {(u.permissions || []).length} {t('sys.str_4373')}</button>
                                            )}
                                        </td>
                                        <td>
                                            <button className={`btn btn-sm ${u.active ? 'btn-success' : 'btn-ghost'}`} onClick={() => toggleUserActive(u)} style={{ fontSize: '11px' }}>
                                                {u.active ? t('sys.str_4581') : t('sys.str_4542')}
                                            </button>
                                        </td>
                                        <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString('ar-SA')}</td>
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

            {/* Device Management Section */}
            {canManageUsers && (
                <div className="card" style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>{t('sys.str_4376')}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                        {t('sys.str_4377')}</p>
                    <table className="table" style={{ fontSize: '13px' }}>
                        <thead><tr><th>{t('sys.str_4378')}</th><th>{t('sys.str_4379')}</th><th>{t('sys.str_4380')}</th><th>{t('sys.str_4215')}</th><th></th></tr></thead>
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
                                            <span style={{ color: 'var(--success-light)', fontSize: '12px', fontWeight: '600' }}>{t('sys.str_4381')}</span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{t('sys.str_4382')}</span>
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
                                                    } catch { showToast(t('sys.str_4162')); }
                                                }}
                                                style={{ fontSize: '11px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}
                                            >
                                                {t('sys.str_4383')}</button>
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
                            <h3>{t('sys.str_4384')}{editPermUser.fullName}</h3>
                            <button className="modal-close" onClick={() => setEditPermUser(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>{t('sys.str_4385')}</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                                <button type="button" className={`btn btn-sm ${editPermModules.length === ALL_MODULES.length ? 'btn-primary' : 'btn-ghost'}`}
                                    onClick={() => setEditPermModules(editPermModules.length === ALL_MODULES.length ? [] : ALL_MODULES.map(m => m.key))} style={{ fontSize: '11px' }}>
                                    {editPermModules.length === ALL_MODULES.length ? t('sys.str_4578') : t('sys.str_4579')}
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
                                    showToast(t('sys.str_4582'));
                                    setEditPermUser(null);
                                    fetchUsers();
                                } catch { showToast(t('sys.str_4199')); }
                            }}>{t('sys.str_4252')}</button>
                            <button className="btn btn-ghost" onClick={() => setEditPermUser(null)}>{t('sys.str_4097')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Danger Zone */}
            {(canDeleteAllSales || canClearZatca) && (
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
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>{t('sys.str_4389')}</p>
                </div>
            )}
        </>
    );
}
