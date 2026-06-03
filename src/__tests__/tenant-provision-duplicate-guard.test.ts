/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
import { POST } from '@/app/api/tenant/provision/route';
import { provisioningLocks } from '@/lib/tenant/provisioning-guard';
import { NextRequest } from 'next/server';

// Mock seed-socpa-coa to prevent DB calls
jest.mock('@/lib/seed-socpa-coa', () => {
  return {
    seedSocpaCoA: jest.fn().mockResolvedValue(true),
  };
});

// Mock translateArToEn to avoid HTTP calls
jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    ...actual,
  };
});

// Mock ssh2
jest.mock('ssh2', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        on: jest.fn().mockImplementation((event: string, callback: any) => {
          if (event === 'ready') {
            setTimeout(callback, 10);
          }
          return {
            on: jest.fn(),
            connect: jest.fn(),
          };
        }),
        connect: jest.fn(),
        exec: jest.fn().mockImplementation((cmd: string, callback: any) => {
          const mockStream = {
            on: jest.fn().mockImplementation((event: string, cb: any) => {
              if (event === 'data') {
                cb(Buffer.from('[DONE]'));
              }
              if (event === 'close') {
                setTimeout(cb, 10);
              }
            }),
            stderr: {
              on: jest.fn(),
            },
          };
          callback(null, mockStream);
        }),
        end: jest.fn(),
      };
    }),
  };
});

// Setup mock Prisma Client
const mockFindUnique = jest.fn();
const mockUpsert = jest.fn();
const mockCreateLicense = jest.fn();

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  return {
    ...actual,
    PrismaClient: jest.fn().mockImplementation(() => {
      const client: any = {
        tenantAccount: {
          findUnique: mockFindUnique,
          upsert: mockUpsert,
        },
        desktopLicense: {
          create: mockCreateLicense,
        },
        setting: {
          upsert: jest.fn().mockResolvedValue({}),
        },
        user: {
          upsert: jest.fn().mockResolvedValue({}),
        },
        company: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 1 }),
        },
        branch: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 1 }),
        },
        stock: {
          create: jest.fn().mockResolvedValue({}),
        },
        customer: {
          create: jest.fn().mockResolvedValue({}),
        },
        unit: {
          createMany: jest.fn().mockResolvedValue({}),
        },
        $use: jest.fn(),
        $disconnect: jest.fn().mockResolvedValue({}),
      };
      client.$extends = jest.fn().mockImplementation(() => client);
      return client;
    }),
  };
});

describe('Tenant Provisioning Duplicate Guard API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    provisioningLocks.clear();
  });

  const validBody = {
    companyNameAr: 'شركة جديدة',
    companyNameEn: 'New Company',
    businessDomain: 'retail',
    branchName: 'الفرع الرئيسي',
    mobile: '0500000000',
    city: 'الرياض',
    subdomain: 'new-subdomain',
    clerkUserId: 'user_123',
    clerkEmail: 'user@example.com',
  };

  it('allows provisioning if subdomain and user are unique', async () => {
    mockFindUnique.mockResolvedValue(null); // Subdomain and user do not exist
    mockUpsert.mockResolvedValue({ id: 1, subdomain: 'new-subdomain' });
    mockCreateLicense.mockResolvedValue({});

    const req = new NextRequest('http://localhost/api/tenant/provision', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.subdomain).toBe('new-subdomain');
  });

  it('rejects if subdomain already exists in Master DB', async () => {
    // Mock existing subdomain record
    mockFindUnique.mockImplementation(({ where }) => {
      if (where.subdomain === 'new-subdomain') {
        return Promise.resolve({ id: 99, subdomain: 'new-subdomain' });
      }
      return Promise.resolve(null);
    });

    const req = new NextRequest('http://localhost/api/tenant/provision', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('SUBDOMAIN_ALREADY_EXISTS');
    expect(body.message).toContain('محجوز بالفعل');
  });

  it('rejects if clerkEmail already has a tenant', async () => {
    mockFindUnique.mockImplementation(({ where }) => {
      if (where.userEmail === 'user@example.com') {
        return Promise.resolve({ id: 99, userEmail: 'user@example.com' });
      }
      return Promise.resolve(null);
    });

    const req = new NextRequest('http://localhost/api/tenant/provision', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('USER_ALREADY_HAS_TENANT');
    expect(body.message).toContain('بالفعل لهذا البريد');
  });

  it('rejects if clerkUserId already has a tenant', async () => {
    mockFindUnique.mockImplementation(({ where }) => {
      if (where.clerkUserId === 'user_123') {
        return Promise.resolve({ id: 99, clerkUserId: 'user_123' });
      }
      return Promise.resolve(null);
    });

    const req = new NextRequest('http://localhost/api/tenant/provision', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('USER_ALREADY_HAS_TENANT');
    expect(body.message).toContain('بالفعل لهذا المستخدم');
  });

  it('rejects concurrent requests for the same subdomain using memory lock', async () => {
    mockFindUnique.mockResolvedValue(null);

    // Manually lock it first
    provisioningLocks.add('new-subdomain');

    const req = new NextRequest('http://localhost/api/tenant/provision', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('PROVISIONING_IN_PROGRESS');
  });

  it('sanitizes DB setup failure output and does not leak logs/secrets to user', async () => {
    mockFindUnique.mockResolvedValue(null);
    // Mock runDbSetupViaSsh failing by mocking ssh2 to trigger mock stream error or empty DONE
    jest.spyOn(require('ssh2'), 'Client').mockImplementationOnce(() => {
      return {
        on: jest.fn().mockImplementation((event: string, callback: any) => {
          if (event === 'ready') {
            setTimeout(callback, 10);
          }
          return {};
        }),
        connect: jest.fn(),
        exec: jest.fn().mockImplementation((cmd: string, callback: any) => {
          const mockStream = {
            on: jest.fn().mockImplementation((event: string, cb: any) => {
              if (event === 'data') {
                cb(Buffer.from('Error: connection timed out or auth failed'));
              }
              if (event === 'close') {
                setTimeout(cb, 10);
              }
            }),
            stderr: {
              on: jest.fn(),
            },
          };
          callback(null, mockStream);
        }),
        end: jest.fn(),
      } as any;
    });

    const req = new NextRequest('http://localhost/api/tenant/provision', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('DATABASE_CREATION_FAILED');
    // Ensure no SSH output or debug logs containing commands/secrets are leaked
    expect(body.debug).toBeUndefined();
    expect(body.message).toBe('فشل إعداد قاعدة البيانات. يرجى المحاولة مرة أخرى.');
  });
});
