import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

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

  const { taskId } = await req.json();

  if (!taskId) {
    return jsonResponse({ error: 'Missing taskId' }, 400);
  }

  const { data: task, error: taskError } = await admin
    .from('tasks')
    .select('id, creator_id')
    .eq('id', taskId)
    .single();

  if (taskError || !task) {
    return jsonResponse({ error: taskError?.message || 'Task not found' }, 404);
  }

  const { data: callerProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', callerData.user.id)
    .single();

  const canDelete = callerProfile?.role === 'admin' || task.creator_id === callerData.user.id;

  if (!canDelete) {
    return jsonResponse({ error: 'Only admins or task creators can delete tasks' }, 403);
  }

  const { error: deleteError } = await admin.from('tasks').delete().eq('id', taskId);

  if (deleteError) {
    return jsonResponse({ error: deleteError.message }, 400);
  }

  return jsonResponse({ deleted: true, taskId });
});
