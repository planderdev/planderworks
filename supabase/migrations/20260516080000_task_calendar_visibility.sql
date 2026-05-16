alter table public.tasks
add column if not exists show_on_calendar boolean not null default true;
