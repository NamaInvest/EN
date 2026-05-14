"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { CloudCog, Loader2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function AuthRouter() {
  const { t } = useTranslation();
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [msg, setMsg] = useState(t('sys.str_1572'));

  // [#13] إصلاح: إضافة عداد محاولات بدلاً من reload لا نهائي
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 12; // أقصى 12 محاولة (12 × 5 ثوانٍ = دقيقة واحدة)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/sign-in");
      return;
    }

    if (isLoaded && isSignedIn && user) {
      const email = user.emailAddresses[0]?.emailAddress;
      if(!email) return;

      const checkTenantStatus = async () => {
        try {
          const res = await fetch(`/api/tenant/check-status?email=${encodeURIComponent(email)}`);
          if (!res.ok) throw new Error("Failed to fetch tenant status");
          const data = await res.json();

          if (data.status === "active") {
            setMsg(`مرحباً بك مجدداً! جاري تحويلك إلى نطاقك المخصص: ${data.subdomain}.namainvist.com`);
            setTimeout(() => {
              window.location.href = `https://${data.subdomain}.namainvist.com/sign-in`;
            }, 1000);
          } else if (data.status === "pending") {
            retryCountRef.current += 1;
            if (retryCountRef.current >= MAX_RETRIES) {
              // [#13] بعد دقيقة كاملة من المحاولات، نوقف ونعرض رسالة
              setMsg(t('sys.str_1575') || 'يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.');
            } else {
              setMsg(`${t('sys.str_1573')} (${retryCountRef.current}/${MAX_RETRIES})`);
              setTimeout(() => {
                checkTenantStatus(); // إعادة الاستعلام بدلاً من reload الصفحة بالكامل
              }, 5000);
            }
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
  }, [isLoaded, isSignedIn, user, router, t]);

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
