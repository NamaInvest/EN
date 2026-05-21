import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from '../components/ui/EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const NoData: Story = {
  args: {
    variant: 'no-data',
    title: 'لا توجد بيانات',
    message: 'لم يتم العثور على أي سجلات مطابقة في هذا القسم.',
    illustration: '/assets/empty-states/no-data.svg',
    cta: {
      label: 'إضافة جديد',
      onClick: () => alert('Clicked!'),
    },
  },
};

export const NoResults: Story = {
  args: {
    variant: 'no-results',
    title: 'لا توجد نتائج بحث',
    message: 'حاول تغيير كلمات البحث أو إزالة بعض الفلاتر.',
    illustration: '/assets/empty-states/empty.svg',
  },
};

export const ErrorState: Story = {
  args: {
    variant: 'error',
    title: 'خطأ في الاتصال',
    message: 'تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى لاحقاً.',
    illustration: '/assets/errors/500.svg',
    cta: {
      label: 'إعادة المحاولة',
      onClick: () => window.location.reload(),
    },
  },
};
