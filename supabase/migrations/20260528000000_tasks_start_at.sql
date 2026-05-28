-- 업무 계획 시작일 (start_at)
-- dueAt(마감)과 짝. started_at(진행중 자동기록, 실제 시작)과는 별개.
-- 캘린더에서 start_at ~ due_at 기간 막대로 표시.

alter table public.tasks
add column if not exists start_at timestamptz;
