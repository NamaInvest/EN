import React from 'react';
import FinancialReportAuditClient from './FinancialReportAuditClient';

export const metadata = {
  title: '🛡️ سجل تدقيق التقارير المالية - نماء للاستثمار',
  description: 'سجل تدقيق وتتبع عمليات توليد وتصدير التقارير المالية والمحاسبية لشركة نماء للاستثمار.',
};

export default function FinancialReportAuditPage() {
  return <FinancialReportAuditClient />;
}
