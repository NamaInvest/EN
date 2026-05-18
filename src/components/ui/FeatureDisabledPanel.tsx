import React from 'react';
import { AlertTriangle, HardDrive, FileText } from 'lucide-react';
import Link from 'next/link';

interface FeatureDisabledPanelProps {
  moduleName: string;
  apiExists: boolean;
  apiPath?: string;
  missingFeatures: string;
  reportLink?: string;
}

export default function FeatureDisabledPanel({ 
  moduleName, 
  apiExists, 
  apiPath, 
  missingFeatures, 
  reportLink 
}: FeatureDisabledPanelProps) {
  return (
    <div className="card" style={{ 
      maxWidth: '800px', 
      margin: '4rem auto', 
      padding: '3rem', 
      textAlign: 'center',
      border: '1px solid var(--border)',
      background: 'var(--bg-secondary)',
      direction: 'rtl'
    }}>
      <AlertTriangle size={64} color="#f59e0b" style={{ margin: '0 auto 1.5rem', opacity: 0.8 }} />
      <h2 style={{ marginBottom: '1rem', color: 'var(--text)' }}>
        وحدة {moduleName} قيد التطوير
      </h2>
      
      <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
        هذه الواجهة غير مكتملة حالياً وهي في وضع (Placeholder). تم تعطيلها مؤقتاً لحين استكمال الربط مع الخدمات الخلفية وبناء واجهة المستخدم النهائية.
      </p>

      <div style={{ textAlign: 'right', background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>حالة الربط الهندسي</h3>
        
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HardDrive size={18} color={apiExists ? "#22c55e" : "#ef4444"} />
            <strong>الـ API:</strong> 
            {apiExists ? (
              <span style={{ color: '#22c55e' }}>متوفر ({apiPath})</span>
            ) : (
              <span style={{ color: '#ef4444' }}>غير متوفر أو يحتاج بناء</span>
            )}
          </li>
          <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <FileText size={18} color="var(--text-muted)" style={{ marginTop: '0.2rem' }} />
            <div>
              <strong>النواقص:</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                {missingFeatures}
              </div>
            </div>
          </li>
        </ul>
      </div>

      {reportLink && (
        <div style={{ marginTop: '2rem' }}>
          <Link href={reportLink} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>
            عرض تقرير الفجوات (Gap Report)
          </Link>
        </div>
      )}
    </div>
  );
}
