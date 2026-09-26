// Decorator @Roles(...): gắn danh sách vai trò được phép cho controller/handler.
// RolesGuard sẽ đọc metadata này (ROLES_KEY) để kiểm tra quyền.
import { SetMetadata } from '@nestjs/common';
import { Role } from './role.enum.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
