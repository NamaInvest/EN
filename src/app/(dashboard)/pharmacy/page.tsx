import FeatureDisabledPanel from '@/components/ui/FeatureDisabledPanel';

export default function DisabledModulePage() {
  return (
    <FeatureDisabledPanel 
      moduleName="pharmacy"
      apiExists={true}
      apiPath="/api/pharmacy"
      missingFeatures="لا يوجد ربط بين واجهة المستخدم وخدمات الواجهة الخلفية. الشاشة غير مبنية بعد."
      reportLink="/reports"
    />
  );
}
