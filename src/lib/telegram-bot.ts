import prisma from './prisma';

export async function getBotToken() {
    const setting = await prisma.setting.findUnique({ where: { key: 'telegram_bot_token' } });
    return setting?.value || process.env.TELEGRAM_BOT_TOKEN || '';
}

async function getAPI() {
    const token = await getBotToken();
    return `https://api.telegram.org/bot${token}`;
}

// ─── Send message to Telegram ───
export async function sendMessage(chatId: number, text: string, parseMode = 'HTML') {
    const api = await getAPI();
    await fetch(`${api}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
    });
}

// ─── Extract number from Arabic text ───
function extractNumber(text: string): number {
    const arabicDigits: Record<string, string> = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
    let cleaned = text;
    for (const [ar, en] of Object.entries(arabicDigits)) cleaned = cleaned.replace(new RegExp(ar, 'g'), en);

    const wordNums: Record<string, number> = {
        'صفر': 0, 'واحد': 1, 'اثنين': 2, 'ثلاث': 3, 'اربع': 4, 'أربع': 4, 'خمس': 5,
        'ست': 6, 'سبع': 7, 'ثمان': 8, 'تسع': 9, 'عشر': 10, 'عشرين': 20, 'ثلاثين': 30,
        'اربعين': 40, 'أربعين': 40, 'خمسين': 50, 'ستين': 60, 'سبعين': 70, 'ثمانين': 80, 'تسعين': 90,
        'مية': 100, 'مئة': 100, 'ميتين': 200, 'مئتين': 200, 'ثلاثمية': 300, 'اربعمية': 400, 'خمسمية': 500,
        'الف': 1000, 'ألف': 1000, 'الفين': 2000, 'ألفين': 2000,
    };

    for (const [word, num] of Object.entries(wordNums)) {
        if (cleaned.includes(word)) {
            if (cleaned.includes('الاف') || cleaned.includes('آلاف') || cleaned.includes('الف')) {
                const beforeAlf = cleaned.split(/الاف|آلاف|ألاف/)[0].trim();
                for (const [w, n] of Object.entries(wordNums)) {
                    if (beforeAlf.includes(w) && n < 100) return n * 1000;
                }
            }
            return num;
        }
    }

    const match = cleaned.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
}

function fmt(n: number): string {
    return n.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function getSalesToday(): Promise<string> {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sales = await prisma.salesInvoice.findMany({ where: { date: { gte: today } } });
    const totalAmount = sales.reduce((s, i) => s + (i.total || 0), 0);
    return `📊 <b>مبيعات اليوم</b>\n\n📄 عدد الفواتير: <b>${sales.length}</b>\n💰 إجمالي المبيعات: <b>${fmt(totalAmount)} ر.س</b>`;
}

async function getSalesMonth(): Promise<string> {
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    const sales = await prisma.salesInvoice.findMany({ where: { date: { gte: start } } });
    const totalAmount = sales.reduce((s, i) => s + (i.total || 0), 0);
    return `📊 <b>مبيعات الشهر</b>\n\n📄 عدد الفواتير: <b>${sales.length}</b>\n💰 الإجمالي: <b>${fmt(totalAmount)} ر.س</b>`;
}

async function getTreasuryBalance(): Promise<string> {
    const entries = await prisma.treasury.findMany();
    const balance = entries.reduce((s, e) => s + (e.type === 'in' ? e.amount : -e.amount), 0);
    return `🏦 <b>رصيد الخزينة</b>\n\n💰 الرصيد الحالي: <b>${fmt(balance)} ر.س</b>`;
}

async function getLowStock(): Promise<string> {
    const products = await prisma.product.findMany({
        where: { currentStock: { lt: 5 } }, orderBy: { currentStock: 'asc' }, take: 20,
    });
    if (products.length === 0) return '✅ <b>المخزون ممتاز!</b>\nلا توجد أصناف ناقصة';
    let msg = `⚠️ <b>أصناف ناقصة (مخزون أقل من 5)</b>\n\n`;
    products.forEach(p => { msg += `• ${p.name}: <b>${p.currentStock || 0}</b> ${(p.currentStock || 0) === 0 ? '🔴' : '🟡'}\n`; });
    return msg;
}

async function getProductCount(): Promise<string> {
    return `📦 <b>عدد المنتجات:</b> ${await prisma.product.count()}`;
}

async function getCustomerCount(): Promise<string> {
    return `👥 <b>عدد العملاء والموردين:</b> ${await prisma.customer.count()}`;
}

async function getEmployeeCount(): Promise<string> {
    return `👷 <b>عدد الموظفين:</b> ${await prisma.employee.count()}`;
}

async function getUsersList(): Promise<string> {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const users = await prisma.user.findMany({
        include: { permissions: true, salesInvoices: { where: { date: { gte: today } } } },
        orderBy: { id: 'asc' },
    });
    if (users.length === 0) return '❌ لا يوجد مستخدمين';
    const roleMap: Record<string, string> = { admin: '👑 مدير', cashier: '💰 كاشير', accountant: '📊 محاسب', data_entry: '📝 مدخل بيانات' };
    let msg = `👥 <b>المستخدمين (${users.length})</b>\n━━━━━━━━━━━━━━━━━━\n\n`;
    users.forEach(u => {
        const role = roleMap[u.role] || u.role;
        const salesToday = u.salesInvoices.reduce((s, i) => s + (i.total || 0), 0);
        msg += `${u.active ? '🟢' : '🔴'} <b>${u.fullName}</b> (@${u.username})\n`;
        msg += `   ${role} | صلاحيات: ${u.permissions.length > 0 ? u.permissions.length + ' قسم' : 'كاملة'}\n`;
        if (u.salesInvoices.length > 0) msg += `   📊 مبيعات اليوم: <b>${u.salesInvoices.length}</b> فاتورة | <b>${fmt(salesToday)} ر.س</b>\n`;
        msg += `\n`;
    });
    return msg;
}

async function getUserSales(username: string): Promise<string> {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const user = await prisma.user.findFirst({
        where: { OR: [{ username: { contains: username } }, { fullName: { contains: username } }] },
        include: { salesInvoices: { where: { date: { gte: monthStart } } } },
    });
    if (!user) return `❌ لم يتم العثور على مستخدم بهذا الاسم: ${username}`;
    const salesToday = user.salesInvoices.filter(s => s.date >= today);
    const todayTotal = salesToday.reduce((s, i) => s + (i.total || 0), 0);
    const monthTotal = user.salesInvoices.reduce((s, i) => s + (i.total || 0), 0);
    return `👤 <b>تقرير المستخدم: ${user.fullName}</b>\n━━━━━━━━━━━━━━━━━━\n\n` +
        `📊 مبيعات اليوم: <b>${salesToday.length}</b> فاتورة | <b>${fmt(todayTotal)} ر.س</b>\n` +
        `📈 مبيعات الشهر: <b>${user.salesInvoices.length}</b> فاتورة | <b>${fmt(monthTotal)} ر.س</b>\n`;
}

async function getExpensesToday(): Promise<string> {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const expenses = await prisma.expense.findMany({ where: { date: { gte: today } } });
    const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    return `💸 <b>مصروفات اليوم</b>\n\n📄 عدد: <b>${expenses.length}</b>\n💰 الإجمالي: <b>${fmt(total)} ر.س</b>`;
}

async function getTopProducts(): Promise<string> {
    const d = new Date(); d.setDate(d.getDate() - 30);
    const details = await prisma.salesInvoiceDetail.findMany({ where: { invoice: { date: { gte: d } } } });
    const map = new Map<string, number>();
    details.forEach(d => { map.set(d.productName || 'غير معروف', (map.get(d.productName || 'غير معروف') || 0) + (d.quantity || 0)); });
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (sorted.length === 0) return '📊 لا توجد مبيعات في آخر 30 يوم';
    let msg = `🏆 <b>أعلى 10 منتجات مبيعاً (آخر 30 يوم)</b>\n\n`;
    sorted.forEach(([name, qty], i) => { msg += `${i + 1}. ${name}: <b>${qty}</b>\n`; });
    return msg;
}

async function addPurchase(amount: number): Promise<string> {
    if (amount <= 0) return '❌ المبلغ غير صحيح';
    const tax = amount * 0.15;
    const count = await prisma.purchaseInvoice.count();
    await prisma.purchaseInvoice.create({
        data: { invoiceNo: count + 1, date: new Date(), subtotal: amount, discountRate: 0, discountValue: 0, taxValue: tax, total: amount + tax, paymentType: 'cash', paid: amount + tax, remaining: 0, notes: 'تم الإضافة عبر بوت تلجرام' },
    });
    await prisma.treasury.create({
        data: { type: 'out', amount: amount + tax, description: `مشتريات #${count + 1} (تلجرام)`, referenceType: 'purchase', date: new Date() },
    });
    return `✅ <b>تم تسجيل مشتريات</b>\n\n💰 المبلغ: <b>${fmt(amount)} ر.س</b>\n📊 الضريبة: <b>${fmt(tax)} ر.س</b>\n📋 الإجمالي: <b>${fmt(amount + tax)} ر.س</b>\n📄 فاتورة رقم: <b>#${count + 1}</b>`;
}

async function addExpense(amount: number, description: string): Promise<string> {
    if (amount <= 0) return '❌ المبلغ غير صحيح';
    await prisma.expense.create({ data: { amount, description: description || 'مصروف عبر تلجرام', date: new Date() } });
    await prisma.treasury.create({ data: { type: 'out', amount, description: `مصروف: ${description || 'عام'} (تلجرام)`, referenceType: 'expense', date: new Date() } });
    return `✅ <b>تم تسجيل مصروف</b>\n\n💰 المبلغ: <b>${fmt(amount)} ر.س</b>\n📝 الوصف: ${description || 'مصروف عام'}`;
}

async function getDailyReport(): Promise<string> {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sales = await prisma.salesInvoice.findMany({ where: { date: { gte: today } } });
    const salesTotal = sales.reduce((s, i) => s + (i.total || 0), 0);
    const purchases = await prisma.purchaseInvoice.findMany({ where: { date: { gte: today } } });
    const purchasesTotal = purchases.reduce((s, i) => s + (i.total || 0), 0);
    const expenses = await prisma.expense.findMany({ where: { date: { gte: today } } });
    const expensesTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const lowStock = await prisma.product.count({ where: { currentStock: { lt: 5 } } });
    const entries = await prisma.treasury.findMany();
    const balance = entries.reduce((s, e) => s + (e.type === 'in' ? e.amount : -e.amount), 0);
    return `📋 <b>التقرير اليومي</b> - ${new Date().toLocaleDateString('ar-SA')}\n━━━━━━━━━━━━━━━━━━\n` +
        `🧾 المبيعات: <b>${sales.length}</b> فاتورة | <b>${fmt(salesTotal)} ر.س</b>\n` +
        `📦 المشتريات: <b>${purchases.length}</b> فاتورة | <b>${fmt(purchasesTotal)} ر.س</b>\n` +
        `💸 المصروفات: <b>${expenses.length}</b> | <b>${fmt(expensesTotal)} ر.س</b>\n━━━━━━━━━━━━━━━━━━\n` +
        `📊 صافي اليوم: <b>${fmt(salesTotal - purchasesTotal - expensesTotal)} ر.س</b>\n` +
        `🏦 رصيد الخزينة: <b>${fmt(balance)} ر.س</b>\n` +
        `⚠️ أصناف ناقصة: <b>${lowStock}</b>`;
}

// ─── Main Command Router ───
export async function processMessage(text: string): Promise<string> {
    const t = text.trim().toLowerCase();

    if (t === '/start' || t === '/help' || t.includes('مساعد') || t.includes('الأوامر') || t.includes('اوامر')) {
        return `🤖 <b>مرحباً بك في بوت نما سوفت!</b>\n\n📊 <b>الاستفسارات:</b>\n• مبيعات اليوم\n• مبيعات الشهر\n• مصروفات اليوم\n• رصيد الخزينة\n• المخزون الناقص\n• أعلى المنتجات مبيعاً\n• عدد المنتجات\n• عدد العملاء\n• عدد الموظفين\n• تقرير يومي\n\n👥 <b>المستخدمين:</b>\n• المستخدمين\n• مبيعات [اسم]\n\n✍️ <b>العمليات:</b>\n• مشتريات 10000\n• مصروف 500 إيجار`;
    }
    if ((t.includes('مبيعات') || t.includes('بيع')) && (t.includes('اليوم') || t.includes('يوم'))) return await getSalesToday();
    if ((t.includes('مبيعات') || t.includes('بيع')) && (t.includes('شهر') || t.includes('الشهر'))) return await getSalesMonth();
    if (t.includes('خزينة') || t.includes('رصيد') || t.includes('الخزنة') || t.includes('الرصيد')) return await getTreasuryBalance();
    if (t.includes('ناقص') || t.includes('نقص') || (t.includes('مخزون') && (t.includes('قليل') || t.includes('ناقص') || t.includes('نفذ')))) return await getLowStock();
    if (t.includes('أعلى') || t.includes('اعلى') || t.includes('أكثر') || t.includes('اكثر') || t.includes('ترتيب')) return await getTopProducts();
    if (t.includes('منتج') && (t.includes('كم') || t.includes('عدد'))) return await getProductCount();
    if ((t.includes('عميل') || t.includes('عملاء') || t.includes('زبون')) && (t.includes('كم') || t.includes('عدد'))) return await getCustomerCount();
    if ((t.includes('موظف') || t.includes('موظفين')) && (t.includes('كم') || t.includes('عدد'))) return await getEmployeeCount();
    if (t.includes('مستخدم') || t.includes('مستخدمين') || t === '/users') return await getUsersList();
    if (t.includes('مبيعات') && !t.includes('اليوم') && !t.includes('شهر') && !t.includes('يوم')) {
        const name = t.replace(/مبيعات/g, '').trim();
        if (name.length > 0) return await getUserSales(name);
    }
    if (t.includes('مصروف') && (t.includes('اليوم') || t.includes('يوم'))) return await getExpensesToday();
    if (t.includes('تقرير') || t.includes('ملخص') || (t.includes('اليوم') && !t.includes('مبيعات') && !t.includes('مصروف'))) return await getDailyReport();
    if (t.includes('مشتريات') || t.includes('شراء') || t.includes('اشتري')) {
        const amount = extractNumber(t);
        if (amount > 0) return await addPurchase(amount);
        return '❓ حدد المبلغ. مثال: <b>مشتريات 10000</b>';
    }
    if (t.includes('مصروف') || t.includes('صرف') || t.includes('سدد')) {
        const amount = extractNumber(t);
        const desc = t.replace(/[\d,\.]+/g, '').replace(/مصروف|صرف|سدد|ريال|ر\.س/g, '').trim();
        if (amount > 0) return await addExpense(amount, desc);
        return '❓ حدد المبلغ. مثال: <b>مصروف 500 إيجار</b>';
    }
    if (t.includes('مخزون') || t.includes('بضاعة') || t.includes('ستوك')) return await getLowStock();
    return `❓ لم أفهم الأمر.\n\nأرسل <b>/help</b> لعرض الأوامر المتاحة.`;
}
