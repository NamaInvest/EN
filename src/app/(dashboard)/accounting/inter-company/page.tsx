import FeatureDisabledPanel from '@/components/ui/FeatureDisabledPanel';

export default function DisabledModulePage() {
  return (
    <FeatureDisabledPanel 
      moduleName="accounting/inter-company"
      apiExists={true}
      apiPath="/api/accounting/inter-company"
      missingFeatures="لا يوجد ربط بين واجهة المستخدم وخدمات الواجهة الخلفية. الشاشة غير مبنية بعد."
      reportLink="/reports"
    />
  );
}
