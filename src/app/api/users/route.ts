import { NextResponse, NextRequest } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { hashPassword, getUserFromRequest, hasPermission } from '@/lib/auth';
import { checkQuota, quotaErrorResponse } from '@/lib/quotaGuard';

export async function GET(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const allowed = await hasPermission(auth.userId, 'manage_users', prisma);
        if (!allowed) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const users = await prisma.user.findMany({
            where: { username: { not: 'admin' } },  // Hide system admin user
            select: { id: true, username: true, fullName: true, role: true, phone: true, active: true, createdAt: true, permissions: true, deviceToken: true, deviceName: true, deviceBoundAt: true, branchId: true, branch: { select: { id: true, name: true } } },
            orderBy: { id: 'asc' },
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error('Users GET error:', error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const allowed = await hasPermission(auth.userId, 'manage_users', prisma);
        if (!allowed) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية إدارة المستخدمين' }, { status: 403 });

        const body = await request.json();
        const username = String(body.username || '').trim();
        const password = String(body.password || '').trim();
        const fullName = String(body.fullName || '').trim();

        if (!username || !password || !fullName) {
            return NextResponse.json({ error: 'اسم المستخدم وكلمة المرور والاسم الكامل مطلوبة' }, { status: 400 });
        }
        const existing = await prisma.user.findFirst({ 
            where: { 
                username: {
                    equals: username,
                    mode: 'insensitive'
                }
            } 
        });
        if (existing) {
            return NextResponse.json({ error: 'اسم المستخدم موجود مسبقاً' }, { status: 409 });
        }

        // --- Quota Guard (User Limit) ---
        const tenant = request.headers.get('x-tenant');
        if (tenant) {
            const quotaCheck = await checkQuota(tenant, 'user');
            if (!quotaCheck.allowed) return quotaErrorResponse(quotaCheck);
        }
        // -----------------------------------

        const user = await prisma.user.create({
            data: {
                username: username,
                passwordHash: hashPassword(password),
                fullName: fullName,
                role: body.role || 'cashier',
                phone: body.phone?.trim() || null,
                active: true,
                branchId: body.branchId ? parseInt(body.branchId) : null,
                defaultPage: body.defaultPage?.trim() || null,
            },
            select: { id: true, username: true, fullName: true, role: true, phone: true, active: true, createdAt: true, branchId: true, defaultPage: true },
        });

        // ── Default modules by role ──────────────────────────────────
        const DEFAULT_ROLE_MODULES: Record<string, string[]> = {
            // كاشير — نقطة البيع والمبيعات فقط
            cashier: ['pos', 'sales', 'products', 'customers', 'shifts'],
            // المالك — كل شيء (مثل admin)
            owner: [],
            // مدير عام — كل الوحدات
            general_manager: ['pos', 'sales', 'products', 'customers', 'shifts', 'purchases', 'purchase_orders',
                'stock', 'warehouses', 'employees', 'attendance', 'salaries', 'vacations', 'reports',
                'accounting', 'treasury', 'banks', 'expenses', 'manufacturing', 'loyalty', 'settings'],
            // مدير النظام — مثل المالك
            system_admin: [],
            // مراجع / مدقق — مالية + تقارير (قراءة فقط)
            auditor: ['accounting', 'treasury', 'banks', 'expenses', 'reports', 'fixed_assets', 'petty_cash'],
            // محاسب — المالية والحسابات
            accountant: ['accounting', 'treasury', 'banks', 'expenses', 'petty_cash', 'receipt_vouchers',
                'fixed_assets', 'installments', 'reports'],
            // موارد بشرية — HR فقط
            hr: ['employees', 'attendance', 'salaries', 'vacations', 'hr_loans', 'reports'],
            // مندوب مبيعات — مبيعات + عملاء
            sales_rep: ['pos', 'sales', 'price_quotes', 'sales_orders', 'products', 'customers',
                'loyalty', 'sales_routes', 'sales_targets'],
            // مدخل بيانات — مشتريات + مخزون + أصناف
            data_entry: ['products', 'stock', 'warehouses', 'purchases', 'purchase_orders', 'barcode', 'batches'],
            // مدير (fallback)
            manager: ['pos', 'sales', 'products', 'customers', 'shifts', 'purchases', 'stock', 'warehouses',
                       'employees', 'reports', 'accounting', 'treasury', 'banks', 'expenses'],
            admin: [], // admin gets all — handled by role check in sidebar
        };

        const role = body.role || 'cashier';
        const modules = (body.modules && Array.isArray(body.modules) && body.modules.length > 0)
            ? body.modules
            : DEFAULT_ROLE_MODULES[role] || DEFAULT_ROLE_MODULES['cashier'];

        // Only create permissions for non-admin roles (admin has full access by role)
        if (role !== 'admin' && role !== 'owner' && modules.length > 0) {
            for (const mod of modules) {
                await prisma.userPermission.create({
                    data: { userId: user.id, module: mod, canView: true, canAdd: true, canEdit: true, canDelete: true, canPrint: true },
                });
            }
        } else if (body.modules && Array.isArray(body.modules) && body.modules.length > 0) {
            // Admin/owner with explicit modules
            for (const mod of body.modules) {
                await prisma.userPermission.create({
                    data: { userId: user.id, module: mod, canView: true, canAdd: true, canEdit: true, canDelete: true, canPrint: true },
                });
            }
        }

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error('Users POST error:', error);
        return NextResponse.json({ error: 'فشل في إنشاء المستخدم' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const body = await request.json();
        if (!body.id) {
            return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
        }

        if (body.modules || body.permissions) {
            const canPerm = await hasPermission(auth.userId, 'manage_permissions', prisma);
            if (!canPerm) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية تعديل الصلاحيات' }, { status: 403 });
        } else {
            const canUser = await hasPermission(auth.userId, 'manage_users', prisma);
            if (!canUser) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية إدارة المستخدمين' }, { status: 403 });
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = {};
        if (body.fullName) data.fullName = String(body.fullName).trim();
        if (body.role) data.role = String(body.role);
        if (body.phone !== undefined) data.phone = body.phone ? String(body.phone).trim() : null;
        if (body.active !== undefined) data.active = Boolean(body.active);
        if (body.password) data.passwordHash = hashPassword(String(body.password).trim());
        if (body.branchId !== undefined) data.branchId = body.branchId ? parseInt(body.branchId) : null;
        

        const user = await prisma.user.update({
            where: { id: body.id },
            data,
            select: { id: true, username: true, fullName: true, role: true, phone: true, active: true, createdAt: true, permissions: true, branchId: true,  },
        });

        if (body.permissions && Array.isArray(body.permissions)) {
            await prisma.userPermission.deleteMany({ where: { userId: body.id } });
            for (const p of body.permissions) {
                await prisma.userPermission.create({
                    data: { 
                        userId: body.id, 
                        module: p.module, 
                        canView: p.canView ?? false, 
                        canAdd: p.canAdd ?? false, 
                        canEdit: p.canEdit ?? false, 
                        canDelete: p.canDelete ?? false, 
                        canPrint: p.canPrint ?? false 
                    },
                });
            }
        } else if (body.modules && Array.isArray(body.modules)) {
            await prisma.userPermission.deleteMany({ where: { userId: body.id } });
            for (const mod of body.modules) {
                await prisma.userPermission.create({
                    data: { userId: body.id, module: mod, canView: true, canAdd: true, canEdit: true, canDelete: true, canPrint: true },
                });
            }
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Users PUT error:', error);
        return NextResponse.json({ error: 'فشل في تحديث المستخدم' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const allowed = await hasPermission(auth.userId, 'manage_users', prisma);
        if (!allowed) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const userId = Number(searchParams.get('userId'));

        if (action === 'unbind-device' && userId) {
            await prisma.user.update({
                where: { id: userId },
                data: { deviceToken: null, deviceName: null, deviceBoundAt: null },
            });
            return NextResponse.json({ success: true, message: 'تم فك ربط الجهاز بنجاح' });
        }

        return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
    } catch (error) {
        console.error('Users PATCH error:', error);
        return NextResponse.json({ error: 'فشل في العملية' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const prisma = getPrisma(request);
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const allowed = await hasPermission(auth.userId, 'manage_users', prisma);
        if (!allowed) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get('id'));
        if (!id) return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
        if (id === auth.userId) return NextResponse.json({ error: 'لا يمكنك حذف حسابك' }, { status: 400 });

        await prisma.userPermission.deleteMany({ where: { userId: id } });
        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Users DELETE error:', error);
        return NextResponse.json({ error: 'فشل في حذف المستخدم' }, { status: 500 });
    }
}
