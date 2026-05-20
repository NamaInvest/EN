import FeatureDisabledPanel from '@/components/ui/FeatureDisabledPanel';
import ManufacturingApsClient from './ManufacturingApsClient';

export default function ManufacturingApsPage() {
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_MANUFACTURING_APS === 'true';

  if (!isEnabled) {
    return (
      <FeatureDisabledPanel 
        moduleName="manufacturing/aps"
        apiExists={true}
        apiPath="/api/manufacturing/aps"
        missingFeatures="هذه الشاشة تحت التطوير وسيتم إطلاقها قريباً بعد استكمال الفحوصات الأمنية."
        reportLink="/reports"
      />
    );
  }

  return <ManufacturingApsClient />;
}
