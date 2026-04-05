'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle, Clock } from 'lucide-react';

export default function AICameraAttendanceKiosk() {
  const [faceapiObj, setFaceapiObj] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [faceMatcher, setFaceMatcher] = useState<any>(null);
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [scanning, setScanning] = useState(false); // only true when actively matching a face
  const [recognizedEmployee, setRecognizedEmployee] = useState<any | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  // Prevent spamming the API for the same person
  const currentMatchRef = useRef<number | null>(null);
  const lastMatchTimeRef = useRef<number>(0);

  useEffect(() => {
    // Clock tick
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    
    initializeAI();

    return () => {
      clearInterval(interval);
      if (videoRef.current && videoRef.current.srcObject) {
         (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeAI = async () => {
    const tl = new Date().toLocaleTimeString();
    setLogs(prev => [`[${tl}] 🔵 JSDelivr AI Library booting up...`, ...prev]);

    try {
      const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
      const faceapi = await import('face-api.js');
      setFaceapiObj(faceapi);
      
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelsLoaded(true);
      const tl2 = new Date().toLocaleTimeString();
      setLogs(prev => [`[${tl2}] 🟢 AI Weights Loaded Into Browser RAM!`, ...prev]);

      // Fetch employees & build face matcher
      const res = await fetch('/api/employees');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setEmployees(data);
        
        // Parse DB stored descriptors
        const labeledDescriptors: any[] = [];
        let enrolled = 0;

        data.forEach(emp => {
          if (emp.faceDescriptor) {
            try {
               const array = JSON.parse(emp.faceDescriptor);
               const float32Array = new Float32Array(array);
               labeledDescriptors.push(
                 new faceapi.LabeledFaceDescriptors(emp.id.toString(), [float32Array])
               );
               enrolled++;
            } catch(e) {}
          }
        });

        if (labeledDescriptors.length > 0) {
           const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.55); // 0.55 is threshold distance (lower is stricter)
           setFaceMatcher(matcher);
           const tl3 = new Date().toLocaleTimeString();
           setLogs(prev => [`[${tl3}] ⚡ FaceMatcher Engine ready. Enrolled Employees: ${enrolled}`, ...prev]);
        } else {
           const tl3 = new Date().toLocaleTimeString();
           setLogs(prev => [`[${tl3}] ⚠️ No biometrics found in DB. Please use Enrollment page first.`, ...prev]);
        }
      }

      startCamera();
    } catch (err) {
      console.error(err);
      const tlE = new Date().toLocaleTimeString();
      setLogs(prev => [`[${tlE}] 🔴 AI Initialization FAILED.`, ...prev]);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera access denied or failed", err);
      alert("يرجى تفعيل صلاحية الكاميرا");
    }
  };

  const handleVideoPlay = () => {
    // Loop
    setInterval(async () => {
      if (!videoRef.current || !faceMatcher || !faceapiObj) return;

      setScanning(true);
      const detection = await faceapiObj.detectSingleFace(videoRef.current)
                                     .withFaceLandmarks()
                                     .withFaceDescriptor();

      if (detection) {
        const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
        
        if (bestMatch.label !== 'unknown') {
           const empId = parseInt(bestMatch.label);
           
           // Cool down to avoid spamming the database with 30 posts per second
           const now = Date.now();
           if (currentMatchRef.current !== empId || (now - lastMatchTimeRef.current > 10000)) { // 10 seconds cooldown
               currentMatchRef.current = empId;
               lastMatchTimeRef.current = now;
               executeAttendance(empId, bestMatch.distance);
           }
        }
      } else {
        setScanning(false);
      }
    }, 500); // Analyze every 500ms
  };


  const executeAttendance = async (employeeId: number, distance: number) => {
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    setRecognizedEmployee(emp);
    
    // Simulate real delay for visual effect
    setTimeout(async () => {
        try {
          await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId: emp.id })
          });
          
          const tl = new Date().toLocaleTimeString();
          setLogs(prev => [`[${tl}] 🟢 تم تسجيل دخول: ${emp.name} (دقة: ${(100 - distance*100).toFixed(1)}%)`, ...prev]);
        } catch (e) {
          console.error(e);
        }
        
        // Hide overlay after 3 seconds
        setTimeout(() => {
            setRecognizedEmployee(null);
            currentMatchRef.current = null;
        }, 3000);

    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col md:flex-row font-sans" dir="rtl">
      
      {/* Sidebar Analytics & Simulation Panel */}
      <div className="w-full md:w-80 bg-slate-800 p-6 flex flex-col border-l border-slate-700 shadow-2xl z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/50">
            <Camera className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Nama AI</h1>
            <p className="text-blue-400 text-xs font-bold tracking-widest uppercase">Live Biometric Core</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-4 mb-6 text-center border border-slate-700/50">
          <div className="text-slate-400 text-xs mb-1">Local Time (KSA)</div>
          <div className="text-3xl font-black text-white tracking-tighter tabular-nums font-mono flex items-center justify-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            {time}
          </div>
        </div>

        {/* Live Logs */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
            System Console
            <span className={`w-2 h-2 rounded-full ${modelsLoaded ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></span>
          </h3>
          <div className="flex-1 bg-black/50 rounded-xl border border-slate-700 p-3 overflow-y-auto font-mono text-[10px] space-y-2">
            {logs.map((log, idx) => (
              <div key={idx} className={`${log.includes('🔴') ? 'text-red-400' : log.includes('🟢') ? 'text-green-400' : 'text-slate-300'}`}>{log}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Camera View */}
      <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
        
        {/* Dynamic Top Indicator */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex gap-2 transition-all">
          <div className={`px-4 py-2 rounded-full backdrop-blur-md border text-xs font-bold flex items-center gap-2 
             ${scanning ? 'bg-amber-900/60 border-amber-500/50 text-amber-300' : 'bg-slate-900/80 border-white/10'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${scanning ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,1)]' : 'bg-green-500'}`}></span>
            {scanning ? 'SCANNING FACES...' : 'STANDBY'}
          </div>
        </div>

        {/* Video feed */}
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          onPlay={handleVideoPlay}
          className={`w-full h-full object-cover transition-all duration-1000 ${recognizedEmployee ? 'scale-105 filter brightness-110 contrast-125' : 'filter grayscale-[10%] brightness-75'}`}
        />

        {/* AI Viewfinder Overlay */}
        {scanning && !recognizedEmployee && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center mix-blend-screen">
            <div className="w-72 h-72 border-2 border-dashed border-blue-500/50 rounded-3xl relative animate-[pulse_2s_ease-in-out_infinite]">
               <div className="absolute top-0 left-0 w-full h-[6px] bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,1)] animate-[scan_1.5s_linear_infinite]" style={{ borderRadius: '10px' }}></div>
            </div>
          </div>
        )}

        {/* Matched State Overlay */}
        {recognizedEmployee && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-green-900/20 backdrop-blur-[4px] z-30 transition-all duration-300">
            <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(34,197,94,0.4)] p-8 flex flex-col items-center animate-fade-in-up border-4 border-green-500 max-w-sm w-full mx-4">
               <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4 relative drop-shadow-xl">
                 <div className="absolute inset-0 rounded-full border-4 border-green-500 border-l-transparent animate-spin"></div>
                 <CheckCircle className="w-12 h-12 text-green-600 relative z-10" />
               </div>
               <h2 className="text-3xl font-black text-slate-800 mb-1">{recognizedEmployee.name}</h2>
               <p className="text-green-600 font-bold mb-6 text-xl tracking-tight">Identity Verified / تم الحضور</p>
               
               <div className="w-full bg-slate-50 rounded-xl p-4 flex justify-between items-center border border-slate-200">
                 <div>
                   <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">Time Logged</div>
                   <div className="text-slate-800 font-bold font-mono text-lg">{time}</div>
                 </div>
                 <div className="text-left w-1/2">
                   <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">Authorization</div>
                   <div className="text-green-600 font-bold font-mono flex items-center gap-1 text-[11px] leading-tight mt-1">
                     APPROVED & SYNCED TO HRSD
                   </div>
                 </div>
               </div>
            </div>
          </div>
        )}

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
        `}} />
      </div>

    </div>
  );
}
