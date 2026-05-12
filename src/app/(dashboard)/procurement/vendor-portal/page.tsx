'use client';
import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Globe, Users, FileSignature, CheckCircle2, Truck, Package, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

export default function VendorPortalDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  
  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [asns, setAsns] = useState<any[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
      try {
          const res = await fetch('/api/procurement/vendor-portal');
          const data = await res.json();
          if (data.success) {
              setPurchaseOrders(data.purchaseOrders || []);
              setAsns(data.asns || []);
          }
      } catch(e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  const handleAcknowledge = async (po: any) => {
      if (!confirm(_t('تأكيد الموافقة على أمر الشراء (مبدئياً خلال 3 أيام)؟', 'Acknowledge this PO (Promised in 3 days)?'))) return;
      setIsProcessing(true);
      try {
          const promisedDate = new Date();
          promisedDate.setDate(promisedDate.getDate() + 3);

          const res = await fetch('/api/procurement/vendor-portal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  action: 'ACKNOWLEDGE_PO',
                  poId: po.id,
                  vendorId: po.vendorId,
                  promisedDate: promisedDate.toISOString(),
                  notes: 'Auto Acknowledged via Portal'
              })
          });
          const data = await res.json();
          if (data.success) {
              toast.success(_t('تم تأكيد أمر الشراء', 'PO Acknowledged successfully'));
              fetchData();
          } else {
              toast.error(data.error || 'Error');
          }
      } catch(e) {
          toast.error('Network Error');
      } finally {
          setIsProcessing(false);
      }
  };

  const handleSubmitASN = async (po: any) => {
      if (!confirm(_t('إنشاء إشعار شحن مسبق (ASN) لهذا الطلب؟', 'Create Advance Ship Notice (ASN) for this PO?'))) return;
      setIsProcessing(true);
      try {
          const etd = new Date();
          const eta = new Date();
          eta.setDate(eta.getDate() + 5);

          const res = await fetch('/api/procurement/vendor-portal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  action: 'SUBMIT_ASN',
                  poId: po.id,
                  vendorId: po.vendorId,
                  trackingNumber: 'TRK-' + Math.floor(Math.random() * 1000000),
                  carrier: 'DHL Express',
                  etd: etd.toISOString(),
                  eta: eta.toISOString(),
                  packages: [
                      { packageNo: 'PKG-1', weight: 15, productLines: po.details.map((d: any) => ({ poLineId: d.id, qty: d.quantity })) }
                  ]
              })
          });
          const data = await res.json();
          if (data.success) {
              toast.success(_t('تم إرسال إشعار الشحن بنجاح', 'ASN Submitted successfully'));
              fetchData();
          } else {
              toast.error(data.error || 'Error');
          }
      } catch(e) {
          toast.error('Network Error');
      } finally {
          setIsProcessing(false);
      }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">{_t('جاري التحميل...', 'Loading...')}</div>;

  const pendingAcks = purchaseOrders.filter(po => po.status === 'SENT' || po.status === 'APPROVED');
  const ackedPOs = purchaseOrders.filter(po => po.status === 'ACKNOWLEDGED');

  return (
        <div className="max-w-7xl mx-auto space-y-8 p-6" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3 text-slate-800">
                        <div className="w-12 h-12 rounded-[1.25rem] bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Globe className="w-6 h-6" />
                        </div>
                        {_t('بوابة الموردين الذكية', 'Smart Vendor Portal')}
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">{_t('تأكيد أوامر الشراء، إشعارات الشحن المسبقة، وإدارة الفواتير.', 'Acknowledge POs, Advance Ship Notices (ASN), and Invoice Management.')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-slate-700">
                        <Clock className="text-orange-500 w-5 h-5"/>{_t('بانتظار التأكيد', 'Pending Acknowledgment')}
                    </h2>
                    <p className="text-4xl font-black text-slate-800">{pendingAcks.length}</p>
                    <p className="text-sm text-slate-500 mt-2 font-medium">{_t('أوامر شراء تحتاج إلى تأكيد وموعد تسليم.', 'POs needing confirmation and promised date.')}</p>
                </Card>
                <Card className="p-6 border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-slate-700">
                        <ShieldCheck className="text-green-500 w-5 h-5"/>{_t('طلبات مؤكدة', 'Acknowledged')}
                    </h2>
                    <p className="text-4xl font-black text-slate-800">{ackedPOs.length}</p>
                    <p className="text-sm text-slate-500 mt-2 font-medium">{_t('طلبات جاهزة للشحن من قبل المورد.', 'Orders ready to be shipped by vendor.')}</p>
                </Card>
                <Card className="p-6 border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                    <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-slate-700">
                        <Truck className="text-indigo-500 w-5 h-5"/>{_t('إشعارات الشحن (ASN)', 'Ship Notices (ASN)')}
                    </h2>
                    <p className="text-4xl font-black text-slate-800">{asns.length}</p>
                    <p className="text-sm text-slate-500 mt-2 font-medium">{_t('شحنات في الطريق لمستودعاتنا.', 'Shipments en route to our warehouses.')}</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending POs */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-orange-500" />
                        {_t('أوامر الشراء المفتوحة', 'Open Purchase Orders')}
                    </h3>
                    
                    {pendingAcks.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 text-slate-400 font-medium">
                            {_t('لا توجد أوامر شراء بانتظار التأكيد.', 'No pending POs.')}
                        </div>
                    ) : (
                        pendingAcks.map((po: any) => (
                            <Card key={po.id} className="p-6 rounded-3xl border-slate-200 hover:border-orange-300 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-xl font-black text-slate-800">PO-{po.orderNo}</h4>
                                        <p className="text-slate-500 text-sm font-semibold">{po.vendor?.name}</p>
                                    </div>
                                    <Badge className="bg-orange-100 text-orange-600 uppercase font-bold tracking-wider">{po.status}</Badge>
                                </div>
                                <div className="space-y-2 mb-6">
                                    {po.details.map((d: any, i: number) => (
                                        <div key={i} className="flex justify-between text-sm font-medium text-slate-600 bg-slate-50 p-2 rounded-xl">
                                            <span>{d.product?.name || 'Item'}</span>
                                            <span className="font-bold text-slate-800">{Number(d.quantity)}x</span>
                                        </div>
                                    ))}
                                </div>
                                <Button disabled={isProcessing} onClick={() => handleAcknowledge(po)} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl h-12 shadow-md shadow-orange-500/20">
                                    {_t('تأكيد أمر الشراء (Acknowledge)', 'Acknowledge PO')}
                                </Button>
                            </Card>
                        ))
                    )}
                </div>

                {/* Acknowledged POs ready for ASN */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Package className="w-6 h-6 text-indigo-500" />
                        {_t('تجهيز الشحن (ASN)', 'Prepare Shipment (ASN)')}
                    </h3>
                    
                    {ackedPOs.length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 text-slate-400 font-medium">
                            {_t('لا توجد طلبات مؤكدة جاهزة للشحن.', 'No acknowledged POs ready.')}
                        </div>
                    ) : (
                        ackedPOs.map((po: any) => {
                            const hasAsn = asns.some(a => a.poId === po.id);
                            return (
                            <Card key={po.id} className="p-6 rounded-3xl border-slate-200 hover:border-indigo-300 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-xl font-black text-slate-800">PO-{po.orderNo}</h4>
                                        <p className="text-slate-500 text-sm font-semibold">{po.vendor?.name}</p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-600 uppercase font-bold tracking-wider">{_t('مؤكد', 'ACKNOWLEDGED')}</Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 font-medium mb-6 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                                    <Clock className="w-4 h-4 text-indigo-500"/>
                                    {_t('تاريخ التسليم المتوقع:', 'Promised Date:')} <span className="font-bold text-indigo-700">{new Date(po.promisedDate || po.date).toLocaleDateString()}</span>
                                </div>

                                {hasAsn ? (
                                    <Button disabled variant="outline" className="w-full bg-slate-50 text-slate-400 font-bold rounded-2xl h-12 border-dashed">
                                        <CheckCircle2 className="w-4 h-4 mr-2"/> {_t('تم إرسال إشعار الشحن', 'ASN Submitted')}
                                    </Button>
                                ) : (
                                    <Button disabled={isProcessing} onClick={() => handleSubmitASN(po)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl h-12 shadow-md shadow-indigo-600/20">
                                        <Truck className="w-4 h-4 mr-2"/> {_t('إصدار إشعار شحن (Submit ASN)', 'Submit ASN')}
                                    </Button>
                                )}
                            </Card>
                        )})
                    )}
                </div>
            </div>
            
        </div>
    );
}
