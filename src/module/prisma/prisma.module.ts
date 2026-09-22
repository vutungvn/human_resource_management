import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global() // Đánh dấu đây là module dùng chung toàn cục
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Xuất service ra để các module khác sử dụng
})
export class PrismaModule {}
