'use client';
import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, ChevronRight, Calculator, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
    dueDateUntil: z.string().min(1, 'Due date is required'),
    currency: z.string(),
    includeDiscountWindow: z.boolean(),
    paymentMethod: z.string()
});

type FormValues = z.infer<typeof formSchema>;

export default function CreatePaymentRunPage() {
    const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();
    const { lang } = useTranslation();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [proposalData, setProposalData] = useState<any>(null);

    const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            dueDateUntil: '',
            currency: 'SAR',
            includeDiscountWindow: true,
            paymentMethod: 'SARIE'
        }
    });

    const formData = watch();

    const handlePropose = async (data: FormValues) => {
        setLoading(true);
        // Simulate API call for proposing payment run
        setTimeout(() => {
            setProposalData({
                invoicesCount: 250,
                discountOpportunitiesCount: 80,
                discountSavings: 18000,
                totalAmount: 1850000,
                vendorsCount: 78
            });
            setStep(2);
            setLoading(false);
        }, 1500);
    };

    const handleCreateRun = async () => {
        setLoading(true);
        // Simulate API call for saving the run
        setTimeout(() => {
            toastSuccess('Payment Run submitted for approval successfully!');
            window.location.href = '/accounting/payment-runs';
        }, 1000);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Link href="/accounting/payment-runs">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">{_t('New Payment Run', 'New Payment Run')}</h1>
                    <p className="text-gray-500">{_t('Generate a new proposal for vendor payments', 'Generate a new proposal for vendor payments')}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-8">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>1</div>
                    <span>{_t('Parameters', 'Parameters')}</span>
                </div>
                <div className="flex-1 h-px bg-gray-200 mx-2"></div>
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>2</div>
                    <span>{_t('Proposal Preview', 'Proposal Preview')}</span>
                </div>
                <div className="flex-1 h-px bg-gray-200 mx-2"></div>
                <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>3</div>
                    <span>{_t('Confirmation', 'Confirmation')}</span>
                </div>
            </div>

            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>{_t('Selection Criteria', 'Selection Criteria')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(handlePropose)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">{_t('Due Date Until', 'Due Date Until')}</label>
                                    <input 
                                        type="date" 
                                        className={`w-full border rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none ${errors.dueDateUntil ? 'border-red-500' : 'border-gray-300'}`}
                                        {...register('dueDateUntil')}
                                    />
                                    {errors.dueDateUntil && <p className="text-red-500 text-xs mt-1">{errors.dueDateUntil.message}</p>}
                                    <p className="text-xs text-gray-500">{_t('Include all open AP items due on or before this date.', 'Include all open AP items due on or before this date.')}</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">{_t('العملة', 'Currency')}</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        {...register('currency')}
                                    >
                                        <option value="SAR">{_t('SAR - Saudi Riyal', 'SAR - Saudi Riyal')}</option>
                                        <option value="USD">{_t('USD - US Dollar', 'USD - US Dollar')}</option>
                                        <option value="EUR">{_t('EUR - Euro', 'EUR - Euro')}</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Payment Method / Format</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        {...register('paymentMethod')}
                                    >
                                        <option value="SARIE">SARIE (Saudi Banks Excel/CSV)</option>
                                        <option value="SEPA">{_t('SEPA XML (pain.001.001.09)', 'SEPA XML (pain.001.001.09)')}</option>
                                        <option value="SWIFT">{_t('SWIFT MT103', 'SWIFT MT103')}</option>
                                    </select>
                                </div>
                                <div className="space-y-2 pt-8">
                                    <label className="flex items-center gap-3">
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 text-blue-600 rounded"
                                            {...register('includeDiscountWindow')}
                                        />
                                        <span className="text-sm font-medium text-gray-700">{_t('Include future invoices within cash discount windows', 'Include future invoices within cash discount windows')}</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6 border-t border-gray-100">
                                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    {loading ? 'Analyzing...' : 'Generate Proposal'}
                                    {!loading && <ChevronRight className="w-4 h-4 ml-2" />}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {step === 2 && proposalData && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-blue-50 border-blue-100">
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">{_t('المبلغ الإجمالي', 'Total Amount')}</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{proposalData.totalAmount.toLocaleString()} <span className="text-sm font-normal text-gray-500">{formData.currency}</span></h3>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('Invoices', 'Invoices')}</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{proposalData.invoicesCount}</h3>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('Vendors', 'Vendors')}</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">{proposalData.vendorsCount}</h3>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-100">
                            <CardContent className="p-4">
                                <p className="text-xs font-medium text-green-600 uppercase tracking-wider">{_t('Discount Savings', 'Discount Savings')}</p>
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">+{proposalData.discountSavings.toLocaleString()} <span className="text-sm font-normal text-gray-500">{formData.currency}</span></h3>
                                <p className="text-xs text-green-700 mt-1">From {proposalData.discountOpportunitiesCount} opportunities</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                            <CardTitle className="text-lg">{_t('Proposal Line Items', 'Proposal Line Items')}</CardTitle>
                            <Button variant="outline" size="sm">
                                <FileSpreadsheet className="w-4 h-4 mr-2" />{_t('Export to Excel', 'Export to Excel')}</Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-12 text-center text-gray-500">
                                <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p>{_t('Interactive data grid would appear here showing grouped vendors and invoices.', 'Interactive data grid would appear here showing grouped vendors and invoices.')}</p>
                                <p className="text-sm mt-2 text-gray-400">{_t('Users can uncheck specific invoices to block them from this run.', 'Users can uncheck specific invoices to block them from this run.')}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-between items-center pt-4">
                        <Button variant="outline" onClick={() => setStep(1)}>
                            <ArrowLeft className="w-4 h-4 mr-2" />{_t('رجوع', 'Back')}</Button>
                        <Button onClick={handleCreateRun} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                            {loading ? 'Submitting...' : 'Submit for Approval'}
                            {!loading && <Check className="w-4 h-4 ml-2" />}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
