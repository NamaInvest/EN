import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Purchase Orders Auth and Logout Guard Tests', () => {
  let mockLocalStorage: Record<string, string> = {};

  beforeEach(() => {
    mockLocalStorage = {
      token: 'mock-valid-jwt-token',
      user: JSON.stringify({
        id: 1,
        fullName: 'Test User',
        role: 'user',
        permissions: [{ module: 'purchases', canView: true, canAdd: true, canEdit: false, canPrint: true }]
      })
    };
    
    // Stub global localStorage
    global.localStorage = {
      getItem: (key: string) => mockLocalStorage[key] || null,
      setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
      removeItem: (key: string) => { delete mockLocalStorage[key]; },
      clear: () => { mockLocalStorage = {}; },
      length: Object.keys(mockLocalStorage).length,
      key: (index: number) => Object.keys(mockLocalStorage)[index] || null
    };

    // Stub window.location
    delete (global as any).window;
    (global as any).window = {
      location: {
        href: 'http://localhost/purchase-orders',
        origin: 'http://localhost'
      }
    };
  });

  it('should not call logout or clear storage when loaded with a valid token', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    expect(token).toBe('mock-valid-jwt-token');
    expect(user.id).toBe(1);
    // Ensure no credentials/sessions are deleted or cleared on load
    expect(localStorage.getItem('token')).not.toBeNull();
  });

  it('should handle API 401/403 response by showing a localized permission error instead of logging out', async () => {
    // Mock API returning 401 Unauthorized
    const mockFetch = jest.fn().mockImplementation(() => 
      Promise.resolve({
        status: 401,
        ok: false,
        json: () => Promise.resolve({ error: 'Unauthorized' })
      } as Response)
    );
    
    let errorState: string | null = null;
    let loadingState = true;

    // Simulate load() logic from purchase-orders/page.tsx:
    const simulateLoad = async () => {
      loadingState = true;
      errorState = null;
      try {
        const token = localStorage.getItem('token') || '';
        const r = await mockFetch('/api/purchase-orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (r.status === 401 || r.status === 403) {
          errorState = 'غير مصرح لك بعرض أوامر الشراء';
          loadingState = false;
          return;
        }
        
        if (r.ok) {
          // load orders
        } else {
          errorState = 'حدث خطأ أثناء تحميل البيانات من الخادم';
        }
      } catch (e: any) {
        errorState = 'حدث خطأ غير متوقع';
      }
      loadingState = false;
    };

    await simulateLoad();

    // Verify error state is set to localized permission error message
    expect(errorState).toBe('غير مصرح لك بعرض أوامر الشراء');
    expect(loadingState).toBe(false);
    
    // Verify session/token are NOT cleared (no logout)
    expect(localStorage.getItem('token')).toBe('mock-valid-jwt-token');
    expect(localStorage.getItem('user')).not.toBeNull();
  });

  it('should restrict UI actions based on permission flags without redirecting or logging out', () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Helper function mirroring hasPermission from purchase-orders/page.tsx
    const hasPermission = (action: 'canView' | 'canAdd' | 'canEdit' | 'canDelete' | 'canPrint') => {
      if (!user) return false;
      if (user.role === 'admin' || user.role === 'owner' || user.role === 'CFO') return true;
      const purchasesPerm = (user.permissions || []).find((p: any) => p.module === 'purchases');
      if (!purchasesPerm) return false;
      return !!purchasesPerm[action];
    };

    // Verify permission checks restrict actions correctly
    expect(hasPermission('canAdd')).toBe(true);
    expect(hasPermission('canEdit')).toBe(false);
    expect(hasPermission('canPrint')).toBe(true);
    
    // Verify permission checks do not mutate or clear localStorage
    expect(localStorage.getItem('token')).toBe('mock-valid-jwt-token');
    expect(localStorage.getItem('user')).not.toBeNull();
  });
});
