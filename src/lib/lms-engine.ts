import { prisma } from './prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'lms-engine' });

/**
 * H-05: LMS Engine — uses TrainingEnrollment + TrainingCourse schema
 * Employee manager field is `managerId` (not reportingManagerId)
 */
export class LMSEngine {
  static async enroll(tenantId: string, employeeId: number, courseId: number) {
    log.info(`Enrolling employee ${employeeId} in course ${courseId}`);
    return prisma.trainingEnrollment.create({
      data: { tenantId, employeeId, courseId, status: 'ENROLLED' },
    });
  }

  static async updateProgress(tenantId: string, enrollmentId: number, score: number) {
    await prisma.trainingEnrollment.findUniqueOrThrow({ where: { id: enrollmentId, tenantId } });
    const status = score >= 70 ? 'COMPLETED' : 'IN_PROGRESS';
    log.info(`Training enrollment ${enrollmentId}: score=${score} → ${status}`);
    return prisma.trainingEnrollment.update({ where: { id: enrollmentId }, data: { score, status } });
  }

  static async complete(tenantId: string, enrollmentId: number) {
    await prisma.trainingEnrollment.findUniqueOrThrow({ where: { id: enrollmentId, tenantId } });
    return prisma.trainingEnrollment.update({ where: { id: enrollmentId }, data: { status: 'COMPLETED' } });
  }

  /** Get enrollments for all direct reports of a manager (Employee.managerId) */
  static async getTeamEnrollments(tenantId: string, managerId: number) {
    const employees = await prisma.employee.findMany({
      where: { managerId, tenantId },
      select: { id: true, name: true },
    });
    const empIds = employees.map(e => e.id);
    if (!empIds.length) return [];
    return prisma.trainingEnrollment.findMany({ where: { employeeId: { in: empIds }, tenantId } });
  }

  /** Active courses = status SCHEDULED */
  static async getCatalog(tenantId: string) {
    return prisma.trainingCourse.findMany({
      where: { tenantId, status: 'SCHEDULED' },
      orderBy: { startDate: 'asc' },
    });
  }
}
