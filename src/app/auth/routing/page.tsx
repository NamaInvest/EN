"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CloudCog, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function AuthRouter() {
    const { t } = useTranslation();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [msg, setMsg] = useState(t('sys.str_1572'));

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && session?.user?.email) {
      const checkTenantStatus = async () => {
        try {
          const res = await fetch(`/api/tenant/status?email=${encodeURIComponent(session.user.email!)}`);
          if (!res.ok) throw new Error("Failed to fetch tenant status");
          const data = await res.json();

          if (data.status === "active") {
            setMsg(`مرحباً بك مجدداً! جاري تحويلك إلى نطاقك المخصص: ${data.subdomain}.namainvist.com`);
            setTimeout(() => {
              window.location.href = `https://${data.subdomain}.namainvist.com/login?token=${session.user.email}`;
            }, 1000);
          } else if (data.status === "pending") {
            setMsg(t('sys.str_1573'));
            setTimeout(() => {
              window.location.reload();
            }, 5000);
          } else {
            setMsg(t('sys.str_1574'));
            setTimeout(() => {
              router.replace("/onboarding/zatca");
            }, 800);
          }
        } catch (err) {
          console.error(err);
          setMsg(t('sys.str_1575'));
        }
      };

      checkTenantStatus();
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center p-4 font-sans text-center" dir="rtl">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(10,10,12,0.9),rgba(10,10,12,0.9)),url('data:image/svg+xml;base64,...')] opacity-20"></div>
      <div className="relative z-10 flex flex-col items-center">
        <CloudCog className="w-16 h-16 text-blue-500 mb-6 animate-pulse" />
        <h1 className="text-2xl font-bold text-white mb-2">{t('sys.str_1571')}</h1>
        <div className="flex items-center gap-3 text-blue-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{msg}</span>
        </div>
      </div>
    </div>
  );
}
