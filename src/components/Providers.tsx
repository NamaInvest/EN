"use client";

// We no longer need next-auth SessionProvider since we use Clerk
export function Providers({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
