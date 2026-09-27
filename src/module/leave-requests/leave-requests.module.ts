import { Module } from '@nestjs/common';
import { LeaveRequestsService } from './leave-requests.service.js';
import { LeaveRequestsController } from './leave-requests.controller.js';

/**
 * PrismaModule là @Global nên PrismaService tự inject được, không cần import lại.
 * RolesGuard cần Reflector — NestJS cung cấp sẵn toàn cục, không cần khai báo.
 */
@Module({
  controllers: [LeaveRequestsController],
  providers: [LeaveRequestsService],
  exports: [LeaveRequestsService],
})
export class LeaveRequestsModule {}
