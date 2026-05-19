'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Plus, Upload, History, BrainCircuit, Settings, Link as LinkIcon, List, RotateCcw, RotateCw, Maximize, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, SkipBack, SkipForward, Trash, Copy, RefreshCw, ChevronDown, FileText } from 'lucide-react';

export default function InvoiceCaptureInboxPage() {
    const { t } = useTranslation();

    const [data, setData] = useState<any>({ captures: [], counts: {} });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [showUpload, setShowUpload] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const [ocrText, setOcrText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [savingManual, setSavingManual] = useState(false);
    const [manualForm, setManualForm] = useState({
        vendorName: '', vatNumber: '', invoiceNumber: '',
        invoiceDate: '', totalAmount: '', vatAmount: '', currency: 'SAR'
    });

    // Workbench Mode State
    const [activeCapture, setActiveCapture] = useState<any>(null);
    const [editForm, setEditForm] = useState<any>({});
    const [zoom, setZoom] = useState(100);
    const [rotation, setRotation] = useState(0);
    const [reprocessing, setReprocessing] = useState(false);
    const [reprocessMsg, setReprocessMsg] = useState<{text: string; type: 'success'|'error'|'info'}|null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showLines, setShowLines] = useState(false);

    const showMsg = (text: string, type: 'success'|'error'|'info' = 'info') => {
        setReprocessMsg({ text, type });
        setTimeout(() => setReprocessMsg(null), 5000);
    };

    useEffect(() => { fetchCaptures(); }, [filter]);

    async function fetchCaptures() {
        setLoading(true);
        const res = await fetch(`/api/ap/capture?status=${filter}`);
        if (res.ok) setData(await res.json());
        setLoading(false);
    }

    // ── حفظ يدوي بدون AI ────────────────────────────────────────────────────
    async function saveManual(e: any) {
        e.preventDefault();
        setSavingManual(true);
        try {
            const res = await fetch('/api/ap/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'MANUAL',
                    skipAI: true,
                    manualData: manualForm
                })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                setManualForm({ vendorName: '', vatNumber: '', invoiceNumber: '', invoiceDate: '', totalAmount: '', vatAmount: '', currency: 'SAR' });
                setShowManual(false);
                fetchCaptures();
            } else {
                alert(`❌ ${result.error || 'حدث خطأ'}`);
            }
        } catch (err: any) {
            alert(`❌ خطأ في الاتصال: ${err.message}`);
        } finally {
            setSavingManual(false);
        }
    }

    async function handleUpload(e: any) {
        e.preventDefault();
        setUploading(true);
        let imageBase64 = null;
        let mimeType = null;

        try {
            if (imageFile) {
                imageBase64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(imageFile);
                });
                mimeType = imageFile.type;
            }

            const res = await fetch('/api/ap/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    source: 'UPLOAD', ocrText, imageBase64, mimeType,
                    fileUrl: imageFile ? imageFile.name : 'manual-entry' 
                })
            });
            
            if (res.ok) {
                setOcrText('');
                setImageFile(null);
                setShowUpload(false);
                fetchCaptures();
            } else {
                const errData = await res.json().catch(() => ({}));
                alert(`خطأ في المعالجة: ${errData.error || res.statusText}`);
            }
        } catch (err: any) {
            alert(`حدث خطأ غير متوقع: ${err.message || 'تحقق من الاتصال'}`);
        } finally {
            setUploading(false);
        }
    }

    // ── ابدأ المعالجة: إعادة تحليل الفاتورة بالذكاء الاصطناعي ─────────────────
    async function reprocessCapture() {
        if (!activeCapture) return;
        setReprocessing(true);
        showMsg('جاري تحليل الفاتورة بـ Gemini AI...', 'info');
        try {
            const res = await fetch('/api/ap/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'REPROCESS',
                    ocrText: activeCapture.ocrRawText || '',
                    fileUrl: activeCapture.fileUrl || '',
                    mimeType: 'text/plain'
                })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                const ext = result.capture?.extractedData || {};
                setEditForm({
                    vendorName: ext.vendorName || editForm.vendorName || '',
                    vatNumber: ext.vatNumber || editForm.vatNumber || '',
                    invoiceNumber: ext.invoiceNumber || editForm.invoiceNumber || '',
                    invoiceDate: ext.invoiceDate || editForm.invoiceDate || '',
                    totalAmount: ext.totalAmount || editForm.totalAmount || '',
                    currency: ext.currency || editForm.currency || 'SAR',
                });
                setActiveCapture({ ...activeCapture, matchStatus: result.capture?.matchStatus, confidence: result.capture?.confidence });
                showMsg(`✅ ${result.message}`, 'success');
                fetchCaptures();
            } else {
                showMsg(`❌ ${result.error || result.detail || 'فشلت المعالجة — تحقق من Gemini API Key في الإعدادات'}`, 'error');
            }
        } catch (err: any) {
            showMsg(`❌ خطأ في الاتصال: ${err.message}`, 'error');
        } finally {
            setReprocessing(false);
        }
    }

    // ── حفظ التغييرات اليدوية ────────────────────────────────────────────────
    async function saveCapture() {
        if (!activeCapture) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/ap/capture?id=${activeCapture.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    extractedData: {
                        vendorName: editForm.vendorName,
                        vatNumber: editForm.vatNumber,
                        invoiceNumber: editForm.invoiceNumber,
                        invoiceDate: editForm.invoiceDate,
                        totalAmount: parseFloat(editForm.totalAmount) || 0,
                        currency: editForm.currency || 'SAR',
                    }
                })
            });
            const result = await res.json();
            if (res.ok) {
                showMsg('✅ تم حفظ التغييرات بنجاح', 'success');
                fetchCaptures();
            } else {
                showMsg(`❌ ${result.error || 'فشل الحفظ'}`, 'error');
            }
        } catch (err: any) {
            showMsg(`❌ خطأ: ${err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    }

    // ── حذف الفاتورة ─────────────────────────────────────────────────────────
    async function deleteCapture() {
        if (!activeCapture) return;
        if (!confirm('هل تريد حذف هذه الفاتورة نهائياً؟')) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/ap/capture?id=${activeCapture.id}`, { method: 'DELETE' });
            if (res.ok) {
                setActiveCapture(null);
                fetchCaptures();
            } else {
                const result = await res.json();
                showMsg(`❌ ${result.error || 'فشل الحذف'}`, 'error');
            }
        } catch (err: any) {
            showMsg(`❌ خطأ: ${err.message}`, 'error');
        } finally {
            setDeleting(false);
        }
    }

    const openWorkbench = (capture: any) => {
        setActiveCapture(capture);
        setEditForm({
            vendorName: capture.extractedData?.vendorName || '',
            vatNumber: capture.extractedData?.vatNumber || '',
            invoiceNumber: capture.extractedData?.invoiceNumber || '',
            invoiceDate: capture.extractedData?.invoiceDate || '',
            totalAmount: capture.extractedData?.totalAmount || '',
            currency: capture.extractedData?.currency || 'SAR',
        });
        setZoom(100);
        setRotation(0);
    };

    const closeWorkbench = () => {
        setActiveCapture(null);
    };

    const statusColors: any = { PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200', MATCHED_PO: 'bg-green-100 text-green-800 border-green-200', MATCHED_GRN: 'bg-blue-100 text-blue-800 border-blue-200', EXCEPTION: 'bg-red-100 text-red-800 border-red-200', POSTED: 'bg-gray-100 text-gray-600 border-gray-200' };
    const statusLabels: any = { PENDING: 'بانتظار المعالجة', MATCHED_PO: 'مطابق مع أمر شراء', MATCHED_GRN: 'مطابق مع إيصال استلام', EXCEPTION: 'يحتاج مراجعة', POSTED: 'تم الترحيل' };

    if (activeCapture) {
        return (
            <div className="h-screen flex flex-col bg-gray-50 -m-6" dir="rtl">
                {/* Advanced OCR Top Toolbar */}
                <div className="bg-white border-b flex items-center justify-between px-4 py-2 shadow-sm z-10">
                    <div className="flex items-center gap-6">
                        <button onClick={closeWorkbench} className="flex flex-col items-center text-gray-500 hover:text-blue-600">
                            <List size={20} />
                            <span className="text-[10px] mt-1 font-medium">الرجوع للقائمة</span>
                        </button>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <button className="flex flex-col items-center text-gray-500 hover:text-blue-600">
                            <LinkIcon size={20} />
                            <span className="text-[10px] mt-1 font-medium">التكاملات</span>
                        </button>
                        <button className="flex flex-col items-center text-gray-500 hover:text-blue-600">
                            <Settings size={20} />
                            <span className="text-[10px] mt-1 font-medium">إعدادات الذكاء الاصطناعي</span>
                        </button>
                        <button className="flex flex-col items-center text-gray-500 hover:text-blue-600">
                            <BrainCircuit size={20} />
                            <span className="text-[10px] mt-1 font-medium">وضع المعالجة</span>
                        </button>
                        <button className="flex flex-col items-center text-gray-500 hover:text-blue-600">
                            <History size={20} />
                            <span className="text-[10px] mt-1 font-medium">السجل</span>
                        </button>
                        <div className="h-8 w-px bg-gray-200"></div>
                        <button className="flex flex-col items-center text-gray-500 hover:text-blue-600">
                            <Upload size={20} />
                            <span className="text-[10px] mt-1 font-medium">استيراد الفواتير</span>
                        </button>
                        <button className="flex flex-col items-center text-gray-500 hover:text-blue-600">
                            <Plus size={20} />
                            <span className="text-[10px] mt-1 font-medium">دفعة جديدة</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="text-xs text-gray-500 font-medium">100%</div>
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-full"></div>
                            </div>
                        </div>
                        <Button 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2 px-6"
                            onClick={reprocessCapture}
                            disabled={reprocessing}
                        >
                            {reprocessing ? 'جاري التحليل...' : 'ابدأ المعالجة'} <Play size={16} fill="currentColor" />
                        </Button>
                    </div>
                </div>

                {/* Main Split Workspace */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left Pane - Document Viewer */}
                    <div className="flex-1 flex flex-col bg-gray-100 relative">
                        {/* Viewer Toolbar */}
                        <div className="absolute top-4 left-0 right-0 flex justify-center z-10 pointer-events-none">
                            <div className="bg-white rounded-lg shadow-md border p-1.5 flex items-center gap-1 pointer-events-auto">
                                <button onClick={() => setRotation(r => r - 90)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><RotateCcw size={18} /></button>
                                <button onClick={() => setRotation(r => r + 90)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><RotateCw size={18} /></button>
                                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                <button className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><Maximize size={18} /></button>
                                <button onClick={() => setZoom(z => z + 20)} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><ZoomIn size={18} /></button>
                                <button onClick={() => setZoom(z => Math.max(20, z - 20))} className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><ZoomOut size={18} /></button>
                                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                <button className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><SkipForward size={18} /></button>
                                <button className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><ChevronRight size={18} /></button>
                                <span className="text-xs font-medium px-2 text-gray-600">صفحة 1 من 1</span>
                                <button className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><ChevronLeft size={18} /></button>
                                <button className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><SkipBack size={18} /></button>
                            </div>
                        </div>

                        {/* Document Display Area */}
                        <div className="flex-1 overflow-auto flex items-center justify-center p-8">
                            <div 
                                className="bg-white shadow-lg min-w-[500px] min-h-[700px] border flex items-center justify-center text-gray-400 transition-transform duration-200"
                                style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
                            >
                                {activeCapture.fileUrl === 'manual-entry' ? (
                                    <div className="p-8 whitespace-pre-wrap text-black font-mono text-sm border m-4 bg-gray-50 flex-1 h-full w-full">
                                        {activeCapture.ocrRawText}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <FileText size={48} className="mb-4 text-gray-300" />
                                        <p>سيتم عرض الصورة/الـ PDF هنا قريباً</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Pane - Invoice Details Form */}
                    <div className="w-[400px] bg-white border-r flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.03)] z-20">
                        {/* Right Top Actions */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                                <span>مكتمل 100% (19/19)</span>
                                <span className="text-yellow-500">⚡</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <button title="حذف" onClick={deleteCapture} disabled={deleting} className="p-2 hover:bg-red-50 text-red-500 rounded-md disabled:opacity-50">
                                    <Trash size={16} />
                                </button>
                                <button title="نسخ معرّف" onClick={() => { navigator.clipboard.writeText(activeCapture.id); showMsg('✅ تم نسخ المعرّف', 'success'); }} className="p-2 hover:bg-gray-100 text-gray-600 rounded-md">
                                    <Copy size={16} />
                                </button>
                                <button title="إعادة معالجة" onClick={reprocessCapture} disabled={reprocessing} className="p-2 hover:bg-gray-100 text-gray-600 rounded-md disabled:opacity-50">
                                    <RefreshCw size={16} className={reprocessing ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">
                            <h2 className="text-xl font-bold text-center text-blue-600 mb-3">تفاصيل الفاتورة</h2>
                            {/* رسالة النتيجة */}
                            {reprocessMsg && (
                                <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium text-center ${
                                    reprocessMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                                    reprocessMsg.type === 'error'   ? 'bg-red-50 text-red-700 border border-red-200' :
                                    'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                    {reprocessMsg.text}
                                </div>
                            )}
                            {/* الحالة والثقة */}
                            <div className="flex justify-between items-center mb-4 text-xs">
                                <span className="bg-gray-100 px-2 py-1 rounded">الحالة: <strong>{activeCapture.matchStatus || 'PENDING'}</strong></span>
                                <span className="bg-gray-100 px-2 py-1 rounded">الثقة: <strong>{Math.round((activeCapture.confidence || 0) * 100)}%</strong></span>
                            </div>
                            
                            {/* Accordion Group */}
                            <div className="border rounded-md mb-6 overflow-hidden">
                                <div className="bg-gray-100 px-3 py-2 flex items-center justify-between cursor-pointer border-b">
                                    <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <List size={14} /> المعلومات الأساسية
                                    </span>
                                    <ChevronDown size={14} className="text-gray-500" />
                                </div>
                                <div className="p-3 space-y-4 bg-white">
                                    <div>
                                        <label className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1">
                                            <span>اسم المورد <span className="text-red-500">*</span></span>
                                            <span>🏢</span>
                                        </label>
                                        <input type="text" value={editForm.vendorName} onChange={e=>setEditForm({...editForm, vendorName: e.target.value})} className="w-full border bg-gray-50 rounded px-2 py-1.5 text-sm" />
                                    </div>
                                    <div>
                                        <label className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1">
                                            <span>الرقم الضريبي للمورد <span className="text-red-500">*</span></span>
                                            <span className="text-blue-500">123</span>
                                        </label>
                                        <input type="text" value={editForm.vatNumber} onChange={e=>setEditForm({...editForm, vatNumber: e.target.value})} className="w-full border bg-gray-50 rounded px-2 py-1.5 text-sm" />
                                    </div>
                                    <div>
                                        <label className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1">
                                            <span>رقم الفاتورة <span className="text-red-500">*</span></span>
                                            <span>🧾</span>
                                        </label>
                                        <input type="text" value={editForm.invoiceNumber} onChange={e=>setEditForm({...editForm, invoiceNumber: e.target.value})} className="w-full border bg-gray-50 rounded px-2 py-1.5 text-sm" />
                                    </div>
                                    <div>
                                        <label className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1">
                                            <span>تاريخ الفاتورة <span className="text-red-500">*</span></span>
                                            <span>📅</span>
                                        </label>
                                        <input type="date" value={editForm.invoiceDate} onChange={e=>setEditForm({...editForm, invoiceDate: e.target.value})} className="w-full border bg-gray-50 rounded px-2 py-1.5 text-sm" />
                                    </div>
                                    <div>
                                        <label className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1">
                                            <span>الإجمالي <span className="text-red-500">*</span></span>
                                            <span>💰</span>
                                        </label>
                                        <input type="number" value={editForm.totalAmount} onChange={e=>setEditForm({...editForm, totalAmount: e.target.value})} className="w-full border bg-gray-50 rounded px-2 py-1.5 text-sm" />
                                    </div>
                                    <div>
                                        <label className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1">
                                            <span>العملة</span>
                                            <span>💱</span>
                                        </label>
                                        <input type="text" value={editForm.currency} onChange={e=>setEditForm({...editForm, currency: e.target.value})} className="w-full border bg-gray-50 rounded px-2 py-1.5 text-sm" />
                                    </div>
                                </div>
                            </div>

                            <Button 
                                className="w-full bg-[#1890ff] hover:bg-[#40a9ff] text-white py-6 flex items-center justify-center gap-2 font-bold mb-4 shadow-sm"
                                onClick={() => setShowLines(!showLines)}
                            >
                                {showLines ? 'إخفاء البنود' : 'عرض بنود الفاتورة'} <List size={18} />
                            </Button>
                            {showLines && (
                                <div className="border rounded-lg overflow-hidden mb-4">
                                    <table className="w-full text-xs">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-2 py-2 text-right">البيان</th>
                                                <th className="px-2 py-2 text-center">الكمية</th>
                                                <th className="px-2 py-2 text-center">السعر</th>
                                                <th className="px-2 py-2 text-center">الإجمالي</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(activeCapture.extractedData?.lineItems || activeCapture.extractedData?.lines || []).length > 0 
                                                ? (activeCapture.extractedData?.lineItems || activeCapture.extractedData?.lines || []).map((line: any, i: number) => (
                                                    <tr key={i} className="border-t">
                                                        <td className="px-2 py-1.5">{line.description || line.item || '—'}</td>
                                                        <td className="px-2 py-1.5 text-center">{line.quantity || 1}</td>
                                                        <td className="px-2 py-1.5 text-center">{line.unitPrice || line.price || '—'}</td>
                                                        <td className="px-2 py-1.5 text-center font-bold">{line.total || line.amount || '—'}</td>
                                                    </tr>
                                                ))
                                                : <tr><td colSpan={4} className="px-2 py-4 text-center text-gray-400">لا توجد بنود — اضغط "ابدأ المعالجة" لاستخراجها</td></tr>
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Bottom Action Buttons */}
                        <div className="p-4 border-t flex gap-3">
                            <Button 
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white gap-2" 
                                onClick={deleteCapture}
                                disabled={deleting}
                            >
                                {deleting ? 'جاري الحذف...' : 'حذف الفاتورة'} <Trash size={16} />
                            </Button>
                            <Button 
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
                                onClick={saveCapture}
                                disabled={saving}
                            >
                                {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'} <Settings size={16} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">{t('ap.capture_title') || 'صندوق وارد الفواتير (AP Invoice Capture)'}</h1>
                    <p className="text-sm text-gray-500">أتمتة استلام ومعالجة فواتير الموردين بالذكاء الاصطناعي</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => { setShowManual(!showManual); setShowUpload(false); }} 
                        className="bg-gray-600 hover:bg-gray-700 shadow-md flex items-center gap-2 px-5 py-2"
                        variant="outline"
                    >
                        ✏️ {showManual ? 'إغلاق' : 'إدخال يدوي'}
                    </Button>
                    <Button 
                        onClick={() => { setShowUpload(!showUpload); setShowManual(false); }} 
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-md flex items-center gap-2 px-6 py-2"
                    >
                        {showUpload ? 'إغلاق' : (
                            <>
                                <BrainCircuit size={18} />
                                قارئ الفاتورة الذكي
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { key: 'total', label: 'الإجمالي', color: 'text-gray-800' },
                    { key: 'pending', label: 'بالانتظار', color: 'text-yellow-600' },
                    { key: 'matched', label: 'مطابق', color: 'text-green-600' },
                    { key: 'exception', label: 'استثناءات', color: 'text-red-600' },
                    { key: 'posted', label: 'مرحّل', color: 'text-blue-600' },
                ].map(s => (
                    <Card key={s.key} className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setFilter(s.key === 'total' ? 'ALL' : s.key.toUpperCase())}>
                        <CardContent className="p-4 text-center">
                            <p className={`text-3xl font-bold ${s.color}`}>{data.counts?.[s.key] || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Upload Form */}
            {showUpload && (
                <Card className="border-blue-200 shadow-sm">
                    <CardHeader className="bg-blue-50 border-b"><CardTitle className="text-blue-800 text-lg">رفع فاتورة أو صورة للمعالجة بالذكاء الاصطناعي</CardTitle></CardHeader>
                    <CardContent className="p-5">
                        <form onSubmit={handleUpload} className="space-y-5">
                            <div>
                                <label className="block text-sm mb-2 font-bold text-gray-700">صورة أو ملف الفاتورة (للقراءة الآلية OCR)</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                                    <input 
                                        type="file" 
                                        accept="image/*,application/pdf"
                                        onChange={e => setImageFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm mb-2 font-bold text-gray-700">أو انسخ والصق نص الفاتورة يدوياً</label>
                                <textarea
                                    className="w-full h-32 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="مثال:&#10;شركة التقنية المتقدمة&#10;الرقم الضريبي: 300012345600003..."
                                    value={ocrText}
                                    onChange={e => setOcrText(e.target.value)}
                                    required={!imageFile && !ocrText}
                                />
                            </div>
                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={uploading || (!imageFile && !ocrText)}>
                                {uploading ? 'جاري المعالجة بالذكاء الاصطناعي...' : 'معالجة واستخراج البيانات (AI OCR)'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* نموذج الإدخال اليدوي */}
            {showManual && (
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="bg-gray-50 border-b">
                        <CardTitle className="text-gray-800 text-lg flex items-center gap-2">
                            ✏️ إدخال يدوي — بدون معالجة AI
                            <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">تحفظ مباشرة بالحالة PENDING</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <form onSubmit={saveManual} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">اسم المورد <span className="text-red-500">*</span></label>
                                    <input required className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="شركة التقنية المتقدمة" value={manualForm.vendorName} onChange={e => setManualForm({...manualForm, vendorName: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">الرقم الضريبي</label>
                                    <input className="w-full border rounded-lg px-3 py-2 text-sm" dir="ltr" placeholder="300012345600003" value={manualForm.vatNumber} onChange={e => setManualForm({...manualForm, vatNumber: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">رقم الفاتورة <span className="text-red-500">*</span></label>
                                    <input required className="w-full border rounded-lg px-3 py-2 text-sm" dir="ltr" placeholder="INV-2025-001" value={manualForm.invoiceNumber} onChange={e => setManualForm({...manualForm, invoiceNumber: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">تاريخ الفاتورة <span className="text-red-500">*</span></label>
                                    <input required type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={manualForm.invoiceDate} onChange={e => setManualForm({...manualForm, invoiceDate: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">الإجمالي شامل الضريبة <span className="text-red-500">*</span></label>
                                    <input required type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="1150.00" value={manualForm.totalAmount} onChange={e => setManualForm({...manualForm, totalAmount: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">مبلغ ضريبة القيمة المضافة (15%)</label>
                                    <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="150.00" value={manualForm.vatAmount} onChange={e => setManualForm({...manualForm, vatAmount: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">العملة</label>
                                    <select className="w-full border rounded-lg px-3 py-2 text-sm" value={manualForm.currency} onChange={e => setManualForm({...manualForm, currency: e.target.value})}>
                                        <option value="SAR">ريال سعودي (SAR)</option>
                                        <option value="USD">دولار أمريكي (USD)</option>
                                        <option value="EUR">يورو (EUR)</option>
                                        <option value="AED">درهم إماراتي (AED)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" className="flex-1 bg-gray-700 hover:bg-gray-800 text-white" disabled={savingManual}>
                                    {savingManual ? 'جاري الحفظ...' : '✅ حفظ يدوياً — بدون AI'}
                                </Button>
                                <Button type="button" variant="outline" className="px-6" onClick={() => setShowManual(false)}>
                                    إلغاء
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Captures List */}
            <Card>
                <CardHeader className="border-b bg-gray-50">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">الفواتير الواردة</CardTitle>
                        <div className="flex gap-2">
                            {['ALL', 'PENDING', 'MATCHED_PO', 'EXCEPTION', 'POSTED'].map(s => (
                                <button key={s} onClick={() => setFilter(s)}
                                    className={`px-4 py-1.5 text-xs font-medium rounded-full border transition-colors ${filter === s ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
                                    {s === 'ALL' ? 'الكل' : statusLabels[s] || s}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? <div className="p-8 text-center text-gray-500">جاري التحميل...</div> : (
                        <div className="divide-y">
                            {data.captures.map((cap: any) => (
                                <div key={cap.id} className="p-4 hover:bg-blue-50 transition-colors flex justify-between items-center group cursor-pointer" onClick={() => openWorkbench(cap)}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${statusColors[cap.matchStatus] || ''}`}>
                                                {statusLabels[cap.matchStatus] || cap.matchStatus}
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">المصدر: {cap.source}</span>
                                            <span className="text-xs text-gray-400" dir="ltr">{new Date(cap.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm mt-3">
                                            <div className="flex flex-col">
                                                <span className="text-gray-400 text-xs mb-1">المورد</span>
                                                <span className="font-semibold text-gray-800">{cap.extractedData?.vendorName || '—'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-400 text-xs mb-1">رقم الفاتورة</span>
                                                <span className="font-semibold text-gray-800">{cap.extractedData?.invoiceNumber || '—'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-400 text-xs mb-1">تاريخ الفاتورة</span>
                                                <span className="font-semibold text-gray-800">{cap.extractedData?.invoiceDate || '—'}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-gray-400 text-xs mb-1">الإجمالي</span>
                                                <span className="font-bold text-blue-600">{cap.extractedData?.totalAmount || 0} {cap.extractedData?.currency || 'SAR'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mr-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                                            فتح في ورشة العمل <ChevronLeft size={16} className="mr-1" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {data.captures.length === 0 && (
                                <div className="p-12 text-center text-gray-500">لا توجد فواتير مطابقة للبحث</div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
