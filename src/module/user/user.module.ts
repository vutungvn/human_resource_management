import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { EmployeesModule } from '../employees/employees.module.js';

@Module({
  imports: [EmployeesModule],
  controllers: [UserController],
})
export class UserModule {}
