import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './module/prisma/prisma.module.js';
import { EmployeesModule } from './module/employees/employees.module.js';
import { UserModule } from './module/user/user.module.js';

@Module({
  imports: [PrismaModule, EmployeesModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
