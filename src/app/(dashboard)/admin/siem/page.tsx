import FeatureDisabledPanel from '@/components/ui/FeatureDisabledPanel';

export default function DisabledModulePage() {
  return (
    <FeatureDisabledPanel 
      moduleName="admin/siem"
      apiExists={false}
      apiPath="/api/admin/siem"
      missingFeatures="لا يوجد ربط بين واجهة المستخدم وخدمات الواجهة الخلفية. الشاشة غير مبنية بعد."
      reportLink="/reports"
    />
  );
}
