'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, Save, ScanFace, Check, AlertCircle } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function AIEnrollmentPage() {
    const { t } = useTranslation();
  const [faceapiObj, setFaceapiObj] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const loadModels = async () => {
      setStatus({ type: 'info', msg: 'جاري تحميل عقل الذكاء الاصطناعي (AI Models)...' });
      const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
      try {
        const faceapi = await import('face-api.js');
        setFaceapiObj(faceapi);
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
        setStatus({ type: 'success', msg: 'نماذج الذكاء الاصطناعي جاهزة للعمل 🧠' });
      } catch (err) {
        console.error(err);
        setStatus({ type: 'error', msg: 'فشل تحميل نماذج الذكاء الاصطناعي.' });
      }
    };
    
    loadModels();
    
    // Fetch employees
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setEmployees(data);
      });
  }, []);

  const openCamera = async () => {
    if (!selectedEmp) {
      setStatus({ type: 'error', msg: 'يرجى اختيار الموظف أولاً!' });
      return;
    }
    setScanning(true);
    setFaceDescriptor(null);
    setStatus({ type: 'info', msg: 'يتم تشغيل الكاميرا...' });
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus({ type: 'info', msg: 'قف أمام الكاميرا بانتباه للالتقاط.' });
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', msg: 'لم يتم العثور على كاميرا أو لم يتم منح الصلاحية.' });
      setScanning(false);
    }
  };

  const captureAndEncode = async () => {
    if (!faceapiObj || !videoRef.current) return;
    setStatus({ type: 'info', msg: 'جاري مسح وتحليل ملامح الوجه...' });

    const detection = await faceapiObj.detectSingleFace(videoRef.current)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setStatus({ type: 'error', msg: 'لم يتم التعرف على وجه! يرجى النظر للكاميرا جيداً، وتجنب الإضاءة المعتمة.' });
      return;
    }

    setFaceDescriptor(detection.descriptor);
    setStatus({ type: 'success', msg: '✅ تم تشفير البصمة البيومترية بنجاح!' });
    // Stop camera
    closeCamera();
  };

  const closeCamera = () => {
    setScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const saveBiometric = async () => {
    if (!selectedEmp || !faceDescriptor) return;
    
    setStatus({ type: 'info', msg: 'جاري الحفظ في قاعدة البيانات بقسم الـ HR...' });
    
    // Convert Float32Array to string array for storing in DB
    const descriptorArray = Array.from(faceDescriptor);

    try {
      const res = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmp,
          faceDescriptor: JSON.stringify(descriptorArray)
        })
      });

      if (res.ok) {
        setStatus({ type: 'success', msg: '🎉 تم ربط بصمة الوجه بالموظف وهو جاهز الآن لختم الدخول بالكاميرا العصرية!' });
        setFaceDescriptor(null);
        setSelectedEmp('');
      } else {
        setStatus({ type: 'error', msg: 'حدث خطأ في حفظ بيانات البصمة بسيرفر نما إنفست' });
      }
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', msg: 'خطأ اتصال بالشبكة.' });
    }
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6 flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ScanFace className="text-blue-600 w-8 h-8" />
            تسجيل البصمة الذكية (AI Face Enrollment)
          </h1>
          <p className="text-slate-500 mt-1">
            قم بالتقاط الوجه الخاص بالموظف وحفظ (بصمته البيومترية) للتعرف عليه آلياً في شاشة الحضور.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: Setup & Status */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-lg mb-4 text-slate-800">1. إعداد الموظف للإلتقاط</h3>
          
          <label className="block text-sm font-bold text-slate-700 mb-2">اختر الموظف المستهدف:</label>
          <select 
            value={selectedEmp} 
            onChange={(e) => setSelectedEmp(e.target.value)}
            disabled={scanning || !modelsLoaded}
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 font-medium bg-slate-50"
          >
            <option value="">-- يرجى اختيار الموظف --</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>
                {e.name} {e.faceDescriptor ? '(بصمة مسجلة سابقاً)' : ''}
              </option>
            ))}
          </select>

          {status.msg && (
            <div className={`mt-6 p-4 rounded-lg font-bold flex items-start gap-3 ${
              status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
              status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {status.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : 
               status.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : 
               <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></div>}
              <span>{status.msg}</span>
            </div>
          )}

          {!scanning && !faceDescriptor && (
            <button 
              onClick={openCamera}
              disabled={!modelsLoaded || !selectedEmp}
              className="mt-6 w-full bg-slate-800 hover:bg-black text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              فتح المستشعر والتقاط الوجه
            </button>
          )}

          {faceDescriptor && (
            <div className="mt-6 bg-slate-50 p-6 rounded-xl border-2 border-dashed border-green-400 text-center animate-fade-in-up">
               <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Check className="text-green-600 w-8 h-8" />
               </div>
               <h4 className="font-bold text-slate-800 mb-1">الوجه مشفر ومعالج 100%</h4>
               <p className="text-xs text-slate-500 font-mono mb-4 break-words">
                 Descriptor Matix: 128-points Neural Identity
               </p>
               <button 
                 onClick={saveBiometric}
                 className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/30 text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2 transition"
               >
                 <Save className="w-5 h-5" />
                 حفظ واعتماد البصمة للموظف
               </button>
            </div>
          )}

        </div>

        {/* Right Side: Camera View Finder */}
        <div className="bg-slate-900 rounded-xl shadow-inner border border-slate-800 p-2 flex flex-col relative overflow-hidden min-h-[400px]">
           {!scanning ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm">
                <Camera className="w-12 h-12 mb-2 opacity-20" />
                الكاميرا مقفلة
             </div>
           ) : (
             <>
               <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover rounded-lg filter drop-shadow-2xl"
               />
               <div className="absolute inset-0 border-[6px] border-blue-500/30 rounded-lg pointer-events-none"></div>
               
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10 w-full px-6">
                 <button 
                   onClick={closeCamera}
                   className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 p-3 rounded-xl font-bold transition"
                 >
                   {t('fin.str_206')}</button>
                 <button 
                   onClick={captureAndEncode}
                   className="flex-[2] bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.6)] text-white p-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
                 >
                   <ScanFace className="w-5 h-5" />
                   التقط الملامح الآن!
                 </button>
               </div>
             </>
           )}
        </div>

      </div>
    </div>
  );
}
