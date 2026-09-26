import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

/**
 * DTO khởi tạo bảng lương theo kỳ (4.4).
 * HR chỉ cần cung cấp khoảng thời gian; hệ thống tự tính lương cho toàn bộ
 * nhân viên đang ACTIVE (base_salary, deductions) — đúng tinh thần tự động hóa.
 */
export class ProcessPayrollDto {
  @ApiProperty({
    example: '2026-10-01',
    description: 'Ngày bắt đầu kỳ lương (YYYY-MM-DD)',
  })
  @IsDateString({}, { message: 'payPeriodStart phải là ngày hợp lệ (YYYY-MM-DD)' })
  payPeriodStart!: string;

  @ApiProperty({
    example: '2026-10-31',
    description: 'Ngày kết thúc kỳ lương (phải >= payPeriodStart)',
  })
  @IsDateString({}, { message: 'payPeriodEnd phải là ngày hợp lệ (YYYY-MM-DD)' })
  payPeriodEnd!: string;
}
