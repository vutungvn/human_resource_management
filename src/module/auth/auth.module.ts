import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy.js';
@Module({
  imports: [PrismaModule,
    JwtModule.register({
      global: true, // Nếu muốn dùng chung toàn cục, hoặc khai báo riêng trong module
      secret: process.env.jwtSecret, // Thay bằng chuỗi bí mật của bạn hoặc dùng ConfigService
      signOptions: { expiresIn: '15m' }, // Thời gian sống của token
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
