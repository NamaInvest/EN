import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.ZEPTOMAIL_HOST || 'smtp.zeptomail.sa',
    port: Number(process.env.ZEPTOMAIL_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.ZEPTOMAIL_USER || 'emailapikey',
        pass: process.env.ZEPTOMAIL_PASS,
    },
});

const FROM = `"${process.env.EMAIL_FROM_NAME || 'نما انفست'}" <${process.env.EMAIL_FROM || 'noreply@namainvist.com'}>`;

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
    try {
        await transporter.sendMail({ from: FROM, to, subject, html, text });
        return true;
    } catch (err) {
        console.error('[Email] Failed to send:', err);
        return false;
    }
}

// ─── Template: Welcome ───────────────────────────────────────────────────────
export function welcomeEmailTemplate(fullName: string, username: string, password: string, systemUrl: string) {
    return {
        subject: `مرحباً في نما انفست - بيانات الدخول`,
        html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; direction: rtl; }
  .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 40px 32px; text-align: center; }
  .header h1 { color: #fff; margin: 0; font-size: 28px; font-weight: 700; }
  .header p { color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px; }
  .body { padding: 36px 32px; }
  .greeting { font-size: 18px; color: #1e293b; font-weight: 600; margin-bottom: 16px; }
  .info-box { background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0; }
  .info-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
  .info-row:last-child { border-bottom: none; }
  .info-label { color: #64748b; font-size: 14px; }
  .info-value { color: #1e293b; font-weight: 600; font-size: 15px; font-family: monospace; }
  .btn { display: block; text-align: center; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 16px; font-weight: 600; margin: 24px 0; }
  .footer { background: #f8fafc; padding: 20px 32px; text-align: center; color: #94a3b8; font-size: 12px; }
  .warning { background: #fef3c7; border-right: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; font-size: 14px; color: #92400e; margin-top: 16px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🚀 نما انفست</h1>
    <p>نظام إدارة الأعمال الذكي</p>
  </div>
  <div class="body">
    <div class="greeting">مرحباً ${fullName}! 👋</div>
    <p style="color:#475569;line-height:1.7">تم إنشاء حسابك في نظام نما انفست بنجاح. فيما يلي بيانات الدخول الخاصة بك:</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">🔗 رابط النظام</span>
        <span class="info-value">${systemUrl}</span>
      </div>
      <div class="info-row">
        <span class="info-label">👤 اسم المستخدم</span>
        <span class="info-value">${username}</span>
      </div>
      <div class="info-row">
        <span class="info-label">🔑 كلمة المرور</span>
        <span class="info-value">${password}</span>
      </div>
    </div>

    <a href="${systemUrl}" class="btn">تسجيل الدخول الآن →</a>

    <div class="warning">
      ⚠️ يُرجى تغيير كلمة المرور فور تسجيل الدخول لأول مرة لحماية حسابك.
    </div>
  </div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} نما انفست - جميع الحقوق محفوظة</p>
    <p>هذا البريد أُرسل تلقائياً، لا تقم بالرد عليه</p>
  </div>
</div>
</body>
</html>`,
    };
}

// ─── Template: Invoice ────────────────────────────────────────────────────────
export function invoiceEmailTemplate(customerName: string, invoiceNo: number, total: number, pdfUrl?: string) {
    return {
        subject: `فاتورة رقم #${invoiceNo} من نما انفست`,
        html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><style>
  body { font-family: 'Segoe UI',Arial,sans-serif; background:#f8fafc; margin:0; padding:20px; direction:rtl; }
  .container { max-width:600px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
  .header { background:linear-gradient(135deg,#10b981,#059669); padding:32px; text-align:center; }
  .header h1 { color:#fff; margin:0; font-size:24px; }
  .body { padding:32px; }
  .amount { font-size:36px; font-weight:800; color:#059669; text-align:center; margin:20px 0; }
  .btn { display:block; text-align:center; background:linear-gradient(135deg,#10b981,#059669); color:#fff !important; text-decoration:none; padding:14px 32px; border-radius:10px; font-size:16px; font-weight:600; margin:20px 0; }
  .footer { background:#f8fafc; padding:16px 32px; text-align:center; color:#94a3b8; font-size:12px; }
</style></head>
<body>
<div class="container">
  <div class="header"><h1>🧾 فاتورتك جاهزة!</h1></div>
  <div class="body">
    <p style="color:#475569">مرحباً ${customerName}،</p>
    <p style="color:#475569">يسعدنا إبلاغك بأنه تم إصدار الفاتورة رقم <strong>#${invoiceNo}</strong> باسمك.</p>
    <div class="amount">${total.toLocaleString('en-GB')} ر.س</div>
    ${pdfUrl ? `<a href="${pdfUrl}" class="btn">⬇️ تحميل الفاتورة</a>` : ''}
  </div>
  <div class="footer">© ${new Date().getFullYear()} نما انفست</div>
</div>
</body>
</html>`,
    };
}

// ─── Template: Password Reset ─────────────────────────────────────────────────
export function passwordResetTemplate(fullName: string, newPassword: string) {
    return {
        subject: `إعادة تعيين كلمة المرور - نما انفست`,
        html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><style>
  body { font-family:'Segoe UI',Arial,sans-serif; background:#f8fafc; margin:0; padding:20px; direction:rtl; }
  .container { max-width:600px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
  .header { background:linear-gradient(135deg,#f59e0b,#d97706); padding:32px; text-align:center; }
  .header h1 { color:#fff; margin:0; font-size:24px; }
  .body { padding:32px; }
  .pass-box { background:#fef3c7; border:2px dashed #f59e0b; border-radius:12px; padding:20px; text-align:center; margin:20px 0; }
  .pass-value { font-size:24px; font-weight:800; color:#92400e; letter-spacing:2px; font-family:monospace; }
  .footer { background:#f8fafc; padding:16px 32px; text-align:center; color:#94a3b8; font-size:12px; }
</style></head>
<body>
<div class="container">
  <div class="header"><h1>🔑 إعادة تعيين كلمة المرور</h1></div>
  <div class="body">
    <p style="color:#475569">مرحباً ${fullName}،</p>
    <p style="color:#475569">تم إعادة تعيين كلمة مرورك. كلمة المرور الجديدة هي:</p>
    <div class="pass-box"><div class="pass-value">${newPassword}</div></div>
    <p style="color:#ef4444;font-size:14px">⚠️ يُرجى تسجيل الدخول وتغيير كلمة المرور فوراً.</p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} نما انفست</div>
</div>
</body>
</html>`,
    };
}
