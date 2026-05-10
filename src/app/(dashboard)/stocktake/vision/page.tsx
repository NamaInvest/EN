"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { useToast } from '@/components/Toast';

interface VisionResult {
 productId: number | null;
 productName: string;
 barcode: string | null;
 systemStock: number;
 visionCount: number;
 difference: number;
 matched: boolean;
 originalAiName: string;
}

export default function VisionInventoryPage() {
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

 const { t } = useTranslation();
 const [imagePreview, setImagePreview] = useState<string | null>(null);
 const [imageFile, setImageFile] = useState<File | null>(null);
 const [loading, setLoading] = useState(false);
 const [results, setResults] = useState<VisionResult[] | null>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 setImageFile(file);
 const reader = new FileReader();
 reader.onloadend = () => {
 setImagePreview(reader.result as string);
 };
 reader.readAsDataURL(file);
 setResults(null);
 };

 const processImage = async () => {
 if (!imageFile) return;

 setLoading(true);
 try {
 const formData = new FormData();
 formData.append("image", imageFile);

 // Need token for authentication in standard Next.js logic
 const token = localStorage.getItem('token');
 const res = await fetch("/api/stocktake/vision", {
 method: "POST",
 headers: {
 'Authorization': `Bearer ${token}`
 },
 body: formData,
 });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      } else {
        toastError(t('stock.str_2674'));
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toastError(t('stock.str_2675'));
    } finally {
      setLoading(false);
    }
  };

  const syncStock = async () => {
    toastSuccess(t('stock.str_2676'));
    // Here we would send results back to a /api/stocktake/save endpoint
    setResults(null);
    setImagePreview(null);
    setImageFile(null);
  };

 return (
 <div className="space-y-6 animate-fade-in p-2 md:p-6" style={{ maxWidth: '800px', margin: '0 auto' }}>
 <div className="page-header text-center md:text-right">
 <h1 className="page-title flex items-center justify-center md:justify-start gap-2">
 <span className="text-primary text-2xl">📸</span> 
 {t('stock.str_2652')}</h1>
 <p className="text-muted-foreground text-sm mt-1">
 {t('stock.str_2653')}</p>
 </div>

 <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
 <div className="p-6 flex flex-col items-center justify-center min-h-[300px] bg-slate-50 relative">
 <input
 type="file"
 accept="image/*"
 capture="environment"
 onChange={handleImageCapture}
 className="hidden"
 ref={fileInputRef}
 id="camera-input"
 />

 {!imagePreview ? (
 <div className="text-center space-y-4">
 <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto cursor-pointer hover:bg-primary/20 transition-colors"
 onClick={() => fileInputRef.current?.click()}>
 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
 </svg>
 </div>
 <div>
 <h3 className="text-lg font-bold text-slate-800">{t('stock.str_2654')}</h3>
 <p className="text-sm text-slate-500">{t('stock.str_2655')}</p>
 </div>
 <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
 {t('stock.str_2656')}</button>
 </div>
 ) : (
 <div className="w-full flex flex-col items-center gap-4">
 <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border shadow-lg">
 <Image src={imagePreview} alt="Captured shelf" layout="fill" objectFit="contain" className="bg-black/5" />
 
 {loading && (
 <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
 <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4" />
 <h3 className="font-bold text-shadow text-lg">{t('stock.str_2657')}</h3>
 <p className="text-sm text-center text-shadow-sm opacity-90">{t('stock.str_2658')}</p>
 </div>
 )}
 </div>
 
 {!loading && !results && (
 <div className="flex gap-2 w-full max-w-md">
 <button className="btn outline flex-1" onClick={() => fileInputRef.current?.click()}>
 {t('stock.str_2659')}</button>
 <button className="btn btn-primary flex-1 shadow-md" onClick={processImage}>
 {t('stock.str_2660')}</button>
 </div>
 )}
 </div>
 )}
 </div>

 {/* Results Table Section */}
 {results && (
 <div className="border-t divide-y">
 <div className="p-4 bg-slate-50 flex items-center justify-between">
 <h3 className="font-bold text-slate-800 flex items-center gap-2">
 {t('stock.str_2661')}</h3>
 <span className="badge primary px-3 py-1">{t('stock.str_2662')}{results.length} {t('stock.str_2663')}</span>
 </div>
 
 <div className="overflow-x-auto">
 <table className="w-full text-sm text-right">
 <thead className="bg-slate-100/50 text-slate-500 border-b">
 <tr>
 <th className="p-4 font-medium">{t('stock.str_2664')}</th>
 <th className="p-4 font-medium text-center">{t('stock.str_2665')}</th>
 <th className="p-4 font-medium text-center">{t('stock.str_2666')}</th>
 <th className="p-4 font-medium text-center">{t('stock.str_2667')}</th>
 <th className="p-4 font-medium">{t('fin.str_227')}</th>
 </tr>
 </thead>
 <tbody className="divide-y bg-white">
 {results.length === 0 && (
 <tr>
 <td colSpan={5} className="p-8 text-center text-slate-500">
 {t('stock.str_2668')}</td>
 </tr>
 )}
 {results.map((res, i) => (
 <tr key={i} className="hover:bg-slate-50/50 transition-colors">
 <td className="p-4 font-medium text-slate-800">
 {res.productName}
 {!res.matched && <div className="text-xs text-amber-600 mt-1">{t('stock.str_2669')}</div>}
 </td>
 <td className="p-4 text-center font-mono text-slate-500">
 {res.systemStock}
 </td>
 <td className="p-4 text-center font-medium font-mono text-primary">
 {res.visionCount}
 </td>
 <td className="p-4 text-center font-mono">
 {res.difference === 0 ? (
 <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">{t('stock.str_2670')}</span>
 ) : res.difference > 0 ? (
 <span className="text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">+{res.difference} {t('stock.str_2671')}</span>
 ) : (
 <span className="text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded">{res.difference} {t('stock.str_2672')}</span>
 )}
 </td>
 <td className="p-4">
 {res.matched ? (
 <span className="text-emerald-500 text-lg" title={t('stock.str_2677')}>✅</span>
 ) : (
 <span className="text-slate-300 text-lg" title={t('stock.str_2678')}>❌</span>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t">
 <button className="btn outline text-slate-600 border-slate-300" onClick={() => setResults(null)}>
 {t('fin.str_206')}</button>
 <button className="btn btn-primary" onClick={syncStock}>
 {t('stock.str_2673')}</button>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
