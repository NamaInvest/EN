import React from 'react';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ArrowRightLeft, TrendingUp, Landmark, FileText, ArrowUpRight, ArrowDownRight, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default async function TreasuryDashboardPage() {
    // 1. Bank Accounts & Cash Position
    const accounts = await prisma.bankAccount.findMany({
        where: { isActive: true },
        select: { id: true, bankName: true, accountName: true, accountNumber: true, currentBalance: true, currency: true }
    });

    const totalCash = accounts.reduce((acc, curr) => acc + (curr.currentBalance || 0), 0);

    // 2. Pending Checks (PDC & Received)
    const pendingChecks = await prisma.checkTransaction.count({
        where: { status: { in: ['PENDING', 'UNDER_COLLECTION'] } }
    });

    // 3. Active Petty Cash Funds
    const pettyCashFunds = await prisma.pettyCashFund.count({
        where: { status: 'ACTIVE' }
    });

    // 4. Recent Bank Transactions
    const recentTransactions = await prisma.bankTransaction.findMany({
        take: 5,
        orderBy: { transactionDate: 'desc' },
        include: { bankAccount: true }
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Landmark className="w-8 h-8 text-indigo-600" />
                        Treasury & Cash Management
                    </h1>
                    <p className="text-gray-500 mt-1">Manage bank accounts, cash positions, checks, and petty cash.</p>
                </div>
                <div className="flex gap-2">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                        Inter-account Transfer
                    </Button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-indigo-600">Total Cash Position</p>
                            <Building2 className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">SAR {totalCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        <p className="text-xs text-indigo-500 mt-1">Across {accounts.length} active bank accounts</p>
                    </CardContent>
                </Card>
                <Link href="/treasury/checks">
                    <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-amber-600">Pending Checks (PDC)</p>
                                <FileText className="w-4 h-4 text-amber-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">{pendingChecks}</h3>
                            <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">Manage Checks <ArrowRightLeft className="w-3 h-3" /></p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/treasury/petty-cash">
                    <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100 hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-emerald-600">Active Petty Cash Funds</p>
                                <Landmark className="w-4 h-4 text-emerald-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mt-2">{pettyCashFunds}</h3>
                            <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">Manage Funds <ArrowRightLeft className="w-3 h-3" /></p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Bank Accounts List */}
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-100 pb-3 bg-gray-50">
                        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-gray-500" />
                                Bank Accounts Balance
                            </span>
                            <Button variant="ghost" size="sm" className="h-8 text-indigo-600">View All</Button>
                        </CardTitle>
                    </CardHeader>
                    <div className="divide-y divide-gray-100 bg-white">
                        {accounts.map(account => (
                            <div key={account.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-900">{account.bankName}</p>
                                    <p className="text-xs text-gray-500">{account.accountNumber} • {account.accountName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">
                                        {account.currentBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs text-gray-500">{account.currency}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Recent Transactions */}
                <Card className="border-gray-200 shadow-sm">
                    <CardHeader className="border-b border-gray-100 pb-3 bg-gray-50">
                        <CardTitle className="text-lg font-semibold text-gray-800 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-gray-500" />
                                Recent Bank Transactions
                            </span>
                            <Button variant="ghost" size="sm" className="h-8 text-indigo-600">Refresh</Button>
                        </CardTitle>
                    </CardHeader>
                    <div className="divide-y divide-gray-100 bg-white">
                        {recentTransactions.map(tx => (
                            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${
                                        tx.type === 'DEPOSIT' || tx.type === 'INCOME' ? 'bg-green-100 text-green-600' : 
                                        tx.type === 'TRANSFER' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                        {tx.type === 'DEPOSIT' || tx.type === 'INCOME' ? <ArrowDownRight className="w-4 h-4" /> : 
                                         tx.type === 'TRANSFER' ? <RefreshCcw className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{tx.description || tx.type}</p>
                                        <p className="text-xs text-gray-500">{tx.bankAccount.bankName} • {new Date(tx.transactionDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-sm font-bold ${
                                        tx.type === 'DEPOSIT' || tx.type === 'INCOME' ? 'text-green-600' : 
                                        tx.type === 'TRANSFER' ? 'text-blue-600' : 'text-red-600'
                                    }`}>
                                        {tx.type === 'DEPOSIT' || tx.type === 'INCOME' ? '+' : '-'}{tx.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                    <p className="text-xs text-gray-400">{tx.reference}</p>
                                </div>
                            </div>
                        ))}
                        {recentTransactions.length === 0 && (
                            <div className="p-8 text-center text-gray-500 text-sm bg-white">
                                No recent bank transactions found.
                            </div>
                        )}
                    </div>
                </Card>

            </div>
        </div>
    );
}
