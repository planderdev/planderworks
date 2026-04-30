import { createClient } from '@supabase/supabase-js';

const recipientRoutes = {
  japan: ['이인성', '이동욱'],
  china: ['최승우', '이동욱'],
  both: ['이인성', '최승우', '이동욱'],
};

const sendJson = (res, response, status = 200, origin = '*') => {
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Vary', 'Origin');
  return res.status(status).json(response);
};

const getAllowedOrigin = (req) => {
  const requestOrigin = req.headers.origin || '*';
  const allowedOrigins = String(process.env.MARKETING_LEAD_ALLOWED_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (!allowedOrigins.length) return requestOrigin;
  return allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
};

const getString = (body, keys) => {
  for (const key of keys) {
    const value = body?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
};

const normalizeMarket = (value) => {
  const lower = value.toLowerCase();
  const hasJapan = value.includes('일본') || lower.includes('japan');
  const hasChina = value.includes('중국') || lower.includes('china');

  if (hasJapan && hasChina) return 'both';
  if (hasChina) return 'china';
  return 'japan';
};

const buildDescription = (lead) =>
  [
    `원하는 마케팅: ${lead.desiredMarketing}`,
    `업체명: ${lead.companyName}`,
    `업종: ${lead.industry}`,
    `담당자: ${lead.contactName}`,
    `연락처: ${lead.contact}`,
    `예산범위: ${lead.budgetRange || '미입력'}`,
    `접수 경로: ${lead.source || '카페24 랜딩페이지'}`,
    `접수 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`,
  ].join('\n');

const notifyTask = async ({ supabaseUrl, serviceRoleKey, taskId }) => {
  const response = await fetch(`${supabaseUrl}/functions/v1/send-task-notification`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ taskId }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(body || `Notification failed: ${response.status}`);
  }
};

const parseBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  if (typeof req.body !== 'string') return {};

  try {
    return JSON.parse(req.body);
  } catch {
    return {};
  }
};

export default async function handler(req, res) {
  const origin = getAllowedOrigin(req);

  if (req.method === 'OPTIONS') {
    return sendJson(res, { ok: true }, 200, origin);
  }

  if (req.method !== 'POST') {
    return sendJson(res, { error: 'Method not allowed' }, 405, origin);
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return sendJson(res, { error: 'Missing server configuration' }, 500, origin);
  }

  const body = parseBody(req);

  if (body.website) {
    return sendJson(res, { ok: true, skipped: true }, 200, origin);
  }

  const lead = {
    desiredMarketing: getString(body, ['desiredMarketing', 'marketing', '원하는 마케팅']),
    companyName: getString(body, ['companyName', 'company', '업체명']),
    industry: getString(body, ['industry', 'businessType', '업종']),
    contactName: getString(body, ['contactName', 'managerName', '담당자']),
    contact: getString(body, ['contact', 'phone', '연락처']).replace(/\D/g, ''),
    budgetRange: getString(body, ['budgetRange', 'budget', '예산범위']),
    source: getString(body, ['source', 'utmSource', '접수 경로']),
  };

  const missingField = [
    ['desiredMarketing', '원하는 마케팅'],
    ['companyName', '업체명'],
    ['industry', '업종'],
    ['contactName', '담당자'],
    ['contact', '연락처'],
  ].find(([key]) => !lead[key]);

  if (missingField) {
    return sendJson(res, { error: `${missingField[1]}을 입력해주세요.` }, 400, origin);
  }

  if (!/^\d{11}$/.test(lead.contact)) {
    return sendJson(res, { error: '연락처는 숫자 11자리로 입력해주세요.' }, 400, origin);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
  const market = normalizeMarket(lead.desiredMarketing);
  const recipientNames = recipientRoutes[market];
  const neededNames = Array.from(new Set([...recipientNames, '이동욱']));

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name, role')
    .in('name', neededNames);

  if (profilesError) {
    return sendJson(res, { error: profilesError.message }, 500, origin);
  }

  const profileByName = new Map((profiles || []).map((profile) => [profile.name, profile]));
  const creator = profileByName.get('이동욱') || (profiles || [])[0];
  const assignees = recipientNames.map((name) => profileByName.get(name)).filter(Boolean);

  if (!creator || assignees.length !== recipientNames.length) {
    return sendJson(res, { error: '플랜더웍스 담당자 정보를 찾지 못했습니다.' }, 500, origin);
  }

  const title = `해외마케팅 상담 요청 - ${lead.companyName}`;
  const description = buildDescription(lead);
  const rows = assignees.map((assignee) => ({
    title,
    description,
    task_type: '업무 요청',
    status: 'pending',
    priority: 'high',
    creator_id: creator.id,
    assignee_id: assignee.id,
  }));

  const { data: createdTasks, error: taskError } = await supabase
    .from('tasks')
    .insert(rows)
    .select('id, assignee_id');

  if (taskError) {
    return sendJson(res, { error: taskError.message }, 500, origin);
  }

  const notificationErrors = [];

  await Promise.all(
    (createdTasks || []).map(async (task) => {
      try {
        await notifyTask({ supabaseUrl, serviceRoleKey, taskId: task.id });
      } catch (error) {
        notificationErrors.push(error instanceof Error ? error.message : String(error));
      }
    }),
  );

  if (notificationErrors.length) {
    return sendJson(
      res,
      {
        error: '업무는 생성됐지만 알림 전송에 실패했습니다.',
        taskCount: createdTasks?.length || 0,
      },
      502,
      origin,
    );
  }

  return sendJson(res, { ok: true, taskCount: createdTasks?.length || rows.length }, 200, origin);
}
