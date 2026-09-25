import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuditContext } from '../audit/audit-context.interface.js';

type RequestWithUser = Request & { user?: { id: number } };

// Lấy context audit (userId + IP) từ request hiện tại
export const AuditCtx = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuditContext => {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();

    return {
      userId: req.user?.id ?? getDevUserId(req),
      ipAddress: req.ip ?? null,
    };
  },
);

// TẠM THỜI khi chưa có Auth (4.1): đọc userId từ header x-user-id để test.
// Khi có JwtAuthGuard thì xóa hàm này, chỉ dùng req.user.id.
function getDevUserId(req: Request): number | null {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const raw = req.headers['x-user-id'];
  const id = Number(Array.isArray(raw) ? raw[0] : raw);

  return Number.isInteger(id) && id > 0 ? id : null;
}
