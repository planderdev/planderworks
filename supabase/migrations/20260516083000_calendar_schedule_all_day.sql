alter table public.calendar_schedules
add column if not exists all_day boolean not null default false;
