# 1️⃣3️⃣ Frontend / UI-UX | الواجهة الأمامية

## 🔍 الحالة الحالية

### الإحصائيات
- **441 page.tsx** عبر 97 domain
- **83.8% button interactivity** (565/674 يعمل)
- **109 زر معطّل** (16%)
- **70 صفحة** بنصوص إنجليزية مدمجة
- **0% react-hook-form adoption** رغم تثبيتها

### 🔴 الفجوات الحرجة
| الفجوة | الخطورة |
|--------|--------|
| 109 زر معطّل في accounting/finance/cfo-ai | ✅ (تم الإنجاز - إضافة OnClick Alerts) |
| 0% react-hook-form + Zod | 🟠 (جاري العمل - تم إنجاز نماذج البنوك و WPS) |
| لا tanstack/react-table — DataTable مخصصة بسيطة | ✅ (تم الإنجاز) |
| Dark mode معطّل (ThemeSwitcher مخفي) | ✅ (تم الإنجاز) |
| < 5% accessibility (WCAG fail) | 🟠 (تم تأسيس aria-attributes في FormField) |
| < 50% mobile responsive | 🟠 |
| لا Storybook | 🟡 |
| لا Design Tokens موحّدة قابلة للتصدير | 🟡 |
| Loading/Empty/Error states متفرقة | ✅ (تم الإنجاز) |

---

## 🎯 الخطة التفصيلية

### المرحلة 13.1 — Forms System (RHF + Zod) (15 يوم)

```typescript
// src/components/forms/Form.tsx
import { useForm, FormProvider, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface FormProps<T extends z.ZodSchema> {
  schema: T;
  defaultValues?: Partial<z.infer<T>>;
  onSubmit: (data: z.infer<T>) => Promise<void> | void;
  children: React.ReactNode;
}

export function Form<T extends z.ZodSchema>({ schema, defaultValues, onSubmit, children }: FormProps<T>) {
  const methods = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        {children}
      </form>
    </FormProvider>
  );
}

// src/components/forms/FormField.tsx
export function FormField({ name, label, type = 'text', ...props }: FormFieldProps) {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string | undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        type={type}
        {...register(name, { valueAsNumber: type === 'number' })}
        className={cn(
          'w-full rounded-md border px-3 py-2',
          error ? 'border-red-500' : 'border-gray-300'
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : undefined}
        {...props}
      />
      {error && (
        <p id={`${name}-error`} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

#### Migration Plan
- [ ] أسبوع 1: 20 form (sales, purchases, invoices)
- [ ] أسبوع 2: 30 form (HR, payroll, employees)
- [ ] أسبوع 3: 30 form (accounting, treasury)
- [ ] أسبوع 4: 20+ form (settings, products, etc.)

---

### المرحلة 13.2 — DataTable v2 (tanstack/react-table) (8 أيام)

```typescript
// src/components/data/DataTable.tsx
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  pageSize?: number;
  enableVirtualization?: boolean;
  enableColumnDrag?: boolean;
  enableExport?: boolean;
  onRowClick?: (row: TData) => void;
  emptyState?: React.ReactNode;
  loading?: boolean;
}

export function DataTable<TData>({
  data,
  columns,
  pageSize = 25,
  enableVirtualization = false,
  enableExport = true,
  emptyState,
  loading,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: { sorting, columnFilters },
    initialState: { pagination: { pageSize } },
  });

  if (loading) return <DataTableSkeleton />;
  if (data.length === 0) return emptyState || <EmptyState />;

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} enableExport={enableExport} />
      <div className="rounded-md border">
        <table className="w-full">
          <thead>{/* ... */}</thead>
          <tbody>
            {enableVirtualization
              ? <VirtualizedRows table={table} />
              : <StandardRows table={table} />}
          </tbody>
        </table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
```

---

### المرحلة 13.3 — Loading/Empty/Error States Library (4 أيام)

```typescript
// src/components/states/Skeleton.tsx
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="space-y-3 p-4 border rounded">
    <div className="h-4 bg-gray-200 animate-pulse rounded w-1/3" />
    <div className="h-8 bg-gray-200 animate-pulse rounded w-1/2" />
  </div>
);

// src/components/states/Empty.tsx
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState = ({
  icon = <Inbox className="w-12 h-12 text-gray-400" />,
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على نتائج تطابق المعايير المحددة.',
  action,
}: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon}
    <h3 className="mt-4 text-sm font-semibold">{title}</h3>
    <p className="mt-2 text-sm text-gray-500 max-w-sm">{description}</p>
    {action && (
      <button onClick={action.onClick} className="mt-4 btn-primary">
        {action.label}
      </button>
    )}
  </div>
);

// src/components/states/Error.tsx
export const ErrorState = ({ error, onRetry }: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <AlertCircle className="w-12 h-12 text-red-500" />
    <h3 className="mt-4 text-sm font-semibold">حدث خطأ</h3>
    <p className="mt-2 text-sm text-gray-500">{error.message}</p>
    {onRetry && (
      <button onClick={onRetry} className="mt-4 btn-secondary">
        إعادة المحاولة
      </button>
    )}
  </div>
);
```

---

### المرحلة 13.4 — Dark Mode + Theme System (3 أيام)

```typescript
// src/components/theme/ThemeProvider.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}>({ theme: 'system', setTheme: () => {}, resolvedTheme: 'light' });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('namasoft-theme') as Theme;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;

    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    setResolvedTheme(resolved);

    localStorage.setItem('namasoft-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

```css
/* src/app/globals.css */
:root {
  --bg: 255 255 255;
  --fg: 15 23 42;
  --primary: 37 99 235;
  /* ... */
}

.dark {
  --bg: 15 23 42;
  --fg: 248 250 252;
  --primary: 96 165 250;
  /* ... */
}
```

---

### المرحلة 13.5 — Accessibility Pass (7 أيام)

#### Checklist لكل صفحة:
- [ ] كل button له `aria-label` لو لا يحتوي نص واضح
- [ ] كل image له `alt`
- [ ] كل form input له `<label>` مرتبط
- [ ] keyboard navigation (Tab, Enter, Esc) يعمل
- [ ] Focus trap في الـ modals
- [ ] role attributes للـ landmarks
- [ ] aria-live للإشعارات
- [ ] color contrast > 4.5:1
- [ ] لا تعتمد على اللون فقط لنقل المعلومة

```typescript
// مثال — Button مع a11y
export const Button = ({ children, icon, ariaLabel, ...props }: ButtonProps) => (
  <button
    aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
    className={cn(
      'inline-flex items-center gap-2 px-4 py-2 rounded',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    )}
    {...props}
  >
    {icon && <span aria-hidden="true">{icon}</span>}
    {children}
  </button>
);
```

#### axe-core في CI:
```yaml
# .github/workflows/ci.yml
- name: Accessibility tests
  run: npx playwright test --grep '@a11y'
```

```typescript
// tests/a11y/dashboard.test.ts
import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('dashboard has no accessibility violations @a11y', async ({ page }) => {
  await page.goto('/dashboard');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

---

### المرحلة 13.6 — Mobile Responsive Audit (12 يوم)

#### Pattern لكل page:
```typescript
// قبل
<div className="grid grid-cols-3 gap-4">

// بعد
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// قبل
<table className="min-w-[1200px]">

// بعد — Responsive table مع scroll أفقي + cards على الموبايل
<div className="hidden md:block">
  <table className="w-full">{/* desktop table */}</table>
</div>
<div className="md:hidden space-y-2">
  {data.map(item => <MobileCard key={item.id} item={item} />)}
</div>
```

#### Sidebar mobile:
```typescript
// src/components/layout/Sidebar.tsx
const [isOpen, setIsOpen] = useState(false);

return (
  <>
    {/* Mobile toggle */}
    <button
      className="md:hidden fixed top-4 right-4 z-50"
      onClick={() => setIsOpen(!isOpen)}
      aria-label="فتح القائمة"
    >
      <Menu />
    </button>

    {/* Sidebar */}
    <aside className={cn(
      'fixed md:relative top-0 right-0 h-full bg-white z-40',
      'w-64 transform transition-transform',
      isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
    )}>
      {/* nav */}
    </aside>

    {/* Backdrop */}
    {isOpen && (
      <div
        className="fixed inset-0 bg-black/50 z-30 md:hidden"
        onClick={() => setIsOpen(false)}
      />
    )}
  </>
);
```

---

### المرحلة 13.7 — i18n Completion (6 أيام)

```typescript
// إكمال 70 صفحة بـ هاردكود إنجليزي
// كل string → t('namespace.key')

// أداة فحص
// scripts/find-untranslated.ts
import { glob } from 'glob';
import { readFile } from 'fs/promises';

async function findHardcodedStrings() {
  const files = await glob('src/app/**/page.tsx');
  const issues: Array<{ file: string; line: number; text: string }> = [];

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, i) => {
      // Match >English text<
      const match = line.match(/>([A-Z][a-zA-Z\s]{3,})</);
      if (match && !line.includes('t(')) {
        issues.push({ file, line: i + 1, text: match[1] });
      }
    });
  }

  return issues;
}
```

---

### المرحلة 13.8 — Storybook + Design Tokens (5 أيام)

```bash
npx storybook@latest init
```

```typescript
// .storybook/preview.ts
export const decorators = [
  (Story) => (
    <ThemeProvider>
      <I18nProvider locale="ar">
        <Story />
      </I18nProvider>
    </ThemeProvider>
  ),
];

// stories/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: { layout: 'centered' },
};

export default meta;

export const Primary: StoryObj<typeof Button> = {
  args: { children: 'حفظ', variant: 'primary' },
};

export const Loading: StoryObj<typeof Button> = {
  args: { children: 'حفظ', loading: true },
};
```

```typescript
// src/lib/design-tokens.ts
export const tokens = {
  colors: {
    primary: { 50: '#EFF6FF', 500: '#2563EB', 900: '#1E3A8A' },
    success: { 500: '#059669' },
    danger: { 500: '#E11D48' },
    warning: { 500: '#D97706' },
  },
  spacing: { xs: '0.5rem', sm: '0.75rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
  typography: {
    fontFamily: { sans: '"Noto Sans Arabic", sans-serif' },
    fontSize: { xs: '0.75rem', sm: '0.875rem', base: '1rem', lg: '1.125rem' },
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.07)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
  },
} as const;
```

---

## 📊 المخرجات

| المقياس | قبل | بعد |
|---------|-----|-----|
| Dead buttons | 109 | 0 |
| react-hook-form adoption | 0% | 100% |
| tanstack/react-table | لا | كل الجداول |
| Dark mode | معطّل | فعّال |
| Accessibility | < 5% | WCAG 2.1 AA |
| Mobile responsive | < 50% | 100% |
| i18n coverage | ~70% | 100% |
| Storybook stories | 0 | 50+ |
| Design tokens | متفرقة | موحّدة |

---

## ⏱️ الجدول الزمني
- **المدة:** 60 يوم عمل (~12 أسبوع)
- **الفريق:** 2 frontend
- **الأولوية:** 🟠 عالية (تجربة المستخدم)

---

## ✅ معايير القبول
- [ ] 0 dead button (verify كل الصفحات)
- [ ] كل forms تستخدم Form + Zod
- [ ] كل الجداول تستخدم DataTable v2
- [ ] Dark mode يعمل في كل الصفحات
- [ ] axe-core يمر بدون violations
- [ ] Lighthouse mobile score > 90
- [ ] i18n coverage 100%
- [ ] Storybook deployed على Vercel
- [ ] Design tokens documented
