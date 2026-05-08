# 83 — Real-time | اللحظي

## 🟡 الأولوية: متوسط

## 🎯 الفجوات
- لا live updates
- لا collaborative editing
- لا presence indicators

## 🎯 الخطة

### 83.1 — Real-time Stack (3 أيام)
**Options:**
- **Pusher / Ably** (managed, $$)
- **Socket.io** (self-host)
- **Supabase Realtime** (Postgres-based)
- **SSE** (للحالات البسيطة)

**التوصية:** Socket.io للبدء، ثم migration لو زاد load.

### 83.2 — Use Cases (5 أيام design)
- POS: متاح/مشغول/مغلق
- Inventory: stock levels live
- Approvals: instant notification
- Dashboard KPIs: auto-refresh
- Chat / Copilot: streaming
- Collaborative editing (rare)
- Presence (من online، من يحرّر هذا الـ document)

### 83.3 — WebSocket Server (5 أيام)
```typescript
import { Server } from 'socket.io';

const io = new Server({
  cors: { origin: process.env.APP_URL },
  transports: ['websocket'],
});

io.use(authenticateSocket);  // JWT verification

io.on('connection', (socket) => {
  socket.join(`tenant:${socket.user.tenantId}`);
  socket.join(`user:${socket.user.id}`);

  socket.on('subscribe', (channel) => {
    if (canSubscribe(socket.user, channel)) {
      socket.join(channel);
    }
  });
});

// Publish from anywhere
io.to(`tenant:${tenantId}`).emit('invoice.created', { invoiceId });
```

### 83.4 — Server-Sent Events (3 أيام)
For one-way streaming (LLM responses, long-running operations):
```typescript
export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of llm.stream(prompt)) {
        controller.enqueue(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

### 83.5 — Frontend Integration (4 أيام)
```typescript
// React hooks
const { data, isConnected } = useRealtime('invoices', {
  onUpdate: (invoice) => {
    queryClient.setQueryData(['invoices', invoice.id], invoice);
  },
});
```

### 83.6 — Presence Indicators (3 أيام)
- Show who's online
- Show who's editing this document
- Avatars in real-time

### 83.7 — Optimistic Updates (3 أيام)
- Update UI immediately
- Rollback on server rejection
- Conflict resolution

### 83.8 — Scaling (4 أيام)
- Redis adapter for multi-server
- Sticky sessions
- Connection pooling
- Rate limiting per user

## 📊 KPIs
| KPI | قبل | بعد |
|-----|-----|-----|
| Real-time channels | 0 | 10+ |
| Latency p95 | لا | < 100ms |
| Concurrent connections | لا | thousands |

## ⏱️ المدة: 30 يوم عمل
