// Thông tin người thực hiện thao tác, truyền xuống PostgreSQL để trigger ghi vào audit_logs
export interface AuditContext {
  // ID nhân viên đang thao tác (NULL nếu hệ thống tự chạy)
  userId: number | null;
  // Địa chỉ IP của request
  ipAddress: string | null;
}

// Context dùng cho các tác vụ hệ thống tự chạy (seed, cron...)
export const SYSTEM_AUDIT_CONTEXT: AuditContext = {
  userId: null,
  ipAddress: null,
};
