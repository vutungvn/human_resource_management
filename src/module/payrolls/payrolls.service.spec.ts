import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PayrollsService } from './payrolls.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LeaveStatus } from '../../generated/enums.js';
import { Role } from '../auth/decorators/role.enum.js';

/**
 * Unit test PayrollsService — mock PrismaService (SRS 6.2).
 * withAuditContext được mock để gọi thẳng callback với tx = prismaMock,
 * nhờ đó test được logic mà không cần transaction/DB thật.
 */
describe('PayrollsService', () => {
  let service: PayrollsService;

  const employee = { findMany: vi.fn() };
  const leaveRequest = { findMany: vi.fn() };
  const payroll = { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() };

  const prismaMock = {
    employee,
    leaveRequest,
    payroll,
    // Gọi luôn callback với "tx" giả có payroll.create.
    withAuditContext: vi.fn(async (_ctx, fn) => fn({ payroll })),
  };

  const ctx = { userId: 100, ipAddress: '127.0.0.1' };

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PayrollsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = moduleRef.get(PayrollsService);
  });

  describe('processPayroll', () => {
    it('từ chối khi payPeriodEnd < payPeriodStart', async () => {
      await expect(
        service.processPayroll(ctx, {
          payPeriodStart: '2026-10-31',
          payPeriodEnd: '2026-10-01',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(employee.findMany).not.toHaveBeenCalled();
    });

    it('không có ngày nghỉ không hợp lệ → deductions = 0', async () => {
      employee.findMany.mockResolvedValue([
        { id: 1, jobTitle: { salaryMin: 2200 } },
      ]);
      leaveRequest.findMany.mockResolvedValue([]); // không có đơn nào
      payroll.create.mockResolvedValue({ id: 1 });

      const result = await service.processPayroll(ctx, {
        payPeriodStart: '2026-10-01',
        payPeriodEnd: '2026-10-31',
      });

      expect(result.processed).toBe(1);
      const data = payroll.create.mock.calls[0][0].data;
      expect(data.employeeId).toBe(1);
      expect(Number(data.baseSalary)).toBe(2200);
      expect(Number(data.deductions)).toBe(0);
      // Không được tự set total_salary (DB tự sinh).
      expect(data).not.toHaveProperty('totalSalary');
    });

    it('trừ đúng: 2 ngày nghỉ chưa duyệt HR × (2200/22) = 200', async () => {
      employee.findMany.mockResolvedValue([
        { id: 5, jobTitle: { salaryMin: 2200 } },
      ]);
      // 1 đơn nghỉ 10-10 → 10-11 (2 ngày), status chưa APPROVED_BY_HR
      leaveRequest.findMany.mockResolvedValue([
        {
          startDate: new Date('2026-10-10'),
          endDate: new Date('2026-10-11'),
        },
      ]);
      payroll.create.mockResolvedValue({ id: 9 });

      await service.processPayroll(ctx, {
        payPeriodStart: '2026-10-01',
        payPeriodEnd: '2026-10-31',
      });

      // Chỉ lấy đơn có status ≠ APPROVED_BY_HR và giao với kỳ lương.
      expect(leaveRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            employeeId: 5,
            status: { not: LeaveStatus.APPROVED_BY_HR },
          }),
        }),
      );
      const data = payroll.create.mock.calls[0][0].data;
      expect(Number(data.deductions)).toBe(200);
    });

    it('chỉ tính phần ngày nghỉ NẰM TRONG kỳ lương (đơn tràn ra ngoài)', async () => {
      employee.findMany.mockResolvedValue([
        { id: 7, jobTitle: { salaryMin: 2200 } },
      ]);
      // Đơn 09-28 → 10-02 nhưng kỳ lương bắt đầu 10-01 ⇒ chỉ 10-01, 10-02 = 2 ngày
      leaveRequest.findMany.mockResolvedValue([
        {
          startDate: new Date('2026-09-28'),
          endDate: new Date('2026-10-02'),
        },
      ]);
      payroll.create.mockResolvedValue({ id: 1 });

      await service.processPayroll(ctx, {
        payPeriodStart: '2026-10-01',
        payPeriodEnd: '2026-10-31',
      });

      const data = payroll.create.mock.calls[0][0].data;
      expect(Number(data.deductions)).toBe(200);
    });

    it('ghi qua withAuditContext (để trigger audit lấy được actor_id)', async () => {
      employee.findMany.mockResolvedValue([
        { id: 1, jobTitle: { salaryMin: 2200 } },
      ]);
      leaveRequest.findMany.mockResolvedValue([]);
      payroll.create.mockResolvedValue({ id: 1 });

      await service.processPayroll(ctx, {
        payPeriodStart: '2026-10-01',
        payPeriodEnd: '2026-10-31',
      });

      expect(prismaMock.withAuditContext).toHaveBeenCalledWith(
        ctx,
        expect.any(Function),
      );
    });
  });

  describe('findOne', () => {
    it('ném NotFound khi không tồn tại phiếu lương', async () => {
      payroll.findUnique.mockResolvedValue(null);
      await expect(
        service.findOne(99, { id: 1, role: Role.USER }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('ném Forbidden khi USER xem phiếu của người khác', async () => {
      payroll.findUnique.mockResolvedValue({ id: 1, employeeId: 2 });
      await expect(
        service.findOne(1, { id: 99, role: Role.USER }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('USER xem phiếu của chính mình → OK', async () => {
      const row = { id: 1, employeeId: 5 };
      payroll.findUnique.mockResolvedValue(row);
      await expect(
        service.findOne(1, { id: 5, role: Role.USER }),
      ).resolves.toBe(row);
    });

    it('HR_MANAGER xem phiếu của người khác → OK', async () => {
      const row = { id: 1, employeeId: 2 };
      payroll.findUnique.mockResolvedValue(row);
      await expect(
        service.findOne(1, { id: 99, role: Role.HR_MANAGER }),
      ).resolves.toBe(row);
    });
  });
});
