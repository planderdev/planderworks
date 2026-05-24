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
  const internalSecret = Deno.env.get('PLANDER_INTERNAL_SECRET');
  const internalSecretHeader = req.headers.get('x-plander-internal-secret');
  const isInternalCall = Boolean(internalSecret) && internalSecretHeader === internalSecret;

  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey || (!authHeader && !isInternalCall)) {
    return jsonResponse({ error: 'Missing server configuration' }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  let callerUserId: string | null = null;

  if (!isInternalCall) {
    const { data: callerData, error: callerError } = await admin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (callerError || !callerData.user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    callerUserId = callerData.user.id;
  }

  const { meetingMinuteId } = await req.json().catch(() => ({}));

  if (!meetingMinuteId) {
    return jsonResponse({ error: 'Missing meetingMinuteId' }, 400);
  }

  const { data: minute, error: minuteError } = await admin
    .from('meeting_minutes')
    .select('id, title, category, created_by, creator:profiles!meeting_minutes_created_by_fkey(name)')
    .eq('id', meetingMinuteId)
    .single();

  if (minuteError || !minute) {
    return jsonResponse({ error: minuteError?.message || 'Meeting minute not found' }, 404);
  }

  if (!isInternalCall && minute.created_by !== callerUserId) {
    const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', callerUserId).single();
    if (callerProfile?.role !== 'admin') {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }
  }

  const { data: admins, error: adminError } = await admin
    .from('profiles')
    .select('id')
    .eq('role', 'admin');

  if (adminError) {
    return jsonResponse({ error: adminError.message }, 400);
  }

  const adminIds = (admins || []).map((profile: { id: string }) => profile.id).filter(Boolean);
  if (!adminIds.length) {
    return jsonResponse({ sent: 0, skipped: 'No admins' });
  }

  const { data: preferences, error: preferencesError } = await admin
    .from('push_preferences')
    .select('user_id, report_enabled')
    .in('user_id', adminIds);

  if (preferencesError) {
    return jsonResponse({ error: preferencesError.message }, 400);
  }

  const preferencesByUser = new Map((preferences || []).map((preference: { user_id: string; report_enabled: boolean }) => [preference.user_id, preference]));
  const enabledAdminIds = adminIds.filter((userId) => {
    const preference = preferencesByUser.get(userId);
    return preference ? Boolean(preference.report_enabled) : true;
  });

  if (!enabledAdminIds.length) {
    return jsonResponse({ sent: 0, skipped: 'Admins disabled report push' });
  }

  const { data: subscriptions, error: subscriptionError } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', enabledAdminIds);

  if (subscriptionError) {
    return jsonResponse({ error: subscriptionError.message }, 400);
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const payload = JSON.stringify({
    title: '새 회의록이 등록되었습니다',
    body: `${minute.category} · ${minute.creator?.name || 'Plander'}: ${minute.title}`,
    url: '/#meetingMinutes',
    meetingMinuteId: minute.id,
  });
  const staleSubscriptionIds: string[] = [];
  let sent = 0;

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
