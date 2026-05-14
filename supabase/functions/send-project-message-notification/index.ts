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

  const { messageId } = await req.json();

  if (!messageId) {
    return jsonResponse({ error: 'Missing messageId' }, 400);
  }

  const { data: message, error: messageError } = await admin
    .from('project_messages')
    .select(`
      id,
      content,
      user_id,
      project_id,
      author:profiles!project_messages_user_id_fkey(name),
      project:projects(
        id,
        name,
        created_by,
        project_members(user_id)
      )
    `)
    .eq('id', messageId)
    .single();

  if (messageError || !message) {
    return jsonResponse({ error: messageError?.message || 'Message not found' }, 404);
  }

  if (message.user_id !== callerData.user.id) {
    const { data: callerProfile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', callerData.user.id)
      .single();

    if (callerProfile?.role !== 'admin') {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }
  }

  const project = Array.isArray(message.project) ? message.project[0] : message.project;

  if (!project) {
    return jsonResponse({ error: 'Project not found' }, 404);
  }

  const recipientIds = Array.from(
    new Set(
      [
        project.created_by,
        ...((project.project_members || []).map((member: { user_id?: string }) => member.user_id)),
      ].filter((userId): userId is string => Boolean(userId) && userId !== message.user_id),
    ),
  );

  if (!recipientIds.length) {
    return jsonResponse({ sent: 0, skipped: 'No recipients' });
  }

  const { data: preferences, error: preferencesError } = await admin
    .from('push_preferences')
    .select('user_id, project_message_enabled')
    .in('user_id', recipientIds);

  if (preferencesError) {
    return jsonResponse({ error: preferencesError.message }, 400);
  }

  const preferencesByUser = new Map((preferences || []).map((preference: { user_id: string; project_message_enabled: boolean }) => [preference.user_id, preference]));
  const enabledRecipientIds = recipientIds.filter((userId) => {
    const preference = preferencesByUser.get(userId);
    return preference ? preference.project_message_enabled : true;
  });

  if (!enabledRecipientIds.length) {
    return jsonResponse({ sent: 0, skipped: 'Recipients disabled project message push' });
  }

  const { data: subscriptions, error: subscriptionError } = await admin
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', enabledRecipientIds);

  if (subscriptionError) {
    return jsonResponse({ error: subscriptionError.message }, 400);
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const preview = String(message.content || '').replace(/\s+/g, ' ').slice(0, 80);
  const payload = JSON.stringify({
    title: `${project.name} 새 대화`,
    body: `${message.author?.name || 'Plander'}: ${preview}`,
    url: `/?projectId=${project.id}#project`,
    projectId: project.id,
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
