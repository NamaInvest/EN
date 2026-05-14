# 44 - PWA والوقت الحقيقي (PWA & Real-time)

> Progressive Web App + Service Worker + Real-time Updates + Push Notifications

---

## 📱 PWA (Progressive Web App)

### الـ Library:
- `@ducanh2912/next-pwa` 10.2.9

### الـ Setup:
```typescript
// next.config.ts
import withPWA from '@ducanh2912/next-pwa';

const pwaConfig = withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching: [
        {
            urlPattern: /^https:\/\/namainvist\.com\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
                cacheName: 'api-cache',
                expiration: { maxAgeSeconds: 60 * 60 } // 1 hour
            }
        },
        {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: 'CacheFirst',
            options: {
                cacheName: 'image-cache',
                expiration: { maxAgeSeconds: 30 * 24 * 60 * 60 } // 30 days
            }
        }
    ]
});

export default pwaConfig(nextConfig);
```

### الـ Files المُولّدة:
```
public/
├── sw.js              ← Service Worker (مولّد)
├── pos-sw.js          ← SW خاص بـ POS (للـ offline)
├── pos-db.js          ← IndexedDB للـ POS
├── manifest.json      ← PWA Manifest
└── icons/             ← Icons بأحجام مختلفة
```

---

## 📋 PWA Manifest

### `src/app/manifest.ts`:
```typescript
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Nama Invest',
        short_name: 'NamaInvest',
        description: 'نظام ERP سعودي شامل',
        lang: 'ar',
        dir: 'rtl',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0066cc',
        orientation: 'portrait',
        scope: '/',
        icons: [
            { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
        ],
        shortcuts: [
            { name: 'POS', short_name: 'POS', url: '/pos', icons: [{ src: '/icons/pos.png', sizes: '96x96' }] },
            { name: 'المبيعات', short_name: 'مبيعات', url: '/sales' },
            { name: 'المخزون', short_name: 'مخزون', url: '/inventory' }
        ],
        screenshots: [
            { src: '/screenshots/dashboard.png', sizes: '1280x720', type: 'image/png' }
        ]
    };
}
```

---

## 🔧 Service Worker Strategies

### الـ Caching Strategies:

| Strategy | الاستخدام |
|---|---|
| **CacheFirst** | للأصول الثابتة (CSS, JS, Images) |
| **NetworkFirst** | للـ APIs (يفضل fresh) |
| **StaleWhileRevalidate** | للصفحات (سرعة + freshness) |
| **NetworkOnly** | للعمليات الحساسة (payments) |
| **CacheOnly** | للوضع offline |

### الـ Setup الفعلي:
```javascript
// public/sw.js (مولّد بـ next-pwa)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('static-v1').then((cache) => {
            return cache.addAll([
                '/',
                '/manifest.json',
                '/icons/icon-192x192.png',
                // ...
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('/api/')) {
        event.respondWith(networkFirst(event.request));
    } else {
        event.respondWith(cacheFirst(event.request));
    }
});
```

---

## 🛒 POS Offline Mode

### `public/pos-sw.js` + `public/pos-db.js`:

```javascript
// pos-db.js — IndexedDB للـ offline POS
const DB_NAME = 'namasoft-pos-offline';
const DB_VERSION = 1;

async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Stores:
            db.createObjectStore('products', { keyPath: 'id' });
            db.createObjectStore('customers', { keyPath: 'id' });
            db.createObjectStore('pending-invoices', { keyPath: 'id', autoIncrement: true });
            db.createObjectStore('sessions', { keyPath: 'id' });
        };
        
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

// عند الـ POS sale:
async function saveInvoiceOffline(invoice) {
    const db = await openDB();
    const tx = db.transaction('pending-invoices', 'readwrite');
    await tx.objectStore('pending-invoices').add(invoice);
    
    // عند الاتصال: sync
    self.registration.sync.register('sync-pending-invoices');
}
```

### الـ Background Sync:
```javascript
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-pending-invoices') {
        event.waitUntil(syncPendingInvoices());
    }
});

async function syncPendingInvoices() {
    const db = await openDB();
    const tx = db.transaction('pending-invoices', 'readwrite');
    const store = tx.objectStore('pending-invoices');
    const invoices = await store.getAll();
    
    for (const invoice of invoices) {
        try {
            await fetch('/api/pos/invoices', {
                method: 'POST',
                body: JSON.stringify(invoice)
            });
            
            // نجح → احذف من الـ pending
            await store.delete(invoice.id);
        } catch (e) {
            // فشل → ابقى للمحاولة لاحقاً
            console.error('Sync failed for', invoice.id);
        }
    }
}
```

---

## 📲 Install Prompt

### Custom Prompt:
```typescript
'use client';
import { useEffect, useState } from 'react';

let deferredPrompt: any;

export function InstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false);
    
    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            deferredPrompt = e;
            setShowPrompt(true);
        };
        
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);
    
    const handleInstall = async () => {
        if (!deferredPrompt) return;
        
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        
        if (result.outcome === 'accepted') {
            console.log('PWA installed');
        }
        
        setShowPrompt(false);
        deferredPrompt = null;
    };
    
    if (!showPrompt) return null;
    
    return (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg">
            <p>تثبيت Nama Invest على جهازك؟</p>
            <button onClick={handleInstall}>تثبيت</button>
            <button onClick={() => setShowPrompt(false)}>لاحقاً</button>
        </div>
    );
}
```

---

## 🔔 Push Notifications

### الـ Setup (إذا مفعّل):
```typescript
// طلب الإذن
async function requestNotificationPermission() {
    if (!('Notification' in window)) return false;
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;
    
    // Subscribe
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
    });
    
    // Save subscription
    await fetch('/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription)
    });
    
    return true;
}
```

### الـ Backend Push:
```typescript
import webpush from 'web-push';

webpush.setVapidDetails(
    'mailto:support@namainvist.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

async function sendPush(userId: number, payload: any) {
    const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId, active: true }
    });
    
    for (const sub of subscriptions) {
        try {
            await webpush.sendNotification(
                JSON.parse(sub.subscription),
                JSON.stringify(payload)
            );
        } catch (e) {
            // failed → mark inactive
            if (e.statusCode === 410) {
                await prisma.pushSubscription.update({
                    where: { id: sub.id },
                    data: { active: false }
                });
            }
        }
    }
}
```

### الـ Service Worker Handler:
```javascript
self.addEventListener('push', (event) => {
    const data = event.data.json();
    
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge.png',
            data: data.url
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data || '/')
    );
});
```

---

## ⚡ Real-time Updates

### الـ Options:
1. **Polling** (الأبسط) — React Query refetchInterval
2. **WebSockets** — للـ chat والـ realtime
3. **Server-Sent Events (SSE)** — للـ one-way streaming
4. **Webhooks** — للـ async events

### Current Implementation: Polling

```typescript
// مثال:
const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => fetch('/api/notifications').then(r => r.json()),
    refetchInterval: 30 * 1000  // كل 30 ثانية
});
```

### الـ Future: WebSockets (مقترح)
- للـ chat
- للـ real-time dashboards
- للـ POS sync بين الـ terminals
- المكتبة المقترحة: Socket.io أو ws

---

## 🌐 Offline-First Strategy

### المبادئ:
1. **Cache static assets** أولاً
2. **IndexedDB للـ data** (POS, draft invoices)
3. **Background Sync** عند العودة للإنترنت
4. **Optimistic Updates** في الـ UI
5. **Conflict Resolution** عند الـ sync

### مثال POS Offline:
```
1. الإنترنت متاح:
   - Sales fetched من API
   - يُحفظ في IndexedDB

2. الإنترنت يقطع:
   - الـ POS يكمل العمل
   - يقرأ من IndexedDB
   - يحفظ الفواتير الجديدة في 'pending-invoices'
   - UI يعرض "Offline Mode"

3. عودة الإنترنت:
   - Background Sync يرسل pending invoices
   - تحديث الـ IndexedDB
   - UI يعود "Online"
```

---

## 📊 Real-time Notifications

### النماذج:
```prisma
Notification {
    userId, type
    title, body
    read, readAt
    actionUrl
    createdAt
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}

PushSubscription {
    userId
    subscription: Json  // PushSubscription object
    active
    createdAt, lastUsedAt
}
```

### Notification Types:
- `APPROVAL_REQUEST` — موافقة مطلوبة
- `INVOICE_OVERDUE` — فاتورة متأخرة
- `STOCK_LOW` — مخزون منخفض
- `CHEQUE_BOUNCED` — شيك ارتد
- `PAYROLL_DUE` — وقت الرواتب
- `BACKUP_FAILED` — فشل النسخة الاحتياطية
- `ZATCA_REJECTED` — رفض ZATCA
- `SUBSCRIPTION_EXPIRING` — اشتراك ينتهي
- `LOGIN_NEW_DEVICE` — دخول من جهاز جديد

### الـ Delivery Channels:
- 🔔 In-app (دائماً)
- 📧 Email (إذا critical)
- 💬 WhatsApp (إذا high priority)
- 📱 Push Notification
- 📞 Telegram (للـ admins)

---

## 🌐 Updates System

### `src/app/updates/` و `public/updates/`:
- صفحة لعرض التحديثات
- For desktop app: تنزيل installer جديد
- For web app: cache invalidation

### الـ Flow:
```
1. Master Owner ينشر تحديثاً
2. النظام يحدّث:
   - latest.yml (للـ Electron auto-updater)
   - service worker cache
3. المستخدمون يستلمون:
   - Banner: "تحديث متاح!"
   - عند الضغط: إعادة تحميل + تحديث الـ cache
```

---

## 🎯 Best Practices

1. ✅ **Cache strategically** (لا تكش كل شيء)
2. ✅ **Network First** للـ APIs
3. ✅ **Cache First** للأصول الثابتة
4. ✅ **Offline UX clear** (banner واضح)
5. ✅ **Background Sync** للـ queued operations
6. ✅ **Conflict Resolution** واضح
7. ✅ **Push Notifications** مع opt-in
8. ❌ **لا cache** للـ payment endpoints
9. ❌ **لا offline** للعمليات الحساسة (transfers, approvals)
10. ✅ **Test offline mode** بانتظام
