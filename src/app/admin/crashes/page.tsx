import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.app.admin.crashe' });

export default async function DesktopCrashesPage() {
  const crashes = await prisma.desktopCrashReport.findMany({
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Desktop Crash Reports</h1>
      
      <div className="space-y-4">
        {crashes.map((crash: any) => (
          <div key={crash.id} className={`border rounded-lg bg-card text-card-foreground shadow-sm ${crash.isResolved ? 'opacity-60' : ''}`}>
            <div className="flex flex-col space-y-1.5 p-6 bg-muted/50 border-b">
              <h3 className="text-lg font-semibold leading-none tracking-tight flex justify-between items-center">
                <span>{crash.errorMessage}</span>
                <span className="text-sm font-normal text-muted-foreground">
                  {new Date(crash.timestamp).toLocaleString()}
                </span>
              </h3>
            </div>
            <div className="p-6 pt-4 space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-muted-foreground">OS:</span>{' '}
                  {crash.osPlatform} ({crash.osRelease})
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Version:</span>{' '}
                  {crash.appVersion}
                </div>
                <div className="col-span-2">
                  <span className="font-semibold text-muted-foreground">Tenant:</span>{' '}
                  <span className="truncate block" title={crash.tenantInfo || 'Unknown'}>
                    {crash.tenantInfo || 'Unknown'}
                  </span>
                </div>
              </div>

              {crash.notes && (
                <div className="mt-2 text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                  <strong>Context:</strong> {crash.notes}
                </div>
              )}

              {crash.stackTrace && (
                <details className="mt-4">
                  <summary className="text-sm cursor-pointer text-blue-600 hover:underline">
                    View Stack Trace
                  </summary>
                  <pre className="mt-2 bg-slate-950 text-slate-50 p-4 rounded-md text-xs overflow-x-auto">
                    {crash.stackTrace}
                  </pre>
                </details>
              )}
            </div>
          </div>
        ))}

        {crashes.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No crash reports found.</p>
        )}
      </div>
    </div>
  );
}
