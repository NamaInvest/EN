/**
 * Storybook Stories — Form Components
 * FormField, FormSelect, FormTextarea, EmptyState
 */

import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from '@/components/forms/FormField';
import { FormSelect } from '@/components/forms/FormSelect';
import { FormTextarea } from '@/components/forms/FormTextarea';
import { EmptyState, ErrorState, LoadingState } from '@/components/states/Empty';

// ─── FormField ───────────────────────────────────────────────────────────────
export default {
  title: 'Forms/FormField',
  component: FormField,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof FormField>;

type Story = StoryObj<typeof FormField>;

export const Default: Story = {
  args: { label: 'اسم العميل', name: 'customerName', placeholder: 'أدخل الاسم' },
};

export const WithError: Story = {
  args: { label: 'البريد الإلكتروني', name: 'email', error: 'البريد الإلكتروني غير صالح' },
};

export const WithHint: Story = {
  args: { label: 'رقم الهوية', name: 'nationalId', hint: '10 أرقام بدون مسافات', placeholder: '1234567890' },
};

export const Required: Story = {
  args: { label: 'رقم الفاتورة', name: 'invoiceRef', required: true },
};

export const NumberField: Story = {
  args: { label: 'المبلغ', name: 'amount', type: 'number', placeholder: '0.00', dir: 'ltr' },
};

// ─── FormSelect ──────────────────────────────────────────────────────────────
const SELECT_OPTIONS = [
  { label: 'مسودة', value: 'draft' },
  { label: 'مرسلة', value: 'sent' },
  { label: 'مدفوعة', value: 'paid' },
  { label: 'ملغاة', value: 'cancelled' },
];

export const SelectDefault: StoryObj<typeof FormSelect> = {
  render: () => (
    <FormSelect label="حالة الفاتورة" name="status" options={SELECT_OPTIONS} />
  ),
};

// ─── FormTextarea ─────────────────────────────────────────────────────────────
export const TextareaDefault: StoryObj<typeof FormTextarea> = {
  render: () => (
    <FormTextarea label="ملاحظات" name="notes" placeholder="أدخل ملاحظاتك هنا..." rows={4} />
  ),
};

// ─── States ──────────────────────────────────────────────────────────────────
export const Empty: StoryObj<typeof EmptyState> = {
  render: () => (
    <EmptyState
      title="لا توجد فواتير"
      description="ابدأ بإنشاء أولى فواتيرك لعرضها هنا"
      action={{ label: 'إنشاء فاتورة', onClick: () => alert('clicked') }}
    />
  ),
};

export const Error: StoryObj<typeof ErrorState> = {
  render: () => (
    <ErrorState
      title="خطأ في التحميل"
      description="لم نتمكن من تحميل البيانات. يرجى المحاولة مرة أخرى."
      onRetry={() => alert('retry')}
    />
  ),
};

export const Loading: StoryObj<typeof LoadingState> = {
  render: () => <LoadingState message="جاري تحميل الفواتير..." />,
};
