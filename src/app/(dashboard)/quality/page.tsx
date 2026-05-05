import React from 'react';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ClipboardCheck, AlertTriangle, FileWarning, Target, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function QualityDashboardPage() {
    const inspections = await prisma.qualityInspection.count();
    const passedInspections = await prisma.qualityInspection.count({
        where: { status: 'PASSED' }
    });
    
    const openNcrs = await prisma.nonConformanceReport.count();

    const passRate = inspections > 0 ? Math.round((passedInspections / inspections) * 100) : 0;

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-teal-600" />
                        Quality Management (QMS)
                    </h1>
                    <p className="text-gray-500 mt-1">Manage inspections, specifications, and Non-Conformance Reports (NCR).</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/quality/inspections">
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
                            <ClipboardCheck className="w-4 h-4 mr-2" />
                            New Inspection
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-teal-600">Total Inspections</p>
                            <Target className="w-4 h-4 text-teal-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{inspections}</h3>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-green-600">First-Pass Yield (FPY)</p>
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mt-2">{passRate}%</h3>
                    </CardContent>
                </Card>
                <Card className={openNcrs > 0 ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${openNcrs > 0 ? 'text-red-600' : 'text-gray-600'}`}>Open NCRs</p>
                            <AlertTriangle className={`w-4 h-4 ${openNcrs > 0 ? 'text-red-400' : 'text-gray-400'}`} />
                        </div>
                        <h3 className={`text-2xl font-bold mt-2 ${openNcrs > 0 ? 'text-red-900' : 'text-gray-900'}`}>{openNcrs}</h3>
                    </CardContent>
                </Card>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                
                {/* Inspections Card */}
                <Link href="/quality/inspections">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 hover:border-teal-300">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
                                <ClipboardCheck className="w-6 h-6 text-teal-600" />
                                Quality Inspections
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4">Perform incoming (GRN), in-process, and final quality checks. Record test parameters.</p>
                            <div className="flex items-center text-sm font-medium text-teal-600">
                                View Inspections <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* NCRs Card */}
                <Link href="/quality/ncrs">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 hover:border-red-300">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
                                <FileWarning className="w-6 h-6 text-red-600" />
                                Non-Conformance (NCR)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 mb-4">Manage defect reports, MRB dispositions (Rework, Scrap, Return), and root cause analysis.</p>
                            <div className="flex items-center text-sm font-medium text-red-600">
                                Manage NCRs <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Specs Card */}
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-gray-200 hover:border-blue-300">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xl flex items-center gap-2 text-gray-800">
                            <Target className="w-6 h-6 text-blue-600" />
                            Quality Specs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-500 mb-4">Define product-specific quality parameters, acceptable limits (min/max), and AQL sampling plans.</p>
                        <div className="flex items-center text-sm font-medium text-blue-600">
                            View Specifications <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    </CardContent>
                </Card>

            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <Card className="bg-gradient-to-br from-slate-50 to-white">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-slate-500" />
                            CAPA Workflow
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">Corrective and Preventive Actions. Enforce ISO/FDA compliance with structured root cause analysis workflows.</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50 to-white">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-slate-500" />
                            Calibration & Audits
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">Track gauge calibrations, equipment maintenance, and schedule recurring supplier quality audits.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
