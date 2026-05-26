import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

// 공지 푸시 발송
// - important=true → 전원 강제 발송 (notice_enabled 무시)
// - important=false → notice_enabled=true(또는 미설정=기본 true)인 사람에게만
// 대상은 admin만이 아닌 전 프로필.

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
    const { data: callerData, error: callerError } = await admin.auth.getUser(authHeader!.replace('Bearer ', ''));
    if (callerError || !callerData.user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }
    callerUserId = callerData.user.id;
  }

  const { noticeId } = await req.json().catch(() => ({}));
  if (!noticeId) {
    return jsonResponse({ error: 'Missing noticeId' }, 400);
  }

  const { data: notice, error: noticeError } = await admin
    .from('notices')
    .select('id, title, category, important, created_by, creator:profiles!notices_created_by_fkey(name)')
    .eq('id', noticeId)
    .single();

  if (noticeError || !notice) {
    return jsonResponse({ error: noticeError?.message || 'Notice not found' }, 404);
  }

  // 작성 권한 검증 — 작성자거나 admin만 푸시 트리거 가능
  if (!isInternalCall && notice.created_by !== callerUserId) {
    const { data: callerProfile } = await admin.from('profiles').select('role').eq('id', callerUserId).single();
    if (callerProfile?.role !== 'admin') {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }
  }

  // 대상 = 전 프로필
  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id');

  if (profilesError) {
    return jsonResponse({ error: profilesError.message }, 400);
  }

  const allUserIds = (profiles || []).map((p: { id: string }) => p.id).filter(Boolean);
  if (!allUserIds.length) {
    return jsonResponse({ sent: 0, skipped: 'No users' });
  }

  // 중요 공지가 아니면 notice_enabled 필터 적용
  let targetUserIds = allUserIds;
  if (!notice.important) {
    const { data: preferences, error: preferencesError } = await admin
      .from('push_preferences')
      .select('user_id, notice_enabled')
      .in('user_id', allUserIds);

    if (preferencesError) {
      return jsonResponse({ error: preferencesError.message }, 400);
    }

    const prefMap = new Map(
      (preferences || []).map((p: { user_id: string; notice_enabled: boolean | null }) => [p.user_id, p]),
    );

    targetUserIds = allUserIds.filter((userId) => {
      const pref = prefMap.get(userId);
      // 미설정 → 기본 true
      return pref ? pref.notice_enabled !== false : true;
    });
  }

  if (!targetUserIds.length) {
    return jsonResponse({ sent: 0, skipped: 'All users disabled notice push' });
  }

  const { data: subscriptions, error: subscriptionError } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', targetUserIds);

  if (subscriptionError) {
    return jsonResponse({ error: subscriptionError.message }, 400);
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const payload = JSON.stringify({
    title: `${notice.important ? '[중요] ' : ''}새 공지: ${notice.title}`,
    body: `${notice.category} · ${notice.creator?.name || 'Plander'}`,
    url: '/#notices',
    noticeId: notice.id,
    important: Boolean(notice.important),
  });

  const staleSubscriptionIds: string[] = [];
  let sent = 0;

  await Promise.all(
    (subscriptions || []).map(async (subscription: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
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

  return jsonResponse({
    sent,
    removed: staleSubscriptionIds.length,
    important: Boolean(notice.important),
    targets: targetUserIds.length,
  });
});
