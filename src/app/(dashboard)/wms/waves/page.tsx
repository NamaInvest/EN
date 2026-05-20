import FeatureDisabledPanel from '@/components/ui/FeatureDisabledPanel';
import WmsWavesClient from './WmsWavesClient';

const ENABLE_WMS_WAVES_UI = true; // Feature flag for Phase 2C

export default function WmsWavesPage() {
  if (!ENABLE_WMS_WAVES_UI) {
    return (
      <FeatureDisabledPanel 
        moduleName="wms/waves"
        apiExists={true}
        apiPath="/api/wms/waves"
        missingFeatures="لا يوجد ربط بين واجهة المستخدم وخدمات الواجهة الخلفية. الشاشة غير مبنية بعد."
        reportLink="/reports"
      />
    );
  }

  return <WmsWavesClient />;
}
