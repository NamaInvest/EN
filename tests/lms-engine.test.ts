/**
 * LMS Engine Tests
 * Comprehensive unit testing for Training Courses and Training Enrollments logic (H-05).
 * Tests cover enrollment, progress update, course completion, team reports query, and catalog retrieval.
 * Uses mocked Prisma client to ensure clean, isolated runs without database dependency.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma client to avoid actual database reads/writes during unit testing.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    trainingEnrollment: {
      create: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    employee: {
      findMany: vi.fn(),
    },
    trainingCourse: {
      findMany: vi.fn(),
    },
  },
}));

import { LMSEngine } from '../src/lib/lms-engine';
import { prisma } from '@/lib/prisma';
import { TrainingCourse, TrainingEnrollment, Employee } from '@prisma/client';

describe('LMSEngine', () => {
  beforeEach(() => {
    // Clear mock histories and reset mock functions before each test execution
    vi.clearAllMocks();
  });

  describe('enroll', () => {
    it('should enroll an employee in a course successfully with ENROLLED status', async () => {
      const mockEnrollment = {
        id: 1,
        tenantId: 'tenant-123',
        employeeId: 10,
        courseId: 20,
        status: 'ENROLLED',
        score: null,
      };
      vi.mocked(prisma.trainingEnrollment.create).mockResolvedValue(mockEnrollment);

      const result = await LMSEngine.enroll('tenant-123', 10, 20);

      // Verify the right query parameters were sent to the database client
      expect(prisma.trainingEnrollment.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-123',
          employeeId: 10,
          courseId: 20,
          status: 'ENROLLED',
        },
      });
      expect(result).toEqual(mockEnrollment);
    });
  });

  describe('updateProgress', () => {
    it('should mark status as COMPLETED when score is 70 or above', async () => {
      const mockEnrollment = {
        id: 1,
        tenantId: 'tenant-123',
        employeeId: 10,
        courseId: 20,
        status: 'ENROLLED',
        score: null,
      };
      const mockUpdatedEnrollment = {
        ...mockEnrollment,
        score: 85,
        status: 'COMPLETED',
      };

      vi.mocked(prisma.trainingEnrollment.findUniqueOrThrow).mockResolvedValue(mockEnrollment);
      vi.mocked(prisma.trainingEnrollment.update).mockResolvedValue(mockUpdatedEnrollment);

      const result = await LMSEngine.updateProgress('tenant-123', 1, 85);

      // Verify validation check was performed
      expect(prisma.trainingEnrollment.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1, tenantId: 'tenant-123' },
      });
      // Verify update parameters set the correct status
      expect(prisma.trainingEnrollment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { score: 85, status: 'COMPLETED' },
      });
      expect(result.status).toBe('COMPLETED');
    });

    it('should mark status as IN_PROGRESS when score is less than 70', async () => {
      const mockEnrollment = {
        id: 1,
        tenantId: 'tenant-123',
        employeeId: 10,
        courseId: 20,
        status: 'ENROLLED',
        score: null,
      };
      const mockUpdatedEnrollment = {
        ...mockEnrollment,
        score: 65,
        status: 'IN_PROGRESS',
      };

      vi.mocked(prisma.trainingEnrollment.findUniqueOrThrow).mockResolvedValue(mockEnrollment);
      vi.mocked(prisma.trainingEnrollment.update).mockResolvedValue(mockUpdatedEnrollment);

      const result = await LMSEngine.updateProgress('tenant-123', 1, 65);

      // Verify update parameters set the status as IN_PROGRESS
      expect(prisma.trainingEnrollment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { score: 65, status: 'IN_PROGRESS' },
      });
      expect(result.status).toBe('IN_PROGRESS');
    });
  });

  describe('complete', () => {
    it('should explicitly mark status as COMPLETED', async () => {
      const mockEnrollment = {
        id: 1,
        tenantId: 'tenant-123',
        employeeId: 10,
        courseId: 20,
        status: 'ENROLLED',
        score: null,
      };
      const mockUpdatedEnrollment = {
        ...mockEnrollment,
        status: 'COMPLETED',
      };

      vi.mocked(prisma.trainingEnrollment.findUniqueOrThrow).mockResolvedValue(mockEnrollment);
      vi.mocked(prisma.trainingEnrollment.update).mockResolvedValue(mockUpdatedEnrollment);

      const result = await LMSEngine.complete('tenant-123', 1);

      // Verify validation check was performed
      expect(prisma.trainingEnrollment.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1, tenantId: 'tenant-123' },
      });
      // Verify complete sets the status to COMPLETED
      expect(prisma.trainingEnrollment.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'COMPLETED' },
      });
      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('getTeamEnrollments', () => {
    it('should return list of enrollments for manager direct reports', async () => {
      const mockEmployees = [
        { id: 10, name: 'Employee A' },
        { id: 11, name: 'Employee B' },
      ];
      const mockEnrollments = [
        { id: 1, employeeId: 10, courseId: 20, status: 'ENROLLED' },
        { id: 2, employeeId: 11, courseId: 20, status: 'COMPLETED' },
      ];

      vi.mocked(prisma.employee.findMany).mockResolvedValue(mockEmployees as unknown as Employee[]);
      vi.mocked(prisma.trainingEnrollment.findMany).mockResolvedValue(mockEnrollments as unknown as TrainingEnrollment[]);

      const result = await LMSEngine.getTeamEnrollments('tenant-123', 99);

      // Verify managerId query logic
      expect(prisma.employee.findMany).toHaveBeenCalledWith({
        where: { managerId: 99, tenantId: 'tenant-123' },
        select: { id: true, name: true },
      });
      // Verify enrollment retrieval targets only the reports of this manager
      expect(prisma.trainingEnrollment.findMany).toHaveBeenCalledWith({
        where: { employeeId: { in: [10, 11] }, tenantId: 'tenant-123' },
      });
      expect(result).toEqual(mockEnrollments);
    });

    it('should return empty list immediately if manager has no reports', async () => {
      vi.mocked(prisma.employee.findMany).mockResolvedValue([]);

      const result = await LMSEngine.getTeamEnrollments('tenant-123', 99);

      expect(result).toEqual([]);
      // Verify no enrollment query was made
      expect(prisma.trainingEnrollment.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getCatalog', () => {
    it('should get scheduled courses ordered by start date', async () => {
      const mockCourses = [
        { id: 101, title: 'Intro to Finance', status: 'SCHEDULED', startDate: new Date('2026-07-01') },
        { id: 102, title: 'Advanced Taxes', status: 'SCHEDULED', startDate: new Date('2026-08-01') },
      ];
      vi.mocked(prisma.trainingCourse.findMany).mockResolvedValue(mockCourses as unknown as TrainingCourse[]);

      const result = await LMSEngine.getCatalog('tenant-123');

      // Verify scheduled status and start date order
      expect(prisma.trainingCourse.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', status: 'SCHEDULED' },
        orderBy: { startDate: 'asc' },
      });
      expect(result).toEqual(mockCourses);
    });
  });
});
