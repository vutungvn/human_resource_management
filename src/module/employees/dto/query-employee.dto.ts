import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryEmployeeDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số trang (page) phải là số nguyên' })
  @Min(1, { message: 'Số trang (page) phải lớn hơn hoặc bằng 1' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số lượng bản ghi (limit) phải là số nguyên' })
  @Min(1, { message: 'Số lượng bản ghi (limit) phải lớn hơn hoặc bằng 1' })
  limit: number = 10;

  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm (search) phải là chuỗi ký tự' })
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'ID phòng ban (departmentId) phải là số nguyên' })
  departmentId?: number;
}
