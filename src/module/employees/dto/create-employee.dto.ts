import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EmployeeStatus, Role } from '../../../generated/enums.js';

export class CreateEmployeeDto {
  @IsString({ message: 'Họ phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Họ không được để trống' })
  @MaxLength(50, { message: 'Họ tối đa 50 ký tự' })
  firstName: string;

  @IsString({ message: 'Tên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên không được để trống' })
  @MaxLength(50, { message: 'Tên tối đa 50 ký tự' })
  lastName: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(150, { message: 'Email tối đa 150 ký tự' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  @MaxLength(255, { message: 'Mật khẩu tối đa 255 ký tự' })
  password: string;

  @IsEnum(Role, { message: 'Vai trò không hợp lệ' })
  role: Role;

  @IsInt({ message: 'Mã phòng ban phải là số nguyên' })
  @Min(1, { message: 'Mã phòng ban phải lớn hơn 0' })
  departmentId: number;

  @IsInt({ message: 'Mã chức danh phải là số nguyên' })
  @Min(1, { message: 'Mã chức danh phải lớn hơn 0' })
  jobTitleId: number;

  @IsOptional()
  @IsInt({ message: 'Mã quản lý phải là số nguyên' })
  @Min(1, { message: 'Mã quản lý phải lớn hơn 0' })
  managerId?: number;

  @IsEnum(EmployeeStatus, { message: 'Trạng thái không hợp lệ' })
  status: EmployeeStatus;
}
