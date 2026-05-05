import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShoppingBag, ClipboardList, Users, Truck, ArrowRight, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ProcurementDashboard() {
    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-8 h-8 text-blue-600" />
                    Procurement & Purchases
                </h1>
                <p className="text-gray-500 mt-1">Manage suppliers, purchase orders, and internal requisitions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                
                {/* Requisitions Card */}
                <Link href="/purchases/requisitions">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-indigo-100 hover:border-indigo-300">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl flex items-center gap-2 text-indigo-700">
                                <ClipboardList className="w-6 h-6" />
                                Requisitions (PR)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4">Review and approve internal purchase requests from departments before converting them to POs.</p>
                            <div className="flex items-center text-sm font-medium text-indigo-600">
                                View Requests <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Purchase Orders Card */}
                <Link href="/purchases/orders">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-blue-100 hover:border-blue-300">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl flex items-center gap-2 text-blue-700">
                                <ShoppingBag className="w-6 h-6" />
                                Purchase Orders (PO)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4">Create, send, and track purchase orders to suppliers. Manage delivery statuses and costs.</p>
                            <div className="flex items-center text-sm font-medium text-blue-600">
                                Manage Orders <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Suppliers Card */}
                <Link href="/crm/customers"> {/* Suppliers use the same model but could be filtered */}
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-green-100 hover:border-green-300">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl flex items-center gap-2 text-green-700">
                                <Users className="w-6 h-6" />
                                Suppliers (Vendors)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4">Manage your vendor directory, view performance history, and track accounts payable balances.</p>
                            <div className="flex items-center text-sm font-medium text-green-600">
                                View Suppliers <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <Card className="bg-gradient-to-br from-slate-50 to-white">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-slate-500" />
                            Goods Receipt (GRN)
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">Record goods received from suppliers against Purchase Orders. Integrated with Inventory/Warehousing module.</p>
                        <Link href="/inventory" className="inline-flex items-center text-sm font-medium text-slate-700 hover:text-slate-900">
                            Go to Inventory <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-white">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-slate-500" />
                            Purchase Invoices
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">Process incoming vendor invoices and perform 3-way matching. Integrated with Accounting (Accounts Payable).</p>
                        <Link href="/accounting/purchase-invoices" className="inline-flex items-center text-sm font-medium text-slate-700 hover:text-slate-900">
                            Go to AP Module <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
