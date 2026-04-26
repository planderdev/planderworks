import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
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
  const internalSecret = Deno.env.get('PLANDER_INTERNAL_SECRET');
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@plander.co.kr';
  const authHeader = req.headers.get('Authorization');
  const apiKeyHeader = req.headers.get('apikey');
  const internalSecretHeader = req.headers.get('x-plander-internal-secret');

  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    !vapidPublicKey ||
    !vapidPrivateKey ||
    (!authHeader && !apiKeyHeader && !internalSecretHeader)
  ) {
    return jsonResponse({ error: 'Missing server configuration' }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const isInternalServiceCall =
    (Boolean(internalSecret) && internalSecretHeader === internalSecret) ||
    authHeader === `Bearer ${serviceRoleKey}` ||
    apiKeyHeader === serviceRoleKey;
  let callerUserId: string | null = null;

  if (!isInternalServiceCall) {
    const { data: callerData, error: callerError } = await admin.auth.getUser(authHeader.replace('Bearer ', ''));

    if (callerError || !callerData.user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    callerUserId = callerData.user.id;
  }

  const { taskId } = await req.json();

  if (!taskId) {
    return jsonResponse({ error: 'Missing taskId' }, 400);
  }

  const { data: task, error: taskError } = await admin
    .from('tasks')
    .select(`
      id,
      title,
      description,
      creator_id,
      assignee_id,
      creator:profiles!tasks_creator_id_fkey(name),
      assignee:profiles!tasks_assignee_id_fkey(name)
    `)
    .eq('id', taskId)
    .single();

  if (taskError || !task) {
    return jsonResponse({ error: taskError?.message || 'Task not found' }, 404);
  }

  if (!isInternalServiceCall && task.creator_id !== callerUserId) {
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', callerUserId)
      .single();

    if (callerProfile?.role !== 'admin') {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }
  }

  if (!task.assignee_id) {
    return jsonResponse({ sent: 0, skipped: 'No assignee' });
  }

  const { data: subscriptions, error: subscriptionError } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', task.assignee_id);

  if (subscriptionError) {
    return jsonResponse({ error: subscriptionError.message }, 400);
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const payload = JSON.stringify({
    title: '새 업무가 도착했습니다',
    body: `${task.creator?.name || 'Plander'} → ${task.assignee?.name || '담당자'}: ${task.title}`,
    url: `/?taskId=${task.id}`,
    taskId: task.id,
  });

  let sent = 0;
  const staleSubscriptionIds: string[] = [];

  await Promise.all(
    (subscriptions || []).map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload,
        );
        sent += 1;
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          staleSubscriptionIds.push(subscription.id);
        }
      }
    }),
  );

  if (staleSubscriptionIds.length) {
    await admin.from('push_subscriptions').delete().in('id', staleSubscriptionIds);
  }

  return jsonResponse({ sent, removed: staleSubscriptionIds.length });
});
