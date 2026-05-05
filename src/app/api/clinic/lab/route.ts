import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const orders = await prisma.labOrder.findMany({
            include: {
                patient: true,
                doctor: true,
                results: {
                    include: {
                        // test relation is missing in the schema LabResult -> LabTest ? 
                        // wait, let me just return results
                    }
                }
            },
            orderBy: {
                date: 'desc'
            },
            take: 50
        });

        // I'll manually stitch LabTest since relation might not be defined explicitly in LabResult include 
        // if not added properly, but I did add `testId` map.
        // Actually to be safe from Prisma TS errors if relation is missing, I'll fetch tests separately
        const testsList = await prisma.labTest.findMany();
        
        // Enhance orders with test details
        const enhancedOrders = orders.map((order: any) => ({
            ...order,
            results: order.results.map((r: any) => ({
                ...r,
                test: testsList.find((t: any) => t.id === r.testId)
            }))
        }));

        const doctors = await prisma.employee.findMany({ take: 10 });
        const patients = await prisma.customer.findMany({ take: 20 });
        const labTests = testsList;

        return NextResponse.json({
            success: true,
            data: {
                orders: enhancedOrders,
                metadata: { doctors, patients, labTests }
            }
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        const order = await prisma.labOrder.create({
            data: {
                patientId: Number(body.patientId),
                doctorId: Number(body.doctorId),
                notes: body.notes,
                status: 'PENDING',
                results: {
                    create: body.testIds.map((testId: any) => ({
                        testId: Number(testId),
                        value: '', // To be filled later
                        isAbnormal: false
                    }))
                }
            },
            include: {
                results: true
            }
        });

        return NextResponse.json({
            success: true,
            data: order,
            message: 'تم إنشاء طلب التحليل بنجاح وإرساله للمختبر.'
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        // Used to update result values (enter results)
        const body = await req.json();
        const { resultId, value, isAbnormal } = body;

        const updated = await prisma.labResult.update({
            where: { id: Number(resultId) },
            data: { 
                value: value.toString(), 
                isAbnormal: Boolean(isAbnormal) 
            }
        });

        // Auto update order status if all results are entered
        const orderId = updated.orderId;
        const allResults = await prisma.labResult.findMany({ where: { orderId } });
        const allEntered = allResults.every((r: any) => r.value && r.value.trim() !== '');

        if (allEntered) {
            await prisma.labOrder.update({
                where: { id: orderId },
                data: { status: 'COMPLETED' }
            });
        } else {
            await prisma.labOrder.update({
                where: { id: orderId },
                data: { status: 'IN_PROCESS' }
            });
        }

        return NextResponse.json({
            success: true,
            data: updated,
            message: 'تم حفظ النتيجة.'
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
