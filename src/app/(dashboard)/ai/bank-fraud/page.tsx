'use client';

import React, { useState, useRef } from 'react';
import { useTranslation } from '@/lib/i18n';

export default function BankFraudDetectionPage() {
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
            formData.append('receipt', file);

            const res = await fetch('/api/ai/bank-fraud', {
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
        <div className="p-8 max-w-6xl mx-auto space-y-6" dir="rtl">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow flex flex-col md:flex-row justify-between items-center border-b-4 border-red-600 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span>🕵️‍♂️</span> تحليل تزوير الحوالات (Bank Fraud Detection OCR)
                    </h1>
                    <p className="text-gray-500 mt-1">قم برفع إيصال التحويل البنكي لفحصه عبر الذكاء الاصطناعي لاكتشاف التلاعب الرقمي بالفوتوشوب أو النصوص.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 px-4 py-2 rounded-md font-bold shadow-sm hover:bg-red-100 transition"
                    >
                        📎 إرفاق إيصال
                    </button>
                    <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleImageChange}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Preview Panel */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-100 dark:border-gray-700 min-h-[500px] flex flex-col">
                    <h2 className="font-bold text-lg mb-4 text-gray-800 dark:text-gray-200 border-b pb-2">المستند المرفق</h2>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center relative overflow-hidden">
                        {imageSrc ? (
                            <>
                                <img src={imageSrc} alt="Receipt" className="max-w-full max-h-[500px] object-contain rounded" />
                                {loading && (
                                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-red-500 mb-4"></div>
                                        <p className="font-bold text-lg">جاري الفحص الجنائي الرقمي...</p>
                                        <p className="text-xs text-gray-300 mt-2">يتم تحليل الخطوط، الهيكلة، وبيانات الميتا داتا</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-gray-400 text-center">
                                <span className="text-5xl mb-4 block">🧾</span>
                                <p className="font-medium">لم يتم إرفاق أي إيصال</p>
                            </div>
                        )}
                    </div>
                    {imageSrc && !result && !loading && (
                        <button 
                            onClick={processImage}
                            className="mt-4 w-full bg-red-600 text-white py-3 rounded-md font-bold shadow hover:bg-red-700 transition"
                        >
                            بدء فحص التزوير والتلاعب
                        </button>
                    )}
                </div>

                {/* Analysis Results */}
                <div className="space-y-6">
                    {!result && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700 h-full flex flex-col items-center justify-center text-gray-500">
                            <span className="text-4xl mb-4 opacity-50">🔬</span>
                            <p className="text-center font-medium">النتيجة ستظهر هنا بعد انتهاء التحليل.</p>
                        </div>
                    )}

                    {result && (
                        <div className={`p-6 rounded-lg shadow-lg border-t-8 ${result.isFraud ? 'bg-red-50 dark:bg-red-900/10 border-red-600' : 'bg-green-50 dark:bg-green-900/10 border-green-600'}`}>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-3xl">{result.isFraud ? '🛑' : '✅'}</span>
                                <div>
                                    <h2 className={`text-2xl font-black ${result.isFraud ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                                        {result.isFraud ? 'إيصال مزور / تلاعب مكتشف!' : 'إيصال سليم وموثوق'}
                                    </h2>
                                    <p className="text-sm font-bold mt-1 text-gray-600 dark:text-gray-400">نسبة الموثوقية للقرار: {(result.confidenceScore * 100).toFixed(1)}%</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded shadow-sm border dark:border-gray-700 p-4 mb-6">
                                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 border-b pb-2">البيانات المستخرجة (OCR)</h3>
                                <div className="grid grid-cols-2 gap-y-3 text-sm">
                                    <div className="text-gray-500">البنك:</div>
                                    <div className="font-bold text-gray-900 dark:text-white">{result.extractedData.bankName}</div>
                                    
                                    <div className="text-gray-500">المبلغ:</div>
                                    <div className="font-black text-lg text-indigo-600 dark:text-indigo-400">{result.extractedData.amount} SAR</div>
                                    
                                    <div className="text-gray-500">التاريخ:</div>
                                    <div className="font-bold text-gray-900 dark:text-white">{result.extractedData.date}</div>
                                    
                                    <div className="text-gray-500">الرقم المرجعي:</div>
                                    <div className="font-mono text-gray-900 dark:text-white">{result.extractedData.referenceNumber}</div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3">ملاحظات المحرك الذكي:</h3>
                                <div className="space-y-2">
                                    {result.flags.map((flag: any, idx: number) => (
                                        <div key={idx} className={`p-3 rounded text-sm font-bold flex gap-2 items-start ${flag.type === 'DANGER' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' : flag.type === 'WARNING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'}`}>
                                            <span>{flag.type === 'DANGER' ? '❌' : flag.type === 'WARNING' ? '⚠️' : '✔️'}</span>
                                            <span>{flag.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {result.isFraud && (
                                <button className="mt-6 w-full bg-gray-900 text-white py-2 rounded font-bold hover:bg-gray-800 transition">
                                    إرسال تنبيه للإدارة المالية بوقف الاعتماد
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
