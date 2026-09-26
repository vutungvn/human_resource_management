/**
 * JwtAuthGuard — cổng xác thực (Authentication) của hệ thống.
 *
 * Nhiệm vụ: xác định người dùng hiện tại và gắn vào `req.user` theo cấu trúc
 * { id, email, role } để các tầng sau (@CurrentUser, RolesGuard, service) sử dụng.
 *
 * Ghi chú: đây là bản hiện thực tạm phục vụ phát triển và kiểm thử độc lập cho
 * module Nghỉ phép / Tính lương — danh tính được đọc từ header của request. Khi
 * tích hợp module Xác thực, guard này sẽ được thay bằng bản giải mã JWT (Passport).
 */
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();

    const rawId = req.headers['x-user-id'];
    const id = Number(Array.isArray(rawId) ? rawId[0] : rawId);

    if (!Number.isInteger(id) || id <= 0) {
      throw new UnauthorizedException(
        'Yêu cầu chưa được xác thực (thiếu thông tin người dùng).',
      );
    }

    const header = (name: string): string | undefined => {
      const v = req.headers[name];
      return Array.isArray(v) ? v[0] : v;
    };

    (req as Request & { user: AuthUser }).user = {
      id,
      email: header('x-user-email') ?? `user${id}@hrm.local`,
      role: header('x-user-role') ?? 'USER',
    };

    return true;
  }
}
