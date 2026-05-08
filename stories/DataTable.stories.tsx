/**
 * Storybook Stories — DataTable Component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from '@/components/data/DataTable';

const meta: Meta<typeof DataTable> = {
  title:      'Data/DataTable',
  component:  DataTable,
  parameters: { layout: 'fullscreen' },
  tags:       ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof DataTable>;

// ─── Fixtures ────────────────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'ref',      header: 'المرجع',      sortable: true },
  { key: 'customer', header: 'العميل',      sortable: true },
  { key: 'amount',   header: 'المبلغ',      sortable: true, className: 'text-right ltr' },
  { key: 'status',   header: 'الحالة' },
  { key: 'date',     header: 'التاريخ',     sortable: true },
];

const SAMPLE_DATA = Array.from({ length: 50 }, (_, i) => ({
  ref:      `INV-${String(i + 1).padStart(4, '0')}`,
  customer: ['شركة الأمانة', 'مؤسسة النور', 'شركة الخليج', 'مجموعة الرياض'][i % 4],
  amount:   `${((i + 1) * 1234.50).toLocaleString('ar-SA')} ر.س`,
  status:   ['مدفوعة', 'معلقة', 'متأخرة', 'ملغاة'][i % 4],
  date:     new Date(2026, 4, (i % 28) + 1).toLocaleDateString('ar-SA'),
}));

export const Default: Story = {
  args: {
    columns:  COLUMNS,
    data:     SAMPLE_DATA.slice(0, 10),
    caption:  'فواتير المبيعات',
  },
};

export const WithSearch: Story = {
  args: {
    columns: COLUMNS,
    data:    SAMPLE_DATA,
    caption: 'مع بحث وترقيم',
    searchable: true,
    pageSize:   10,
  },
};

export const Empty: Story = {
  args: {
    columns: COLUMNS,
    data:    [],
    caption: 'جدول فارغ',
  },
};

export const Loading: Story = {
  args: {
    columns:  COLUMNS,
    data:     [],
    caption:  'جاري التحميل',
    loading:  true,
  },
};

export const LargeDataset: Story = {
  name: 'Large Dataset (50 rows)',
  args: {
    columns:    COLUMNS,
    data:       SAMPLE_DATA,
    searchable: true,
    pageSize:   20,
  },
};
