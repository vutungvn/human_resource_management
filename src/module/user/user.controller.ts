import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { EmployeesService } from '../employees/employees.service.js';

@Controller('user')
export class UserController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get(':id')
  getProfile(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.findOne(id);
  }
}
