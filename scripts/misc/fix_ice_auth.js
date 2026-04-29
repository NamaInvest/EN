const fs = require('fs');
let c = fs.readFileSync('src/app/ice/page.tsx', 'utf8');

// Add auth states after the expandedSection state
const stateInsert = `
    // ── Auth State ──
    const [authenticated, setAuthenticated] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);
    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
`;

c = c.replace(
    "const [expandedSection, setExpandedSection] = useState<string | null>(null);",
    "const [expandedSection, setExpandedSection] = useState<string | null>(null);" + stateInsert
);

// Add auth check useEffect before the theme useEffect
const authCheckEffect = `
    // ── Auth Check ──
    useEffect(() => {
        fetch('/api/ice/auth')
            .then(r => r.json())
            .then(d => { setAuthenticated(d.authenticated); setAuthChecking(false); })
            .catch(() => { setAuthenticated(false); setAuthChecking(false); });
    }, []);

    const handleLogin = async () => {
        setLoginLoading(true);
        setLoginError('');
        try {
            const res = await fetch('/api/ice/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: loginUsername, password: loginPassword }),
            });
            const data = await res.json();
            if (data.success) {
                setAuthenticated(true);
            } else {
                setLoginError(data.error || 'فشل تسجيل الدخول');
            }
        } catch { setLoginError('خطأ في الاتصال بالخادم'); }
        finally { setLoginLoading(false); }
    };

    const handleLogout = async () => {
        await fetch('/api/ice/auth', { method: 'DELETE' });
        setAuthenticated(false);
    };

`;

c = c.replace(
    "useEffect(() => {\n        const saved = localStorage.getItem('ice-theme') as ThemeMode;",
    authCheckEffect + "    useEffect(() => {\n        const saved = localStorage.getItem('ice-theme') as ThemeMode;"
);

// Wrap fetchTenants to only run when authenticated
c = c.replace(
    "useEffect(() => { fetchTenants(); }, [fetchTenants]);",
    "useEffect(() => { if (authenticated) fetchTenants(); }, [fetchTenants, authenticated]);"
);

// Add login page and loading screen before the main return
// Find the return statement and add auth gates
const loginPage = `
    // ── Loading ──
    if (authChecking) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-950">
                <style dangerouslySetInnerHTML={{ __html: \`
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Lateef:wght@400;700;900&display=swap');
                    html { font-size: 24px !important; }
                    body { font-family: 'Lateef', sans-serif; }
                \` }} />
                <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    // ── Login Page ──
    if (!authenticated) {
        return (
            <div dir="rtl" className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 relative overflow-hidden">
                <style dangerouslySetInnerHTML={{ __html: \`
                    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Lateef:wght@400;700;900&display=swap');
                    html { font-size: 20px !important; }
                    body, button, input { font-family: 'Lateef', sans-serif; }
                    .font-outfit { font-family: 'Outfit', sans-serif !important; }
                \` }} />
                {/* Background Effects */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[128px]" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[128px]" />
                </div>

                <div className="relative z-10 w-full max-w-md mx-4">
                    {/* Logo */}
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-500/30">
                            <Building2 className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2">محرك نما إنفست</h1>
                        <p className="text-slate-400 text-sm font-bold">Infrastructure Control Engine</p>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6">
                        <div className="text-center">
                            <h2 className="text-xl font-black text-white mb-1">تسجيل الدخول</h2>
                            <p className="text-slate-400 text-xs">أدخل بيانات الدخول للمتابعة</p>
                        </div>

                        {loginError && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-3 text-rose-400 text-sm font-bold text-center">
                                {loginError}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">اسم المستخدم</label>
                                <input
                                    type="text"
                                    value={loginUsername}
                                    onChange={e => setLoginUsername(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                    placeholder="admin"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-base placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">كلمة المرور</label>
                                <input
                                    type="password"
                                    value={loginPassword}
                                    onChange={e => setLoginPassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white text-base placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleLogin}
                            disabled={loginLoading || !loginUsername || !loginPassword}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white text-base font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                            {loginLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                            دخول
                        </button>
                    </div>

                    <p className="text-center text-slate-600 text-xs mt-6 font-bold">
                        Nama Invest Infrastructure Engine v2.0
                    </p>
                </div>
            </div>
        );
    }

`;

c = c.replace(
    "    const T = THEMES[theme];\n    const isLight = theme === 'light';\n\n    return (",
    "    const T = THEMES[theme];\n    const isLight = theme === 'light';\n" + loginPage + "    return ("
);

// Also update the ICE tenants/toggle API to accept ice_token instead of Clerk
// We need to update the verifyOwner in both route files

fs.writeFileSync('src/app/ice/page.tsx', c, 'utf8');
console.log('Done! Added auth system to ICE page.');

// Verify
const hasAuth = c.includes('handleLogin');
const hasLogout = c.includes('handleLogout');
console.log('Has login:', hasAuth, 'Has logout:', hasLogout);
