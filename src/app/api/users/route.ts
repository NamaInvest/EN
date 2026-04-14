import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, getUserFromRequest, hasPermission } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const allowed = await hasPermission(auth.userId, 'manage_users');
        if (!allowed) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const users = await prisma.user.findMany({
            select: { id: true, username: true, fullName: true, role: true, phone: true, active: true, createdAt: true, permissions: true, deviceToken: true, deviceName: true, deviceBoundAt: true, branchId: true, defaultPage: true, branch: { select: { id: true, name: true } } },
            orderBy: { id: 'asc' },
        });
        return NextResponse.json(users);
    } catch (error) {
        console.error('Users GET error:', error);
        return NextResponse.json([], { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const allowed = await hasPermission(auth.userId, 'manage_users');
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
        const user = await prisma.user.create({
            data: {
                username: username,
                passwordHash: hashPassword(password),
                fullName: fullName,
                role: body.role || 'cashier',
                phone: body.phone?.trim() || null,
                active: true,
                branchId: body.branchId ? parseInt(body.branchId) : null,
                defaultPage: body.defaultPage || null,
            },
            select: { id: true, username: true, fullName: true, role: true, phone: true, active: true, createdAt: true, branchId: true, defaultPage: true },
        });

        if (body.modules && Array.isArray(body.modules)) {
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
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

        const body = await request.json();
        if (!body.id) {
            return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
        }

        if (body.modules) {
            const canPerm = await hasPermission(auth.userId, 'manage_permissions');
            if (!canPerm) return NextResponse.json({ error: 'غير مصرح - تحتاج صلاحية تعديل الصلاحيات' }, { status: 403 });
        } else {
            const canUser = await hasPermission(auth.userId, 'manage_users');
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
        if (body.defaultPage !== undefined) data.defaultPage = body.defaultPage || null;

        const user = await prisma.user.update({
            where: { id: body.id },
            data,
            select: { id: true, username: true, fullName: true, role: true, phone: true, active: true, createdAt: true, permissions: true, branchId: true, defaultPage: true },
        });

        if (body.modules && Array.isArray(body.modules)) {
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
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const allowed = await hasPermission(auth.userId, 'manage_users');
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
    try {
        const auth = getUserFromRequest(request);
        if (!auth) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
        const allowed = await hasPermission(auth.userId, 'manage_users');
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
