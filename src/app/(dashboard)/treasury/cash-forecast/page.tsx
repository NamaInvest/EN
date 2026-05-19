import FeatureDisabledPanel from '@/components/ui/FeatureDisabledPanel';
import { CashForecastClient } from './CashForecastClient';

// Feature Flag for progressive rollout
const ENABLE_UI = true;

export default function CashForecastPage() {
  if (!ENABLE_UI) {
    return (
      <FeatureDisabledPanel 
        moduleName="treasury/cash-forecast"
        apiExists={true}
        apiPath="/api/treasury/cash-forecast"
        missingFeatures="الواجهة قيد التطوير - يتم الاعتماد على FeatureDisabledPanel"
        reportLink="/reports"
      />
    );
  }

  return <CashForecastClient />;
}
