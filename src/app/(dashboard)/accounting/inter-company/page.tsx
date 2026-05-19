import FeatureDisabledPanel from '@/components/ui/FeatureDisabledPanel';
import { InterCompanyClient } from './InterCompanyClient';

// Feature Flag for progressive rollout
const ENABLE_UI = true;

export default function InterCompanyPage() {
  if (!ENABLE_UI) {
    return (
      <FeatureDisabledPanel 
        moduleName="accounting/inter-company"
        apiExists={true}
        apiPath="/api/accounting/inter-company"
        missingFeatures="الواجهة قيد التطوير - يتم الاعتماد على FeatureDisabledPanel"
        reportLink="/reports"
      />
    );
  }

  return <InterCompanyClient />;
}
