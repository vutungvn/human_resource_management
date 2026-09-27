import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../../generated/client.js';
import dotenv from 'dotenv';
import { AuditContext } from '../../common/audit/audit-context.interface.js';

dotenv.config();

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
  }

  // Chạy các thao tác ghi DB trong 1 transaction có gắn context người dùng.
  // Trigger fn_audit_log() đọc app.current_user_id / app.current_ip để điền audit_logs.
  async withAuditContext<T>(
    ctx: AuditContext,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      // set_config(..., true) tương đương SET LOCAL: chỉ có hiệu lực trong transaction này.
      // Dùng tham số bind thay vì ghép chuỗi để tránh SQL injection.
      await tx.$queryRaw`
        SELECT
          set_config('app.current_user_id', ${ctx.userId?.toString() ?? ''}, true),
          set_config('app.current_ip', ${ctx.ipAddress ?? ''}, true)
      `;

      return fn(tx);
    });
  }
}
