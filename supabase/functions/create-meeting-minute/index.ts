import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

type MeetingMinuteBody = {
  category?: string;
  title?: string;
  content?: string;
  summary?: string;
  decisions?: string;
  actionItems?: string;
  attendees?: string;
  projectId?: string;
  heldAt?: string;
  sourceApp?: string;
  externalId?: string;
  authorEmail?: string;
  authorUserId?: string;
};

async function sha256Hex(value: string) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function parseDate(value: string | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
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
  const internalSecret = Deno.env.get('PLANDER_INTERNAL_SECRET');
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
    .select('id, scope, active, created_by')
    .eq('key_hash', keyHash)
    .eq('active', true)
    .single();

  if (keyError || !keyRecord) {
    return jsonResponse({ error: 'Invalid API key' }, 401);
  }

  if (keyRecord.scope !== 'meeting_minutes') {
    return jsonResponse({ error: 'API key scope is not allowed for meeting minutes' }, 403);
  }

  const body = (await req.json().catch(() => ({}))) as MeetingMinuteBody;
  const category = String(body.category || '내부회의').trim();
  const title = String(body.title || '').trim();
  const content = String(body.content || '').trim();
  const summary = String(body.summary || '').trim();
  const decisions = String(body.decisions || '').trim();
  const actionItems = String(body.actionItems || '').trim();
  const attendees = String(body.attendees || '').trim();
  const projectId = body.projectId ? String(body.projectId).trim() : null;
  const sourceApp = String(body.sourceApp || 'external_recorder').trim() || 'external_recorder';
  const externalId = body.externalId ? String(body.externalId).trim() : null;
  const heldAt = parseDate(body.heldAt);

  if (!title) {
    return jsonResponse({ error: 'Missing title' }, 400);
  }

  if (!content && !summary) {
    return jsonResponse({ error: 'Missing content or summary' }, 400);
  }

  let createdBy = keyRecord.created_by || null;
  const authorEmail = String(body.authorEmail || '').trim().toLowerCase();
  const authorUserId = String(body.authorUserId || '').trim();

  if (authorEmail || authorUserId) {
    const { data: profiles, error: profileError } = authorUserId
      ? await admin.from('profiles').select('id').eq('id', authorUserId).limit(1)
      : await admin.from('profiles').select('id').eq('email', authorEmail).limit(1);

    if (profileError) {
      return jsonResponse({ error: profileError.message }, 400);
    }
    if (profiles?.[0]?.id) createdBy = profiles[0].id;
  }

  const row = {
    category,
    title,
    content: content || summary,
    summary,
    decisions,
    action_items: actionItems,
    attendees,
    project_id: projectId,
    held_at: heldAt ? heldAt.toISOString() : null,
    source_app: externalId ? sourceApp : null,
    external_id: externalId,
    created_by: createdBy,
  };

  let minuteId: string | null = null;
  let action: 'created' | 'updated' = 'created';

  if (externalId) {
    const { data: existing, error: existingError } = await admin
      .from('meeting_minutes')
      .select('id')
      .eq('source_app', sourceApp)
      .eq('external_id', externalId)
      .maybeSingle();

    if (existingError) {
      return jsonResponse({ error: existingError.message }, 400);
    }

    if (existing?.id) {
      const { data: updated, error: updateError } = await admin
        .from('meeting_minutes')
        .update(row)
        .eq('id', existing.id)
        .select('id')
        .single();

      if (updateError || !updated) {
        return jsonResponse({ error: updateError?.message || 'Failed to update meeting minute' }, 400);
      }

      minuteId = updated.id;
      action = 'updated';
    }
  }

  if (!minuteId) {
    const { data: created, error: insertError } = await admin
      .from('meeting_minutes')
      .insert(row)
      .select('id')
      .single();

    if (insertError || !created) {
      return jsonResponse({ error: insertError?.message || 'Failed to create meeting minute' }, 400);
    }

    minuteId = created.id;
  }

  await admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRecord.id);

  let notification: unknown = null;
  if (action === 'created') {
    const notifyResponse = await fetch(`${supabaseUrl}/functions/v1/send-meeting-minute-notification`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-plander-internal-secret': internalSecret || '',
      },
      body: JSON.stringify({ meetingMinuteId: minuteId }),
    });
    notification = {
      ok: notifyResponse.ok,
      status: notifyResponse.status,
      body: await notifyResponse.text(),
    };
  }

  return jsonResponse({
    ok: true,
    action,
    meetingMinuteId: minuteId,
    notification,
  });
});
