import FeatureDisabledPanel from '@/components/ui/FeatureDisabledPanel';
import { PosAccountantClient } from './PosAccountantClient';

// Feature Flag for progressive rollout
const ENABLE_UI = true;

export default function PosAccountantPage() {
  if (!ENABLE_UI) {
    return (
      <FeatureDisabledPanel 
        moduleName="pos/accountant"
        apiExists={true}
        apiPath="/api/pos/accountant"
        missingFeatures="الواجهة قيد التطوير - يتم الاعتماد على FeatureDisabledPanel"
        reportLink="/reports"
      />
    );
  }

  return <PosAccountantClient />;
}
