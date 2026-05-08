# 86 — Mobile & PWA | تطبيقات الجوال

## 🟠 الأولوية: عالي

## 🔍 الموجود
- @ducanh2912/next-pwa configured
- بسيط

## 🔴 الفجوات
- لا offline support حقيقي
- لا native apps (iOS/Android)
- لا mobile-specific features (camera, biometric)

## 🎯 الخطة

### 86.1 — PWA Optimization (5 أيام)
- Manifest.json complete
- Service Worker مع caching strategies
- Install prompts
- App icons (all sizes)
- Splash screens
- Push notifications (web push)

### 86.2 — Offline Mode (10 أيام)
**For POS especially:**
- IndexedDB (Dexie.js) for local storage
- Queue actions when offline
- Sync when online
- Conflict resolution
- Visual offline indicator
- Cached read access

```typescript
// Queue strategy
class OfflineQueue {
  async addToQueue(action: PendingAction): Promise<void>;
  async sync(): Promise<SyncResult>;
  async resolveConflict(local, remote): Promise<Resolution>;
}
```

### 86.3 — Mobile-First UI (8 أيام)
- Touch-optimized buttons (44×44 min)
- Swipe gestures
- Pull-to-refresh
- Bottom navigation
- Mobile-specific layouts
- Reduce text input (use selects)

### 86.4 — Native Apps (React Native) (30 أيام)
**Or simpler: Capacitor / Tauri Mobile**
- iOS app (App Store)
- Android app (Google Play + Huawei AppGallery للسعودية)
- Same codebase as web
- Native features access

### 86.5 — Mobile Features (8 أيام)
- Camera (للـ OCR، QR scanning)
- Biometric authentication (Face ID, Touch ID)
- Push notifications
- Geolocation (geofence attendance)
- File system (local storage)
- Background sync
- Native sharing

### 86.6 — Mobile-Specific Features (10 أيام)
- POS terminal mode (focused UI)
- Field sales (for sales reps on the road)
- Manager approvals (one-tap approve)
- Time tracking (clock-in/out)
- Inventory checking (barcode scanner)
- Customer signature capture

### 86.7 — App Store Optimization (5 أيام)
- Screenshots (per device size)
- Description (Arabic + English)
- Keywords
- Reviews management
- A/B testing

### 86.8 — Device Compatibility (4 أيام)
- iOS 14+ (last 4 versions)
- Android 8+
- Tablets (iPad, Galaxy Tab)
- Foldables (Z Flip/Fold)

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Mobile usage % | غير مقاس | tracked |
| Offline reliability | لا | 100% POS |
| App store rating | لا | > 4.5 |
| Mobile conversion | غير مقاس | tracked |

## ⏱️ المدة: 80 يوم عمل (شامل native apps)
