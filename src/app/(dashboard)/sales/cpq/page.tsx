import FeatureDisabledPanel from '@/components/ui/FeatureDisabledPanel';

export default function DisabledModulePage() {
  return (
    <FeatureDisabledPanel 
      moduleName="sales/cpq"
      apiExists={false}
      apiPath="/api/sales/cpq"
      missingFeatures="لا يوجد ربط بين واجهة المستخدم وخدمات الواجهة الخلفية. الشاشة غير مبنية بعد."
      reportLink="/reports"
    />
  );
}
