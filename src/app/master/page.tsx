"use client";

import React, { useState, useEffect } from "react";
import { Server, Activity, Power, RefreshCw, Key, ShieldAlert, Cpu, Database, Globe } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function MasterControlPanel() {
    const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [nodes, setNodes] = useState<{ id: string; status: string; pm2_env: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([]);

  useEffect(() => {
    if (localStorage.getItem("master_auth") === "true") {
      setAuthenticated(true);
      fetchNodes();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "namamaster") {
      localStorage.setItem("master_auth", "true");
      setAuthenticated(true);
      fetchNodes();
    } else {
      logAction(`[AUTH ERROR] ${t('sys.str_164')}`);
    }
  };

  const fetchNodes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status" })
      });
      const data = await res.json();
      if (data.success && data.nodes) {
        setNodes(data.nodes);
        logAction("Fetched live node statuses from global PM2 daemon.");
      }
    } catch (err) {
      logAction("Failed to fetch node statuses.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (nodeId: string, actionCmd: string) => {
    logAction(`Sending command '${actionCmd}' to ${nodeId}...`);
    try {
      const res = await fetch("/api/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionCmd, target: nodeId })
      });
      const data = await res.json();
      if (data.success) {
        logAction(`[SUCCESS] ${nodeId}: ${data.output}`);
        setTimeout(fetchNodes, 1500);
      } else {
        logAction(`[ERROR] ${nodeId}: ${data.error}`);
      }
    } catch (err) {
      logAction(`[ERROR] Connection lost while communicating with supervisor.`);
    }
  };

  const logAction = (msg: string) => {
    setActionLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500"></div>
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
               <ShieldAlert className="text-red-500 w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">{t('sys.str_156')}</h1>
          <p className="text-slate-400 text-sm text-center mb-8">{t('sys.str_157')}</p>
          
          <form onSubmit={handleLogin}>
            <div className="mb-6 relative">
              <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                type="password" 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pr-12 pl-4 text-white focus:outline-none focus:border-red-500 transition-colors"
                placeholder={t('sys.str_165')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-red-500/25">
              {t('sys.str_158')}</button>
          </form>
        </div>
      </div>
    );
  }

  // Pre-fill nodes n1 to n15 even if PM2 doesn't return them all (so they can be provisioned/viewed)
  const displayNodes = Array.from({ length: 15 }, (_, i) => {
    const id = `n${i + 1}`;
    const liveNode = nodes.find(n => n.id === id);
    return liveNode || { id, status: "offline", pm2_env: {} };
  });

  return (
    <div className="min-h-screen bg-[#0b1121] text-slate-300 font-sans p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
              <Server className="text-indigo-400 w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{t('sys.str_159')}</h1>
              <p className="text-indigo-400/80 text-sm font-medium mt-1">SaaS Infrastructure Hypervisor</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={fetchNodes} className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors border border-slate-700">
              <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              {t('sys.str_160')}</button>
            <button onClick={() => { localStorage.removeItem("master_auth"); setAuthenticated(false); }} className="flex items-center px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-sm font-semibold transition-colors border border-red-500/20">
              <Power className="w-4 h-4 ml-2" />
              {t('sys.str_77')}</button>
          </div>
        </div>

        {/* Console / Logs */}
        <div className="mb-8 bg-black/60 rounded-xl p-4 border border-slate-800 font-mono text-xs h-32 overflow-y-auto">
          {actionLog.map((log, i) => (
            <div key={i} className={`mb-1 ${log.includes('ERROR') ? 'text-red-400' : log.includes('SUCCESS') ? 'text-green-400' : 'text-slate-500'}`}>
              {log}
            </div>
          ))}
          {actionLog.length === 0 && <span className="text-slate-600">Waiting for supervisor commands...</span>}
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayNodes.map((node) => {
            const isOnline = node.status === "online";
            return (
              <div key={node.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg hover:border-indigo-500/30 transition-colors group">
                <div className="px-5 py-4 flex justify-between items-center border-b border-slate-800/80 bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${isOnline ? 'bg-emerald-500 text-emerald-500' : 'bg-red-500 text-red-500'}`}></div>
                    <span className="font-bold text-white text-lg tracking-wider uppercase">{node.id}</span>
                  </div>
                  <div className="text-xs font-mono px-2 py-1 rounded bg-black/50 text-slate-400 border border-slate-800 border-dashed">
                    .namainvist.com
                  </div>
                </div>
                
                <div className="p-5">
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 flex items-center"><Cpu className="w-4 h-4 ml-2" /> PM2 Process</span>
                      <span className={`font-mono ${isOnline ? 'text-emerald-400' : 'text-slate-600'}`}>{isOnline ? 'Active' : 'Unallocated'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 flex items-center"><Database className="w-4 h-4 ml-2" /> Database</span>
                      <span className="text-indigo-400 font-mono">tenant_{node.id}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 flex items-center"><Activity className="w-4 h-4 ml-2" /> Next.js Host</span>
                      <span className="text-slate-300 font-mono">Port {(3000 + parseInt(node.id.replace('n','')) - 1) || 3000}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <button 
                      onClick={() => handleAction(node.id, "restart")}
                      className="flex items-center justify-center px-2 py-2.5 bg-slate-800 hover:bg-emerald-600/20 hover:text-emerald-400 text-slate-300 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-emerald-500/30"
                    >
                      <RefreshCw className="w-3.5 h-3.5 ml-1.5" /> {t('sys.str_161')}</button>
                    <button 
                      onClick={() => handleAction(node.id, "stop")}
                      className="flex items-center justify-center px-2 py-2.5 bg-slate-800 hover:bg-red-600/20 hover:text-red-400 text-slate-300 rounded-lg text-xs font-bold transition-all border border-transparent hover:border-red-500/30"
                    >
                      <Power className="w-3.5 h-3.5 ml-1.5" /> {t('sys.str_162')}</button>
                    <button 
                      onClick={() => window.open(`https://${node.id}.namainvist.com`, '_blank')}
                      className="col-span-2 flex items-center justify-center px-2 py-2.5 bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/20 text-indigo-400 hover:text-white rounded-lg text-xs font-bold transition-all mt-1"
                    >
                      <Globe className="w-3.5 h-3.5 ml-1.5" /> {t('sys.str_163')}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
