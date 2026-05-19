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
    return <OfflineDashboard onBack={() => setScreen('welcome')} onCheckUpdates={() => setScreen('update_screen')} />;
  }

  if (screen === 'update_screen') {
    return <AppUpdateScreen onBack={() => setScreen('dashboard')} />;
  }

  return null;
}
