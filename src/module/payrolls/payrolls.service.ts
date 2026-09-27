import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../../generated/client.js';
import { EmployeeStatus, LeaveStatus } from '../../generated/enums.js';
import { Role } from '../auth/decorators/role.enum.js';
import { AuditContext } from '../../common/audit/audit-context.interface.js';
import { ProcessPayrollDto } from './dto/process-payroll.dto.js';

/** Vai trò được xem toàn bộ phiếu lương của công ty. */
const PRIVILEGED_ROLES: string[] = [Role.HR_MANAGER, Role.ADMIN];

@Injectable()
export class PayrollsService {
  // Số ngày công chuẩn mỗi tháng, dùng để quy đổi lương ngày = base_salary / 22.
  private static readonly WORKING_DAYS_PER_MONTH = 22;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Khởi tạo bảng lương cho toàn bộ nhân viên ACTIVE trong kỳ [start, end].
   * Với mỗi nhân viên:
   *   - base_salary = mức tối thiểu của chức danh (job_title.salary_range_min)
   *   - deductions  = (số ngày nghỉ trong kỳ CHƯA được HR duyệt) × (base_salary / 22)
   *   - total_salary do PostgreSQL tự sinh (GENERATED ALWAYS AS ... STORED)
   *    tong lương = lương cơ bản + bonus - deductions
   * Toàn bộ INSERT chạy trong 1 transaction có gắn AuditContext để trigger
   * ghi được actor_id vào audit_logs (SRS 4.5).
   */
  async processPayroll(ctx: AuditContext, dto: ProcessPayrollDto) {
    const start = new Date(dto.payPeriodStart);
    const end = new Date(dto.payPeriodEnd);

    if (end < start) {
      throw new BadRequestException(
        'payPeriodEnd phải lớn hơn hoặc bằng payPeriodStart.',
      );
    }

    // Lấy nhân viên đang làm việc kèm mức lương tối thiểu của chức danh.
    const employees = await this.prisma.employee.findMany({
      where: { status: EmployeeStatus.ACTIVE },
      include: { jobTitle: { select: { salaryMin: true } } },
    });

    // Tính sẵn dữ liệu từng dòng lương trước khi ghi (phần thuần tính toán).
    const rows: Prisma.PayrollCreateManyInput[] = [];
    for (const emp of employees) {
      const baseSalary = new Prisma.Decimal(emp.jobTitle.salaryMin);
      const invalidDays = await this.countInvalidLeaveDays(emp.id, start, end);

      const dailyRate = baseSalary.div(
        PayrollsService.WORKING_DAYS_PER_MONTH,
      );
      const deductions = dailyRate.mul(invalidDays).toDecimalPlaces(2);

      rows.push({
        employeeId: emp.id,
        baseSalary,
        deductions,
        payPeriodStart: start,
        payPeriodEnd: end,
      });
    }

    // Ghi trong transaction có audit context (không set total_salary — DB tự sinh).
    const created = await this.prisma.withAuditContext(ctx, async (tx) => {
      const result = [];
      for (const row of rows) {
        result.push(await tx.payroll.create({ data: row }));
      }
      return result;
    });

    return {
      payPeriodStart: start,
      payPeriodEnd: end,
      processed: created.length,
      payrolls: created,
    };
  }

  /**
   * Đếm số ngày nghỉ của một nhân viên nằm trong kỳ lương mà đơn CHƯA
   * được HR phê duyệt cuối (status ≠ APPROVED_BY_HR) → ngày nghỉ "không hợp lệ".
   */
  private async countInvalidLeaveDays(
    employeeId: number,
    start: Date,
    end: Date,
  ): Promise<number> {
    const leaves = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: { not: LeaveStatus.APPROVED_BY_HR },
        // Đơn có khoảng thời gian giao với kỳ lương.
        startDate: { lte: end },
        endDate: { gte: start },
      },
      select: { startDate: true, endDate: true },
    });

    let days = 0;
    for (const leave of leaves) {
      // Chỉ tính phần ngày nghỉ nằm TRONG kỳ lương.
      const from = leave.startDate > start ? leave.startDate : start;
      const to = leave.endDate < end ? leave.endDate : end;
      days += this.inclusiveDayCount(from, to);
    }
    return days;
  }

  /** Số ngày tính cả 2 đầu mút (VD: 01→03 = 3 ngày). */
  private inclusiveDayCount(from: Date, to: Date): number {
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY) + 1;
  }

  /** Nhân viên xem phiếu lương của chính mình. */
  async findMine(employeeId: number) {
    return this.prisma.payroll.findMany({
      where: { employeeId },
      orderBy: { id: 'desc' },
    });
  }

  /** HR_MANAGER / ADMIN xem toàn bộ phiếu lương. */
  async findAll() {
    return this.prisma.payroll.findMany({ orderBy: { id: 'desc' } });
  }

  /**
   * Xem chi tiết 1 phiếu lương.
   * Nhân viên thường chỉ được xem phiếu của mình; HR_MANAGER/ADMIN xem của mọi người.
   */
  async findOne(id: number, user: { id: number; role: string }) {
    const payroll = await this.prisma.payroll.findUnique({ where: { id } });

    if (!payroll) {
      throw new NotFoundException(`Không tìm thấy phiếu lương có ID ${id}.`);
    }

    const isPrivileged = PRIVILEGED_ROLES.includes(user.role);
    if (!isPrivileged && payroll.employeeId !== user.id) {
      throw new ForbiddenException('Bạn chỉ được xem phiếu lương của chính mình.');
    }

    return payroll;
  }
}
