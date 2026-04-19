'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle, Fingerprint, XCircle } from 'lucide-react';
import { useTranslation } from "@/lib/i18n";

export default function FaceIdAttendance() {
    const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState(t('sys.str_1563'));
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setMessage(t('sys.str_1564'));
      setStatus('error');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureAndRecord = async () => {
    if (!videoRef.current || status === 'success') return;
    
    setLoading(true);
    setStatus('idle');
    setMessage(t('sys.str_1565'));

    // 1. Capture snapshot from video stream
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const photoBase64 = canvas.toDataURL('image/jpeg', 0.8);

    try {
      // 2. Send snapshot to our AI Backend for Facial Recognition
      const res = await fetch('/api/attendance/face-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: photoBase64 })
      });

      const data = await res.json();
      
      if (res.ok) {
        setStatus('success');
        setEmployee(data.employee);
        setMessage(`طھظ… طھط³ط¬ظٹظ„ ط§ظ„ط®ظ’طھظ’ظ… ط¨ظ†ط¬ط§ط­: ${data.action === 'check_in' ? t('sys.str_380') : t('sys.str_381')}`);
        
        // Reset after 4 seconds for the next employee
        setTimeout(() => {
          setStatus('idle');
          setEmployee(null);
          setMessage(t('sys.str_1566'));
        }, 4000);
      } else {
        setStatus('error');
        setMessage(data.error || t('sys.str_1567'));
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (e) {
      setStatus('error');
      setMessage(t('sys.str_1568'));
      setTimeout(() => setStatus('idle'), 3000);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: 'Lateef, sans-serif' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '36px', margin: '0 0 10px', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Fingerprint size={40} color="#3b82f6" /> 
          {t('sys.str_1560')}</h1>
        <p style={{ color: '#94a3b8', fontSize: '18px' }}>{t('sys.str_1561')}</p>
      </div>

      <div style={{ 
          position: 'relative', 
          width: '400px', 
          height: '400px', 
          borderRadius: '50%', 
          overflow: 'hidden', 
          border: `8px solid ${status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : '#3b82f6'}`,
          boxShadow: `0 0 50px ${status === 'success' ? 'rgba(34, 197, 94, 0.4)' : status === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)'}`,
          transition: 'all 0.3s ease'
        }}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
        />
        
        {/* Scanning Overlay Animation */}
        {loading && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '10px', backgroundColor: 'rgba(59, 130, 246, 0.8)', boxShadow: '0 0 20px #3b82f6', animation: 'scan 2s infinite linear' }} />
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}} />

      <div style={{ marginTop: '40px', textAlign: 'center', height: '120px' }}>
        {status === 'success' && <CheckCircle size={50} color="#22c55e" style={{ margin: '0 auto 10px' }} />}
        {status === 'error' && <XCircle size={50} color="#ef4444" style={{ margin: '0 auto 10px' }} />}
        
        <h2 style={{ color: status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : '#e2e8f0', fontSize: '24px', margin: '0 0 10px' }}>
          {message}
        </h2>
        
        {employee && (
          <div style={{ fontSize: '20px', color: '#f8fafc', fontWeight: 'bold' }}>
            {t('sys.str_1562')}{employee.name} - ({employee.position || t('hr.str_554')})
          </div>
        )}
      </div>

      <button 
        onClick={captureAndRecord}
        disabled={loading || status === 'success'}
        style={{
          marginTop: '20px',
          padding: '20px 60px',
          fontSize: '24px',
          backgroundColor: loading ? '#475569' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '50px',
          cursor: loading || status === 'success' ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Camera size={28} /> {loading ? t('sys.str_1569') : t('sys.str_1570')}
      </button>

    </div>
  );
}

