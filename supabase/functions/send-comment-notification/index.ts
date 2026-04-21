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
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@plander.co.kr';
  const authHeader = req.headers.get('Authorization');

  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey || !authHeader) {
    return jsonResponse({ error: 'Missing server configuration' }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: callerData, error: callerError } = await admin.auth.getUser(authHeader.replace('Bearer ', ''));

  if (callerError || !callerData.user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const { commentId } = await req.json();

  if (!commentId) {
    return jsonResponse({ error: 'Missing commentId' }, 400);
  }

  const { data: comment, error: commentError } = await admin
    .from('task_comments')
    .select(`
      id,
      content,
      user_id,
      task_id,
      author:profiles!task_comments_user_id_fkey(name),
      task:tasks(
        id,
        title,
        creator_id,
        assignee_id,
        task_watchers(user_id)
      )
    `)
    .eq('id', commentId)
    .single();

  if (commentError || !comment) {
    return jsonResponse({ error: commentError?.message || 'Comment not found' }, 404);
  }

  if (comment.user_id !== callerData.user.id) {
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', callerData.user.id)
      .single();

    if (callerProfile?.role !== 'admin') {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }
  }

  const task = Array.isArray(comment.task) ? comment.task[0] : comment.task;
  if (!task) {
    return jsonResponse({ error: 'Task not found' }, 404);
  }

  const recipientIds = Array.from(
    new Set(
      [
        task.creator_id,
        task.assignee_id,
        ...((task.task_watchers || []).map((watcher: { user_id?: string }) => watcher.user_id)),
      ].filter((userId): userId is string => Boolean(userId) && userId !== comment.user_id),
    ),
  );

  if (!recipientIds.length) {
    return jsonResponse({ sent: 0, skipped: 'No recipients' });
  }

  const { data: subscriptions, error: subscriptionError } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', recipientIds);

  if (subscriptionError) {
    return jsonResponse({ error: subscriptionError.message }, 400);
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const payload = JSON.stringify({
    title: '업무에 댓글이 달렸습니다',
    body: `${comment.author?.name || 'Plander'}: ${task.title}`,
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
