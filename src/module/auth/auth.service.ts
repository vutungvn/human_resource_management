import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}
  async register(registerDto: any) {
    console.log('registerDto:', registerDto);
    try{
const { email, password, firstName, lastName, role, departmentId, jobTitleId, managerId } = registerDto;
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { email },
    });
    if (existingEmployee) {
      throw new Error('Email này đã được sử dụng trong hệ thống');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newEmployee = await this.prisma.employee.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: role || 'USER', // Mặc định là USER nếu client không truyền
        departmentId: departmentId || null,
        jobTitleId: jobTitleId || null,
        managerId: managerId || null,
      },
      include: {
        department: true,
        jobTitle: true,
      },
    });
    const { password: _, ...result } = newEmployee;

    return result;
    }
    catch (error) {
      console.error('Error occurred while registering user:', error);
      throw new Error('Đã xảy ra lỗi khi đăng ký người dùng');
      
    }
    
  }

  async login(loginDto: any) {
    const { email, password } = loginDto;

    const employee = await this.prisma.employee.findUnique({ where: { email } });
    if (!employee) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (employee.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const payload = { sub: employee.id, email: employee.email, role: employee.role };

    // 1. Sinh Access Token (Thời hạn 15 phút)
    const accessToken = await this.jwtService.signAsync(payload);

    // 2. Sinh Refresh Token (Thời hạn 7 ngày)
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.refreshTokenSecret|| 'REFRESH_TOKEN_SECRET',
      expiresIn: '7d',
    });

    const { password: _, ...userInfo } = employee;

    return {
      accessToken,
      refreshToken, // Trả về cho Controller set vào Cookie
      user: userInfo,
    };
  }

  // Phương thức cấp lại Access Token từ Refresh Token
  async refreshToken(refreshToken: string) {
    try {
      // Xác thực Refresh Token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.refreshTokenSecret|| 'REFRESH_TOKEN_SECRET',
      });

      // Sinh Access Token mới
      const newAccessToken = await this.jwtService.signAsync(
        { sub: payload.sub, email: payload.email, role: payload.role }
      );

      return { accessToken: newAccessToken };
    } catch {
      throw new UnauthorizedException('Refresh Token không hợp lệ hoặc đã hết hạn');
    };
  }
}
