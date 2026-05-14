# 42 - مكونات الواجهة والأنماط (UI Components & Patterns)

> 63 مكون + Forms + Tables + States + Themes + Patterns

---

## 📂 هيكل المكونات

```
src/components/
├── AICopilotButton.tsx           ← AI button (117 سطر)
├── DesktopBanner.tsx             ← Banner للديسكتوب (335 سطر)
├── DimensionPicker.tsx           ← اختيار مراكز التكلفة/المشاريع
├── DocumentUploader.tsx          ← رفع وثائق
├── GlobalAuthGuard.tsx           ← حماية المسارات (60 سطر)
├── GlobalErrorBoundary.tsx       ← Error boundary
├── GlobalSearch.tsx              ← بحث شامل
├── HijriDate.tsx                 ← تاريخ هجري
├── InactivityGuard.tsx           ← قطع الجلسة بسبب الخمول
├── InvoiceReceipt.tsx            ← فاتورة للطباعة (827 سطر) — كبيرة!
├── LanguageSwitcher.tsx          ← تبديل اللغة
├── LocationSelector.tsx          ← اختيار الفرع/المستودع
├── NotificationBell.tsx          ← جرس الإشعارات
├── PrintButton.tsx               ← زر الطباعة
├── Providers.tsx                 ← React Context providers
├── QuotaModal.tsx                ← Modal للـ quota
├── RiyalLogo.tsx                 ← شعار الريال
├── SessionGuard.tsx              ← حماية الجلسة
├── Sidebar.tsx                   ← Sidebar (1254 سطر!) — الأكبر
├── Skeleton.tsx                  ← Skeleton loader
├── StockNotificationBell.tsx     ← تنبيهات المخزون
├── SubscriptionGuard.tsx         ← حماية الاشتراك
├── ThemeSwitcher.tsx             ← تبديل الـ themes
├── Toast.tsx                     ← Toast notifications
├── TrialBanner.tsx               ← Banner للتجريبي
├── VoucherReceipt.tsx            ← قسيمة استلام
│
├── data/
│   └── DataTable.tsx             ← Data table الرئيسي
│
├── forms/
│   ├── Form.tsx                  ← Form wrapper
│   ├── FormField.tsx             ← حقل عام
│   ├── FormSelect.tsx            ← اختيار
│   ├── FormTextarea.tsx          ← Textarea
│   └── FormWrapper.tsx           ← مع schemas (Customer, Invoice)
│
├── gaps/
│   ├── CustomerPortal.tsx        ← بوابة العميل
│   └── VendorPortal.tsx          ← بوابة المورد
│
├── ice/
│   └── IceSidebar.tsx            ← Sidebar للـ ICE (133 سطر)
│
├── pos/
│   ├── AddCustomerModal.tsx
│   ├── RestaurantFloorPlan.tsx   ← خريطة المطعم (262 سطر)
│   └── SalesReturnModal.tsx
│
├── states/
│   ├── Empty.tsx                 ← Empty + Error + Loading
│   ├── Error.tsx
│   └── Skeleton.tsx              ← Table/Card/Form skeletons
│
├── theme/
│   └── ThemeProvider.tsx         ← Theme context
│
├── ui/                            ← shadcn/ui patterns
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── ComingSoonModule.tsx
│   ├── data-table.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── mobile-layout.tsx
│   ├── nama-form.tsx
│   ├── select.tsx
│   ├── state-badge.tsx
│   ├── states.tsx                ← LoadingState, EmptyState, etc.
│   ├── switch.tsx
│   └── table.tsx
│
└── v2/
    └── JourneyTimeline.tsx       ← Timeline للحالات
```

---

## 🎨 الـ UI Library: shadcn/ui

### المبدأ:
- **لا library خارجية كاملة** (لا MUI، لا Antd)
- **Components محلية** copy-paste من shadcn/ui
- **مخصصة بـ TailwindCSS**
- **مبنية على Radix UI** (للـ accessibility)

### Radix UI primitives المستخدمة:
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-label`
- `@radix-ui/react-select`
- `@radix-ui/react-slot`
- `@radix-ui/react-switch`

---

## 🎯 الـ Forms (نمط React Hook Form + Zod)

### مثال أساسي:
```typescript
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
    name: z.string().min(3).max(100),
    email: z.string().email(),
    age: z.number().int().positive()
});

type FormData = z.infer<typeof schema>;

export function MyForm() {
    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema)
    });
    
    const onSubmit = async (data: FormData) => {
        await fetch('/api/...', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    };
    
    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <FormField name="name" {...register('name')} error={errors.name} />
            <FormField name="email" type="email" {...register('email')} error={errors.email} />
            <Button type="submit">حفظ</Button>
        </form>
    );
}
```

### الـ FormField المخصص:
```typescript
// components/forms/FormField.tsx
interface Props {
    name: string;
    label: string;
    error?: FieldError;
    type?: string;
    placeholder?: string;
}

export function FormField({ name, label, error, ...rest }: Props) {
    return (
        <div className="space-y-1">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} {...rest} aria-invalid={!!error} />
            {error && <p className="text-red-500 text-sm">{error.message}</p>}
        </div>
    );
}
```

### الـ Schemas في `forms/FormWrapper.tsx`:
- `customerSchema`
- `invoiceLineSchema`
- `salesInvoiceSchema`
- (وغيرها — كل entity له schema)

---

## 📊 Data Tables

### المكتبة: `@tanstack/react-table` 8.21.3

### النمط:
```typescript
import { useReactTable, ColumnDef, getCoreRowModel } from '@tanstack/react-table';

const columns: ColumnDef<Product>[] = [
    { accessorKey: 'name', header: 'الاسم' },
    { accessorKey: 'price', header: 'السعر' },
    { accessorKey: 'stock', header: 'المخزون' },
    {
        id: 'actions',
        cell: ({ row }) => (
            <DropdownMenu>
                <Button onClick={() => editProduct(row.original.id)}>تعديل</Button>
                <Button onClick={() => deleteProduct(row.original.id)}>حذف</Button>
            </DropdownMenu>
        )
    }
];

const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
});
```

### نماذج DataTable موجودة:
- `components/DataTable.tsx` (190 سطر)
- `components/data/DataTable.tsx` (227 سطر)
- `components/ui/data-table.tsx` (201 سطر)

كل واحد له خصائص:
- **Sorting**
- **Filtering**
- **Pagination**
- **Column visibility**
- **Selection (checkboxes)**
- **Export to Excel/PDF**
- **Bulk actions**

---

## 🦴 Skeletons & Loading States

### نمط الـ States (في `ui/states.tsx`):
```typescript
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/states';

function MyPage() {
    const { data, isLoading, error } = useQuery({ queryKey: ['x'], queryFn: ... });
    
    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState error={error} retry={refetch} />;
    if (!data?.length) return <EmptyState message="لا توجد بيانات" />;
    
    return <DataTable data={data} />;
}
```

### الـ Skeletons المتاحة:
- `TableSkeleton` — للجداول
- `CardSkeleton` — للبطاقات
- `KpiCardSkeleton` — للـ KPIs
- `PageSkeleton` — صفحة كاملة
- `FormSkeleton` — للنماذج
- `SkeletonBox`, `SkeletonRow`, `SkeletonCard` — primitives

### المتصفح:
- إظهار الـ Skeleton أثناء الـ loading
- منع layout shift
- تجربة سلسة

---

## 🎨 Theming

### الـ ThemeProvider:
```typescript
// components/theme/ThemeProvider.tsx
const themes = {
    light: { background: '#ffffff', foreground: '#000000', ... },
    dark: { background: '#0a0a0a', foreground: '#ffffff', ... },
    blue: { primary: '#0066cc', ... },
    green: { primary: '#10b981', ... }
};

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');
    // ...
}

export const useTheme = () => useContext(ThemeContext);
```

### الـ Themes (من `ThemeSwitcher.tsx`):
- Light
- Dark
- Blue (مالي)
- Green (صحي)
- Premium

---

## 🔔 Toast Notifications

### المكتبة: react-hot-toast + Custom Toast

### الاستخدام:
```typescript
import { useToast } from '@/components/Toast';

function MyComponent() {
    const toast = useToast();
    
    const handleSave = async () => {
        try {
            await save();
            toast.success('تم الحفظ بنجاح');
        } catch (e) {
            toast.error('فشل الحفظ: ' + e.message);
        }
    };
}
```

### الأنواع:
- `success` — أخضر
- `error` — أحمر
- `warning` — أصفر
- `info` — أزرق

---

## 🔍 Global Search

### المسار: `components/GlobalSearch.tsx`

### الميزات:
- Ctrl+K للفتح
- بحث في:
  - المنتجات
  - العملاء
  - الفواتير
  - الموظفين
  - الصفحات
- AI-powered (semantic search)
- recent searches
- يعرض النتائج فوراً

### الاختصار:
```typescript
useEffect(() => {
    const handleKeyDown = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setOpen(true);
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
}, []);
```

---

## 🛡 Guards & Protections

### GlobalAuthGuard:
```typescript
// يحمي المسارات بـ JWT check
export function GlobalAuthGuard({ children }) {
    const { data: session, isLoading } = useSession();
    
    if (isLoading) return <LoadingState />;
    if (!session) return <RedirectToLogin />;
    
    return <>{children}</>;
}
```

### SessionGuard:
- يلتقط 401 من الـ API
- يعيد التوجيه لـ login

### InactivityGuard:
- بعد 30 دقيقة بدون نشاط
- يطلب إعادة الدخول
- لمنع unauthorized access

### SubscriptionGuard:
- يتحقق من حالة الاشتراك
- إذا منتهي → /error/expired
- إذا suspended → blocked

---

## 🖼 Invoice Receipt Component

### `components/InvoiceReceipt.tsx` (827 سطر — الأكبر!)

### الميزات:
- طباعة الفواتير حسب صيغ متعددة:
  - A4 (للأعمال)
  - 80mm (Thermal printer للـ POS)
  - 58mm (Thermal printer صغير)
- ZATCA QR في المكان الصحيح
- العربي + الإنجليزي
- الشعار، التوقيع، الختم
- الإجماليات مفصلة
- المرتجعات
- Multi-currency

### الاستخدام:
```typescript
<InvoiceReceipt
    invoice={invoiceData}
    size="A4"  // أو "80mm" أو "58mm"
    showQR={true}
    showCompanyLogo={true}
    language="ar"
/>
```

---

## 🍽 Restaurant Floor Plan

### `components/pos/RestaurantFloorPlan.tsx` (262 سطر)

### الميزات:
- خريطة تفاعلية للطاولات
- Drag-drop لإعادة ترتيب الطاولات
- ألوان حسب الحالة:
  - 🟢 Available
  - 🔴 Occupied
  - 🟡 Reserved
  - 🔵 Cleaning
- النقر يفتح الطلب
- تعدد المناطق (Zones)

---

## 🎛 Sidebar (Mega Sidebar)

### `components/Sidebar.tsx` (1254 سطر — الأكبر مطلقاً!)

### السبب:
- يحتوي navigation لكل الـ 109 موديول
- Sub-menus لكل واحد
- Search داخل
- Icons لكل قسم
- يدعم Collapse/Expand
- Multi-level nesting

### النمط:
```typescript
const menuStructure = [
    {
        section: 'المحاسبة',
        icon: '💰',
        items: [
            { label: 'شجرة الحسابات', href: '/accounting/accounts' },
            { label: 'القيود اليومية', href: '/accounting/journal' },
            // ...
        ]
    },
    {
        section: 'المبيعات',
        icon: '🛒',
        items: [...]
    },
    // ...
];
```

---

## 🎨 Premium Design Patterns

### الـ Principles (من CLAUDE.md):
- ✅ ظلال خفيفة (Soft shadows)
- ✅ Border radius متناسق (rounded-lg, rounded-2xl)
- ✅ Spacing generous (padding: 4, gap: 6)
- ✅ Typography hierarchy واضحة
- ✅ Colors palette متناسقة
- ✅ Animations subtle (200-300ms)
- ✅ Hover states واضحة
- ❌ لا flat designs بدائية
- ❌ لا ألوان صارخة

### Tailwind Patterns:
```css
/* Card */
.card { @apply bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6; }

/* Button (Primary) */
.btn-primary { @apply bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors; }

/* Input */
.input { @apply w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent; }
```

---

## 📱 Mobile Layout

### `components/ui/mobile-layout.tsx` (118 سطر)

### الميزات:
- Bottom navigation
- Hamburger menu
- Swipe gestures
- Touch-friendly targets (44px minimum)
- Sticky header

### Breakpoints:
- **xs:** < 640px (mobile)
- **sm:** 640-768 (large mobile)
- **md:** 768-1024 (tablet)
- **lg:** 1024-1280 (laptop)
- **xl:** 1280+ (desktop)

---

## 🎬 Animation & Transitions

### النمط:
```typescript
// Framer Motion (إذا مُثبت)
import { motion } from 'framer-motion';

<motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
>
    {content}
</motion.div>
```

### Tailwind animations:
```css
/* Fade in */
.fade-in { @apply animate-fade-in; }

/* Slide in from right */
.slide-in { @apply animate-slide-in; }
```

---

## 🌐 RTL Support

### المبدأ:
- HTML `dir="rtl"` (تلقائي حسب اللغة)
- Tailwind RTL plugin
- CSS Logical Properties:
  - `ms-4` بدل `ml-4` (margin-inline-start)
  - `me-4` بدل `mr-4` (margin-inline-end)
  - `ps-4` بدل `pl-4` (padding-inline-start)
  - `pe-4` بدل `pr-4` (padding-inline-end)
  - `text-start` بدل `text-left`

### الـ Components:
- كلها تدعم RTL تلقائياً
- لا hardcoded directions

---

## 🎯 Best Practices

1. ✅ **Server Components** بشكل افتراضي
2. ✅ **`'use client'`** صراحة عند الحاجة
3. ✅ **React Hook Form + Zod** لكل النماذج
4. ✅ **TanStack Table** للجداول
5. ✅ **TanStack Query** للـ data fetching
6. ✅ **shadcn/ui patterns** بدلاً من library كاملة
7. ✅ **Skeletons** أثناء loading
8. ✅ **i18n + RTL** من البداية
9. ❌ **لا `any` types**
10. ❌ **لا inline styles** (استخدم Tailwind)
