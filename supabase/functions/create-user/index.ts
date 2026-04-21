import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

type UserRole = 'admin' | 'manager' | 'staff';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authHeader = req.headers.get('Authorization');

  if (!supabaseUrl || !serviceRoleKey || !authHeader) {
    return jsonResponse({ error: 'Missing server configuration' }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: callerData, error: callerError } = await admin.auth.getUser(authHeader.replace('Bearer ', ''));

  if (callerError || !callerData.user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', callerData.user.id)
    .single();

  if (callerProfile?.role !== 'admin') {
    return jsonResponse({ error: 'Only admins can create users' }, 403);
  }

  const body = await req.json();
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const name = String(body.name || email.split('@')[0] || '').trim();
  const phone = String(body.phone || '').trim();
  const role = (body.role || 'staff') as UserRole;
  const jobTypeName = String(body.jobType || '').trim();

  if (!email || !password || !name) {
    return jsonResponse({ error: 'Missing required fields' }, 400);
  }

  let jobTypeId: string | null = null;

  if (jobTypeName) {
    const { data: jobType, error: jobTypeError } = await admin
      .from('job_types')
      .upsert({ name: jobTypeName }, { onConflict: 'name' })
      .select('id')
      .single();

    if (jobTypeError) {
      return jsonResponse({ error: jobTypeError.message }, 400);
    }

    jobTypeId = jobType.id;
  }

  const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role,
      job_type: jobTypeName,
    },
  });

  if (createError || !createdUser.user) {
    return jsonResponse({ error: createError?.message || 'Failed to create user' }, 400);
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: createdUser.user.id,
    email,
    name,
    phone,
    role,
    job_type_id: jobTypeId,
  });

  if (profileError) {
    return jsonResponse({ error: profileError.message }, 400);
  }

  return jsonResponse({
    id: createdUser.user.id,
    email,
    name,
    role,
    jobType: jobTypeName,
  });
});
