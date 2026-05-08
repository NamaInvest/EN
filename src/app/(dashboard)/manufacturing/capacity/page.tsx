'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function CapacityPlanningPage() {
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [machines, setMachines] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState<Date[]>([]);
    
    // Create a 14-day view starting from today
    useEffect(() => {
        const d = [];
        const today = new Date();
        today.setHours(0,0,0,0);
        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            d.push(date);
        }
        setDays(d);
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/manufacturing/capacity');
            const data = await res.json();
            if (res.ok) {
                setMachines(data.data.machines || []);
                setOrders(data.data.orders || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = async (e: React.DragEvent, machineId: number, targetDate: Date) => {
        e.preventDefault();
        const orderId = e.dataTransfer.getData('orderId');
        if (!orderId) return;

        const order = orders.find(o => o.id === Number(orderId));
        if (!order) return;

        const currentStart = new Date(order.startDate);
        const currentEnd = new Date(order.endDate);
        const duration = currentEnd.getTime() - currentStart.getTime();

        const newStart = new Date(targetDate);
        newStart.setHours(currentStart.getHours(), currentStart.getMinutes());
        
        const newEnd = new Date(newStart.getTime() + duration);

        try {
            const res = await fetch('/api/manufacturing/capacity', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    machineId: machineId,
                    newStartDate: newStart,
                    newEndDate: newEnd
                })
            });
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                toastError(data.error);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDragStart = (e: React.DragEvent, orderId: number) => {
        e.dataTransfer.setData('orderId', orderId.toString());
    };

    if (loading) return <div className="p-8 text-blue-600">جاري تحميل الجدولة...</div>;

    // Build grid cells. Each row is a machine, columns are days.
    return (
        <div className="p-8 mx-auto space-y-6 max-w-full">
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">تخطيط السعة وجدولة الإنتاج (Gantt)</h1>
                    <p className="text-gray-500 mt-1">تخطيط أوامر التصنيع على الآلات ومراكز العمل باستخدام السحب والإفلات.</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto p-4 border border-gray-200 dark:border-gray-700">
                <div style={{ minWidth: '1200px' }}>
                    {/* Header Row */}
                    <div className="flex border-b border-gray-300 dark:border-gray-600 sticky top-0 bg-white dark:bg-gray-800 z-10">
                        <div className="w-48 shrink-0 p-4 font-bold text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600 text-center">
                            الآلة / مركز العمل
                        </div>
                        {days.map((day, i) => (
                            <div key={i} className="flex-1 min-w-[100px] p-2 text-center border-r border-gray-300 dark:border-gray-600 text-sm font-bold text-gray-600 dark:text-gray-400">
                                <div>{day.toLocaleDateString('ar-SA', { weekday: 'short' })}</div>
                                <div>{day.getDate()}/{day.getMonth() + 1}</div>
                            </div>
                        ))}
                    </div>

                    {/* Machine Rows */}
                    {machines.map((machine) => {
                        const machineOrders = orders.filter(o => o.machineId === machine.id);
                        
                        return (
                            <div key={machine.id} className="flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <div className="w-48 shrink-0 p-4 font-bold text-gray-800 dark:text-white border-r border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                                    {machine.name}
                                </div>
                                
                                {/* Day Cells */}
                                {days.map((day, i) => {
                                    // Find orders spanning this day
                                    const dayStart = new Date(day);
                                    dayStart.setHours(0,0,0,0);
                                    const dayEnd = new Date(day);
                                    dayEnd.setHours(23,59,59,999);

                                    const dayOrders = machineOrders.filter(o => {
                                        const os = new Date(o.startDate);
                                        const oe = new Date(o.endDate);
                                        return (os <= dayEnd && oe >= dayStart);
                                    });

                                    const isConflict = dayOrders.length > 1;

                                    return (
                                        <div 
                                            key={i} 
                                            className={`flex-1 min-w-[100px] p-1 border-r border-gray-100 dark:border-gray-700/50 relative min-h-[60px] transition-colors ${isConflict ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
                                            onDrop={(e) => handleDrop(e, machine.id, day)}
                                            onDragOver={handleDragOver}
                                        >
                                            {dayOrders.map(o => (
                                                <div 
                                                    key={o.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, o.id)}
                                                    className={`mb-1 p-1 text-xs text-white rounded shadow-sm cursor-move truncate ${o.status === 'in_progress' ? 'bg-blue-500' : 'bg-indigo-500'}`}
                                                    title={`MO: ${o.orderNumber}\nالكمية: ${o.quantityToProduce}\nالمنتج: ${o.recipe?.name}`}
                                                >
                                                    MO-{o.orderNumber}
                                                </div>
                                            ))}
                                            {isConflict && <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-600 m-1" title="تعارض سعة (Conflict)"></div>}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}

                    {/* Unassigned Orders Row */}
                    <div className="flex border-b-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 mt-4">
                        <div className="w-48 shrink-0 p-4 font-bold text-yellow-800 dark:text-yellow-200 border-r border-yellow-200 text-center flex flex-col justify-center">
                            أوامر غير مجدولة
                            <span className="text-xs text-yellow-600 mt-1">اسحب إلى الجدول للتخصيص</span>
                        </div>
                        <div className="flex-1 p-4 flex flex-wrap gap-2">
                            {orders.filter(o => !o.machineId).map(o => (
                                <div 
                                    key={o.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, o.id)}
                                    className="p-2 text-sm text-white bg-gray-500 rounded shadow-sm cursor-move flex items-center max-w-xs"
                                    title={`الكمية: ${o.quantityToProduce}`}
                                >
                                    MO-{o.orderNumber}: {o.recipe?.name}
                                </div>
                            ))}
                            {orders.filter(o => !o.machineId).length === 0 && (
                                <div className="text-sm text-gray-500 my-auto">لا يوجد أوامر غير مجدولة.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
