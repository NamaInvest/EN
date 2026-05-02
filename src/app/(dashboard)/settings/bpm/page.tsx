'use client';

import React from 'react';
import { GitMerge, Plus, Play, Settings, Shield, Clock, Users, ArrowRight } from 'lucide-react';

export default function BPMDashboard() {
    return (
        <div className="p-6 h-[calc(100vh-64px)] flex flex-col bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between items-center pb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
                        <GitMerge className="w-8 h-8 mr-3 text-emerald-600" />
                        BPM & Workflow Engine
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Design visual workflows, multi-level approvals, and SLA escalations</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        New Workflow
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Active Workflows</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-mono mt-1">12</h3>
                    </div>
                    <GitMerge className="w-8 h-8 text-emerald-500 opacity-20" />
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Running Instances</p>
                        <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono mt-1">84</h3>
                    </div>
                    <Play className="w-8 h-8 text-blue-500 opacity-20" />
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
                        <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400 font-mono mt-1">45</h3>
                    </div>
                    <Users className="w-8 h-8 text-orange-500 opacity-20" />
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-lg border border-red-200 dark:border-red-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-400">SLA Breached</p>
                        <h3 className="text-2xl font-bold text-red-900 dark:text-red-300 font-mono mt-1">3</h3>
                    </div>
                    <Clock className="w-8 h-8 text-red-600 opacity-20" />
                </div>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                
                {/* Left: Workflows List */}
                <div className="w-1/3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Workflow Definitions</h3>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        
                        <div className="p-3 border border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 rounded-md cursor-pointer">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">Purchase Order Approval</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">Active (v2)</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">Trigger: ON_CREATE (PurchaseOrder)</p>
                            <div className="flex text-xs text-gray-500 space-x-3">
                                <span><Users className="w-3 h-3 inline mr-1" /> 2 Steps</span>
                                <span><Play className="w-3 h-3 inline mr-1" /> 14 Running</span>
                            </div>
                        </div>

                        <div className="p-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md cursor-pointer">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">CapEx Request</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 uppercase tracking-wide">Draft (v1)</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">Trigger: MANUAL</p>
                            <div className="flex text-xs text-gray-500 space-x-3">
                                <span><Users className="w-3 h-3 inline mr-1" /> 4 Steps</span>
                                <span><Play className="w-3 h-3 inline mr-1" /> 0 Running</span>
                            </div>
                        </div>

                        <div className="p-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-md cursor-pointer">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">Leave Request</span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wide">Active (v5)</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">Trigger: ON_CREATE (LeaveRequest)</p>
                            <div className="flex text-xs text-gray-500 space-x-3">
                                <span><Users className="w-3 h-3 inline mr-1" /> 2 Steps</span>
                                <span><Play className="w-3 h-3 inline mr-1" /> 45 Running</span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Right: Visual Canvas (Simulated) */}
                <div className="w-2/3 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex flex-col overflow-hidden relative">
                    <div className="p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center z-10">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Purchase Order Approval (Designer)</h3>
                        <div className="flex space-x-2">
                            <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded dark:hover:bg-gray-700"><Settings className="w-4 h-4" /></button>
                        </div>
                    </div>
                    
                    {/* Simulated Nodes Canvas */}
                    <div className="flex-1 p-8 relative overflow-auto bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] dark:bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')] bg-opacity-20 dark:bg-opacity-5">
                        
                        <div className="flex flex-col items-center space-y-8">
                            
                            {/* Start Node */}
                            <div className="w-12 h-12 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 shadow-sm z-10 relative">
                                <Play className="w-5 h-5 ml-1" />
                            </div>

                            {/* Line */}
                            <div className="h-8 w-0.5 bg-gray-400 absolute top-[48px]"></div>

                            {/* Condition Node */}
                            <div className="w-48 p-3 bg-white dark:bg-gray-800 border border-orange-300 rounded shadow-md z-10 text-center relative">
                                <div className="text-xs font-bold text-orange-600 mb-1">CONDITION</div>
                                <div className="text-sm text-gray-800 dark:text-gray-200">Amount &gt; 50,000 SAR?</div>
                            </div>

                            {/* Fork Lines (Simulated with absolute positioning) */}
                            <div className="w-64 h-8 border-t-2 border-l-2 border-r-2 border-gray-400 absolute top-[180px] z-0"></div>

                            <div className="flex space-x-16 w-full justify-center relative mt-8 z-10">
                                {/* Left Branch (No) */}
                                <div className="flex flex-col items-center">
                                    <div className="bg-gray-100 text-gray-500 text-[10px] px-1 mb-2 font-bold absolute -top-4 -ml-24">NO</div>
                                    <div className="w-48 p-3 bg-white dark:bg-gray-800 border-l-4 border-blue-500 rounded shadow-md text-left">
                                        <div className="text-xs font-bold text-blue-600 mb-1 flex items-center"><Users className="w-3 h-3 mr-1"/> TASK</div>
                                        <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">Direct Manager Approval</div>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> SLA: 24h</div>
                                    </div>
                                </div>

                                {/* Right Branch (Yes) */}
                                <div className="flex flex-col items-center">
                                    <div className="bg-gray-100 text-gray-500 text-[10px] px-1 mb-2 font-bold absolute -top-4 ml-24">YES</div>
                                    <div className="w-48 p-3 bg-white dark:bg-gray-800 border-l-4 border-purple-500 rounded shadow-md text-left mb-6">
                                        <div className="text-xs font-bold text-purple-600 mb-1 flex items-center"><Shield className="w-3 h-3 mr-1"/> TASK</div>
                                        <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">Finance Director Approval</div>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> SLA: 48h</div>
                                    </div>
                                    <div className="w-0.5 h-6 bg-gray-400 mb-6"></div>
                                    <div className="w-48 p-3 bg-white dark:bg-gray-800 border-l-4 border-red-500 rounded shadow-md text-left">
                                        <div className="text-xs font-bold text-red-600 mb-1 flex items-center"><Shield className="w-3 h-3 mr-1"/> TASK</div>
                                        <div className="text-sm text-gray-800 dark:text-gray-200 font-medium">CEO Approval</div>
                                        <div className="text-xs text-gray-500 mt-1 flex items-center"><Clock className="w-3 h-3 mr-1"/> SLA: 72h</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
