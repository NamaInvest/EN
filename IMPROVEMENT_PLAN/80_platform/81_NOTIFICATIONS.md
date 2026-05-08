# 81 — Notifications | نظام الإشعارات الموحّد

## 🟠 الأولوية: عالي

## 🔍 الموجود
- Email basic (nodemailer)
- WhatsApp جزئي (whatsapp-web.js)
- Telegram bot

## 🔴 الفجوات
- لا notification service موحّد
- لا في-app notifications
- لا push notifications (mobile/web)
- لا SMS
- لا templates management
- لا delivery tracking
- لا preferences per user

## 🎯 الخطة

### 81.1 — Unified Notification Service (8 أيام)
```typescript
export class NotificationService {
  async send(notification: {
    userId: string;
    template: string;       // 'invoice.created', 'payroll.run'
    variables: Record<string, any>;
    channels?: Channel[];   // ['email', 'whatsapp', 'in_app']
    priority?: 'low' | 'normal' | 'high' | 'critical';
  }): Promise<NotificationResult> {
    // 1. Resolve user preferences
    // 2. Resolve channels (per priority + preferences)
    // 3. Render templates per channel
    // 4. Queue for delivery
    // 5. Track results
  }
}
```

### 81.2 — Email (Resend / Postmark) (4 أيام)
- Templates (React Email)
- Bilingual
- Tracking (opens, clicks)
- Bounce handling
- Reply-to logic

### 81.3 — WhatsApp Business API (6 أيام)
- Migrate from whatsapp-web.js (unstable)
- Meta Cloud API
- Approved templates (per WhatsApp rules)
- Two-way messaging
- Media (PDF invoices)

### 81.4 — SMS (Unifonic / Tawk) (3 أيام)
- Saudi providers
- OTP delivery
- Critical alerts
- Cost-sensitive (use sparingly)

### 81.5 — Push Notifications (5 أيام)
- Web push (Service Worker)
- Mobile push (FCM / APNS)
- Desktop (Electron)
- Permission flow
- Quiet hours

### 81.6 — In-App Notifications (5 أيام)
- Bell icon with counter
- Center (read/unread)
- Action buttons (approve, view)
- Real-time delivery (WebSocket)
- Mark as read

### 81.7 — Telegram Bot (3 أيام)
- For CFO daily report
- Critical alerts
- Approval flows
- Status queries

### 81.8 — Templates Management (5 أيام)
```yaml
template: invoice.created
languages: [ar, en]
channels:
  email:
    subject: "فاتورة جديدة #{invoiceNo}"
    body: "..."
  whatsapp:
    template_id: "invoice_created_v1"
    variables: [invoiceNo, customerName, amount]
  sms:
    body: "Namasoft: فاتورة #{invoiceNo} - {amount} ريال"
  in_app:
    title: "فاتورة جديدة"
    body: "تم إنشاء فاتورة #{invoiceNo}"
    icon: "🧾"
    action_url: "/sales/invoices/{invoiceId}"
```

### 81.9 — User Preferences (3 أيام)
- Per-event preferences
- Per-channel mute
- Quiet hours
- Vacation mode
- Frequency caps

### 81.10 — Delivery Tracking + Analytics (4 أيام)
- Sent / Delivered / Read / Failed
- Bounce reasons
- Engagement metrics
- A/B testing templates

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Channels | 3 partial | 6 unified |
| Delivery rate | غير مقاس | > 95% |
| Engagement rate | غير مقاس | tracked |
| User opt-out rate | غير مقاس | < 10% |

## ⏱️ المدة: 46 يوم عمل
