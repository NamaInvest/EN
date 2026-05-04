'use client';

export default function MasterPanelLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#0B0E14] text-white font-sans selection:bg-blue-500/30 cursor-default" dir="rtl">
            {/* Dedicated SaaS Admin Header */}
            <nav className="bg-[#11131a] border-b border-white/5 px-8 py-5 flex justify-between items-center sticky top-0 z-50 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center font-black text-2xl shadow-[0_0_30px_rgba(37,99,235,0.4)] border border-blue-400/20 flex-shrink-0">
                        🛡️
                    </div>
                    <div>
                        <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 tracking-tight">نظام التحكم السيادي (SaaS)</h1>
                        <p className="text-xs text-blue-400 font-bold tracking-widest mt-0.5 uppercase">Super Administrator Console</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex text-sm text-neutral-400 items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                        <span className="font-mono text-xs tracking-wider">NETWORK: SECURE [N1]</span>
                    </div>
                    
                    <a 
                        href="/"
                        className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-bold transition-all border border-white/10 hover:border-white/20 hover:scale-105 active:scale-95"
                    >
                        العودة للموقع
                    </a>
                    
                    <button 
                         onClick={() => {
                            document.cookie = "namainvist_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                            window.location.href = "/login";
                         }}
                         className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-bold transition-all border border-red-500/30 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:scale-105 active:scale-95"
                    >
                        تسجيل الخروج
                    </button>
                </div>
            </nav>
            
            {/* Isolated Main Content Zone */}
            <main className="p-4 sm:p-8 lg:p-10 animate-fade-in">
                {children}
            </main>

            <style jsx global>{`
                @keyframes fade-in {
                    0% { opacity: 0; transform: translateY(10px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </div>
    );
}
