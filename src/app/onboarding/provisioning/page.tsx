"use client";

import React, { useState, useEffect } from "react";
import { Terminal, Database, Server, CheckSquare, Zap, CloudCog, ShieldCheck } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function SaaSProvisioningTerminal() {
    const { t } = useTranslation();
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [tenantId, setTenantId] = useState("n11");
  const [orgName, setOrgName] = useState(t('sys.str_1583'));
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zatca_pending_org");
      if (saved) setOrgName(saved);
      // Determine next node number (mock logic)
      const mockNodeNumber = Math.floor(Math.random() * 5) + 11; // n11 to n15
      setTenantId(`n${mockNodeNumber}`);
    }

    const sequence = [
      { msg: "[SYSTEM] Authenticated via Google SSO. Master Context: OK.", delay: 500, pg: 5 },
      { msg: `[ZATCA] Validated CRN & VAT 15-digit constraints for '${orgName}'.`, delay: 1200, pg: 15 },
      { msg: `[ALLOCATOR] Querying Hetzner Cloud API for vacant bare-metal slots...`, delay: 2000, pg: 20 },
      { msg: `[ALLOCATOR] Slot acquired. Binding virtual host: ${tenantId}.namainvist.com`, delay: 3500, pg: 35 },
      { msg: `[DB_ENGINE] Bootstrapping isolated PostgreSQL schema 'tenant_${tenantId}'...`, delay: 5000, pg: 50 },
      { msg: `[DB_ENGINE] Applying Prisma Migrations & Core Base Seed...`, delay: 6500, pg: 65 },
      { msg: `[SECURITY] Injecting ZATCA Phase 2 ECDSA Private Key parameters...`, delay: 8000, pg: 75 },
      { msg: `[NGINX] Writing Reverse Proxy configuration on port 80/443...`, delay: 9500, pg: 85 },
      { msg: `[PM2] Spawning daemon process 'namasoft_${tenantId}' (Next.js 15)...`, delay: 11000, pg: 95 },
      { msg: `[SYSTEM] Provisioning complete. Zero-Touch Deploy Success.`, delay: 12500, pg: 100 },
    ];

    sequence.forEach((item) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, item.msg]);
        setProgress(item.pg);
        if (item.pg === 100) {
          setTimeout(() => setCompleted(true), 1000);
        }
      }, item.delay);
    });
  }, [orgName]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-green-400 font-mono flex items-center justify-center p-6 relative overflow-hidden" dir="ltr">
      
      {/* Cinematic Hacker Background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(10,10,12,0.9),rgba(10,10,12,0.9)),url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGgyMHYyMEgwem0xIDEwYTkgOSAwIDExMTggMGE5IDkgMCAwMTgweiIgZmlsbD0icmdiYSgwLCAyNTUsIDAsIDAuMDUpIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-green-500/10 animate-[spin_10s_linear_infinite]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-green-500/20 animate-[spin_15s_linear_infinite_reverse]"></div>

      <div className="w-full max-w-4xl relative z-10">
        
        {/* Modern Terminal Window */}
        <div className="bg-[#0f1115] rounded-xl border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.15)] overflow-hidden backdrop-blur-3xl">
          
          {/* Mac-like Header */}
          <div className="bg-[#1a1d24] px-4 py-3 border-b border-green-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="text-green-500/70 text-xs font-bold tracking-widest uppercase flex items-center gap-2">
              <CloudCog className="w-4 h-4" />
              NamaSoft Automated Provisioner v9.3
            </div>
            <div className="w-10"></div> {/* Spacer */}
          </div>

          <div className="p-8">
            <div className="flex items-center gap-6 mb-8">
               <div className="relative">
                 <Server className={`w-12 h-12 ${completed ? 'text-green-400' : 'text-blue-400 animate-pulse'}`} />
                 {!completed && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>}
               </div>
               <div>
                 <h1 className="text-2xl font-black text-white tracking-tight mb-1">
                   {completed ? `Cluster Node ${tenantId} Online` : `Allocating Cluster Node...`}
                 </h1>
                 <p className="text-sm text-green-500/70">{orgName} is being securely deployed to the Hetzner Grid.</p>
               </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs mb-2 text-green-400/80 font-bold">
                <span>SYSTEM ZERO-TOUCH PROGRESS</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-green-500/20">
                <div 
                  className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]" />
                </div>
              </div>
            </div>

            {/* Logs Area */}
            <div className="bg-black/50 rounded-lg p-4 font-mono text-sm leading-relaxed border border-green-500/10 min-h-[250px] shadow-inner">
               {logs.map((log, index) => (
                 <div key={index} className="flex gap-3 mb-1 opacity-90 animate-in slide-in-from-bottom-2 fade-in">
                   <span className="text-slate-500 select-none">[{new Date().toISOString().split('T')[1].substring(0,8)}]</span>
                   <span className={
                     log.includes("Success") || !!log.match(/OK|complete/i) ? "text-green-400" :
                     log.includes("ZATCA") ? "text-fuchsia-400" :
                     log.includes("Allocating") || log.includes("tenant") ? "text-blue-400" :
                     "text-emerald-300"
                   }>{log}</span>
                 </div>
               ))}
               {!completed && (
                 <div className="flex gap-3 mt-2">
                   <span className="text-slate-600 select-none">{'>'}</span>
                   <span className="w-2 h-4 bg-green-400 animate-pulse inline-block"></span>
                 </div>
               )}
            </div>

            {/* Completion Actions */}
            <div className={`mt-8 transition-all duration-1000 ${completed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
               <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start justify-between">
                 <div className="flex items-center gap-4">
                   <div className="p-2 bg-green-500/20 rounded-lg"><ShieldCheck className="text-green-400 w-8 h-8" /></div>
                   <div>
                     <h3 className="text-white font-bold text-lg font-sans">Operation Successful</h3>
                     <p className="text-green-500/80 text-sm font-sans">Your new administrative domain is resolving instantly.</p>
                   </div>
                 </div>
                 <button 
                   onClick={() => window.location.href = '/login'}
                   className="px-6 py-3 rounded-lg bg-green-500 hover:bg-green-400 text-black font-extrabold font-sans transition-all transform hover:scale-105"
                 >
                   Login to {tenantId.toUpperCase()} Dashboard
                 </button>
               </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
