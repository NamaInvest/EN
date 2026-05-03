'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Shield, Save, Check, X, User } from 'lucide-react';
import { Skeleton } from '@/components/Skeleton';
import { useToast } from '@/components/Toast';

const MODULES_GROUPED = [
    {
        category: 'لوحة القيادة والذكاء الاصطناعي',
        keys: ['dashboard', 'ai_bank', 'ai_copilot', 'ai_cfo', 'ai_scm']
    },
    {
        category: 'المبيعات ونقاط البيع',
        keys: ['sales', 'sales_orders', 'sales_returns', 'sales_routes', 'sales_targets', 'price_quotes', 'pos', 'restaurant_pos', 'customers']
    },
    {
        category: 'المشتريات والتوريد',
        keys: ['purchases', 'purchase_orders', 'purchase_returns', 'letters_of_credit']
    },
    {
        category: 'المخزون والمستودعات',
        keys: ['products', 'stock', 'stock_transfers', 'warehouses', 'wms', 'barcode', 'batches', 'vision_inventory']
    },
    {
        category: 'المالية والمحاسبة',
        keys: ['accounting', 'treasury', 'banks', 'treasury_checks', 'receipt_vouchers', 'expenses', 'petty_cash', 'fixed_assets', 'installments', 'reports']
    },
    {
        category: 'الموارد البشرية والرواتب',
        keys: ['employees', 'attendance', 'salaries', 'vacations', 'hr_loans', 'shifts']
    },
    {
        category: 'التسويق وعلاقات العملاء',
        keys: ['loyalty', 'gift_cards', 'coupons', 'promotions', 'bookings', 'affiliates']
    },
    {
        category: 'التصنيع والصيانة',
        keys: ['manufacturing', 'mrp', 'maintenance']
    },
    {
        category: 'القطاعات المتخصصة (Verticals)',
        keys: ['projects', 'legal', 'schools', 'pharmacy']
    },
    {
        category: 'إعدادات النظام',
        keys: ['settings', 'branches', 'currencies', 'approvals', 'audit_logs', 'master-panel', 'whatsapp', 'salla']
    }
];

const MODULE_NAMES: Record<string, string> = {
    'dashboard': 'لوحة القيادة',
    'ai_bank': 'محلل البنوك الذكي',
    'ai_copilot': 'المساعد الذكي',
    'ai_cfo': 'المدير المالي الذكي',
    'ai_scm': 'سلاسل الإمداد الذكية',
    'pos': 'نقاط البيع',
    'restaurant_pos': 'نقاط بيع المطاعم',
    'shifts': 'الورديات',
    'sales': 'المبيعات',
    'price_quotes': 'عروض الأسعار',
    'sales_orders': 'أوامر البيع',
    'sales_returns': 'مرتجعات المبيعات',
    'sales_routes': 'خطوط السير والمناديب',
    'sales_targets': 'العمولات والمستهدفات',
    'purchases': 'المشتريات',
    'purchase_orders': 'أوامر الشراء',
    'purchase_returns': 'مرتجعات المشتريات',
    'letters_of_credit': 'الاعتمادات المستندية',
    'products': 'المنتجات',
    'stock': 'المخزون',
    'stock_transfers': 'نقل المخزون',
    'warehouses': 'المستودعات',
    'wms': 'إدارة المستودعات المتقدمة',
    'barcode': 'الباركود',
    'batches': 'الدفعات وتواريخ الانتهاء',
    'vision_inventory': 'الجرد بالذكاء الاصطناعي',
    'manufacturing': 'التصنيع',
    'accounting': 'المحاسبة',
    'treasury': 'الخزينة',
    'banks': 'البنوك',
    'treasury_checks': 'الشيكات',
    'receipt_vouchers': 'سندات القبض والصرف',
    'expenses': 'المصروفات',
    'petty_cash': 'العهد النقدية',
    'fixed_assets': 'الأصول الثابتة',
    'installments': 'الأقساط',
    'reports': 'التقارير',
    'customers': 'العملاء',
    'loyalty': 'نقاط الولاء',
    'gift_cards': 'كروت الهدايا',
    'coupons': 'الكوبونات',
    'promotions': 'العروض الترويجية',
    'bookings': 'الحجوزات',
    'affiliates': 'التسويق بالعمولة',
    'employees': 'الموظفين',
    'attendance': 'الحضور والانصراف',
    'salaries': 'الرواتب',
    'vacations': 'الإجازات',
    'hr_loans': 'السلف والقروض',
    'projects': 'المشاريع',
    'legal': 'الشؤون القانونية',
    'schools': 'المدارس',
    'pharmacy': 'الصيدليات',
    'approvals': 'الاعتمادات والموافقات',
    'mrp': 'تخطيط الموارد',
    'maintenance': 'الصيانة',
    'audit_logs': 'سجل الحركات (Audit)',
    'settings': 'الإعدادات العامة',
    'master-panel': 'لوحة التحكم المركزية (Master)',
    'branches': 'الفروع',
    'currencies': 'العملات',
    'salla': 'ربط سلة'
};

const ROLE_PRESETS = [
    {
        name: 'كاشير تجزئة (Retail Cashier)',
        icon: '💻',
        modules: ['dashboard', 'pos', 'shifts', 'sales_returns', 'receipt_vouchers']
    },
    {
        name: 'كاشير مطعم (Restaurant Cashier)',
        icon: '🍔',
        modules: ['dashboard', 'restaurant_pos', 'shifts', 'receipt_vouchers']
    },
    {
        name: 'محاسب عام (Accountant)',
        icon: '📊',
        modules: ['dashboard', 'accounting', 'treasury', 'banks', 'treasury_checks', 'receipt_vouchers', 'expenses', 'petty_cash', 'fixed_assets', 'reports', 'purchases', 'sales']
    },
    {
        name: 'مراجع مالي (Auditor)',
        icon: '🕵️',
        modules: ['dashboard', 'reports', 'audit_logs', 'accounting', 'approvals', 'vision_inventory']
    },
    {
        name: 'أمين مستودع (Storekeeper)',
        icon: '📦',
        modules: ['dashboard', 'products', 'stock', 'stock_transfers', 'warehouses', 'wms', 'barcode', 'batches', 'vision_inventory', 'purchase_orders']
    },
    {
        name: 'مسؤول مشتريات (Purchaser)',
        icon: '🛒',
        modules: ['dashboard', 'purchases', 'purchase_orders', 'purchase_returns', 'letters_of_credit', 'products', 'suppliers']
    },
    {
        name: 'مندوب مبيعات (Sales Rep)',
        icon: '🎯',
        modules: ['dashboard', 'sales', 'sales_orders', 'price_quotes', 'customers', 'sales_routes']
    },
    {
        name: 'مدير إنتاج (Manufacturing)',
        icon: '🏭',
        modules: ['dashboard', 'manufacturing', 'mrp', 'maintenance', 'products', 'stock']
    },
    {
        name: 'مسؤول موارد بشرية (HR)',
        icon: '👥',
        modules: ['dashboard', 'employees', 'attendance', 'salaries', 'vacations', 'hr_loans', 'shifts']
    },
    {
        name: 'إدارة علاقات العملاء (CRM)',
        icon: '🤝',
        modules: ['dashboard', 'customers', 'loyalty', 'gift_cards', 'coupons', 'promotions', 'bookings', 'affiliates']
    },
    {
        name: 'مدير أسطول (Fleet Manager)',
        icon: '🚚',
        modules: ['dashboard', 'fleet', 'maintenance', 'employees']
    },
    {
        name: 'إدارة المدارس (School Admin)',
        icon: '🏫',
        modules: ['dashboard', 'schools', 'employees', 'accounting']
    },
    {
        name: 'صلاحيات كاملة (Admin)',
        icon: '👑',
        modules: MODULES_GROUPED.flatMap(g => g.keys)
    }
];

export default function RolesAndPermissionsPage() {
    const { lang } = useTranslation();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [selectedModules, setSelectedModules] = useState<string[]>([]);
    const toast = useToast();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/settings/roles');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
                if (data.length > 0) {
                    selectUser(data[0]);
                }
            } else {
                toast.error(_t('فشل تحميل المستخدمين', 'Failed to load users'));
            }
        } catch (error) {
            toast.error(_t('حدث خطأ', 'Error occurred'));
        } finally {
            setLoading(false);
        }
    };

    const selectUser = (user: any) => {
        setSelectedUserId(user.id);
        const userMods = user.permissions?.map((p: any) => p.module) || [];
        setSelectedModules(userMods);
    };

    const toggleModule = (moduleKey: string) => {
        setSelectedModules(prev => 
            prev.includes(moduleKey) 
                ? prev.filter(m => m !== moduleKey)
                : [...prev, moduleKey]
        );
    };

    const toggleGroup = (groupKeys: string[]) => {
        const allSelected = groupKeys.every(k => selectedModules.includes(k));
        if (allSelected) {
            setSelectedModules(prev => prev.filter(m => !groupKeys.includes(m)));
        } else {
            setSelectedModules(prev => Array.from(new Set([...prev, ...groupKeys])));
        }
    };

    const applyPreset = (presetModules: string[]) => {
        setSelectedModules(presetModules);
    };

    const handleSave = async () => {
        if (!selectedUserId) return;
        setSaving(true);
        try {
            const res = await fetch('/api/settings/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: selectedUserId, modules: selectedModules })
            });

            if (res.ok) {
                toast.success(_t('تم الحفظ بنجاح', 'Saved successfully'));
                // Update local state
                setUsers(users.map(u => u.id === selectedUserId ? { ...u, permissions: selectedModules.map(m => ({ module: m })) } : u));
            } else {
                toast.error(_t('فشل الحفظ', 'Failed to save'));
            }
        } catch (error) {
            toast.error(_t('حدث خطأ', 'Error occurred'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <Skeleton type="rectangular" className="h-12 w-1/3 mb-6" />
                <div className="flex gap-6">
                    <Skeleton type="rectangular" className="w-1/4 h-96" />
                    <Skeleton type="rectangular" className="w-3/4 h-96" />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="w-6 h-6 text-indigo-600" />
                        {_t('مصفوفة الصلاحيات (Roles & Permissions)', 'Roles & Permissions')}
                    </h1>
                    <p className="text-gray-500 mt-1">{_t('حدد الوحدات المسموح بها لكل مستخدم', 'Define allowed modules per user')}</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {saving ? _t('جاري الحفظ...', 'Saving...') : _t('حفظ التعديلات', 'Save Changes')}
                </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Users List */}
                <div className="w-full md:w-1/4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200">{_t('المستخدمين', 'Users')}</h3>
                    </div>
                    <div className="overflow-y-auto max-h-[600px] p-2 space-y-1">
                        {users.map(user => (
                            <button
                                key={user.id}
                                onClick={() => selectUser(user)}
                                className={`w-full text-start px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${selectedUserId === user.id ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 border' : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedUserId === user.id ? 'bg-indigo-200 text-indigo-700' : 'bg-gray-200 text-gray-600'}`}>
                                    <User className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">{user.username}</div>
                                    <div className="text-xs text-gray-500">{user.role}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="w-full md:w-3/4 flex flex-col gap-6">
                    {/* Presets Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-3">{_t('تطبيق قالب جاهز (Role Templates)', 'Apply Role Template')}</h3>
                        <div className="flex flex-wrap gap-3">
                            {ROLE_PRESETS.map((preset, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => applyPreset(preset.modules)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors text-gray-800 dark:text-gray-200"
                                >
                                    <span>{preset.icon}</span>
                                    {preset.name}
                                </button>
                            ))}
                            <button
                                onClick={() => applyPreset([])}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors text-red-700 dark:text-red-400"
                            >
                                🗑️ {_t('إزالة جميع الصلاحيات', 'Clear All')}
                            </button>
                        </div>
                    </div>

                    {/* Modules Checklist */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200">{_t('الوحدات البرمجية المتاحة', 'Available Modules')}</h3>
                            <span className="text-sm bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full font-bold">{selectedModules.length} {_t('محددة', 'Selected')}</span>
                        </div>
                        
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[600px] overflow-y-auto">
                        {MODULES_GROUPED.map((group, idx) => (
                            <div key={idx} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-800/50">
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-600">
                                    <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200">{group.category}</h4>
                                    <button 
                                        onClick={() => toggleGroup(group.keys)}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-medium"
                                    >
                                        {_t('تحديد الكل', 'Select All')}
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {group.keys.map(key => {
                                        const isSelected = selectedModules.includes(key);
                                        const displayName = MODULE_NAMES[key] || key;
                                        return (
                                            <label key={key} className="flex items-center gap-3 p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-600 w-full">
                                                <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors flex-shrink-0 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                                    {isSelected && <Check className="w-3 h-3" />}
                                                </div>
                                                <span className={`text-sm ${isSelected ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                                    {displayName}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
