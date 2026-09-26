import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { LeaveStatus } from '../../generated/enums.js';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto.js';

/**
 * LeaveRequestsService — nghiệp vụ 4.3 (Dual-Approval Leave Management).
 *
 * Luồng trạng thái đơn:
 *   PENDING → (Manager trực tiếp duyệt) → APPROVED_BY_MANAGER
 *           → (HR duyệt cuối) → APPROVED_BY_HR (chính thức có hiệu lực)
 */
@Injectable()
export class LeaveRequestsService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Nhân viên nộp đơn nghỉ phép. employeeId lấy từ JWT (không tin client).
   * Đơn luôn được tạo ở trạng thái PENDING.
   */
  async create(employeeId: number, dto: CreateLeaveRequestDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    // Ràng buộc nghiệp vụ: ngày kết thúc không được trước ngày bắt đầu.
    // (DB cũng có CHECK end_date >= start_date, đây là lớp chặn sớm + báo lỗi thân thiện.)
    if (end < start) {
      throw new BadRequestException(
        'Ngày kết thúc (endDate) phải lớn hơn hoặc bằng ngày bắt đầu (startDate).',
      );
    }

    return this.prisma.leaveRequest.create({
      data: {
        employeeId,
        startDate: start,
        endDate: end,
        type: dto.type,
        reason: dto.reason ?? null,
        status: LeaveStatus.PENDING,
      },
    });
  }

  /**
   * Cấp 1 — Quản lý trực tiếp phê duyệt.
   * Điều kiện: người gọi phải là manager trực tiếp của nhân viên
   * (employee.managerId === managerId) và đơn đang ở PENDING.
   * (Role MANAGER đã được RolesGuard chặn ở controller.)
   */
  async approveByManager(leaveId: number, managerId: number) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { employee: { select: { managerId: true } } },
    });

    if (!leave) {
      throw new NotFoundException(`Không tìm thấy đơn nghỉ phép có ID ${leaveId}.`);
    }

    // Chỉ đúng quản lý trực tiếp mới được duyệt.
    if (leave.employee.managerId !== managerId) {
      throw new ForbiddenException(
        'Bạn không phải quản lý trực tiếp của nhân viên này.',
      );
    }

    // Chỉ duyệt được đơn đang chờ (PENDING).
    if (leave.status !== LeaveStatus.PENDING) {
      throw new ConflictException(
        `Đơn không ở trạng thái PENDING (hiện tại: ${leave.status}), không thể duyệt cấp quản lý.`,
      );
    }

    return this.prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: LeaveStatus.APPROVED_BY_MANAGER,
        approvedByManagerId: managerId,
      },
    });
  }

  /**
   * Cấp 2 — HR Manager phê duyệt cuối cùng.
   * Điều kiện: đơn phải đã được quản lý duyệt (APPROVED_BY_MANAGER).
   * (Role HR_MANAGER đã được RolesGuard chặn ở controller.)
   */
  async approveByHr(leaveId: number, hrId: number) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      throw new NotFoundException(`Không tìm thấy đơn nghỉ phép có ID ${leaveId}.`);
    }

    // Phải qua cấp quản lý trước mới tới HR.
    if (leave.status !== LeaveStatus.APPROVED_BY_MANAGER) {
      throw new ConflictException(
        `Đơn phải ở trạng thái APPROVED_BY_MANAGER (hiện tại: ${leave.status}) mới được HR duyệt.`,
      );
    }

    return this.prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: LeaveStatus.APPROVED_BY_HR,
        approvedByHrId: hrId,
      },
    });
  }

  /**
   * Từ chối đơn nghỉ phép.
   * - Cho phép: đơn đang PENDING hoặc APPROVED_BY_MANAGER.
   * - Cấm (ConflictException): đơn đã APPROVED_BY_HR (đã có hiệu lực) hoặc đã REJECTED.
   * Chỉ đổi status = REJECTED; không ghi vào approvedByManagerId/HrId vì đó là
   * ô "người DUYỆT", không phải "người từ chối" (schema chưa có cột rejectedBy).
   */
  async reject(leaveId: number) {
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      throw new NotFoundException(`Không tìm thấy đơn nghỉ phép có ID ${leaveId}.`);
    }

    if (
      leave.status === LeaveStatus.APPROVED_BY_HR ||
      leave.status === LeaveStatus.REJECTED
    ) {
      throw new ConflictException(
        `Không thể từ chối đơn ở trạng thái ${leave.status}.`,
      );
    }

    return this.prisma.leaveRequest.update({
      where: { id: leaveId },
      data: { status: LeaveStatus.REJECTED },
    });
  }
  /** Xem các đơn nghỉ của chính mình. */
  async findMine(employeeId: number) {
    return this.prisma.leaveRequest.findMany({
      where: { employeeId },
      orderBy: { id: 'desc' },
    });
  }
}
