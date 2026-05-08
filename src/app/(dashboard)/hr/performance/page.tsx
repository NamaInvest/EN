'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
    employeeId: z.string().min(1, 'Employee is required'),
    evaluatorId: z.string().min(1, 'Evaluator is required'),
    period: z.string().min(1, 'Period is required'),
    score: z.number().min(1, 'Score must be at least 1').max(5, 'Score cannot exceed 5'),
    strengths: z.string().optional().nullable(),
    weaknesses: z.string().optional().nullable(),
    recommendations: z.string().optional().nullable()
});

type FormValues = z.infer<typeof formSchema>;

export default function PerformanceReviewPage() {
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // UI state
    const [activeTab, setActiveTab] = useState('ALL'); // ALL, NEW_EVAL

    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employeeId: '',
            evaluatorId: '',
            period: 'ANNUAL',
            score: undefined,
            strengths: '',
            weaknesses: '',
            recommendations: ''
        }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/hr/performance');
            const data = await res.json();
            if (data.success) {
                setEvaluations(data.data.evaluations);
                setEmployees(data.data.employees);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: FormValues) => {
        setSaving(true);
        try {
            const res = await fetch('/api/hr/performance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (res.ok) {
                toastSuccess('تم تقديم التقييم بنجاح!');
                setActiveTab('ALL');
                reset();
                fetchData();
            } else {
                toastError(result.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const getScoreBadge = (val: number) => {
        if (val >= 4.5) return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">ممتاز ({val})</span>;
        if (val >= 3.5) return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">جيد جداً ({val})</span>;
        if (val >= 2.5) return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">جيد ({val})</span>;
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">ضعيف ({val})</span>;
    };

    if (loading && evaluations.length === 0) return <div className="p-8 text-indigo-600">جاري تحميل سجلات التقييم...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex justify-between items-center border-b-4 border-indigo-600">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تقييم الأداء الشامل (360° Performance Review)</h1>
                    <p className="text-gray-500 mt-1">إدارة تقييمات الموظفين، تحديد الأهداف، ومراجعة النقاط الإيجابية والسلبية.</p>
                </div>
                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-md">
                    <button 
                        onClick={() => setActiveTab('ALL')}
                        className={`px-4 py-2 rounded-md font-bold text-sm ${activeTab === 'ALL' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        السجل والتقارير
                    </button>
                    <button 
                        onClick={() => setActiveTab('NEW_EVAL')}
                        className={`px-4 py-2 rounded-md font-bold text-sm ${activeTab === 'NEW_EVAL' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                        إضافة تقييم جديد
                    </button>
                </div>
            </div>

            {activeTab === 'NEW_EVAL' && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow max-w-4xl mx-auto border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold mb-6 dark:text-white text-indigo-600 border-b pb-2 dark:border-gray-700">نموذج تقييم موظف (Evaluation Form)</h2>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الموظف المُقيَّم (Evaluatee)</label>
                                <select 
                                    className={`w-full border ${errors.employeeId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white`}
                                    {...register('employeeId')}
                                >
                                    <option value="">اختر الموظف...</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name} - {emp.position}</option>)}
                                </select>
                                {errors.employeeId && <span className="text-red-500 text-xs mt-1 block">{errors.employeeId.message}</span>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">المُقيِّم (Evaluator)</label>
                                <select 
                                    className={`w-full border ${errors.evaluatorId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white`}
                                    {...register('evaluatorId')}
                                >
                                    <option value="">اختر المُقيِّم...</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">ملاحظة: إذا كان نفس الموظف فهو (تقييم ذاتي).</p>
                                {errors.evaluatorId && <span className="text-red-500 text-xs mt-1 block">{errors.evaluatorId.message}</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">الفترة الزمنية</label>
                                <select 
                                    className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                    {...register('period')}
                                >
                                    <option value="ANNUAL">سنوي (Annual)</option>
                                    <option value="Q1">الربع الأول (Q1)</option>
                                    <option value="Q2">الربع الثاني (Q2)</option>
                                    <option value="Q3">الربع الثالث (Q3)</option>
                                    <option value="Q4">الربع الرابع (Q4)</option>
                                    <option value="PROBATION">فترة التجربة (Probation)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التقييم الإجمالي (من 5)</label>
                                <input 
                                    type="number" step="0.1"
                                    placeholder="مثال: 4.2"
                                    className={`w-full border ${errors.score ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white font-bold text-indigo-600 dark:text-indigo-400`}
                                    {...register('score', { valueAsNumber: true })}
                                />
                                {errors.score && <span className="text-red-500 text-xs mt-1 block">{errors.score.message}</span>}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نقاط القوة (Strengths)</label>
                                <textarea 
                                    rows={3} 
                                    placeholder="ما هي أبرز إنجازات ومهارات الموظف خلال الفترة؟"
                                    className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                    {...register('strengths')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">نقاط التطوير (Areas of Improvement / Weaknesses)</label>
                                <textarea 
                                    rows={3}
                                    placeholder="أين يجب على الموظف التركيز لتطوير أدائه؟"
                                    className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                    {...register('weaknesses')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">التوصيات والإجراءات (Recommendations)</label>
                                <textarea 
                                    rows={2}
                                    placeholder="دورات تدريبية مقترحة، خطة أهداف للفترة القادمة، مكافأة..."
                                    className="w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-700 dark:text-white"
                                    {...register('recommendations')}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                            <button 
                                type="submit" disabled={saving}
                                className="bg-indigo-600 text-white px-8 py-3 rounded-md font-bold hover:bg-indigo-700 shadow-md disabled:opacity-50"
                            >
                                {saving ? 'جاري الحفظ...' : 'اعتماد التقييم'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {activeTab === 'ALL' && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ التقييم</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموظف</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المُقيِّم</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">الفترة</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">النتيجة</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">ملاحظات والتوصيات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {evaluations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        لا توجد تقييمات أداء مسجلة حتى الآن.
                                    </td>
                                </tr>
                            ) : evaluations.map(ev => {
                                const isSelf = ev.employeeId === ev.evaluatorId;
                                return (
                                    <tr key={ev.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(ev.evaluationDate).toLocaleDateString('ar-SA')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{ev.employee.name}</div>
                                            <div className="text-xs text-gray-500">{ev.employee.position}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {ev.evaluator.name} 
                                                {isSelf && <span className="ml-2 rtl:mr-2 text-xs bg-gray-100 dark:bg-gray-700 px-1 rounded text-gray-500">ذاتي</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-600 dark:text-gray-300">
                                            {ev.period}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {getScoreBadge(ev.score)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                            {ev.recommendations || 'بدون توصيات'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
