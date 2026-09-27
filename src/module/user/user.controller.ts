import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { EmployeesService } from '../employees/employees.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('user')
export class UserController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('profile')
  getProfile(@CurrentUser() currentUser: { id: number }) {
    const userId = currentUser.id;

    return this.employeesService.findOne(currentUser.id);
  }
}
