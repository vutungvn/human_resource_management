// Decorator tham số @CurrentUser(): lấy thông tin người dùng hiện tại từ req.user
// (đã được JwtAuthGuard gắn). Ví dụ @CurrentUser('id') trả về user.id.
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return null;

    // Nếu truyền param ví dụ: @CurrentUser('id') -> Trả về user.id
    return data ? user[data] : user;
  },
);
