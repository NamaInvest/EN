'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Monitor, Terminal, FileText, CheckCircle, Clock, Plus, Loader2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

interface PosSession {
  id: number;
  userId: number;
  terminalId: number | null;
  openingFloat: number;
  variance: number | null;
  status: string;
  openedAt: string;
  closedAt: string | null;
  user?: {
    id: number;
    fullName: string;
  } | null;
}

export default function PosSessionsPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { error: toastError } = useToast();

  const [sessions, setSessions] = useState<PosSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/pos/accountant', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(Array.isArray(data) ? data : []);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || _t('فشل في جلب جلسات نقاط البيع', 'Failed to fetch POS sessions'));
      }
    } catch (err: any) {
      setError(err.message || _t('حدث خطأ أثناء الاتصال بالخادم', 'Connection error occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const stats = useMemo(() => {
    const openCount = sessions.filter(s => s.status === 'OPEN').length;
    const closedCount = sessions.filter(s => s.status === 'CLOSED').length;
    const totalVariance = sessions.reduce((sum, s) => sum + Number(s.variance || 0), 0);
    return { openCount, closedCount, totalVariance };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(sess => {
      const cashierName = (sess.user?.fullName || '').toLowerCase();
      const terminalStr = `terminal #${sess.terminalId || '01'}`;
      const search = searchQuery.toLowerCase();
      return cashierName.includes(search) || terminalStr.includes(search) || String(sess.id).includes(search);
    });
  }, [sessions, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Terminal className="w-8 h-8 text-violet-600" />
            {_t('جلسات نقاط البيع (المكتب الخلفي)', 'POS Sessions (Back Office)')}
          </h1>
          <p className="text-gray-500 mt-1">
            {_t('إدارة أدراج النقود والجلسات الطرفية والتسويات في نهاية اليوم.', 'Manage cash drawers, terminal sessions, and end-of-day reconciliations.')}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchSessions}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            {_t('تحديث', 'Refresh')}
          </button>
          <Link href="/restaurant-tables">
            <Button variant="outline" className="bg-white">{_t('إعداد المطعم', 'Restaurant Setup')}</Button>
          </Link>
          <Link href="/pos" target="_blank">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm">
              <Monitor className="w-4 h-4 mr-2" />
              {_t('إطلاق محطة نقاط البيع', 'Launch POS Terminal')}
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500 font-bold">
          <Loader2 className="animate-spin w-10 h-10 mx-auto mb-4 text-violet-600" />
          <p>{_t('جاري جلب ومزامنة جلسات نقاط البيع...', 'Syncing POS sessions...')}</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold">
          <p>{error}</p>
          <Button onClick={fetchSessions} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
            {_t('إعادة المحاولة', 'Retry')}
          </Button>
        </div>
      ) : (
        <>
          {/* Metrics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-violet-50 to-white border-violet-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-violet-600">{_t('المحطات النشطة (مفتوحة)', 'Active Terminals (OPEN)')}</p>
                  <Monitor className="w-4 h-4 text-violet-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.openCount}</h3>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">{_t('الجلسات المغلقة', 'Closed Sessions')}</p>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{stats.closedCount}</h3>
              </CardContent>
            </Card>
            <Card className={stats.totalVariance < 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-medium ${stats.totalVariance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {_t('إجمالي التباين النقدي', 'Total Cash Variance')}
                  </p>
                  <FileText className={`w-4 h-4 ${stats.totalVariance < 0 ? 'text-red-400' : 'text-green-400'}`} />
                </div>
                <h3 className={`text-2xl font-bold ${stats.totalVariance < 0 ? 'text-red-900' : 'text-green-900'} mt-2`}>
                  {stats.totalVariance.toLocaleString()} <span className="text-sm font-normal opacity-70">{_t('ر.س', 'SAR')}</span>
                </h3>
              </CardContent>
            </Card>
          </div>

          {/* Data Grid */}
          <Card className="overflow-hidden border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center gap-4 bg-white">
              <div className="relative w-full md:w-80">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={_t('البحث باسم الكاشير أو الطرفية...', 'Search by cashier or terminal...')} 
                  className="w-full pr-9 pl-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="px-4 py-3 font-medium">{_t('معرف الجلسة', 'Session ID')}</th>
                    <th className="px-4 py-3 font-medium">{_t('كاشير', 'Cashier')}</th>
                    <th className="px-4 py-3 font-medium">{_t('صالة', 'Terminal')}</th>
                    <th className="px-4 py-3 font-medium">{_t('افتتح في', 'Opened At')}</th>
                    <th className="px-4 py-3 font-medium">{_t('تعويم الافتتاح', 'Opening Float')}</th>
                    <th className="px-4 py-3 font-medium">{_t('التباين', 'Variance')}</th>
                    <th className="px-4 py-3 font-medium">{_t('الحالة', 'Status')}</th>
                    <th className="px-4 py-3 font-medium text-left">{_t('إجراءات', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredSessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        SES-{sess.id}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {sess.user?.fullName || 'Unknown User'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        Terminal #{sess.terminalId || '01'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {format(new Date(sess.openedAt), 'yyyy-MM-dd HH:mm')}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {Number(sess.openingFloat).toLocaleString()} SAR
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {sess.variance !== null ? (
                          <span className={Number(sess.variance) < 0 ? 'text-red-600' : Number(sess.variance) > 0 ? 'text-green-600' : 'text-gray-500'}>
                            {Number(sess.variance).toLocaleString()} SAR
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          sess.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sess.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-left">
                        <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50">
                          {_t('تقرير Z', 'Z-Report')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredSessions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <Terminal className="w-10 h-10 text-gray-300 mb-3" />
                          <p className="text-lg font-medium text-gray-900">{_t('لا توجد جلسات نقاط البيع', 'No POS Sessions')}</p>
                          <p className="text-sm mt-1">{_t('افتح جلسة طرفية لبدء تلقي المدفوعات.', 'Open a terminal session to start receiving payments.')}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
