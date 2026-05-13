do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'task_watchers'
  ) then
    alter publication supabase_realtime add table public.task_watchers;
  end if;
end $$;
