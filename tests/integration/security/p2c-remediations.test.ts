import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let mockUserId: string | null = null;

vi.mock('@/lib/auth', () => {
  return {
    getUserFromRequest: vi.fn().mockImplementation(() => {
      if (!mockUserId) return null;
      return {
        userId: 1,
        username: 'test-user',
        role: 'user',
        tenantId: 'local',
      };
    }),
    hashPassword: vi.fn(),
    comparePassword: vi.fn(),
    generateToken: vi.fn(),
    verifyToken: vi.fn(),
    getTokenFromRequest: vi.fn(),
  };
});

vi.mock('@clerk/nextjs/server', () => {
  return {
    auth: vi.fn().mockImplementation(() => Promise.resolve({ userId: mockUserId })),
  };
});

// Mock fs/promises writeFile and mkdir to prevent writing files during tests
vi.mock('fs/promises', () => {
  return {
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock path and fs to avoid throwing errors about directory existence
vi.mock('fs', () => {
  return {
    existsSync: vi.fn().mockReturnValue(true),
  };
});

describe('Wave P2-C: File Upload Magic-Bytes Verification Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserId = null;
  });

  it('rejects file upload when user is unauthorized', async () => {
    const { POST } = await import('@/app/api/upload/route');
    mockUserId = null; // Unauthorized

    const req = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('rejects upload when file is missing', async () => {
    const { POST } = await import('@/app/api/upload/route');
    mockUserId = 'user-1';

    const formData = new FormData();
    const req = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('لم يتم إرسال ملف');
  });

  it('rejects file upload when size exceeds 2MB', async () => {
    const { POST } = await import('@/app/api/upload/route');
    mockUserId = 'user-1';

    const largeBuffer = Buffer.alloc(3 * 1024 * 1024); // 3MB
    const file = new File([largeBuffer], 'photo.png', { type: 'image/png' });

    const formData = new FormData();
    formData.append('file', file);

    const req = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('حجم الملف يتجاوز 2MB');
  });

  it('rejects file upload when MIME type is not allowed', async () => {
    const { POST } = await import('@/app/api/upload/route');
    mockUserId = 'user-1';

    const file = new File(['code content'], 'malicious.exe', { type: 'application/octet-stream' });
    const formData = new FormData();
    formData.append('file', file);

    const req = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('نوع الملف غير مدعوم');
  });

  it('rejects file upload when client MIME type is spoofed (invalid Magic Bytes)', async () => {
    const { POST } = await import('@/app/api/upload/route');
    mockUserId = 'user-1';

    // Disguised script file as image/png but actual bytes are not PNG
    const maliciousBytes = Buffer.from('console.log("hello malicious world");');
    const file = new File([maliciousBytes], 'spoofed.png', { type: 'image/png' });

    const formData = new FormData();
    formData.append('file', file);

    const req = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('نوع الملف الفعلي غير مدعوم أو غير متطابق');
  });

  it('accepts file upload when actual Magic Bytes match PNG format', async () => {
    const { POST } = await import('@/app/api/upload/route');
    mockUserId = 'user-1';

    // PNG Magic Bytes: 89 50 4e 47
    const validPngBytes = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const file = new File([validPngBytes], 'photo.png', { type: 'image/png' });

    const formData = new FormData();
    formData.append('file', file);

    const req = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.url).toContain('/uploads/');
  });

  it('accepts file upload when actual Magic Bytes match JPEG format', async () => {
    const { POST } = await import('@/app/api/upload/route');
    mockUserId = 'user-1';

    // JPEG Magic Bytes: FF D8 FF
    const validJpegBytes = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46]);
    const file = new File([validJpegBytes], 'photo.jpg', { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('file', file);

    const req = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: formData,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.url).toContain('/uploads/');
  });
});
