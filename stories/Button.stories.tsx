/**
 * Storybook Stories — Button Component
 * Ocean Glass Design System (Namasoft ERP)
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/Button';
import { Save, Trash2, Plus, Download, RefreshCcw } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title:     'UI/Button',
  component: Button,
  parameters: {
    layout:   'centered',
    docs: {
      description: {
        component: 'زر Ocean Glass متعدد الأنماط — يدعم 8 variants، حالة تحميل، وأيقونات.',
      },
    },
  },
  tags:    ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'warning', 'default'],
      description: 'نمط الزر البصري',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'حجم الزر',
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Primary: Story = {
  args: { children: 'حفظ البيانات', variant: 'primary', size: 'md' },
};

export const Secondary: Story = {
  args: { children: 'إلغاء', variant: 'secondary', size: 'md' },
};

export const Danger: Story = {
  args: { children: 'حذف', variant: 'danger', size: 'md' },
};

export const Success: Story = {
  args: { children: 'تم الموافقة', variant: 'success', size: 'md' },
};

export const Loading: Story = {
  args: { children: 'جاري الحفظ...', variant: 'primary', loading: true },
};

export const WithIcon: Story = {
  args: { children: 'إضافة سطر', variant: 'primary', size: 'md' },
  render: (args) => <Button {...args}><Plus className="w-4 h-4 ml-1" />{args.children}</Button>,
};

export const IconOnly: Story = {
  args: { variant: 'outline', size: 'sm', 'aria-label': 'تحديث' },
  render: (args) => <Button {...args}><RefreshCcw className="w-4 h-4" /></Button>,
};

export const SizeVariants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Button size="sm" variant="primary">صغير</Button>
      <Button size="md" variant="primary">متوسط</Button>
      <Button size="lg" variant="primary">كبير</Button>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 p-6">
      {(['primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'warning'] as const).map(v => (
        <Button key={v} variant={v}>{v}</Button>
      ))}
    </div>
  ),
};

export const AccountingActions: Story = {
  name: 'AP/AR Action Bar (Real-world)',
  render: () => (
    <div className="flex gap-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <Button variant="primary">
        <Save className="w-4 h-4 ml-1" /> حفظ القيد
      </Button>
      <Button variant="outline">
        <Download className="w-4 h-4 ml-1" /> تصدير PDF
      </Button>
      <Button variant="danger">
        <Trash2 className="w-4 h-4 ml-1" /> إلغاء
      </Button>
    </div>
  ),
};
