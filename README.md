# Plander Works

Plander internal task workflow MVP.

Production: https://planderworks.vercel.app

## Stack

- Vite
- React
- TypeScript
- Supabase Auth
- Supabase DB/Storage ready
- Vercel ready

## Local Development

```bash
npm install
npm run dev
```

## Environment Variables

Create `.env.local` locally and set these values:

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
VITE_VAPID_PUBLIC_KEY=your-web-push-vapid-public-key
```

For Vercel, add the same variables in Project Settings > Environment Variables.

Do not expose Supabase `service_role` keys or database passwords in frontend code, GitHub, or Vercel client-side variables.

## Current MVP

- Email/password login through Supabase Auth
- Prototype preview mode before admin-created users exist
- Fixed black Plander sidebar
- Light, dark, and system theme modes for the main workspace
- Task dashboard mock data
- Supabase-backed tasks, clients, job types, and profiles
- Admin-only user creation through a Supabase Edge Function
- Device push subscription through a service worker
- Task assignment push delivery through a Supabase Edge Function
- Quick task handoff form
- Responsive mobile sidebar

## Next Build Steps

1. Create the first admin user in Supabase Auth and set the matching `profiles.role` to `admin`.
2. Add real employees through the app's employee admin page.
3. Enable push notifications per device from Settings.
4. Add Storage bucket uploads for task attachments.
5. Add task detail comments, status history, and file previews.
