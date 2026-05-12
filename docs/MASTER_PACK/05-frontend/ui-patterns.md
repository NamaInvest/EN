---
version: 1.0
last_updated: 2026-05-12
---

# Frontend UI/UX Patterns

> أنماط واجهة موحّدة عبر كل صفحات نماسوفت.

## بنية الصفحة القياسية

```
┌─────────────────────────────────────────────────────────┐
│  Header                                                  │
│  ┌─────────────────────┬───────────────────────────────┐ │
│  │ Title + Breadcrumbs │ Primary action + secondary    │ │
│  └─────────────────────┴───────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  Filters Bar                                             │
│  [Search______________] [Filter1▾] [Filter2▾] [Reset]    │
├─────────────────────────────────────────────────────────┤
│  Content (table / cards / chart)                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Empty state | Loading skeleton | Error retry       │ │
│  │  OR table rows with checkbox + row actions          │ │
│  └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  Pagination + Selected count + Bulk actions              │
└─────────────────────────────────────────────────────────┘
```

## نموذج كامل (React Server Component)

```tsx
// src/app/(dashboard)/sales/invoices/page.tsx
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { InvoicesTable } from './InvoicesTable';
import { InvoicesFilters } from './InvoicesFilters';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const { user, tenantId } = await auth();
  
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="فواتير المبيعات"
        breadcrumbs={[{ label: 'المبيعات', href: '/sales' }, { label: 'الفواتير' }]}
        primaryAction={{
          label: 'فاتورة جديدة',
          href: '/sales/invoices/new',
          icon: 'plus',
          permission: 'sales:invoice:create',
        }}
        secondaryActions={[
          { label: 'استيراد', href: '/sales/invoices/import' },
          { label: 'تصدير', onClick: 'export-current-view' },
        ]}
      />
      
      <InvoicesFilters initial={params} />
      
      <Suspense fallback={<TableSkeleton rows={10} cols={7} />}>
        <InvoicesTable filters={params} tenantId={tenantId} />
      </Suspense>
    </div>
  );
}

function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
```

## مكتبة المكونات الأساسية (موجودة فعلاً تحت `src/components/ui/`)

| المكوّن | الاستخدام | المتغيرات |
|---|---|---|
| `Button` | الإجراءات | default, destructive, outline, secondary, ghost, link |
| `Input` | حقل نص | text, email, password, number, tel, url |
| `Select` | منسدلة | searchable, multi, async |
| `Combobox` | منسدلة + بحث | local, remote |
| `DatePicker` | تاريخ | Gregorian + Hijri |
| `Table` | جدول | sortable, selectable, expandable |
| `Card` | كرت | default, elevated, outlined |
| `Dialog` | حوار | modal, sheet, drawer |
| `Toast` | إشعار | success, error, info, warning |
| `Tabs` | تبويب | underline, pills |
| `Badge` | شارة | default, secondary, destructive, outline |
| `Skeleton` | تحميل | text, card, table-row |
| `EmptyState` | حالة فارغة | with-action, illustration |
| `ErrorBoundary` | خطأ | inline, page |
| `Breadcrumbs` | تسلسل | with separator |
| `Pagination` | صفحات | offset, cursor |
| `Filter Bar` | فلتر | dropdown, chips, range |

## نمط النموذج (Form Pattern)

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/components/ui/use-toast';

const schema = z.object({
  customerId: z.string().min(1, 'العميل مطلوب'),
  invoiceDate: z.string().datetime(),
  currency: z.string().length(3),
  lines: z.array(z.object({
    productId: z.string().min(1),
    qty: z.number().positive(),
    unitPrice: z.number().nonnegative(),
  })).min(1, 'يجب إضافة منتج واحد على الأقل'),
});

type FormData = z.infer<typeof schema>;

export function InvoiceForm({ initial }: { initial?: Partial<FormData> }) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initial ?? {
      currency: 'SAR',
      invoiceDate: new Date().toISOString(),
      lines: [{ productId: '', qty: 1, unitPrice: 0 }],
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const idempotencyKey = crypto.randomUUID();
      const res = await fetch('/api/sales/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? 'حدث خطأ');
      }
      
      toast({ title: 'تم إنشاء الفاتورة بنجاح', variant: 'success' });
      router.push('/sales/invoices');
    } catch (e: any) {
      toast({ title: 'فشل الإنشاء', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* fields */}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
      </Button>
    </form>
  );
}
```

## RTL Strategy

```typescript
// app/layout.tsx
import { headers } from 'next/headers';
import { getLocaleFromHeaders } from '@/lib/i18n';

export default async function RootLayout({ children }) {
  const lang = await getLocaleFromHeaders();
  const dir = ['ar', 'fa', 'ur', 'he'].includes(lang) ? 'rtl' : 'ltr';
  
  return (
    <html lang={lang} dir={dir} className={dir === 'rtl' ? 'font-arabic' : 'font-sans'}>
      <body className="bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
```

```css
/* tailwind.config.ts */
{
  theme: {
    extend: {
      fontFamily: {
        arabic: ['IBM Plex Sans Arabic', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('tailwindcss-rtl'),
  ],
}
```

```tsx
// استخدام logical properties
<div className="ms-4 me-2 ps-3 pe-1">  {/* margin/padding-start/end */}
<div className="text-start">           {/* not text-left */}
<Icon className="rtl:rotate-180" />    {/* mirror arrows */}
```

## Empty States

```tsx
// مكوّن موحّد
<EmptyState
  icon={<InboxIcon className="size-12" />}
  title="لا توجد فواتير حتى الآن"
  description="ابدأ بإنشاء أول فاتورة بيع"
  action={{
    label: 'فاتورة جديدة',
    href: '/sales/invoices/new',
  }}
/>
```

## Error States

```tsx
'use client';
import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // log to Sentry
    Sentry.captureException(error);
  }, [error]);
  
  return (
    <div className="rounded-lg border border-destructive/50 p-8 text-center">
      <h2 className="text-xl font-bold">حدث خطأ غير متوقع</h2>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Button onClick={reset} className="mt-4">
        إعادة المحاولة
      </Button>
    </div>
  );
}
```

## Loading States

- **Page-level:** `loading.tsx` per route (skeletons)
- **Section-level:** `Suspense` + Skeleton
- **Inline:** spinner داخل الـ Button
- **Optimistic updates:** للأكشن السريعة (toggle, vote)

## Accessibility (WCAG 2.1 AA)

- كل interactive element له aria-label أو visible text
- Focus indicators واضحة (`outline-offset-2`)
- Skip-to-content link في الهيدر
- Color contrast ≥ 4.5:1 للنص العادي
- Form errors تربط بـ `aria-describedby`
- Modal لها `role="dialog"` + focus trap
- Screen reader announcements للـ toasts (`aria-live`)
- Keyboard navigation كاملة (Tab, Enter, Esc, Arrow keys في القوائم)

## Image / Asset Strategy (بديل Shutterstock)

| الاستخدام | المصدر | الترخيص |
|---|---|---|
| Logos للشركات الديمو | Self-generated (DALL-E) | داخلي |
| Icons | Lucide React (موجود) | MIT |
| Illustrations للـ empty states | unDraw / Storyset | مجاني |
| Product images placeholders | Unsplash API | مجاني (attribution) |
| Avatar placeholders | DiceBear API | مجاني |
| Stock photos تجارية | Pexels API + Pixabay API | مجاني |
| Saudi-specific imagery | تصوير محلي مخصص | شراء حقوق |

```typescript
// src/lib/stock-images.ts (موجود فعلاً)
// يتعامل مع Unsplash + Pexels + DiceBear بـ caching
export async function getStockImage(query: string, options?: { size?: 'small' | 'regular' }) {
  // ...
}
```

## Charts (Recharts — موجود فعلاً)

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <XAxis dataKey="month" />
    <YAxis tickFormatter={(v) => formatSAR(v)} />
    <Tooltip
      formatter={(value: number) => formatSAR(value)}
      labelFormatter={(label) => `شهر ${label}`}
    />
    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
  </LineChart>
</ResponsiveContainer>
```

## Performance

- **Code splitting**: Next.js automatic per route
- **Image optimization**: `next/image` everywhere
- **Font loading**: `next/font` with `display: swap`
- **Bundle analysis**: `npm run analyze` (يضيف @next/bundle-analyzer)
- **Lighthouse budgets**: in `lighthouserc.js` (موجود)
- **React Compiler**: enable when Next.js 16 stable (experimental.reactCompiler)
- **Server Components everywhere; Client only when needed**
