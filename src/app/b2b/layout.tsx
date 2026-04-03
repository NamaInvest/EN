export default function B2BLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fcfcfc', fontFamily: 'system-ui, sans-serif' }}>
            <header style={{ padding: '20px 40px', backgroundColor: '#1a1a2e', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{color: '#3498db'}}>NAMA</span> B2B Portal
                </div>
                <div>بوابة وكلاء الجملة</div>
            </header>
            <main style={{ flex: 1, padding: '40px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                {children}
            </main>
        </div>
    );
}
