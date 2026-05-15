alter table public.profiles
  add column if not exists theme_mode text not null default 'system'
    check (theme_mode in ('system', 'light', 'dark')),
  add column if not exists color_theme text not null default 'default'
    check (color_theme in ('default', 'metal-silver', 'british-green', 'navy', 'orange', 'pastel-pink'));

