import { Body, Controller, Post } from '@nestjs/common';
import { EmployeesService } from './employees.service.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // Thêm nhân sự
  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }
}
