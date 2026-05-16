import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

type ScheduleBody = {
  action?: 'create' | 'update' | 'delete';
  email?: string;
  userId?: string;
  title?: string;
  memo?: string;
  startAt?: string;
  endAt?: string;
  allDay?: boolean;
  externalId?: string;
  externalSource?: string;
};

async function sha256Hex(value: string) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function parseScheduleDate(value: string | undefined, allDay: boolean, endOfDay = false) {
  if (!value) return null;
  const normalized = allDay && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T${endOfDay ? '23:59:59' : '00:00:00'}+09:00`
    : value;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const apiKey = req.headers.get('x-plander-api-key')?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing server configuration' }, 500);
  }

  if (!apiKey) {
    return jsonResponse({ error: 'Missing API key' }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const keyHash = await sha256Hex(apiKey);
  const { data: keyRecord, error: keyError } = await admin
    .from('api_keys')
    .select('id, scope, active')
    .eq('key_hash', keyHash)
    .eq('active', true)
    .single();

  if (keyError || !keyRecord) {
    return jsonResponse({ error: 'Invalid API key' }, 401);
  }

  if (keyRecord.scope !== 'personal_schedule') {
    return jsonResponse({ error: 'API key scope is not allowed for personal schedules' }, 403);
  }

  const body = (await req.json()) as ScheduleBody;
  const requestAction = body.action === 'delete' ? 'delete' : body.action === 'update' ? 'update' : 'create';
  const email = String(body.email || '').trim().toLowerCase();
  const userId = String(body.userId || '').trim();
  const title = String(body.title || '').trim();
  const memo = String(body.memo || '').trim();
  const allDay = Boolean(body.allDay);
  const externalId = body.externalId ? String(body.externalId).trim() : null;
  const externalSource = String(body.externalSource || 'personal_scheduler').trim() || 'personal_scheduler';

  if (requestAction === 'delete') {
    if (!externalId) {
      return jsonResponse({ error: 'Missing externalId' }, 400);
    }

    const { data: existing, error: existingError } = await admin
      .from('calendar_schedules')
      .select('id')
      .eq('external_source', externalSource)
      .eq('external_id', externalId)
      .maybeSingle();

    if (existingError) {
      return jsonResponse({ error: existingError.message }, 400);
    }

    if (existing?.id) {
      const { error: deleteError } = await admin
        .from('calendar_schedules')
        .delete()
        .eq('id', existing.id);

      if (deleteError) {
        return jsonResponse({ error: deleteError.message }, 400);
      }
    }

    await admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRecord.id);

    return jsonResponse({
      ok: true,
      action: existing?.id ? 'deleted' : 'missing',
      scheduleId: existing?.id || null,
    });
  }

  if (!title) {
    return jsonResponse({ error: 'Missing title' }, 400);
  }

  if (!email && !userId) {
    return jsonResponse({ error: 'Missing email or userId' }, 400);
  }

  const startDate = parseScheduleDate(body.startAt, allDay);
  const endDate = parseScheduleDate(body.endAt || body.startAt, allDay, true);

  if (!startDate || !endDate) {
    return jsonResponse({ error: 'Missing or invalid startAt/endAt' }, 400);
  }

  if (endDate.getTime() < startDate.getTime()) {
    return jsonResponse({ error: 'endAt must be later than startAt' }, 400);
  }

  const { data: profiles, error: profileError } = userId
    ? await admin.from('profiles').select('id, email, name').eq('id', userId).limit(1)
    : await admin.from('profiles').select('id, email, name').eq('email', email).limit(1);

  const profile = profiles?.[0];
  if (profileError || !profile) {
    return jsonResponse({ error: profileError?.message || 'Profile not found' }, 404);
  }

  const row = {
    title,
    memo,
    start_at: startDate.toISOString(),
    end_at: endDate.toISOString(),
    all_day: allDay,
    created_by: profile.id,
    external_source: externalId ? externalSource : null,
    external_id: externalId,
  };

  let scheduleId: string | null = null;
  let action: 'created' | 'updated' = 'created';

  if (externalId) {
    const { data: existing, error: existingError } = await admin
      .from('calendar_schedules')
      .select('id')
      .eq('external_source', externalSource)
      .eq('external_id', externalId)
      .maybeSingle();

    if (existingError) {
      return jsonResponse({ error: existingError.message }, 400);
    }

    if (existing?.id) {
      const { data: updated, error: updateError } = await admin
        .from('calendar_schedules')
        .update(row)
        .eq('id', existing.id)
        .select('id')
        .single();

      if (updateError || !updated) {
        return jsonResponse({ error: updateError?.message || 'Failed to update schedule' }, 400);
      }

      scheduleId = updated.id;
      action = 'updated';
    }
  }

  if (!scheduleId) {
    const { data: created, error: insertError } = await admin
      .from('calendar_schedules')
      .insert(row)
      .select('id')
      .single();

    if (insertError || !created) {
      return jsonResponse({ error: insertError?.message || 'Failed to create schedule' }, 400);
    }

    scheduleId = created.id;
  }

  await admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRecord.id);

  return jsonResponse({
    ok: true,
    action,
    scheduleId,
    userId: profile.id,
    userName: profile.name,
  });
});
