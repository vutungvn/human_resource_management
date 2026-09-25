import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum UserRole {
  USER = 'USER',
  MANAGER = 'MANAGER',
  HR_MANAGER = 'HR_MANAGER',
  ADMIN = 'ADMIN',
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'First name không được để trống' })
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Last name không được để trống' })
  @MaxLength(50)
  lastName: string;

  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @MaxLength(150)
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có tối thiểu 6 ký tự' })
  @MaxLength(100)
  password: string;

  @IsEnum(UserRole, { message: 'Role không hợp lệ' })
  role: UserRole;

  @IsInt({ message: 'departmentId phải là số nguyên' })
  departmentId: number;

  @IsInt({ message: 'jobTitleId phải là số nguyên' })
  jobTitleId: number;

  @IsOptional()
  @IsInt({ message: 'managerId phải là số nguyên' })
  managerId?: number;
}