import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { EmployeesService } from './employees.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { QueryEmployeeDto } from './dto/query-employee.dto.js';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // Thêm nhân sự
  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  // Lấy danh sách nhân sự
  @Get()
  findAll(@Query() queryEmployeeDto: QueryEmployeeDto) {
    return this.employeesService.findAll(queryEmployeeDto);
  }
}
