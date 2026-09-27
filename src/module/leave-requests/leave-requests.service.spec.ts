import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LeaveStatus, LeaveType } from '../../generated/enums.js';

/**
 * Unit test LeaveRequestsService — mock hoàn toàn PrismaService (SRS 6.2):
 * test chạy độc lập, không cần DB thật.
 */
describe('LeaveRequestsService', () => {
  let service: LeaveRequestsService;

  // Mock repository của Prisma cho bảng leaveRequest.
  const leaveRequest = {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  };
  const prismaMock = { leaveRequest };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveRequestsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = moduleRef.get(LeaveRequestsService);
  });

  describe('create', () => {
    it('từ chối khi endDate < startDate', async () => {
      await expect(
        service.create(1, {
          startDate: '2026-10-05',
          endDate: '2026-10-01',
          type: LeaveType.VACATION,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(leaveRequest.create).not.toHaveBeenCalled();
    });

    it('tạo đơn ở trạng thái PENDING với employeeId lấy từ token', async () => {
      leaveRequest.create.mockResolvedValue({ id: 10 });

      await service.create(7, {
        startDate: '2026-10-01',
        endDate: '2026-10-03',
        type: LeaveType.SICK,
        reason: 'Ốm',
      });

      expect(leaveRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          employeeId: 7,
          type: LeaveType.SICK,
          reason: 'Ốm',
          status: LeaveStatus.PENDING,
        }),
      });
    });
  });

  describe('approveByManager', () => {
    it('ném NotFound khi không tìm thấy đơn', async () => {
      leaveRequest.findUnique.mockResolvedValue(null);
      await expect(service.approveByManager(99, 1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('ném Forbidden khi người duyệt không phải quản lý trực tiếp', async () => {
      leaveRequest.findUnique.mockResolvedValue({
        id: 1,
        status: LeaveStatus.PENDING,
        employee: { managerId: 2 },
      });
      // managerId gọi = 5, nhưng quản lý thực sự là 2 → Forbidden
      await expect(service.approveByManager(1, 5)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('ném Conflict khi đơn không còn ở trạng thái PENDING', async () => {
      leaveRequest.findUnique.mockResolvedValue({
        id: 1,
        status: LeaveStatus.APPROVED_BY_MANAGER,
        employee: { managerId: 2 },
      });
      await expect(service.approveByManager(1, 2)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('duyệt thành công: chuyển sang APPROVED_BY_MANAGER', async () => {
      leaveRequest.findUnique.mockResolvedValue({
        id: 1,
        status: LeaveStatus.PENDING,
        employee: { managerId: 2 },
      });
      leaveRequest.update.mockResolvedValue({ id: 1 });

      await service.approveByManager(1, 2);

      expect(leaveRequest.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: LeaveStatus.APPROVED_BY_MANAGER,
          approvedByManagerId: 2,
        },
      });
    });
  });

  describe('approveByHr', () => {
    it('ném Conflict khi đơn chưa được quản lý duyệt', async () => {
      leaveRequest.findUnique.mockResolvedValue({
        id: 1,
        status: LeaveStatus.PENDING,
      });
      await expect(service.approveByHr(1, 3)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('duyệt thành công: chuyển sang APPROVED_BY_HR', async () => {
      leaveRequest.findUnique.mockResolvedValue({
        id: 1,
        status: LeaveStatus.APPROVED_BY_MANAGER,
      });
      leaveRequest.update.mockResolvedValue({ id: 1 });

      await service.approveByHr(1, 3);

      expect(leaveRequest.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: LeaveStatus.APPROVED_BY_HR,
          approvedByHrId: 3,
        },
      });
    });
  });

  describe('reject', () => {
    it('ném NotFound khi không tìm thấy đơn', async () => {
      leaveRequest.findUnique.mockResolvedValue(null);
      await expect(service.reject(99)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('ném Conflict khi đơn đã APPROVED_BY_HR (đã có hiệu lực)', async () => {
      leaveRequest.findUnique.mockResolvedValue({
        id: 1,
        status: LeaveStatus.APPROVED_BY_HR,
      });
      await expect(service.reject(1)).rejects.toBeInstanceOf(ConflictException);
      expect(leaveRequest.update).not.toHaveBeenCalled();
    });

    it('từ chối thành công (từ APPROVED_BY_MANAGER): chuyển sang REJECTED', async () => {
      leaveRequest.findUnique.mockResolvedValue({
        id: 1,
        status: LeaveStatus.APPROVED_BY_MANAGER,
      });
      leaveRequest.update.mockResolvedValue({ id: 1 });

      await service.reject(1);

      expect(leaveRequest.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: LeaveStatus.REJECTED },
      });
    });
  });
});
