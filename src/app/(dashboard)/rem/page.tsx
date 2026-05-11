'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Home, Building, Key, Users, DollarSign, TrendingUp, Search, Plus, Filter, AlertTriangle, FileText, CheckCircle2, ChevronRight, X, UserPlus, CreditCard } from 'lucide-react';
import { useToast } from '@/components/Toast';

const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');`;

interface Unit {
  id: string;
  propertyName: string;
  unitDetails: string;
  tenant: string;
  endDate: string;
  status: 'Active' | 'Expiring' | 'Vacant';
  annualValue: number;
}

export default function RealEstateDashboard() {
  const { lang } = useTranslation();
  const { success, info } = useToast();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newPropertyName, setNewPropertyName] = useState('');
  const [newUnitDetails, setNewUnitDetails] = useState('');
  const [newTenant, setNewTenant] = useState('');
  const [newAnnualValue, setNewAnnualValue] = useState('');

  const [units, setUnits] = useState<Unit[]>([
    { id: 'U-001', propertyName: 'برج النخيل التجاري', unitDetails: 'مكتب 402 - الدور الرابع', tenant: 'شركة التقنية الحديثة', endDate: '2026-12-31', status: 'Active', annualValue: 120000 },
    { id: 'U-002', propertyName: 'مجمع الورود السكني', unitDetails: 'فيلا 12', tenant: 'أحمد محمود السالم', endDate: '2026-05-15', status: 'Expiring', annualValue: 85000 },
    { id: 'U-003', propertyName: 'برج الأعمال', unitDetails: 'معرض 01 - الأرضي', tenant: '-', endDate: '-', status: 'Vacant', annualValue: 250000 },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredUnits = useMemo(() => {
    return units.filter(u => {
      const matchesSearch = u.propertyName.includes(searchQuery) || u.unitDetails.includes(searchQuery) || u.tenant.includes(searchQuery);
      const matchesFilter = filterStatus === 'All' || u.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [units, searchQuery, filterStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': return <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-200">ساري</span>;
      case 'Expiring': return <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-200">ينتهي قريباً</span>;
      case 'Vacant': return <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 rounded-full text-xs font-bold border border-slate-200">متاح للتأجير</span>;
      default: return null;
    }
  };

  const handleAddContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropertyName || !newUnitDetails || !newTenant || !newAnnualValue) return;
    
    const newUnit: Unit = {
      id: `U-00${units.length + 1}`,
      propertyName: newPropertyName,
      unitDetails: newUnitDetails,
      tenant: newTenant,
      endDate: '2027-01-01',
      status: 'Active',
      annualValue: Number(newAnnualValue)
    };
    
    setUnits([newUnit, ...units]);
    success('تم إنشاء عقد الإيجار بنجاح!');
    setShowAddModal(false);
    setNewPropertyName('');
    setNewUnitDetails('');
    setNewTenant('');
    setNewAnnualValue('');
  };

  const renewContract = (id: string) => {
    setUnits(prev => prev.map(u => {
      if (u.id === id) {
        return { ...u, status: 'Active', endDate: '2027-12-31' };
      }
      return u;
    }));
    success('تم تجديد العقد بنجاح');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] p-6 lg:p-10 transition-colors duration-300" style={{ fontFamily: "'Fira Sans', sans-serif" }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <style dangerouslySetInnerHTML={{ __html: fontImport }} />
      
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-[#0F172A] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 gap-4">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <Building className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">إدارة الأملاك والعقارات (REM)</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">إدارة العقود، الإيجارات، والتحصيل المالي (IFRS 16)</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors font-bold cursor-pointer">
              <Filter className="w-4 h-4 ml-2" /> تصفية التقارير
            </button>
            <button onClick={() => setShowAddModal(true)} className="flex items-center px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-bold shadow-sm shadow-emerald-500/20 cursor-pointer">
              <Plus className="w-5 h-5 ml-2" /> عقد إيجار جديد
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-indigo-500 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">نسبة الإشغال</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">85%</h3>
              </div>
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Home className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4 ml-1" /> <span>+2% عن الشهر الماضي</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-emerald-500 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">التحصيل (هذا الشهر)</p>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white font-[Fira_Code]">452,000 ﷼</h3>
              </div>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <div className="mt-1 text-xs font-bold text-slate-500">75% من المستهدف</div>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border-r-4 border-r-red-500 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">دفعات متأخرة</p>
                <h3 className="text-3xl font-bold text-red-600 dark:text-red-500 font-[Fira_Code]">12</h3>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-slate-500 dark:text-slate-400 cursor-pointer hover:text-indigo-600">
              <span>بقيمة 145,000 ﷼</span>
            </div>
          </div>

          <div className="bg-linear-to-br from-amber-500 to-orange-600 p-6 rounded-2xl text-white shadow-md shadow-amber-500/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-white/90 mb-1">عقود تنتهي قريباً</p>
                <h3 className="text-3xl font-bold font-[Fira_Code]">
                  {units.filter(u => u.status === 'Expiring').length}
                </h3>
              </div>
              <div className="p-2 bg-white/20 rounded-lg text-white">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-bold text-white/90">
              <span>خلال 30 يوماً القادمة</span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Properties List */}
          <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <Building className="w-5 h-5 ml-2 text-emerald-600" />
                الوحدات الإيجارية النشطة
              </h2>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="All">الكل</option>
                  <option value="Active">ساري</option>
                  <option value="Expiring">ينتهي قريباً</option>
                  <option value="Vacant">متاح للتأجير</option>
                </select>
                <div className="relative flex-1 sm:flex-none">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث برقم الوحدة أو العميل..." 
                    className="pl-4 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold focus:outline-none focus:border-emerald-500 transition-colors w-full sm:w-64"
                  />
                </div>
              </div>
            </div>
            
            {loading ? (
              <div className="p-10 text-center text-slate-500 font-bold">جاري تحميل البيانات...</div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-bold">العقار / الوحدة</th>
                      <th className="px-6 py-4 font-bold">المستأجر</th>
                      <th className="px-6 py-4 font-bold">تاريخ النهاية</th>
                      <th className="px-6 py-4 font-bold">الحالة</th>
                      <th className="px-6 py-4 font-bold">القيمة السنوية</th>
                      <th className="px-6 py-4 font-bold text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-[Fira_Code]">
                    {filteredUnits.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-slate-500">لا توجد بيانات مطابقة</td></tr>
                    ) : filteredUnits.map((unit) => (
                      <tr key={unit.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-slate-200 text-base">{unit.propertyName}</div>
                          <div className="text-xs font-bold text-slate-500">{unit.unitDetails}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-bold">
                          {unit.tenant}
                        </td>
                        <td className={`px-6 py-4 font-bold ${unit.status === 'Expiring' ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                          {unit.endDate}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(unit.status)}
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-bold text-base">
                          {unit.annualValue.toLocaleString()} ﷼
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {unit.status === 'Expiring' && (
                              <button onClick={() => renewContract(unit.id)} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors font-bold text-xs" title="تجديد العقد">
                                تجديد
                              </button>
                            )}
                            <button className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-bold text-xs">
                              التفاصيل
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions & Outstanding Installments */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">العمليات السريعة</h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setShowAddModal(true)} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 text-center transition-colors cursor-pointer group">
                  <Key className="w-6 h-6 mx-auto text-slate-400 group-hover:text-emerald-600 mb-2" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">تأجير وحدة</span>
                </button>
                <button className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 text-center transition-colors cursor-pointer group">
                  <CreditCard className="w-6 h-6 mx-auto text-slate-400 group-hover:text-emerald-600 mb-2" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">تحصيل دفعة</span>
                </button>
                <button className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 text-center transition-colors cursor-pointer group">
                  <Users className="w-6 h-6 mx-auto text-slate-400 group-hover:text-emerald-600 mb-2" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">المستأجرين</span>
                </button>
                <button className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 text-center transition-colors cursor-pointer group">
                  <Building className="w-6 h-6 mx-auto text-slate-400 group-hover:text-emerald-600 mb-2" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">تعريف عقار</span>
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center">
                دفعات مستحقة <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">عاجل</span>
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-200">شركة التقنية الحديثة</p>
                    <p className="text-xs font-bold text-slate-500 mt-1">دفعة الربع الثاني 2026</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-[Fira_Code] font-black text-red-600">30,000 ﷼</p>
                    <p className="text-xs font-bold text-red-500 mt-1">متأخرة 5 أيام</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-200">مؤسسة الأفق</p>
                    <p className="text-xs font-bold text-slate-500 mt-1">الدفعة النصف سنوية</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-[Fira_Code] font-black text-amber-600">45,000 ﷼</p>
                    <p className="text-xs font-bold text-amber-500 mt-1">تستحق غداً</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Add Lease Contract Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
                <Plus className="w-6 h-6 ml-2 text-emerald-600" />
                إنشاء عقد إيجار جديد
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddContract} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اسم العقار / المجمع</label>
                  <input 
                    type="text" 
                    required
                    value={newPropertyName}
                    onChange={(e) => setNewPropertyName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold"
                    placeholder="مثال: برج النخيل..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">رقم / تفاصيل الوحدة</label>
                  <input 
                    type="text" 
                    required
                    value={newUnitDetails}
                    onChange={(e) => setNewUnitDetails(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold"
                    placeholder="مثال: مكتب 402..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اسم المستأجر</label>
                  <input 
                    type="text" 
                    required
                    value={newTenant}
                    onChange={(e) => setNewTenant(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold"
                    placeholder="اسم الشركة أو الفرد..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">القيمة الإيجارية السنوية (﷼)</label>
                  <input 
                    type="number" 
                    required
                    min="1000"
                    value={newAnnualValue}
                    onChange={(e) => setNewAnnualValue(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-bold font-mono"
                    placeholder="120000"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> حفظ واعتماد العقد
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
