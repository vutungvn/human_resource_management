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