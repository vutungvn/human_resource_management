-- =====================================================================
-- SRS 4.5 - Database-level Audit Logging
-- Hàm trigger dùng chung: ghi mọi thay đổi INSERT/UPDATE/DELETE
-- của employees và payrolls vào audit_logs dưới dạng JSONB.
-- =====================================================================

CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_old        JSONB;
    v_new        JSONB;
    v_record_id  INT;
    v_actor_id   INT;
    v_ip_address VARCHAR(45);
BEGIN
    -- 1. Chuyển dòng cũ/mới sang JSONB theo loại thao tác
    IF TG_OP = 'INSERT' THEN
        v_old := NULL;
        v_new := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_old := to_jsonb(OLD);
        v_new := to_jsonb(NEW);

        -- So sánh cũ/mới: UPDATE không đổi gì thì bỏ qua, không ghi log
        IF v_old = v_new THEN
            RETURN NULL;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_old := to_jsonb(OLD);
        v_new := NULL;
    END IF;

    -- 2. Lấy ID bản ghi (qua JSONB để dùng chung cho mọi bảng có cột id)
    v_record_id := COALESCE(v_new ->> 'id', v_old ->> 'id')::INT;

    -- 3. Ẩn mật khẩu: không lưu hash vào log, chỉ đánh dấu nếu bị đổi
    --    (bảng không có cột password thì phép '-' không làm gì)
    IF TG_OP = 'UPDATE'
       AND (v_old ->> 'password') IS DISTINCT FROM (v_new ->> 'password') THEN
        v_old := v_old - 'password';
        v_new := (v_new - 'password') || jsonb_build_object('password', '***CHANGED***');
    ELSE
        v_old := v_old - 'password';
        v_new := v_new - 'password';
    END IF;

    -- 4. Đọc context người dùng do NestJS truyền xuống (SET LOCAL / set_config)
    --    Tham số true: chưa set thì trả NULL thay vì báo lỗi
    v_actor_id   := NULLIF(current_setting('app.current_user_id', true), '')::INT;
    v_ip_address := NULLIF(current_setting('app.current_ip', true), '');

    -- 5. Ghi nhật ký
    INSERT INTO audit_logs (actor_id, action, table_name, record_id, old_value, new_value, ip_address)
    VALUES (v_actor_id, TG_OP, TG_TABLE_NAME, v_record_id, v_old, v_new, v_ip_address);

    -- AFTER trigger: giá trị trả về bị bỏ qua
    RETURN NULL;
END;
$$;

-- Gắn trigger vào bảng employees
DROP TRIGGER IF EXISTS trg_audit_employees ON employees;
CREATE TRIGGER trg_audit_employees
AFTER INSERT OR UPDATE OR DELETE ON employees
FOR EACH ROW
EXECUTE FUNCTION fn_audit_log();

-- Gắn trigger vào bảng payrolls
DROP TRIGGER IF EXISTS trg_audit_payrolls ON payrolls;
CREATE TRIGGER trg_audit_payrolls
AFTER INSERT OR UPDATE OR DELETE ON payrolls
FOR EACH ROW
EXECUTE FUNCTION fn_audit_log();
