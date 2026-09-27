import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, 
  UnauthorizedException,Patch, UseGuards,
  ParseIntPipe
} from '@nestjs/common';
import {  Param } from '@nestjs/common';
import { CurrentUser } from './decorators/current-user.decorator.js'
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from './decorators/public.decorator.js';
import { Role } from './decorators/role.enum.js';
import { Roles } from './decorators/role.decorator.js';
import { AuditCtx } from '../../common/decorators/audit-context.decorator.js';
import type { AuditContext } from '../../common/audit/audit-context.interface.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto,
 @AuditCtx() ctx: AuditContext) {
    return await this.authService.register(registerDto,ctx);
  }
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: any, // Dùng passthrough: true
  ) {
    const { accessToken, refreshToken, user } = await this.authService.login(loginDto);

    // Lưu Refresh Token vào HTTP-Only Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // Chống XSS (JavaScript phía Client không đọc được)
      secure: process.env.NODE_ENV === 'production', // Chỉ gửi qua HTTPS ở môi trường Production
      sameSite: 'strict', // Chống tấn công CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // Thời gian sống của Cookie: 7 ngày (tính theo ms)
    });

    // Chỉ trả về accessToken và thông tin user trong JSON body
    return {
      accessToken: accessToken,
      user,
    };
  }

  // API Cấp lại Access Token mới khi Access Token cũ hết hạn
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy Refresh Token trong Cookie');
    }

    return await this.authService.refreshToken(refreshToken);
  }

  // API Đăng xuất (Đăng xuất = Xóa Cookie)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return { message: 'Đăng xuất thành công' };
  }

@Get('hello')
  hello(){
  console.log('hello');
  return {mes:'hello'};
}
  @Roles(Role.MANAGER, Role.HR_MANAGER)
  @Patch(':id/approve')
  approveLeave(
    @Param('id',ParseIntPipe) requestId: number,
    @CurrentUser() currentUser: { id: number; role: Role },
  ) {
    console.log(currentUser,requestId);
    return this.authService.approve(requestId, currentUser);
  }

}

