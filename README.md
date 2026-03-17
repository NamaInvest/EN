# نما سوفت — نظام نقاط البيع والمحاسبة
# NamaSoft — POS & Accounting System

## المتطلبات | Requirements

| المكون | الإصدار |
|--------|---------|
| Node.js | 18+ |
| PostgreSQL | 14+ |
| npm | 9+ |
| OpenSSL | (للربط مع ZATCA) |

## المكتبات الرئيسية | Dependencies

| المكتبة | الوصف |
|---------|-------|
| `next` 16.x | React Framework |
| `react` 19.x | UI Library |
| `@prisma/client` | ORM لقاعدة البيانات |
| `bcryptjs` | تشفير كلمات المرور |
| `jsonwebtoken` | JWT للمصادقة |
| `qrcode` | توليد باركود QR |
| `zatca-xml-js` | ربط ZATCA المرحلة الثانية |
| `recharts` | رسوم بيانية |
| `jspdf` | تصدير PDF |
| `xlsx` | تصدير Excel |
| `tesseract.js` | OCR للفواتير |
| `date-fns` | معالجة التواريخ |

---

## التثبيت على سيرفر Ubuntu/Debian

### 1. تجهيز السيرفر
```bash
# تحديث النظام
apt update && apt upgrade -y

# تثبيت Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# تثبيت PostgreSQL
apt install -y postgresql postgresql-contrib

# تثبيت PM2 (مدير العمليات)
npm install -g pm2
```

### 2. إعداد قاعدة البيانات
```bash
# دخول PostgreSQL
sudo -u postgres psql

# إنشاء مستخدم وقاعدة بيانات
CREATE USER namasoft WITH PASSWORD 'كلمة_سر_قوية';
CREATE DATABASE namadb OWNER namasoft;
GRANT ALL PRIVILEGES ON DATABASE namadb TO namasoft;
\q
```

### 3. نسخ المشروع وتثبيت المكتبات
```bash
# نسخ المشروع من GitHub
cd /var/www
git clone https://github.com/iceman18ice-sketch/namasoft9-3.git namasoft
cd namasoft

# تثبيت المكتبات
npm install

# تثبيت مكتبات ZATCA (اختياري)
npm install qrcode zatca-xml-js
```

### 4. إعداد ملف البيئة
```bash
# إنشاء ملف .env
cat > .env << 'EOF'
DATABASE_URL="postgresql://namasoft:كلمة_سر_قوية@localhost:5432/namadb"
JWT_SECRET="مفتاح-سري-طويل-وعشوائي"
NODE_ENV=production
EOF
```

### 5. إعداد قاعدة البيانات والجداول
```bash
# إنشاء الجداول من Prisma Schema
npx prisma db push

# توليد Prisma Client
npx prisma generate

# إضافة البيانات الأساسية (إذا يوجد ملف seed)
npx tsx prisma/seed.ts

# إنشاء جدول ZATCA (اختياري)
psql "postgresql://namasoft:كلمة_سر_قوية@localhost:5432/namadb" -c "
CREATE TABLE IF NOT EXISTS zatca_settings (
    id SERIAL PRIMARY KEY,
    seller_name VARCHAR(300), seller_name_ar VARCHAR(300),
    seller_name_en VARCHAR(300) DEFAULT '', tax_number VARCHAR(30),
    commercial_reg VARCHAR(30), cr_number TEXT DEFAULT '',
    street VARCHAR(200), district VARCHAR(200), city VARCHAR(100),
    city_en VARCHAR(100) DEFAULT '', postal_code VARCHAR(10),
    building_number VARCHAR(20), country VARCHAR(10) DEFAULT 'SA',
    invoice_type VARCHAR(20) DEFAULT 'simplified', phase INTEGER DEFAULT 1,
    invoice_type_code VARCHAR(10) DEFAULT '1100', certificate TEXT,
    private_key TEXT, csid TEXT, csid_secret TEXT,
    zatca_compliance_token TEXT, zatca_compliance_secret TEXT,
    zatca_compliance_request_id TEXT, production_csid TEXT,
    production_secret TEXT, zatca_production_token TEXT,
    zatca_production_secret TEXT,
    onboarding_status VARCHAR(30) DEFAULT 'disconnected',
    environment VARCHAR(20) DEFAULT 'sandbox',
    phone TEXT DEFAULT '', email TEXT DEFAULT '',
    branch_name VARCHAR(200) DEFAULT '', branch_name_ar VARCHAR(200) DEFAULT '',
    industry_category VARCHAR(100) DEFAULT 'Medical',
    location_address VARCHAR(50) DEFAULT '',
    egs_serial_number VARCHAR(200) DEFAULT '',
    last_invoice_hash TEXT DEFAULT '', invoice_counter INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);"
```

### 6. بناء وتشغيل المشروع
```bash
# بناء المشروع
npm run build

# تشغيل بـ PM2
pm2 start npm --name "namasoft" -- start
pm2 save
pm2 startup
```

### 7. إعداد Nginx (اختياري — لدومين مخصص)
```bash
apt install -y nginx

cat > /etc/nginx/sites-available/namasoft << 'EOF'
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/namasoft /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx
```

---

## الدخول للنظام

بعد التشغيل، افتح المتصفح على `http://IP_السيرفر:3000`

**بيانات الدخول الافتراضية:**
- اسم المستخدم: `admin`
- كلمة المرور: `admin`

> ⚠️ غيّر كلمة المرور فوراً من الإعدادات!

---

## أوامر مفيدة

| الأمر | الوصف |
|-------|-------|
| `pm2 restart namasoft` | إعادة تشغيل |
| `pm2 logs namasoft` | عرض السجلات |
| `pm2 status` | حالة التطبيق |
| `npx prisma studio` | واجهة قاعدة البيانات |
| `npm run build` | إعادة بناء |

---

## الميزات الرئيسية

- 🧾 نقاط البيع (POS) مع باركود
- 📊 لوحة تحكم ورسوم بيانية
- 🏭 إدارة المخزون والمنتجات
- 👥 العملاء والموردين
- 💰 الخزينة والمصروفات
- 📋 الحجوزات والصيانة
- 👨‍💼 الموظفين والرواتب والإجازات
- 🔐 نظام صلاحيات متقدم
- 🌐 ربط ZATCA المرحلة الثانية
- 📱 تصدير PDF و Excel
- 🔒 جلسة واحدة لكل مستخدم
