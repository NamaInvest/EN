/**
 * Recruitment Engine (G-08)
 * ═════════════════════════
 * Job postings, applications, interview scheduling, hiring pipeline
 */

import type { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.recruitment-' });
const db = (p: any) => p as any;

export class RecruitmentEngine {
    /** Create job posting */
    static async createJob(prisma: PrismaClient, data: {
        title: string; department: string; requirements?: string;
        location?: string; salaryRange?: string; tenantId: string;
    }) {
        return db(prisma).jobPosting?.create?.({
            data: { ...data, status: 'OPEN', createdAt: new Date() },
        });
    }

    /** List open jobs */
    static async listJobs(prisma: PrismaClient, status?: string) {
        return db(prisma).jobPosting?.findMany?.({
            where: status ? { status } : {},
            orderBy: { createdAt: 'desc' },
        }) || [];
    }

    /** Submit application */
    static async applyToJob(prisma: PrismaClient, data: {
        jobId: number; applicantName: string; email: string;
        phone?: string; resumeUrl?: string; tenantId: string;
    }) {
        return db(prisma).jobApplication?.create?.({
            data: { ...data, stage: 'NEW', createdAt: new Date() },
        });
    }

    /** Move application to next stage */
    static async moveStage(prisma: PrismaClient, applicationId: number, newStage: string, notes?: string) {
        return db(prisma).jobApplication?.update?.({
            where: { id: applicationId },
            data: { stage: newStage, notes },
        });
    }

    /** Get pipeline summary */
    static async getPipeline(prisma: PrismaClient, jobId?: number) {
        const where = jobId ? { jobId } : {};
        const apps = await db(prisma).jobApplication?.findMany?.({ where }) || [];
        const stages = ['NEW', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
        return stages.map(s => ({
            stage: s,
            count: apps.filter((a: any) => a.stage === s).length,
            applications: apps.filter((a: any) => a.stage === s),
        }));
    }

    /** Convert hired applicant to employee */
    static async convertToEmployee(prisma: PrismaClient, applicationId: number) {
        const app = await db(prisma).jobApplication?.findUnique?.({ where: { id: applicationId } });
        if (!app || app.stage !== 'HIRED') throw new Error('المتقدم لم يتم توظيفه بعد');
        const job = await db(prisma).jobPosting?.findUnique?.({ where: { id: app.jobId } });

        return prisma.employee.create({
            data: {
                name: app.applicantName,
                email: app.email || '',
                phone: app.phone || '',
                department: job?.department || '',
                position: job?.title || '',
                hireDate: new Date(),
                tenantId: app.tenantId,
            } as any,
        });
    }
}
