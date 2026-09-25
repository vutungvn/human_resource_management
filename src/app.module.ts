import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './module/prisma/prisma.module.js';
import { EmployeesModule } from './module/employees/employees.module.js';

@Module({
  imports: [PrismaModule, EmployeesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
