'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function InvoiceCaptureInboxPage() {
  const { t } = useTranslation();

    const [data, setData] = useState<any>({ captures: [], counts: {} });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [showUpload, setShowUpload] = useState(false);
    const [ocrText, setOcrText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => { fetchCaptures(); }, [filter]);

    async function fetchCaptures() {
        setLoading(true);
        const res = await fetch(`/api/ap/capture?status=${filter}`);
        if (res.ok) setData(await res.json());
        setLoading(false);
    }

    async function handleUpload(e: any) {
        e.preventDefault();
        setUploading(true);

        let imageBase64 = null;
        let mimeType = null;

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
                source: 'UPLOAD', 
                ocrText, 
                imageBase64, 
                mimeType,
                fileUrl: imageFile ? imageFile.name : 'manual-entry' 
            })
        });
        
        if (res.ok) {
            setOcrText('');
            setImageFile(null);
            setShowUpload(false);
            fetchCaptures();
        }
        setUploading(false);
    }

    const statusColors: any = {
        PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        MATCHED_PO: 'bg-green-100 text-green-800 border-green-200',
        MATCHED_GRN: 'bg-blue-100 text-blue-800 border-blue-200',
        EXCEPTION: 'bg-red-100 text-red-800 border-red-200',
        POSTED: 'bg-gray-100 text-gray-600 border-gray-200'
    };

    const statusLabels: any = {
        PENDING: 'بانتظار المعالجة',
        MATCHED_PO: 'مطابق مع أمر شراء',
        MATCHED_GRN: 'مطابق مع إيصال استلام',
        EXCEPTION: 'يحتاج مراجعة',
        POSTED: 'تم الترحيل'
    };

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">{t('ap.capture_title')}</h1>
                    <p className="text-sm text-gray-500">أتمتة استلام ومعالجة فواتير الموردين بالذكاء الاصطناعي</p>
                </div>
                <Button onClick={() => setShowUpload(!showUpload)}>
                    {showUpload ? 'إغلاق' : '+ رفع فاتورة جديدة'}
                </Button>
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
                <Card>
                    <CardHeader><CardTitle>رفع فاتورة أو صورة للمعالجة بالذكاء الاصطناعي</CardTitle></CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1 font-bold">صورة أو ملف الفاتورة (للقراءة الآلية OCR)</label>
                                <input 
                                    type="file" 
                                    accept="image/*,application/pdf"
                                    onChange={e => setImageFile(e.target.files?.[0] || null)}
                                    className="w-full border rounded-md p-2 text-sm mb-4"
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1 text-gray-500">أو انسخ والصق نص الفاتورة يدوياً</label>
                                <textarea
                                    className="w-full h-32 border rounded-md p-3 text-sm"
                                    placeholder="مثال:&#10;شركة التقنية المتقدمة&#10;الرقم الضريبي: 300012345600003&#10;فاتورة رقم: INV-2026-0455&#10;التاريخ: 2026-05-01&#10;المبلغ: 15,000 ر.س&#10;ضريبة: 2,250 ر.س&#10;الإجمالي: 17,250 ر.س&#10;مرجع أمر الشراء: PO-1234"
                                    value={ocrText}
                                    onChange={e => setOcrText(e.target.value)}
                                    required={!imageFile && !ocrText}
                                />
                            </div>
                            <Button type="submit" disabled={uploading || (!imageFile && !ocrText)}>
                                {uploading ? 'جاري المعالجة بالذكاء الاصطناعي...' : 'معالجة واستخراج البيانات (AI OCR)'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Captures List */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>الفواتير الواردة</CardTitle>
                        <div className="flex gap-2">
                            {['ALL', 'PENDING', 'MATCHED_PO', 'EXCEPTION', 'POSTED'].map(s => (
                                <button key={s} onClick={() => setFilter(s)}
                                    className={`px-3 py-1 text-xs rounded-full border ${filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                                    {s === 'ALL' ? 'الكل' : statusLabels[s] || s}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? <p>جاري التحميل...</p> : (
                        <div className="space-y-3">
                            {data.captures.map((cap: any) => (
                                <div key={cap.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-1 text-xs rounded border ${statusColors[cap.matchStatus] || ''}`}>
                                                {statusLabels[cap.matchStatus] || cap.matchStatus}
                                            </span>
                                            <span className="text-xs text-gray-400">المصدر: {cap.source}</span>
                                            <span className="text-xs text-gray-400" dir="ltr">{new Date(cap.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">المورد:</span>{' '}
                                                <span className="font-medium">{cap.extractedData?.vendorName || '—'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">رقم الفاتورة:</span>{' '}
                                                <span className="font-medium">{cap.extractedData?.invoiceNumber || '—'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">الإجمالي:</span>{' '}
                                                <span className="font-bold text-blue-600">{Number(cap.extractedData?.totalAmount || 0).toLocaleString()} {cap.extractedData?.currency || 'SAR'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">الثقة:</span>{' '}
                                                <span className={`font-bold ${cap.confidence > 0.8 ? 'text-green-600' : cap.confidence > 0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                    {Math.round(cap.confidence * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mr-4">
                                        {cap.matchStatus === 'MATCHED_PO' && (
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700">ترحيل</Button>
                                        )}
                                        {cap.matchStatus === 'EXCEPTION' && (
                                            <Button size="sm" variant="outline" className="text-red-600 border-red-200">مراجعة</Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {data.captures.length === 0 && (
                                <p className="text-gray-500 text-center py-8">لا توجد فواتير واردة في هذه الفئة.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
