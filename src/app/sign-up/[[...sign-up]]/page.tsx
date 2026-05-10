import { SignUp } from "@clerk/nextjs";
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.app.sign-up....s' });

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignUp />
    </div>
  );
}
