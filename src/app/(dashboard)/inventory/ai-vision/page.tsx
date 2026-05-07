'use client';

import React, { useState, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function AIVisionInventoryPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setImageSrc(URL.createObjectURL(selectedFile));
            setResult(null);
        }
    };

    const processImage = async () => {
        if (!file) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            const res = await fetch('/api/inventory/ai-vision', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setResult(data.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex flex-col md:flex-row justify-between items-center border-b-4 border-purple-600 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>🤖</span> الجرد بالرؤية الحاسوبية (AI Vision Inventory)
                    </h1>
                    <p className="text-gray-500 mt-1">التقط صورة للأرفف ودع الذكاء الاصطناعي يتعرف على الأصناف ويحصيها تلقائياً.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md font-bold shadow hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                        📷 التقاط / رفع صورة
                    </button>
                    <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleImageChange}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Preview Area */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-inner border-2 border-dashed border-gray-300 dark:border-gray-700 p-4 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
                    {imageSrc ? (
                        <>
                            <img src={imageSrc} alt="Preview" className="max-w-full max-h-[500px] object-contain rounded" />
                            {loading && (
                                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
                                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-purple-500 mb-4"></div>
                                    <p className="font-bold">جاري تحليل الصورة والتعرف على العناصر...</p>
                                </div>
                            )}
                            {result && !loading && (
                                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse">
                                    ✅ تم التحليل
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-gray-400 text-center">
                            <span className="text-6xl mb-4 block">📸</span>
                            <p>يرجى رفع صورة للرف المخزني لتبدأ عملية الجرد الذكي.</p>
                        </div>
                    )}
                </div>

                {/* Results Area */}
                <div className="space-y-4">
                    {imageSrc && !result && !loading && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">الصورة جاهزة للتحليل. انقر على الزر أدناه لبدء العد التلقائي.</p>
                            <button 
                                onClick={processImage}
                                className="w-full bg-purple-600 text-white px-6 py-3 rounded-md font-bold shadow-lg hover:bg-purple-700 text-lg transition transform hover:scale-105"
                            >
                                🧠 بدء الجرد بالذكاء الاصطناعي
                            </button>
                        </div>
                    )}

                    {result && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4 animate-fade-in">
                            <div className="border-b dark:border-gray-700 pb-3 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">نتيجة الجرد الذكي</h3>
                                <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 px-2 py-1 rounded text-xs font-bold">
                                    ⏱️ {(result.processingTimeMs / 1000).toFixed(1)} ثانية
                                </span>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded text-sm">
                                {result.message}
                            </div>

                            <div className="space-y-2">
                                {result.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded hover:shadow-sm transition">
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">{item.label}</div>
                                            <div className="text-xs text-gray-500">دقة التعرف: {(item.confidence * 100).toFixed(0)}%</div>
                                        </div>
                                        <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                                            {item.quantity} <span className="text-xs text-gray-500 font-normal">حبة</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t dark:border-gray-700 flex justify-between items-center">
                                <span className="font-bold text-gray-700 dark:text-gray-300">إجمالي القطع المكتشفة:</span>
                                <span className="text-2xl font-black text-gray-900 dark:text-white">{result.totalCount}</span>
                            </div>

                            <button className="w-full mt-4 border-2 border-purple-600 text-purple-600 dark:text-purple-400 px-4 py-2 rounded font-bold hover:bg-purple-50 dark:hover:bg-purple-900/30 transition">
                                ترحيل لتسوية الجرد
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
