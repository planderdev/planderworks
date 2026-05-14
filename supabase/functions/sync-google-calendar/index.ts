import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, jsonResponse } from '../_shared/cors.ts';

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

type CalendarSyncEvent = {
  id: string;
  title: string;
  kind: string;
  description: string;
  sourceUrl: string;
  allDay: boolean;
  startAt: string;
  endAt: string;
  startDate: string;
  endDate: string;
};

const googleCalendarScope = 'https://www.googleapis.com/auth/calendar.events';
const googleTokenUrl = 'https://oauth2.googleapis.com/token';

function base64UrlEncode(input: string | ArrayBuffer) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = '';

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function privateKeyToArrayBuffer(privateKey: string) {
  const pemContents = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const binary = atob(pemContents);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

async function createServiceAccountAssertion(serviceAccount: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: googleCalendarScope,
    aud: googleTokenUrl,
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyToArrayBuffer(serviceAccount.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

async function getGoogleAccessToken(serviceAccount: ServiceAccount) {
  const assertion = await createServiceAccountAssertion(serviceAccount);
  const response = await fetch(googleTokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const data = await response.json().catch(() => ({})) as { access_token?: string; error?: string; error_description?: string };

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Google access token 발급 실패');
  }

  return data.access_token;
}

function toGoogleEventPayload(event: CalendarSyncEvent) {
  const timeZone = 'Asia/Seoul';
  const description = `${event.kind}\n${event.description || '내용 없음'}\n\nPlanderWorks: ${event.sourceUrl}`;
  const basePayload = {
    summary: event.title,
    description,
    source: { title: 'PlanderWorks', url: event.sourceUrl },
    extendedProperties: {
      private: {
        planderWorksId: event.id,
        planderSource: 'PlanderWorks',
      },
    },
  };

  if (event.allDay) {
    return {
      ...basePayload,
      start: { date: event.startDate },
      end: { date: event.endDate },
    };
  }

  return {
    ...basePayload,
    start: { dateTime: event.startAt, timeZone },
    end: { dateTime: event.endAt, timeZone },
  };
}

async function fetchGoogleCalendar<T>(
  calendarId: string,
  accessToken: string,
  path: string,
  init: RequestInit = {},
  params?: Record<string, string>,
) {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}${path}`);

  Object.entries(params || {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({})) as T & { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(data.error?.message || `Google Calendar 요청 실패 (${response.status})`);
  }

  return data as T;
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
  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_JSON');
  const authHeader = req.headers.get('Authorization');

  if (!supabaseUrl || !serviceRoleKey || !serviceAccountJson || !authHeader) {
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
    return jsonResponse({ error: 'Only admins can sync Google Calendar' }, 403);
  }

  const body = await req.json().catch(() => ({})) as { calendarId?: string; events?: CalendarSyncEvent[] };
  const calendarId = body.calendarId?.trim();
  const events = Array.isArray(body.events) ? body.events.filter((event) => event.id && event.title) : [];

  if (!calendarId) {
    return jsonResponse({ error: 'Missing calendarId' }, 400);
  }

  if (!events.length) {
    return jsonResponse({ error: 'No events to sync' }, 400);
  }

  let serviceAccount: ServiceAccount;

  try {
    serviceAccount = JSON.parse(serviceAccountJson) as ServiceAccount;
  } catch {
    return jsonResponse({ error: 'Invalid GOOGLE_SERVICE_ACCOUNT_JSON' }, 500);
  }

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    return jsonResponse({ error: 'Invalid service account credentials' }, 500);
  }

  try {
    const accessToken = await getGoogleAccessToken(serviceAccount);
    const result = { created: 0, updated: 0, failed: 0 };

    for (const event of events) {
      try {
        const searchResult = await fetchGoogleCalendar<{ items?: Array<{ id?: string }> }>(
          calendarId,
          accessToken,
          '/events',
          { method: 'GET' },
          {
            maxResults: '1',
            singleEvents: 'true',
            showDeleted: 'false',
            privateExtendedProperty: `planderWorksId=${event.id}`,
          },
        );
        const existingEventId = searchResult.items?.[0]?.id;
        const payload = toGoogleEventPayload(event);

        if (existingEventId) {
          await fetchGoogleCalendar(
            calendarId,
            accessToken,
            `/events/${encodeURIComponent(existingEventId)}`,
            {
              method: 'PATCH',
              body: JSON.stringify(payload),
            },
          );
          result.updated += 1;
        } else {
          await fetchGoogleCalendar(calendarId, accessToken, '/events', {
            method: 'POST',
            body: JSON.stringify(payload),
          });
          result.created += 1;
        }
      } catch {
        result.failed += 1;
      }
    }

    if (result.failed === events.length) {
      return jsonResponse({
        ...result,
        error: '모든 일정 전송에 실패했습니다. Calendar ID와 서비스 계정 캘린더 공유 권한을 확인해주세요.',
      }, 500);
    }

    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : 'Google Calendar sync failed' }, 500);
  }
});
