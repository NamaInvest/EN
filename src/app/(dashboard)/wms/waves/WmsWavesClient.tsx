'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Box, GitMerge, AlertCircle, CheckCircle2, TrendingUp, Search, Calendar, FileText, BarChart3, Database, Plus } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { useTranslation } from "@/lib/i18n";

type Wave = {
  id: number;
  waveNumber: string;
  status: string;
  priority: number;
  assignedTo?: number;
  createdAt: string;
  tasks?: any[];
};

type PickTaskPreview = {
  orderId: number;
  productId: number;
  productName: string;
  binLocation: string;
  quantity: number;
  sequence: number;
};

export default function WmsWavesClient() {
    const { lang } = useTranslation();
        const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { error: toastError, success: toastSuccess } = useToast();
  
  // States
  const [waves, setWaves] = useState<Wave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Preview State
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{waveId: string, estimatedMinutes: number, tasks: PickTaskPreview[]} | null>(null);

  // Create Wave State
  const [createLoading, setCreateLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    warehouseId: 1,
    priority: 1,
    orderIdsText: '1,2,3',
  });

  useEffect(() => {
    fetchWaves();
  }, [statusFilter]);

  const fetchWaves = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/wms/waves', window.location.origin);
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);
      
      const res = await fetch(url.toString());
      if (!res.ok) {
        if (res.status === 403) throw new Error('Permission Denied');
        throw new Error('Failed to fetch WMS waves');
      }
      
      const data = await res.json();
      setWaves(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePreview = async () => {
    setPreviewLoading(true);
    try {
      // Mocked request for previewing a wave for demonstration
      const res = await fetch('/api/wms/waves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'plan_wave', warehouseId: 1, orderIds: [1, 2, 3] })
      });
      
      if (!res.ok) throw new Error('Failed to generate preview');
      
      const data = await res.json();
      setPreviewData(data);
      toastSuccess('Wave preview loaded successfully.');
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreateWave = async () => {
    try {
      const orderIds = createForm.orderIdsText.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      if (orderIds.length === 0) {
        toastError('Please provide valid order IDs.');
        return;
      }

      setCreateLoading(true);
      const res = await fetch('/api/wms/waves', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-idempotency-key': crypto.randomUUID()
        },
        body: JSON.stringify({ 
          action: 'create_wave', 
          warehouseId: createForm.warehouseId, 
          orderIds: orderIds,
          priority: createForm.priority
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create wave');
      
      toastSuccess(`Wave created successfully! ID: ${data.wave.waveNumber}`);
      setIsCreateOpen(false);
      fetchWaves(); // Refresh data
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  // Derived metrics
  const totalWaves = waves.length;
  const draftWaves = waves.filter(w => w.status === 'DRAFT').length;
  const readyWaves = waves.filter(w => w.status === 'ALLOCATED').length;
  const completedWaves = waves.filter(w => w.status === 'COMPLETED').length;
  const totalTasks = waves.reduce((sum, w) => sum + (w.tasks?.length || 0), 0);

  if (error === 'Permission Denied') {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-destructive">
        <AlertCircle className="w-16 h-16 mb-4" />
        <h2 className="text-2xl font-bold">Permission Denied</h2>
        <p className="text-muted-foreground mt-2">You do not have the required access to view WMS Waves.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WMS Waves Control (Read-Only)</h1>
          <p className="text-muted-foreground mt-1">Monitor picking waves, slotting, and task assignments securely.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="px-3 py-1 bg-primary/5 text-primary hidden sm:inline-flex">
            <Database className="w-4 h-4 mr-2" />
            Enterprise WMS
          </Badge>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Wave Draft
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Wave Draft</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Warehouse ID</label>
                  <Input 
                    type="number" 
                    value={createForm.warehouseId} 
                    onChange={e => setCreateForm(prev => ({ ...prev, warehouseId: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{_t('الأولوية (1 = مرتفع)', 'Priority (1 = High)')}</label>
                  <Select 
                    value={createForm.priority.toString()} 
                    onValueChange={val => setCreateForm(prev => ({ ...prev, priority: parseInt(val) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Priority 1 (Urgent)</SelectItem>
                      <SelectItem value="2">{_t('الأولوية 2 (طبيعي)', 'Priority 2 (Normal)')}</SelectItem>
                      <SelectItem value="3">{_t('الأولوية 3 (منخفض)', 'Priority 3 (Low)')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source Order IDs (comma separated)</label>
                  <Input 
                    placeholder="e.g. 1, 2, 3" 
                    value={createForm.orderIdsText} 
                    onChange={e => setCreateForm(prev => ({ ...prev, orderIdsText: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">Only CONFIRMED orders will be processed.</p>
                </div>
                <Button onClick={handleCreateWave} disabled={createLoading} className="w-full">
                  {createLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create Wave
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Waves</p>
                <h3 className="text-2xl font-bold mt-1">{loading ? '-' : totalWaves}</h3>
              </div>
              <Box className="w-8 h-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Planning (Draft)</p>
                <h3 className="text-2xl font-bold mt-1 text-orange-500">{loading ? '-' : draftWaves}</h3>
              </div>
              <FileText className="w-8 h-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ready to Pick</p>
                <h3 className="text-2xl font-bold mt-1 text-purple-500">{loading ? '-' : readyWaves}</h3>
              </div>
              <GitMerge className="w-8 h-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{_t('مكتمل', 'Completed')}</p>
                <h3 className="text-2xl font-bold mt-1 text-green-500">{loading ? '-' : completedWaves}</h3>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{_t('الإجمالي مهام', 'Total Tasks')}</p>
                <h3 className="text-2xl font-bold mt-1">{loading ? '-' : totalTasks}</h3>
              </div>
              <BarChart3 className="w-8 h-8 text-gray-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Waves List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Active Waves</CardTitle>
              <CardDescription>Live monitoring of warehouse waves</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={_t('الحالة', 'Status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="DRAFT">{_t('مسودة', 'Draft')}</SelectItem>
                  <SelectItem value="ALLOCATED">Allocated</SelectItem>
                  <SelectItem value="PICKING">Picking</SelectItem>
                  <SelectItem value="COMPLETED">{_t('مكتمل', 'Completed')}</SelectItem>
                </SelectContent>
              </Select>
              <Input 
                placeholder="Search Wave..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[200px]"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
            ) : error ? (
              <div className="p-8 text-center text-destructive bg-destructive/10 rounded-md">{error}</div>
            ) : waves.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground border-2 border-dashed rounded-md">
                No waves found.
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted text-muted-foreground uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Wave No</th>
                      <th className="px-4 py-3">{_t('الحالة', 'Status')}</th>
                      <th className="px-4 py-3">{_t('الأولوية', 'Priority')}</th>
                      <th className="px-4 py-3">{_t('مهام', 'Tasks')}</th>
                      <th className="px-4 py-3">{_t('تم الإنشاء', 'Created')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waves.filter(w => w.waveNumber.toLowerCase().includes(searchQuery.toLowerCase())).map((w) => (
                      <tr key={w.id} className="border-b bg-card hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium">{w.waveNumber}</td>
                        <td className="px-4 py-3">
                          <Badge variant={w.status === 'COMPLETED' ? 'default' : w.status === 'DRAFT' ? 'secondary' : 'outline'}>
                            {w.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${w.priority > 1 ? 'text-red-500' : ''}`}>P{w.priority}</span>
                        </td>
                        <td className="px-4 py-3">{w.tasks?.length || 0}</td>
                        <td className="px-4 py-3">{new Date(w.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wave Preview / Analysis Simulator (Read-Only) */}
        <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Wave Analysis Preview
            </CardTitle>
            <CardDescription>Simulate picking paths before creation (Safe Read-Only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleGeneratePreview} 
              disabled={previewLoading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {previewLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
              Generate AI Preview (Mock Orders)
            </Button>
            
            {previewData && (
              <div className="bg-background border rounded-md p-4 mt-4 text-sm shadow-sm space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-semibold">{previewData.waveId}</span>
                  <Badge variant="secondary">{previewData.estimatedMinutes} Mins Est.</Badge>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {previewData.tasks.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 hover:bg-muted rounded-md transition-colors">
                      <div>
                        <p className="font-medium">{t.productName}</p>
                        <p className="text-xs text-muted-foreground">{_t('نظام: #', 'Order: #')}{t.orderId} | Qty: {t.quantity}</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20">{t.binLocation}</Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-center text-muted-foreground pt-2">
                  * This is a read-only analysis. No actual tasks were saved.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
