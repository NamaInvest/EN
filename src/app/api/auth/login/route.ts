import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const username = String(body.username || '').trim();
        const password = String(body.password || '').trim();
        const deviceToken = body.deviceToken;
        const deviceName = body.deviceName;

        if (!username || !password) {
            return NextResponse.json(
                { error: 'اسم المستخدم وكلمة المرور مطلوبان' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findFirst({
            where: { 
                username: {
                    equals: username,
                    mode: 'insensitive'
                }
            },
            include: { permissions: true },
        });

        if (!user || !user.active) {
            return NextResponse.json(
                { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
                { status: 401 }
            );
        }

        const isValid = comparePassword(password, user.passwordHash);
        if (!isValid) {
            return NextResponse.json(
                { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
                { status: 401 }
            );
        }

        // === Device Binding Logic ===
        // Admin is exempt from device binding
        if (user.role !== 'admin' && deviceToken) {
            if (user.deviceToken && user.deviceToken !== deviceToken) {
                // User is bound to a different device
                return NextResponse.json(
                    { error: 'هذا الحساب مربوط بجهاز آخر. تواصل مع المدير لفك الربط.' },
                    { status: 403 }
                );
            }

            // First login or same device — bind/update
            if (!user.deviceToken) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        deviceToken,
                        deviceName: deviceName || 'Unknown',
                        deviceBoundAt: new Date(),
                    },
                });
            }
        }

        const token = generateToken({
            userId: user.id,
            username: user.username,
            role: user.role,
        });

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                permissions: user.permissions,
            },
        });
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        const errStack = error instanceof Error ? error.stack : '';
        console.error('Login error:', errMsg);
        console.error('Login stack:', errStack);
        return NextResponse.json(
            { error: 'حدث خطأ في الخادم' },
            { status: 500 }
        );
    }
}
