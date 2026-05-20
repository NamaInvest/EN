import { useState, useEffect } from 'react';
import { api } from './lib/api';
import { WelcomeScreen } from './components/WelcomeScreen';
import { LicenseSetupScreen } from './components/LicenseSetupScreen';
import { ExistingCompanyScreen } from './components/ExistingCompanyScreen';
import { NewCompanyProvisionScreen } from './components/NewCompanyProvisionScreen';
import { OfflineDashboard } from './components/OfflineDashboard';

import { LicenseVerifyResponse, LicensePayload } from '../electron/types';

import { AppUpdateScreen } from './components/AppUpdateScreen';

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [fingerprint, setFingerprint] = useState('');
  
  const [licenseData, setLicenseData] = useState<LicenseVerifyResponse | null>(null);
  const [payloadData, setPayloadData] = useState<LicensePayload | null>(null);

  useEffect(() => {
    api.getFingerprint().then((fp) => setFingerprint(fp));
    
    // Auto-check license on startup
    api.checkLicense({}).then((res) => {
      setLicenseData(res);
      if (res.status === 'ACTIVE') {
        setScreen('dashboard'); // For now, dashboard represents Workspace
      } else if (res.status === 'OFFLINE_GRACE') {
        setScreen('dashboard');
      } else if (res.status === 'EXPIRED') {
        setScreen('expired');
      } else if (res.status === 'INVALID' || res.status === 'LOCKED') {
        setScreen('welcome');
      } else if (res.status === 'existing_company') {
        setScreen('existing_company');
      } else if (res.status === 'new_company') {
        setScreen('new_company');
      }
    });
  }, []);

  if (screen === 'welcome') {
    return (
      <WelcomeScreen 
        fingerprint={fingerprint} 
        onStartSetup={() => {
          console.log("Start setup clicked");
          setScreen('license');
        }} 
      />
    );
  }

  if (screen === 'license') {
    return (
      <LicenseSetupScreen 
        fingerprint={fingerprint}
        onBack={() => setScreen('welcome')}
        onSuccess={(res, formData) => {
          setLicenseData(res);
          setPayloadData(formData);
          if (res.status === 'existing_company') {
            setScreen('existing_company');
          } else if (res.status === 'new_company') {
            setScreen('new_company');
          }
        }}
      />
    );
  }

  if (screen === 'existing_company') {
    return (
      <ExistingCompanyScreen 
        data={licenseData} 
        onBack={() => setScreen('license')}
        onDashboard={() => setScreen('dashboard')}
      />
    );
  }

  if (screen === 'new_company') {
    return (
      <NewCompanyProvisionScreen 
        data={licenseData} 
        formData={payloadData}
        onBack={() => setScreen('license')}
        onDashboard={() => setScreen('dashboard')}
      />
    );
  }

  if (screen === 'dashboard') {
    return <OfflineDashboard onBack={() => setScreen('welcome')} onCheckUpdates={() => setScreen('update_screen')} licenseData={licenseData} />;
  }

  if (screen === 'update_screen') {
    return <AppUpdateScreen onBack={() => setScreen('dashboard')} />;
  }

  if (screen === 'expired') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-rose-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            ⚠️
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">انتهت فترة التجربة</h2>
          <p className="text-slate-600 mb-6">لقد انتهت فترة الـ 7 أيام التجريبية الخاصة بك.</p>
          <button onClick={() => setScreen('welcome')} className="px-6 py-2 bg-slate-900 text-white rounded-lg w-full">رجوع</button>
        </div>
      </div>
    );
  }

  return null;
}
