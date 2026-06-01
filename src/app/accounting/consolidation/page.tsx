import React from 'react';
import ConsolidationPreviewClient from './ConsolidationPreviewClient';

export const metadata = {
  title: '📈 معاينة توحيد القوائم المالية - نماء للاستثمار',
  description: 'معاينة القوائم المالية الموحدة وتجميع أرصدة الشركات التابعة واستبعادات المعاملات البينية بشكل آمن وتلقائي.',
};

export default function ConsolidationPage() {
  return <ConsolidationPreviewClient />;
}
