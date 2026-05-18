import FeatureDisabledPanel from '@/components/ui/FeatureDisabledPanel';

export default function DisabledModulePage() {
  return (
    <FeatureDisabledPanel 
      moduleName="enterprise/portfolio"
      apiExists={false}
      apiPath="/api/enterprise/portfolio"
      missingFeatures="لا يوجد ربط بين واجهة المستخدم وخدمات الواجهة الخلفية. الشاشة غير مبنية بعد."
      reportLink="/reports"
    />
  );
}
