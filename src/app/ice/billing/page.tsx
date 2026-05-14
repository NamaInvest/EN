import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { CreditCard, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'ICE - الاشتراكات والمدفوعات',
};

/**
 * @description
 * Billing management page for ICE Super Admin.
 * Displays all invoices, subscriptions, and their payment statuses.
 */
export default async function BillingPage() {
  let invoices: any[] = [];
  
  try {
    invoices = await prisma.iceSubscriptionInvoice.findMany({
      include: {
        subscription: {
          include: { plan: true }
        }
      },
      orderBy: { issueDate: 'desc' },
      take: 50
    });
  } catch (error) {
    console.warn("Failed to fetch invoices.", error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#14161c] p-6 rounded-2xl border border-white/5 shadow-lg">
        <div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-[#0066cc]" />
            الاشتراكات والمدفوعات
          </h1>
          <p className="text-neutral-400 font-medium text-sm">إدارة الفواتير، تجديد الاشتراكات، ومراقبة الإيرادات</p>
        </div>
        
        <div className="flex gap-3">
          <button className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl shadow-lg transition-all text-sm border border-white/10">
            إصدار فاتورة يدوية
          </button>
          <button className="px-6 py-2.5 bg-gradient-to-r from-[#0066cc] to-[#0052a3] hover:from-[#0052a3] hover:to-[#004080] text-white font-bold rounded-xl shadow-lg transition-all text-sm">
            إعدادات الباقات والأسعار
          </button>
        </div>
      </div>

      <div className="bg-[#14161c] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-neutral-400" />
            أحدث الفواتير
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-white">
            <thead className="bg-[#0a0a0f] border-b border-white/5 text-neutral-400 text-sm font-bold">
              <tr>
                <th className="p-4">رقم الفاتورة</th>
                <th className="p-4">الشركة (Tenant)</th>
                <th className="p-4">الباقة المفوترة</th>
                <th className="p-4">المبلغ الإجمالي</th>
                <th className="p-4">تاريخ الإصدار</th>
                <th className="p-4">الاستحقاق</th>
                <th className="p-4">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium text-sm">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-mono text-neutral-300">#{invoice.invoiceNo}</td>
                  <td className="p-4 font-bold text-white">{invoice.tenantId}</td>
                  <td className="p-4 text-neutral-400">{invoice.subscription?.plan?.name || 'غير محدد'}</td>
                  <td className="p-4 font-bold text-[#0066cc]">{Number(invoice.total).toFixed(2)} SAR</td>
                  <td className="p-4 text-neutral-400">{new Date(invoice.issueDate).toLocaleDateString('en-GB')}</td>
                  <td className="p-4 text-neutral-400">{new Date(invoice.dueDate).toLocaleDateString('en-GB')}</td>
                  <td className="p-4">
                    {invoice.status === 'PAID' ? (
                      <span className="flex items-center gap-1.5 text-green-400 bg-green-500/10 px-3 py-1 rounded-full w-fit">
                        <CheckCircle2 className="w-4 h-4" /> مدفوعة
                      </span>
                    ) : invoice.status === 'PENDING' ? (
                      <span className="flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full w-fit">
                        <Clock className="w-4 h-4" /> بانتظار الدفع
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-3 py-1 rounded-full w-fit">
                        <XCircle className="w-4 h-4" /> ملغية/مرفوضة
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500 font-bold">
                    لا يوجد أي فواتير مسجلة في النظام.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
