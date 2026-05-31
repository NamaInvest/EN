import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n';
import { Plus, Trash2, QrCode, Bell, Coffee, Edit } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { QRCodeCanvas } from 'qrcode.react';

interface Zone {
    id: number;
    name: string;
    tables: Table[];
}

interface Table {
    id: number;
    name: string;
    capacity: number;
    status: string;
    qrToken: string;
    waiterCalls: any[];
}

export default function RestaurantFloorPlan({ onTableSelect }: { onTableSelect?: (table: Table) => void }) {
    const { lang } = useTranslation();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const { success, error } = useToast();

    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedZone, setSelectedZone] = useState<number | null>(null);

    // Modals
    const [showAddZone, setShowAddZone] = useState(false);
    const [newZoneName, setNewZoneName] = useState('');
    
    const [showAddTable, setShowAddTable] = useState(false);
    const [newTableName, setNewTableName] = useState('');
    const [newTableCapacity, setNewTableCapacity] = useState(4);

    const [showQrCode, setShowQrCode] = useState<string | null>(null);

    const fetchZones = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/pos/restaurant/tables');
            const data = await res.json();
            if (data.success) {
                setZones(data.zones);
                if (data.zones.length > 0 && selectedZone === null) {
                    setSelectedZone(data.zones[0].id);
                }
            }
        } catch (e: any) {
            error(_t('فشل جلب الأقسام', 'Failed to fetch zones'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchZones();
        // Poll for waiter calls every 10s
        const interval = setInterval(fetchZones, 10000);
        return () => clearInterval(interval);
    }, []);

    const createZone = async () => {
        if (!newZoneName) return;
        try {
            const res = await fetch('/api/pos/restaurant/tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CREATE_ZONE', name: newZoneName })
            });
            const data = await res.json();
            if (data.success) {
                success(_t('تمت الإضافة بنجاح', 'Added successfully'));
                setShowAddZone(false);
                setNewZoneName('');
                fetchZones();
            }
        } catch (e) {
            error(_t('حدث خطأ', 'Error occurred'));
        }
    };

    const createTable = async () => {
        if (!newTableName || !selectedZone) return;
        try {
            const res = await fetch('/api/pos/restaurant/tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CREATE_TABLE', name: newTableName, capacity: newTableCapacity, zoneId: selectedZone })
            });
            const data = await res.json();
            if (data.success) {
                success(_t('تمت الإضافة بنجاح', 'Added successfully'));
                setShowAddTable(false);
                setNewTableName('');
                fetchZones();
            }
        } catch (e) {
            error(_t('حدث خطأ', 'Error occurred'));
        }
    };

    const deleteTable = async (tableId: number) => {
        if(!confirm(_t('هل أنت متأكد من الحذف؟', 'Are you sure you want to delete?'))) return;
        try {
            await fetch('/api/pos/restaurant/tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'DELETE_TABLE', tableId })
            });
            fetchZones();
        } catch (e) {}
    };

    const resolveCall = async (callId: number) => {
        try {
            await fetch('/api/pos/restaurant/tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'RESOLVE_CALL', callId })
            });
            fetchZones();
        } catch (e) {}
    };

    const activeZone = zones.find(z => z.id === selectedZone);

    if (loading && zones.length === 0) {
        return <div className="flex justify-center items-center h-64">{_t('جاري التحميل...', 'Loading...')}</div>;
    }

    return (
        <div className="w-full flex flex-col h-full bg-slate-50 relative">
            {/* Floor Plan Header & Zone Tabs */}
            <div className="flex bg-white p-4 shadow-sm border-b items-center gap-4 overflow-x-auto">
                {zones.map(zone => (
                    <Button 
                        key={zone.id} 
                        variant={selectedZone === zone.id ? 'default' : 'outline'}
                        onClick={() => setSelectedZone(zone.id)}
                        className={`rounded-full px-6 font-bold ${selectedZone === zone.id ? 'bg-orange-500 hover:bg-orange-600 text-white border-transparent' : ''}`}
                    >
                        {zone.name}
                    </Button>
                ))}
                <Button variant="ghost" className="rounded-full text-orange-500 border-orange-200 border border-dashed" onClick={() => setShowAddZone(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {_t('إضافة قسم', 'Add Zone')}
                </Button>
            </div>

            {/* Tables Grid */}
            <div className="p-6 flex-1 overflow-y-auto">
                {activeZone ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {activeZone.tables.map(table => (
                            <Card 
                                key={table.id} 
                                className={`relative cursor-pointer transition-all hover:scale-105 ${table.status === 'Occupied' ? 'border-orange-500 bg-orange-50' : 'border-slate-200'} ${table.waiterCalls?.length > 0 ? 'animate-pulse ring-4 ring-red-500 ring-opacity-50' : ''}`}
                                onClick={() => onTableSelect && onTableSelect(table)}
                            >
                                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[160px] text-center">
                                    <Coffee className={`w-12 h-12 mb-3 ${table.status === 'Occupied' ? 'text-orange-500' : 'text-slate-300'}`} />
                                    <h3 className="text-xl font-black text-slate-800">{table.name}</h3>
                                    <p className="text-sm text-slate-500 mb-2">{_t('السعة:', 'Capacity:')} {table.capacity}</p>
                                    
                                    {/* Action Buttons Overlay */}
                                    <div className="absolute top-2 right-2 flex gap-1" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => setShowQrCode(table.qrToken)} className="p-1.5 bg-slate-100 rounded-md text-slate-500 hover:bg-slate-200"><QrCode className="w-4 h-4" /></button>
                                        <button onClick={() => deleteTable(table.id)} className="p-1.5 bg-red-50 rounded-md text-red-500 hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
                                    </div>

                                    {/* Waiter Calls Badge */}
                                    {table.waiterCalls?.length > 0 && (
                                        <div className="absolute -top-3 -left-3" onClick={(e) => e.stopPropagation()}>
                                            <Button 
                                                variant="destructive" 
                                                size="sm" 
                                                className="rounded-full shadow-lg font-bold flex items-center gap-1"
                                                onClick={() => resolveCall(table.waiterCalls[0].id)}
                                            >
                                                <Bell className="w-4 h-4 animate-bounce" />
                                                {_t('استجابة', 'Respond')}
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                        
                        <Card 
                            className="cursor-pointer border-dashed border-2 border-slate-300 hover:border-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center min-h-[160px]"
                            onClick={() => setShowAddTable(true)}
                        >
                            <CardContent className="p-6 flex flex-col items-center justify-center text-slate-500 hover:text-orange-500">
                                <Plus className="w-8 h-8 mb-2" />
                                <span className="font-bold">{_t('إضافة طاولة', 'Add Table')}</span>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Coffee className="w-16 h-16 mb-4 opacity-20" />
                        <h2 className="text-xl font-bold">{_t('يرجى اختيار أو إضافة قسم', 'Please select or add a zone')}</h2>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showAddZone && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-[400px]">
                        <CardHeader><CardTitle>{_t('إضافة قسم جديد', 'Add New Zone')}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Input placeholder={_t('اسم القسم (مثال: العائلات)', 'Zone Name (e.g. Family)')} value={newZoneName} onChange={e => setNewZoneName(e.target.value)} />
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowAddZone(false)}>{_t('إلغاء', 'Cancel')}</Button>
                                <Button onClick={createZone}>{_t('حفظ', 'Save')}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {showAddTable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <Card className="w-[400px]">
                        <CardHeader><CardTitle>{_t('إضافة طاولة جديدة', 'Add New Table')}</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Input placeholder={_t('اسم/رقم الطاولة', 'Table Name/Number')} value={newTableName} onChange={e => setNewTableName(e.target.value)} />
                            <Input type="number" placeholder={_t('سعة الطاولة', 'Table Capacity')} value={newTableCapacity} onChange={e => setNewTableCapacity(parseInt(e.target.value))} />
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowAddTable(false)}>{_t('إلغاء', 'Cancel')}</Button>
                                <Button onClick={createTable}>{_t('حفظ', 'Save')}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {showQrCode && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowQrCode(null)}>
                    <Card className="p-8 flex flex-col items-center bg-white" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-black mb-6 text-slate-800">{_t('باركود الطاولة', 'Table Barcode')}</h2>
                        <QRCodeCanvas value={`${typeof window !== 'undefined' ? window.location.origin : 'https://namainvist.com'}/customer/table/${showQrCode}`} size={250} level="H" />
                        <p className="mt-4 text-slate-500 text-center text-sm max-w-xs">
                            {_t('قم بطباعة هذا الباركود ووضعه على الطاولة ليتمكن العملاء من استدعاء النادل أو تصفح المنيو.', 'Print this barcode and place it on the table so customers can call the waiter or browse the menu.')}
                        </p>
                        <Button className="mt-6 w-full" onClick={() => window.print()}>{_t('طباعة الباركود', 'Print Barcode')}</Button>
                    </Card>
                </div>
            )}
        </div>
    );
}
