import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './module/prisma/prisma.module.js';
import { LeaveRequestsModule } from './module/leave-requests/leave-requests.module.js';
import { PayrollsModule } from './module/payrolls/payrolls.module.js';

@Module({
  imports: [PrismaModule, LeaveRequestsModule, PayrollsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
