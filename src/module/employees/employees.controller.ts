import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { EmployeesService } from './employees.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { QueryEmployeeDto } from './dto/query-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { AuditCtx } from '../../common/decorators/audit-context.decorator.js';
import type { AuditContext } from '../../common/audit/audit-context.interface.js';
import { Roles } from '../auth/decorators/role.decorator.js';
import { Role } from '../auth/decorators/role.enum.js';

@Roles(Role.ADMIN, Role.HR_MANAGER)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // Thêm nhân sự
  @Post()
  create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @AuditCtx() ctx: AuditContext,
  ) {
    return this.employeesService.create(createEmployeeDto, ctx);
  }

  // Lấy danh sách nhân sự
  @Get()
  findAll(@Query() queryEmployeeDto: QueryEmployeeDto) {
    return this.employeesService.findAll(queryEmployeeDto);
  }

  // Lấy nhân sự theo id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.findOne(id);
  }

  // Cập nhật nhân sự
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @AuditCtx() ctx: AuditContext,
  ) {
    return this.employeesService.update(id, updateEmployeeDto, ctx);
  }

  // Xóa nhân sự
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @AuditCtx() ctx: AuditContext) {
    return this.employeesService.remove(id, ctx);
  }
}
