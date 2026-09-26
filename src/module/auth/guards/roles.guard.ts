/**
 * RolesGuard — kiểm soát phân quyền theo vai trò (RBAC).
 *
 * Đọc danh sách vai trò yêu cầu từ decorator @Roles() gắn trên controller/handler,
 * rồi so khớp với vai trò của người dùng hiện tại (req.user.role). Nếu không đủ
 * quyền sẽ trả về 403 Forbidden.
 */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../decorators/role.enum.js';
import { ROLES_KEY } from '../decorators/role.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Handler không gắn @Roles() nghĩa là không giới hạn vai trò -> cho qua.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userRole: string | undefined = user?.role;

    if (!userRole || !requiredRoles.includes(userRole as Role)) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này.');
    }

    return true;
  }
}
