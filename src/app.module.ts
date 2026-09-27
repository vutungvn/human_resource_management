import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './module/prisma/prisma.module.js';
import { AuthModule } from './module/auth/auth.module.js';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './module/auth/guards/auth.guard.js';
import { RolesGuard } from './module/auth/guards/roles.guard.js';
import { EmployeesModule } from './module/employees/employees.module.js';
import { UserModule } from './module/user/user.module.js';

@Module({
  imports: [PrismaModule, AuthModule, EmployeesModule, UserModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
