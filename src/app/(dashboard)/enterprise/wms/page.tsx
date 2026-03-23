'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { 
    Box, Maximize, Target, Grid, LayoutDashboard, Plus, 
    ChevronDown, ChevronRight, Share2, Layers, MapPin
} from 'lucide-react';

export default function EnterpriseWMS() {
    const { t } = useTranslation();
    const [wmsData, setWmsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedStock, setExpandedStock] = useState<number | null>(null);
    const [expandedZone, setExpandedZone] = useState<number | null>(null);
    const [expandedRack, setExpandedRack] = useState<number | null>(null);
    const [selectedBin, setSelectedBin] = useState<any>(null);
    const [showBinModal, setShowBinModal] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'zone' | 'rack' | 'bin'>('zone');
    const [formData, setFormData] = useState({
        name: '', description: '', stockId: '', zoneId: '', rackId: '', barcode: '', maxWeight: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/enterprise/wms`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setWmsData(data);
                if (data.length > 0 && !expandedStock) setExpandedStock(data[0].id);
            }
        } catch (error) { console.error(error); } 
        finally { setLoading(false); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/enterprise/wms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...formData, type: modalType })
            });

            if (res.ok) {
                setShowModal(false);
                fetchData();
            } else { alert('فشل في الحفظ'); }
        } catch (error) { alert('خطأ في الاتصال'); } 
        finally { setSaving(false); }
    };

    const openModal = (type: 'zone' | 'rack' | 'bin', parentId: number) => {
        setModalType(type);
        setFormData({ name: '', description: '', stockId: type === 'zone' ? parentId.toString() : '', zoneId: type === 'rack' ? parentId.toString() : '', rackId: type === 'bin' ? parentId.toString() : '', barcode: '', maxWeight: '' });
        setShowModal(true);
    };

    return (
        <div style={{ padding: '24px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Grid size={28} color="var(--primary)" />
                        المستودعات الذكية ثلاثية الأبعاد (WMS)
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '14px' }}>
                        تخطيط هندسي للمستودع: أقسام (Zones)، أرفف (Racks)، وخانات (Bins) لـ توجيه التخزين اللحظي 3D.
                    </p>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>جاري تحميل التخطيط...</div>
            ) : (
                <div className="grid-2">
                    {/* Left: Interactive Warehouse List */}
                    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', fontWeight: 'bold' }}>
                            🏢 هيكل المستودعات والمخازن
                        </div>
                        <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', padding: '10px' }}>
                            {wmsData.map(stock => (
                                <div key={stock.id} style={{ marginBottom: '8px' }}>
                                    <div 
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: expandedStock === stock.id ? 'var(--primary-light)' : 'var(--bg-body)', borderRadius: '8px', cursor: 'pointer', border: expandedStock === stock.id ? '1px solid var(--primary)' : '1px solid var(--border)' }}
                                        onClick={() => setExpandedStock(expandedStock === stock.id ? null : stock.id)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '15px', fontWeight: 'bold' }}>
                                            <Box size={20} color={expandedStock === stock.id ? 'var(--primary)' : 'var(--text-muted)'} />
                                            {stock.name} ({stock.code})
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '11px', padding: '2px 8px', background: 'var(--bg-card)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                                                {stock.totalZones} منطقة / {stock.totalRacks} رف
                                            </span>
                                            {expandedStock === stock.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </div>
                                    </div>

                                    {expandedStock === stock.id && (
                                        <div style={{ padding: '10px 10px 10px 30px', borderLeft: '2px dashed var(--border)', marginLeft: '20px', animation: 'slideDown 0.3s ease' }}>
                                            <button 
                                                className="btn btn-ghost btn-sm" 
                                                style={{ width: '100%', marginBottom: '10px', display: 'flex', justifyContent: 'center', gap: '6px', fontSize: '12px', color: 'var(--primary)' }}
                                                onClick={() => openModal('zone', stock.id)}
                                            >
                                                <Plus size={14} /> إضافة منطقة (Zone) داخل المخزن
                                            </button>

                                            {stock.warehouseZones.map((zone: any) => (
                                                <div key={zone.id} style={{ marginBottom: '8px' }}>
                                                    <div 
                                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer' }}
                                                        onClick={() => setExpandedZone(expandedZone === zone.id ? null : zone.id)}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
                                                            <MapPin size={16} color="var(--warning)" />
                                                            {zone.name}
                                                        </div>
                                                    </div>

                                                    {expandedZone === zone.id && (
                                                        <div style={{ padding: '8px', background: 'var(--bg-body)', borderRadius: '6px', marginTop: '4px', border: '1px solid var(--border-light)' }}>
                                                            <button 
                                                                className="btn btn-ghost btn-sm" 
                                                                style={{ width: '100%', marginBottom: '8px', fontSize: '12px', color: 'var(--text-muted)' }}
                                                                onClick={() => openModal('rack', zone.id)}
                                                            >
                                                                + رف جديد
                                                            </button>
                                                            {zone.racks.map((rack: any) => (
                                                                <div 
                                                                    key={rack.id} 
                                                                    style={{ padding: '8px', background: 'var(--bg-card)', marginBottom: '4px', borderRadius: '4px', borderLeft: '3px solid var(--primary)', cursor: 'pointer' }}
                                                                >
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setExpandedRack(expandedRack === rack.id ? null : rack.id)}>
                                                                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}><Layers size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: 'var(--primary)' }}/> {rack.name}</span>
                                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{rack.bins?.length || 0} خانة</span>
                                                                            <button className="btn btn-ghost btn-sm" style={{ padding: '0 4px', fontSize: '11px', color: 'var(--primary)' }} onClick={(e) => { e.stopPropagation(); openModal('bin', rack.id); }}>+ خانة (Bin)</button>
                                                                        </div>
                                                                    </div>
                                                                    {expandedRack === rack.id && (
                                                                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border-light)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                                                                            {rack.bins?.map((bin: any) => (
                                                                                <div 
                                                                                    key={bin.id} 
                                                                                    style={{ padding: '8px', background: 'var(--bg-body)', borderRadius: '6px', border: '1px solid var(--border)', textAlign: 'center', cursor: 'pointer' }}
                                                                                    onClick={() => { setSelectedBin(bin); setShowBinModal(true); }}
                                                                                    title={`الوزن الحالي: ${bin.currentWeight || 0} كغ / الأقصى: ${bin.maxWeight || 'غير محدد'}`}
                                                                                >
                                                                                    <Box size={16} color={bin.status === 'FULL' ? 'var(--danger)' : bin.status === 'PARTIAL' ? 'var(--warning)' : 'var(--success)'} style={{ margin: '0 auto 4px auto' }} />
                                                                                    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{bin.code}</div>
                                                                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                                                                        {bin.currentWeight || 0}{bin.maxWeight ? `/${bin.maxWeight}كغ` : 'كغ'}
                                                                                    </div>
                                                                                    <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden', marginTop: '4px' }}>
                                                                                        <div style={{ height: '100%', width: `${Math.min(((bin.currentWeight || 0) / (bin.maxWeight || 1)) * 100, 100)}%`, background: bin.status === 'FULL' ? 'var(--danger)' : 'var(--success)' }} />
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                            {(!rack.bins || rack.bins.length === 0) && <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1/-1' }}>لا توجد خلايا التخزين</div>}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Graphic Visualization & KPI */}
                    <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🗺️</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{wmsData.reduce((acc, s) => acc + s.totalZones, 0)}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>إجمالي المناطق (Zones)</div>
                            </div>
                            <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                                <div style={{ fontSize: '36px', marginBottom: '8px' }}>📶</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{wmsData.reduce((acc, s) => acc + s.totalRacks, 0)}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>إجمالي الأرفف (Racks)</div>
                            </div>
                            <div className="card" style={{ padding: '20px', textAlign: 'center', gridColumn: '1 / -1' }}>
                                <div style={{ fontSize: '36px', marginBottom: '8px' }}>📦</div>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)' }}>{wmsData.reduce((acc, s) => acc + s.totalBins, 0)}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>إجمالي الخانات / الخلايا (Bins) الجاهزة للتخزين</div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, var(--primary), #1E40AF)', color: '#fff', border: 'none' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>🚀 التوجيه الذكي للمخزون (In-route)</h3>
                            <p style={{ fontSize: '13px', opacity: 0.9, marginBottom: '20px', lineHeight: 1.6 }}>
                                سيقوم النظام بطلب تحديد المنطقة، والرف، والخانة عند استلام مشتريات جديدة أو تحويلات مخزنية، لتمكين تطبيق جوال المندوبين من الوصول السريع للأصناف بناءً على (Row, Rack, Shelf, Bin).
                            </p>
                            <button className="btn" style={{ background: '#fff', color: 'var(--primary)', fontWeight: 'bold', border: 'none' }}>قريباً - طباعة باركودات الأرفف WMS</button>
                        </div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                {modalType === 'zone' && 'إضافة منطقة جديدة Zone'}
                                {modalType === 'rack' && 'إضافة رف جديدة Rack'}
                                {modalType === 'bin' && 'إضافة خانة جديدة Bin'}
                            </h2>
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div className="input-group">
                                    <label className="input-label">الاسم أو الرمز (مثال: A1, الشمالي)</label>
                                    <input className="input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                {modalType === 'bin' && (
                                    <>
                                        <div className="input-group">
                                            <label className="input-label">باركود الخانة (للمسح اللحظي)</label>
                                            <input className="input" dir="ltr" placeholder="BIN-001" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">أقصى وزن افتراضي (كغ)</label>
                                            <input className="input" type="number" dir="ltr" value={formData.maxWeight} onChange={e => setFormData({...formData, maxWeight: e.target.value})} />
                                        </div>
                                    </>
                                )}
                                {(modalType === 'zone') && (
                                    <div className="input-group">
                                        <label className="input-label">وصف إضافي</label>
                                        <input className="input" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '...' : 'تأكيد'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Bin Detail View / Inspection Modal */}
            {showBinModal && selectedBin && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <Box size={22} color="var(--primary)" /> تفاصيل الخانة ({selectedBin.code})
                            </h2>
                            <button className="btn btn-ghost" onClick={() => setShowBinModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="grid-2" style={{ marginBottom: '20px' }}>
                                <div className="card" style={{ padding: '16px', background: 'var(--bg-body)' }}>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>حالة التخزين</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: selectedBin.status === 'FULL' ? 'var(--danger)' : 'var(--success)' }}>
                                        {selectedBin.status === 'FULL' ? 'ممتلئة بالكامل' : selectedBin.status === 'PARTIAL' ? 'شبه ممتلئة' : 'فارغة تماماً'}
                                    </div>
                                </div>
                                <div className="card" style={{ padding: '16px', background: 'var(--bg-body)' }}>
                                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>الوزن المستهلك</div>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                        {selectedBin.currentWeight || 0} / {selectedBin.maxWeight || '∞'} كغ
                                    </div>
                                </div>
                            </div>
                            
                            <h3 style={{ fontSize: '15px', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
                                محتويات الخلية الحالية من البضائع 📦
                            </h3>
                            {/* Native WMS Link Mock - will be tied to StockMovements real-time queries */}
                            <div style={{ textAlign: 'center', padding: '30px', background: 'var(--bg-card)', borderRadius: '10px', color: 'var(--text-muted)' }}>
                                <div><Target size={32} style={{ opacity: 0.5, margin: '0 auto 8px auto' }} /></div>
                                يرجى استخدام (شاشة التحويلات المخزنية الذكية) لتوريد منتجات إلى هذا الموقع <strong style={{ color: 'var(--text)' }}>({selectedBin.code})</strong>.<br/>الربط الآلي للمخزون مفعّل.
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button className="btn btn-ghost" onClick={() => setShowBinModal(false)}>إغلاق</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
