import { Metadata } from 'next';
import IceLoginForm from './IceLoginForm';

export const metadata: Metadata = {
  title: 'ICE Secure Login',
  description: 'Super Admin Login',
};

/**
 * @description
 * Server component rendering the ICE Super Admin login page.
 * Uses a highly modern, dark-themed, glassmorphic design to reflect the premium nature of the system.
 */
export default function IceLogin() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Background Ornaments */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0066cc]/20 rounded-full blur-[100px]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#14161c]/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8">
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-[#0066cc] to-cyan-500 rounded-2xl shadow-[0_0_30px_rgba(0,102,204,0.4)] flex items-center justify-center mb-6">
              <span className="font-black text-3xl text-white tracking-tighter">I</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight text-center">ICE Control</h1>
            <p className="text-sm text-neutral-400 font-medium text-center mt-2">
              لوحة التحكم المركزية - الوصول مقيد للمصرح لهم فقط
            </p>
          </div>

          <IceLoginForm />
          
        </div>
        
        <p className="text-center text-neutral-600 text-xs font-bold mt-8">
          Nama Invest Security Team © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
