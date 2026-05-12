import React, { useState } from 'react';
import { getStateMachineFor, BaseState } from '@/lib/state-machine';
import { useToast } from '@/components/Toast';

interface StateBadgeProps {
    entityType: string;
    entityId: number;
    currentState: BaseState;
    onStateChange?: (newState: BaseState) => void;
    readOnly?: boolean;
}

const STATE_COLORS: Record<string, string> = {
    DRAFT: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    POSTED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    PAID: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    PARTIAL_PAID: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    CANCELLED: 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100',
    REVERSED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    INACTIVE: 'bg-gray-300 text-gray-800 dark:bg-gray-600 dark:text-gray-200',
};

const STATE_LABELS: Record<string, string> = {
    DRAFT: 'مسودة',
    SUBMITTED: 'مُقدم',
    PENDING_APPROVAL: 'بانتظار الاعتماد',
    APPROVED: 'معتمد',
    REJECTED: 'مرفوض',
    POSTED: 'مُرحّل',
    PAID: 'مدفوع',
    PARTIAL_PAID: 'مدفوع جزئياً',
    CANCELLED: 'ملغي',
    REVERSED: 'معكوس',
    ACTIVE: 'نشط',
    INACTIVE: 'غير نشط',
};

export default function StateBadge({ entityType, entityId, currentState, onStateChange, readOnly = false }: StateBadgeProps) {
    const [loading, setLoading] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const { error: toastError, success: toastSuccess } = useToast();

    let allowedTransitions: BaseState[] = [];
    try {
        const machine = getStateMachineFor(entityType);
        allowedTransitions = machine.getAllowedTransitions(currentState);
    } catch (e) {
        // If entityType is not mapped, we just display the badge read-only
    }

    const handleTransition = async (targetState: BaseState) => {
        setLoading(true);
        setMenuOpen(false);
        try {
            const res = await fetch(`/api/documents/transition`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    entityType,
                    entityId,
                    targetState,
                    currentState,
                    reason: '' // Can be expanded to prompt for a reason
                })
            });

            if (!res.ok) {
                const err = await res.json();
                toastError(`فشل تغيير الحالة: ${err.error || 'حدث خطأ غير معروف'}`);
                return;
            }

            toastSuccess('تم تغيير الحالة بنجاح');
            if (onStateChange) onStateChange(targetState);
        } catch (error) {
            console.error(error);
            toastError('فشل الاتصال بالخادم لتغيير الحالة');
        } finally {
            setLoading(false);
        }
    };

    const colorClass = STATE_COLORS[currentState] || 'bg-gray-100 text-gray-800';
    const label = STATE_LABELS[currentState] || currentState;

    if (readOnly || allowedTransitions.length === 0) {
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                {label}
            </span>
        );
    }

    return (
        <div className="relative inline-block text-left">
            <button
                onClick={() => setMenuOpen(!menuOpen)}
                disabled={loading}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors shadow-sm hover:shadow ${colorClass} ${loading ? 'opacity-50' : ''}`}
            >
                {label}
                <svg className="ml-1.5 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>

            {menuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10 focus:outline-none">
                    <div className="py-1">
                        <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                            تغيير الحالة إلى:
                        </div>
                        {allowedTransitions.map(target => (
                            <button
                                key={target}
                                onClick={() => handleTransition(target)}
                                className="block w-full text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                {STATE_LABELS[target] || target}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
