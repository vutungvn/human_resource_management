import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // 1. Đọc cờ @Public() từ Handler hoặc Controller
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. NẾU CÓ @Public() -> Trả về true NGAY LẬP TỨC để bỏ qua check JWT
    if (isPublic) {
      return true;
    }

    // 3. Nếu không có @Public() -> Mới cho Passport kiểm tra Bearer Token
    return super.canActivate(context);
  }
}