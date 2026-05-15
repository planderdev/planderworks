import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

type UserRole = 'admin' | 'staff';

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
    return jsonResponse({ error: 'Only admins can update users' }, 403);
  }

  const body = await req.json();
  const userId = String(body.userId || '').trim();
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const role: UserRole = body.role === 'admin' ? 'admin' : 'staff';
  const jobTypeName = String(body.jobType || '').trim();
  const password = String(body.password || '');
  const avatarUrl = body.avatarUrl ? String(body.avatarUrl).trim() : null;

  if (!userId || !name) {
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

  const userUpdate: {
    password?: string;
    user_metadata: {
      name: string;
      role: UserRole;
      job_type: string;
      avatar_url: string | null;
    };
  } = {
    user_metadata: {
      name,
      role,
      job_type: jobTypeName,
      avatar_url: avatarUrl,
    },
  };

  if (password) {
    userUpdate.password = password;
  }

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, userUpdate);

  if (authUpdateError) {
    return jsonResponse({ error: authUpdateError.message }, 400);
  }

  const { error: profileError } = await admin
    .from('profiles')
    .update({
      name,
      phone,
      role,
      job_type_id: jobTypeId,
      avatar_url: avatarUrl,
    })
    .eq('id', userId);

  if (profileError) {
    return jsonResponse({ error: profileError.message }, 400);
  }

  return jsonResponse({
    id: userId,
    name,
    phone,
    role,
    jobType: jobTypeName,
    avatarUrl,
  });
});
