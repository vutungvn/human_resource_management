-- Dữ liệu mẫu cho departments và job_titles (dùng để test API /employees).
-- Chạy: docker exec -i hrm_postgres psql -U root -d hrm_db < prisma/seed/seed.sql

INSERT INTO departments (name, budget, location) VALUES
  ('Engineering', 500000.00, 'Ho Chi Minh City'),
  ('Human Resources', 150000.00, 'Ha Noi'),
  ('Sales', 300000.00, 'Da Nang')
ON CONFLICT (name) DO NOTHING;

INSERT INTO job_titles (title, salary_range_min, salary_range_max) VALUES
  ('Software Engineer', 15000000.00, 40000000.00),
  ('Senior Software Engineer', 30000000.00, 60000000.00),
  ('HR Specialist', 10000000.00, 25000000.00),
  ('Sales Executive', 10000000.00, 30000000.00)
ON CONFLICT (title) DO NOTHING;
