'use client';

import React, { useState, useEffect } from 'react';

// Example structured list of entities and fields to manage
const CONFIG = {
    roles: ['admin', 'manager', 'accountant', 'hr', 'sales', 'user'],
    entities: [
        { name: 'Salary', fields: ['amount', 'bonuses', 'deductions'] },
        { name: 'Margin', fields: ['percentage', 'cost', 'profit'] },
        { name: 'Cost', fields: ['unitCost', 'totalCost'] },
        { name: 'BankAccount', fields: ['accountNumber', 'balance'] },
        { name: 'EmployeePersonalInfo', fields: ['ssn', 'birthDate', 'address'] }
    ]
};

type Permission = 'READ' | 'WRITE' | 'HIDDEN';

interface RoleFieldPermission {
    id?: number;
    roleName: string;
    modelName: string;
    fieldName: string;
    permission: Permission;
}

export default function FieldPermissionsPage() {
    const [permissions, setPermissions] = useState<RoleFieldPermission[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/settings/permissions/fields')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setPermissions(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const getPermission = (role: string, entity: string, field: string): Permission => {
        const found = permissions.find(p => p.roleName === role && p.modelName === entity && p.fieldName === field);
        return found ? found.permission : 'READ';
    };

    const handleChange = async (role: string, entity: string, field: string, value: Permission) => {
        setSaving(true);

        try {
            const res = await fetch('/api/settings/permissions/fields', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roleName: role,
                    modelName: entity,
                    fieldName: field,
                    permission: value
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setPermissions(prev => {
                    const idx = prev.findIndex(p => p.roleName === role && p.modelName === entity && p.fieldName === field);
                    if (idx > -1) {
                        const copy = [...prev];
                        copy[idx] = updated;
                        return copy;
                    } else {
                        return [...prev, updated];
                    }
                });
            }
        } catch (err) {
            console.error('Failed to update permission', err);
            alert('Failed to save permission');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">جاري التحميل...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">صلاحيات الحقول (Field-Level Permissions)</h1>
                    <p className="text-gray-500 mt-1">التحكم في رؤية وتعديل الحقول الحساسة بناءً على الدور</p>
                </div>
                {saving && <span className="text-sm text-blue-600 animate-pulse">جاري الحفظ...</span>}
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                الكيان (Entity)
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                الحقل (Field)
                            </th>
                            {CONFIG.roles.map(role => (
                                <th key={role} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {role}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {CONFIG.entities.map(entity => (
                            <React.Fragment key={entity.name}>
                                {entity.fields.map((field, idx) => (
                                    <tr key={`${entity.name}-${field}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        {idx === 0 ? (
                                            <td rowSpan={entity.fields.length} className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white border-l border-gray-200 dark:border-gray-700 align-top">
                                                {entity.name}
                                            </td>
                                        ) : null}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                            {field}
                                        </td>
                                        {CONFIG.roles.map(role => (
                                            <td key={role} className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                <select
                                                    disabled={saving}
                                                    value={getPermission(role, entity.name, field)}
                                                    onChange={(e) => handleChange(role, entity.name, field, e.target.value as Permission)}
                                                    className="block w-full pl-3 pr-10 py-1.5 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-white"
                                                >
                                                    <option value="READ">قراءة فقط</option>
                                                    <option value="WRITE">قراءة وتعديل</option>
                                                    <option value="HIDDEN">مخفي</option>
                                                </select>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
