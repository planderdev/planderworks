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
```

For Vercel, add the same variables in Project Settings > Environment Variables.

Do not expose Supabase `service_role` keys or database passwords in frontend code, GitHub, or Vercel client-side variables.

## Current MVP

- Email/password login through Supabase Auth
- Prototype preview mode before admin-created users exist
- Fixed black Plander sidebar
- Light, dark, and system theme modes for the main workspace
- Task dashboard mock data
- Quick task handoff form mockup
- Responsive mobile sidebar

## Next Build Steps

1. Apply the SQL schema in `supabase/schema.sql`.
2. Create the first admin user in Supabase Auth.
3. Build admin account creation through a server-only Supabase path.
4. Replace mock tasks with Supabase queries.
5. Add Storage bucket uploads for task attachments.
