import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { LeaveType } from '../../../generated/enums.js';

/**
 * DTO tạo đơn nghỉ phép (4.3).
 * - Không nhận employeeId/status từ client: employeeId lấy từ JWT (@CurrentUser),
 *   status luôn khởi tạo PENDING ở service. Nhờ ValidationPipe { whitelist: true,
 *   forbidNonWhitelisted: true } mọi field lạ sẽ bị từ chối (chống Mass Assignment).
 */
export class CreateLeaveRequestDto {
  @ApiProperty({
    example: '2026-10-01',
    description: 'Ngày bắt đầu nghỉ (định dạng YYYY-MM-DD)',
  })
  @IsDateString({}, { message: 'startDate phải là ngày hợp lệ (YYYY-MM-DD)' })
  startDate!: string;

  @ApiProperty({
    example: '2026-10-03',
    description: 'Ngày kết thúc nghỉ (phải >= startDate)',
  })
  @IsDateString({}, { message: 'endDate phải là ngày hợp lệ (YYYY-MM-DD)' })
  endDate!: string;

  @ApiProperty({
    enum: LeaveType,
    example: LeaveType.VACATION,
    description: 'Loại nghỉ phép: SICK | CASUAL | VACATION',
  })
  @IsEnum(LeaveType, { message: 'type phải thuộc SICK | CASUAL | VACATION' })
  type!: LeaveType;

  @ApiProperty({
    required: false,
    example: 'Về quê có việc gia đình',
    description: 'Lý do nghỉ (tùy chọn)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
