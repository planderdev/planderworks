import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Session } from '@supabase/supabase-js';
import {
  Bell,
  BellOff,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Download,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Reply,
  Search,
  SendHorizontal,
  Settings,
  ShieldCheck,
  Sun,
  Trash2,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { hasSupabaseConfig, supabase } from './supabaseClient';
import './styles.css';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type ThemeMode = 'system' | 'light' | 'dark';
type ActiveView =
  | 'dashboard'
  | 'calendar'
  | 'allTasks'
  | 'inbox'
  | 'sent'
  | 'project'
  | 'create'
  | 'reports'
  | 'clients'
  | 'employees'
  | 'operations'
  | 'settings';
type TaskStatus = '대기' | '진행중' | '완료 요청' | '보류' | '완료';
type TaskListFilter = '전체' | TaskStatus;
type Priority = '높음' | '보통' | '낮음';
type TaskType = string;

const appViews: ActiveView[] = ['dashboard', 'calendar', 'allTasks', 'inbox', 'sent', 'project', 'create', 'reports', 'clients', 'employees', 'operations', 'settings'];
const fallbackTaskTypes: TaskType[] = ['영업 브리핑', '디자인 요청', '보고', '제안', '확인 요청', '촬영 요청', '시장 조사'];
const MAX_TASK_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TASK_FILE_SIZE_LABEL = '10MB';
const MAX_AVATAR_FILE_SIZE = 1024 * 1024;
const MAX_AVATAR_FILE_SIZE_LABEL = '1MB';
const AVATAR_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const defaultPushPreferences: PushPreferences = {
  task: true,
  report: true,
  projectMessage: true,
};

type AppUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  accountRole: 'admin' | 'staff';
  isPrototype: boolean;
  avatarUrl?: string | null;
};

type Task = {
  id: string;
  title: string;
  from: string;
  to: string;
  creatorId?: string;
  assigneeId?: string;
  recipientIds?: string[];
  clientId?: string;
  projectId?: string | null;
  projectName?: string;
  client: string;
  dueAt?: string | null;
  startedAt?: string | null;
  readAt?: string | null;
  creatorReadAt?: string | null;
  due: string;
  status: TaskStatus;
  priority: Priority;
  type: TaskType;
  summary: string;
  watchers: string[];
  files: TaskFile[];
  comments: TaskComment[];
  creatorAvatarUrl?: string | null;
  assigneeAvatarUrl?: string | null;
};

type TaskFile = {
  id: string;
  name: string;
  path: string;
  size?: number | null;
  mimeType?: string | null;
};

type TaskComment = {
  id: string;
  taskId: string;
  parentId?: string | null;
  userId?: string;
  author: string;
  avatarUrl?: string | null;
  content: string;
  createdAt: string;
};

type Client = {
  id: string;
  name: string;
  manager: string;
  phone: string;
  region: string;
  memo: string;
};

type Project = {
  id: string;
  name: string;
  clientId?: string | null;
  client: string;
  status: string;
  createdBy?: string | null;
  memberIds: string[];
  memberNames: string[];
};

type ProjectMessage = {
  id: string;
  projectId: string;
  userId: string;
  author: string;
  avatarUrl?: string | null;
  content: string;
  createdAt: string;
  readByIds: string[];
  readBy: string[];
};

type PushPreferences = {
  task: boolean;
  report: boolean;
  projectMessage: boolean;
};

type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobType: string;
  role: '관리자' | '사용자';
  load: number;
  avatarUrl?: string | null;
};

type NewEmployee = Omit<Employee, 'id' | 'load'> & {
  password?: string;
};

type EmployeeUpdate = Pick<Employee, 'name' | 'phone' | 'jobType' | 'role' | 'avatarUrl'> & {
  password?: string;
};

type OwnProfileUpdate = Pick<Employee, 'name' | 'phone' | 'jobType' | 'avatarUrl'> & {
  password?: string;
};

type TaskDraft = Omit<Task, 'id' | 'status' | 'watchers' | 'files' | 'comments' | 'dueAt' | 'startedAt' | 'readAt' | 'creatorReadAt'> & {
  status?: TaskStatus;
  watchers?: string[];
  toIds?: string[];
  toList?: string[];
  clientId?: string;
  projectId?: string | null;
  files?: File[];
};

type TaskUpdateDraft = {
  title: string;
  summary: string;
  type: TaskType;
  assigneeId: string;
  clientId: string;
  projectId?: string | null;
  due: string;
  priority: Priority;
};

type OperationCategory = '서버' | '도메인' | 'SaaS' | '정산' | '세금' | '라이선스' | '기타';
type OperationFrequency = '1회' | '매월' | '분기' | '반기' | '매년';
type OperationFilter = '전체' | '오늘' | '7일 이내' | '이번달' | '미완료';
type OperationStatus = '예정' | '임박' | '오늘' | '완료' | '보류';
type OperationItem = {
  id: string;
  title: string;
  category: OperationCategory;
  provider: string;
  amount: number;
  dueDate: string;
  frequency: OperationFrequency;
  assigneeId: string;
  reminders: Array<0 | 1 | 3 | 7>;
  memo: string;
  link: string;
  active: boolean;
  lastCompletedAt?: string | null;
};
type OperationDraft = Omit<OperationItem, 'id' | 'lastCompletedAt'> & {
  lastCompletedAt?: string | null;
};
type GoogleCalendarSettings = {
  calendarId: string;
};
type WorkSchedule = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  memo: string;
  createdBy: string;
  creatorName: string;
};
type WorkScheduleDraft = {
  title: string;
  startAt: string;
  endAt: string;
  memo: string;
};
type CalendarEventItem = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  days: number;
  kind: string;
  description: string;
  sourceUrl: string;
  allDay: boolean;
  onClick: () => void;
};
type GoogleCalendarSyncResult = {
  created: number;
  updated: number;
  failed: number;
};

type TaskSubmitHandler = (task: TaskDraft) => Promise<string>;
type TaskUpdateHandler = (task: Task, updates: TaskUpdateDraft) => Promise<string>;
type TaskDeleteHandler = (task: Task) => Promise<string>;
type TaskCommentSubmitHandler = (task: Task, content: string, parentCommentId?: string | null) => Promise<string>;
type TaskCommentDeleteHandler = (task: Task, comment: TaskComment) => Promise<string>;
type MessageHandler = (message: string) => void;
type ClientSubmitHandler = (client: Omit<Client, 'id'>) => Promise<string>;
type ClientUpdateHandler = (clientId: string, client: Omit<Client, 'id'>) => Promise<string>;
type ClientDeleteHandler = (client: Client) => Promise<string>;
type ProjectDraft = { name: string; clientId: string; memberIds: string[] };
type ProjectSubmitHandler = (project: ProjectDraft) => Promise<string>;
type ProjectUpdateHandler = (projectId: string, project: ProjectDraft) => Promise<string>;
type WorkScheduleSubmitHandler = (schedule: WorkScheduleDraft) => Promise<string>;
type JobTypeSubmitHandler = (name: string) => Promise<string>;
type JobTypeDeleteHandler = (name: string) => Promise<string>;
type TaskTypeSubmitHandler = (name: string) => Promise<string>;
type TaskTypeDeleteHandler = (name: string) => Promise<string>;
type EmployeeSubmitHandler = (employee: NewEmployee) => Promise<string>;
type EmployeeUpdateHandler = (employeeId: string, updates: EmployeeUpdate) => Promise<string>;
type GoogleCalendarSettingsHandler = (settings: GoogleCalendarSettings) => Promise<string>;
type PushPreferencesUpdateHandler = (preferences: PushPreferences) => Promise<string>;

function showActionPopup(message: string) {
  window.dispatchEvent(new CustomEvent('plander-action-complete', { detail: message }));
}

let confirmRequestId = 0;
const confirmResolvers = new Map<number, (confirmed: boolean) => void>();

function requestActionConfirm(message: string) {
  const id = confirmRequestId + 1;
  confirmRequestId = id;
  return new Promise<boolean>((resolve) => {
    confirmResolvers.set(id, resolve);
    window.dispatchEvent(new CustomEvent('plander-action-confirm-request', { detail: { id, message } }));
  });
}

function resolveActionConfirm(id: number, confirmed: boolean) {
  confirmResolvers.get(id)?.(confirmed);
  confirmResolvers.delete(id);
}

const primaryNavItems: Array<{ id: ActiveView; label: string; icon: React.ElementType }> = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'clients', label: '업체관리', icon: Building2 },
  { id: 'reports', label: '보고·제안', icon: FileText },
  { id: 'allTasks', label: '전체 업무보기', icon: BriefcaseBusiness },
  { id: 'operations', label: '구독/정산관리', icon: ShieldCheck },
  { id: 'calendar', label: '캘린더', icon: CalendarClock },
];

const adminNavItems: Array<{ id: ActiveView; label: string; icon: React.ElementType }> = [
  { id: 'employees', label: '직원 관리', icon: UserCog },
  { id: 'settings', label: '설정', icon: Settings },
];

const seedTasks: Task[] = [
  {
    id: '1',
    title: 'A식당 일본 나노 인플루언서 섭외 브리핑',
    from: '인성이형',
    to: '대표',
    client: 'A식당',
    due: '4월 25일',
    status: '진행중',
    priority: '높음',
    type: '영업 브리핑',
    summary: '일본인 한국여행 계정 8명 후보와 촬영 가능 일정 정리 필요',
    watchers: ['대표', '운영팀'],
    files: [],
    comments: [],
  },
  {
    id: '2',
    title: 'B뷰티샵 상세페이지 톤앤매너 요청',
    from: '인성이형',
    to: '디자인팀장',
    client: 'B뷰티샵',
    due: '4월 28일',
    status: '대기',
    priority: '보통',
    type: '디자인 요청',
    summary: '일본 현지 고객용 상세페이지 레퍼런스와 시술 메뉴 번역본 전달',
    watchers: ['인성이형'],
    files: [],
    comments: [],
  },
  {
    id: '3',
    title: '온고 조청 브랜드 일본 판매 채널 조사',
    from: '대표',
    to: '인성이형',
    client: '온고',
    due: '5월 2일',
    status: '완료 요청',
    priority: '높음',
    type: '시장 조사',
    summary: '라쿠텐, 아마존 재팬, 큐텐 입점 조건 비교 및 예상 비용 보고',
    watchers: ['대표', '디자인팀장'],
    files: [],
    comments: [],
  },
  {
    id: '4',
    title: '제주 숙소 릴스 촬영 일정 확인',
    from: '운영팀',
    to: '인성이형',
    client: '제주 숙소',
    due: '4월 30일',
    status: '보류',
    priority: '낮음',
    type: '촬영 요청',
    summary: '비 오는 날 대체 촬영 컷 구성과 인플루언서 이동 동선 확인',
    watchers: ['운영팀'],
    files: [],
    comments: [],
  },
];

const seedClients: Client[] = [
  { id: '1', name: 'A식당', manager: '인성이형', phone: '010-0000-0000', region: '서울', memo: '일본 여행 계정 섭외 관심' },
  { id: '2', name: 'B뷰티샵', manager: '디자인팀장', phone: '010-1111-2222', region: '경기', memo: '상세페이지와 릴스 패키지 문의' },
  { id: '3', name: '온고', manager: '대표', phone: '010-3333-4444', region: '평택', memo: '일본 이커머스 진출 준비' },
];

const seedEmployees: Employee[] = [
  { id: '1', name: '인성이형', email: 'insung@plander.co.kr', phone: '010-0000-0000', jobType: '일본 마케팅', role: '관리자', load: 7 },
  { id: '2', name: '대표', email: 'ceo@plander.co.kr', phone: '010-1111-1111', jobType: '경영·영업', role: '관리자', load: 5 },
  { id: '3', name: '디자인팀장', email: 'design@plander.co.kr', phone: '010-2222-2222', jobType: 'UIUX·브랜딩', role: '사용자', load: 9 },
  { id: '4', name: '개발팀', email: 'dev@plander.co.kr', phone: '010-3333-3333', jobType: '웹·앱 개발', role: '사용자', load: 4 },
];

const seedJobTypes = ['일본 마케팅', '국내 마케팅', '디자인', '개발', '영업', '운영', '대표', '회계·정산'];
const operationStorageKey = 'plander-operations-items';
const operationCategories: OperationCategory[] = ['서버', '도메인', 'SaaS', '정산', '세금', '라이선스', '기타'];
const operationFrequencies: OperationFrequency[] = ['1회', '매월', '분기', '반기', '매년'];
const operationReminderOptions: Array<0 | 1 | 3 | 7> = [7, 3, 1, 0];
const seedOperationItems: OperationItem[] = [
  {
    id: 'op-1',
    title: 'Vercel Pro 결제',
    category: '서버',
    provider: 'Vercel',
    amount: 32000,
    dueDate: '2026-04-25',
    frequency: '매월',
    assigneeId: '1',
    reminders: [7, 1, 0],
    memo: '대표 카드로 결제, 결제 후 청구서 확인 필요',
    link: 'https://vercel.com',
    active: true,
    lastCompletedAt: null,
  },
  {
    id: 'op-2',
    title: 'plander.jp 도메인 갱신',
    category: '도메인',
    provider: '가비아',
    amount: 18000,
    dueDate: '2026-04-27',
    frequency: '매년',
    assigneeId: '4',
    reminders: [7, 3, 1],
    memo: '네임서버 설정 유지 확인',
    link: 'https://domain.gabia.com',
    active: true,
    lastCompletedAt: null,
  },
  {
    id: 'op-3',
    title: '인스타 광고비 정산',
    category: '정산',
    provider: 'Meta Ads',
    amount: 450000,
    dueDate: '2026-04-30',
    frequency: '매월',
    assigneeId: '1',
    reminders: [3, 1, 0],
    memo: '일본 캠페인별 카드 매출 정리',
    link: '',
    active: true,
    lastCompletedAt: null,
  },
  {
    id: 'op-4',
    title: 'Google Workspace 라이선스 갱신',
    category: '라이선스',
    provider: 'Google',
    amount: 72000,
    dueDate: '2026-05-02',
    frequency: '매월',
    assigneeId: '2',
    reminders: [7, 1],
    memo: '계정 수 변동 시 금액 체크',
    link: 'https://admin.google.com',
    active: true,
    lastCompletedAt: null,
  },
];

function getInitialOperations() {
  const saved = localStorage.getItem(operationStorageKey);
  if (!saved) return seedOperationItems;

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return seedOperationItems;
    return parsed.filter(Boolean) as OperationItem[];
  } catch {
    return seedOperationItems;
  }
}

const googleCalendarSettingsStorageKey = 'plander-google-calendar-settings';

function getInitialGoogleCalendarSettings(): GoogleCalendarSettings {
  const saved = localStorage.getItem(googleCalendarSettingsStorageKey);
  if (!saved) return { calendarId: '' };

  try {
    const parsed = JSON.parse(saved) as Partial<GoogleCalendarSettings>;
    return {
      calendarId: parsed.calendarId || '',
    };
  } catch {
    return { calendarId: '' };
  }
}

function normalizeGoogleCalendarSettings(settings: GoogleCalendarSettings): GoogleCalendarSettings {
  return {
    calendarId: settings.calendarId.trim(),
  };
}

function getCalendarEndDate(event: CalendarEventItem) {
  if (event.end.getTime() > event.start.getTime()) return event.end;
  return new Date(event.start.getTime() + 60 * 60 * 1000);
}

function toGoogleCalendarSyncPayload(events: CalendarEventItem[]) {
  return events.map((event) => ({
    id: event.id,
    title: event.title,
    kind: event.kind,
    description: event.description,
    sourceUrl: event.sourceUrl,
    allDay: event.allDay,
    startAt: event.start.toISOString(),
    endAt: getCalendarEndDate(event).toISOString(),
    startDate: formatDateInputValue(startOfCalendarDay(event.start)),
    endDate: formatDateInputValue(addCalendarDays(startOfCalendarDay(event.end), 1)),
  }));
}

async function syncEventsToGoogleCalendar(settings: GoogleCalendarSettings, events: CalendarEventItem[]) {
  const normalizedSettings = normalizeGoogleCalendarSettings(settings);

  if (!supabase) throw new Error('Supabase 연결이 필요합니다.');
  if (!normalizedSettings.calendarId) throw new Error('Google Calendar ID를 먼저 저장해주세요.');
  if (!events.length) throw new Error('옮길 스케줄이 없습니다.');

  const { data, error } = await supabase.functions.invoke('sync-google-calendar', {
    body: {
      calendarId: normalizedSettings.calendarId,
      events: toGoogleCalendarSyncPayload(events),
    },
  });

  if (error || data?.error) {
    throw new Error(data?.error || error?.message || 'Google Calendar 동기화에 실패했습니다.');
  }

  return data as GoogleCalendarSyncResult;
}

function getInitialTheme(): ThemeMode {
  const saved = localStorage.getItem('plander-theme');
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  return 'system';
}

function applyTheme(mode: ThemeMode) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
}

function getUserFromSession(session: Session | null): AppUser | null {
  if (!session?.user.email) return null;

  return {
    id: session.user.id,
    name: session.user.user_metadata?.name || session.user.email.split('@')[0],
    email: session.user.email,
    role: session.user.user_metadata?.job_type || 'Plander',
    accountRole: session.user.user_metadata?.role === 'admin' ? 'admin' : 'staff',
    avatarUrl: session.user.user_metadata?.avatar_url || null,
    isPrototype: false,
  };
}

const statusToDb: Record<TaskStatus, string> = {
  대기: 'pending',
  진행중: 'in_progress',
  보류: 'blocked',
  '완료 요청': 'completion_requested',
  완료: 'completed',
};

const statusFromDb: Record<string, TaskStatus> = {
  pending: '대기',
  in_progress: '진행중',
  blocked: '보류',
  completion_requested: '완료 요청',
  completed: '완료',
  rejected: '보류',
  cancelled: '보류',
};

const priorityToDb: Record<Priority, string> = {
  낮음: 'low',
  보통: 'normal',
  높음: 'high',
};

const priorityFromDb: Record<string, Priority> = {
  low: '낮음',
  normal: '보통',
  high: '높음',
};

const roleToDb: Record<Employee['role'], string> = {
  관리자: 'admin',
  사용자: 'staff',
};

const roleFromDb: Record<string, Employee['role']> = {
  admin: '관리자',
  manager: '사용자',
  staff: '사용자',
};

const getPhoneDigits = (value: string) => value.replace(/\D/g, '').slice(0, 11);

const formatMobilePhone = (value: string) => {
  const digits = getPhoneDigits(value);

  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

const hasValidMobilePhoneLength = (value: string) => {
  const digits = getPhoneDigits(value);
  return digits.length === 0 || digits.length === 11;
};

const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const isActiveView = (value: unknown): value is ActiveView => typeof value === 'string' && appViews.includes(value as ActiveView);
const urlPattern = /((?:https?:\/\/|www\.)[^\s<]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<]*)?)/gi;
const taskCardSummaryLimit = 52;

function truncateText(value: string, limit = taskCardSummaryLimit) {
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > limit ? `${normalized.slice(0, limit).trimEnd()}...` : normalized;
}

function getAvatarInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return 'P';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (/[가-힣]/.test(trimmed)) return trimmed.slice(0, 1);
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function renderLinkedText(text: string) {
  if (!text) return null;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;

  text.replace(urlPattern, (match, _url, offset: number) => {
    if (offset > lastIndex) nodes.push(text.slice(lastIndex, offset));

    const trimmedUrl = match.replace(/[.,!?;:)\]}]+$/g, '');
    const trailingText = match.slice(trimmedUrl.length);
    const href = /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;

    nodes.push(
      <a className="inline-link" href={href} key={`${trimmedUrl}-${offset}`} target="_blank" rel="noopener noreferrer">
        {trimmedUrl}
      </a>,
    );
    if (trailingText) nodes.push(trailingText);
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes.length ? nodes : text;
}

const startOfCalendarDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addCalendarDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};
const diffCalendarDays = (start: Date, end: Date) =>
  Math.round((startOfCalendarDay(end).getTime() - startOfCalendarDay(start).getTime()) / 86400000);

const formatDateInputValue = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const parseTaskDate = (value: string | null | undefined) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getTaskCalendarRange = (task: Task) => {
  const dueDate = parseTaskDate(task.dueAt);
  if (!dueDate) return null;

  const startedDate = parseTaskDate(task.startedAt);
  const rangeStart = startedDate && startedDate.getTime() <= dueDate.getTime() ? startedDate : dueDate;
  const rangeEnd = dueDate.getTime() >= rangeStart.getTime() ? dueDate : rangeStart;

  return {
    start: rangeStart,
    end: rangeEnd,
    days: Math.max(1, diffCalendarDays(rangeStart, rangeEnd) + 1),
  };
};

function formatDueDate(value: string | null | undefined) {
  if (!value) return '미정';
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function parseDueDate(value: string) {
  if (!value.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function getOversizedTaskFiles(files: File[]) {
  return files.filter((file) => file.size > MAX_TASK_FILE_SIZE);
}

function getTaskFileSizeError(files: File[]) {
  const oversizedFiles = getOversizedTaskFiles(files);
  if (!oversizedFiles.length) return '';
  return `파일은 1개당 ${MAX_TASK_FILE_SIZE_LABEL}까지만 첨부할 수 있습니다. (${oversizedFiles.map((file) => file.name).join(', ')})`;
}

async function getEdgeFunctionErrorMessage(data: any, error: any) {
  if (data?.error) return String(data.error);

  const response = error?.context;
  if (response instanceof Response) {
    try {
      const body = await response.clone().json();
      if (body?.error) return String(body.error);
      if (body?.message) return String(body.message);
    } catch {
      try {
        const text = await response.clone().text();
        if (text) return text;
      } catch {
        return error?.message || 'Edge Function 호출에 실패했습니다.';
      }
    }
  }

  return error?.message || 'Edge Function 호출에 실패했습니다.';
}

function getAvatarFileError(file: File | null) {
  if (!file) return '';
  if (!AVATAR_FILE_TYPES.includes(file.type)) return '프로필 사진은 JPG, PNG, WEBP만 업로드할 수 있습니다.';
  if (file.size > MAX_AVATAR_FILE_SIZE) return `프로필 사진은 ${MAX_AVATAR_FILE_SIZE_LABEL} 이하만 업로드할 수 있습니다.`;
  return '';
}

async function uploadAvatarImage(ownerId: string, file: File | null) {
  if (!file) return { url: null as string | null, error: '' };

  const fileError = getAvatarFileError(file);
  if (fileError) return { url: null, error: fileError };

  if (!supabase || ownerId === 'prototype') {
    return { url: URL.createObjectURL(file), error: '' };
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `${ownerId}/${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from('avatars').upload(filePath, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: true,
  });

  if (error) return { url: null, error: `프로필 사진 업로드 실패: ${error.message}` };

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return { url: data.publicUrl, error: '' };
}

function toDateTimeLocalValue(date: Date) {
  const pad = (number: number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDateTimeLocalValue(value: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseOperationDate(value: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getOperationStatus(item: OperationItem): OperationStatus {
  if (!item.active) return '보류';
  if (item.frequency === '1회' && item.lastCompletedAt) return '완료';

  const dueDate = parseOperationDate(item.dueDate);
  if (!dueDate) return '보류';

  const diff = diffCalendarDays(new Date(), dueDate);
  if (diff === 0) return '오늘';
  if (diff <= 7) return '임박';
  return '예정';
}

function addOperationCycle(dueDate: string, frequency: OperationFrequency) {
  const currentDate = parseOperationDate(dueDate) || new Date();
  const nextDate = new Date(currentDate);

  if (frequency === '매월') nextDate.setMonth(nextDate.getMonth() + 1);
  if (frequency === '분기') nextDate.setMonth(nextDate.getMonth() + 3);
  if (frequency === '반기') nextDate.setMonth(nextDate.getMonth() + 6);
  if (frequency === '매년') nextDate.setFullYear(nextDate.getFullYear() + 1);

  return formatDateInputValue(nextDate);
}

function formatOperationDueDate(value: string) {
  const parsed = parseOperationDate(value);
  if (!parsed) return '미정';
  return parsed.toLocaleDateString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric' });
}

function getOperationDaysLeft(value: string) {
  const dueDate = parseOperationDate(value);
  if (!dueDate) return null;
  return diffCalendarDays(new Date(), dueDate);
}

function formatOperationAmount(value: number) {
  return `${new Intl.NumberFormat('ko-KR').format(value)}원`;
}

function getOperationReminderLabel(value: 0 | 1 | 3 | 7) {
  return value === 0 ? '당일 알림' : `알림 ${value}일 전`;
}

function matchesOperationFilter(item: OperationItem, filter: OperationFilter) {
  const status = getOperationStatus(item);
  const dueDate = parseOperationDate(item.dueDate);
  if (!dueDate) return filter === '전체';

  if (filter === '전체') return true;
  if (filter === '오늘') return status === '오늘';
  if (filter === '7일 이내') {
    const days = getOperationDaysLeft(item.dueDate);
    return status !== '완료' && status !== '보류' && days !== null && days <= 7;
  }
  if (filter === '이번달') {
    const now = new Date();
    return dueDate.getFullYear() === now.getFullYear() && dueDate.getMonth() === now.getMonth();
  }
  return status !== '완료' && status !== '보류';
}

function sortOperationsByDueDate(items: OperationItem[]) {
  return [...items].sort((first, second) => {
    const firstDate = parseOperationDate(first.dueDate)?.getTime() || 0;
    const secondDate = parseOperationDate(second.dueDate)?.getTime() || 0;
    return firstDate - secondDate;
  });
}

function resolveOperationAssignee(item: OperationItem, employees: Employee[]) {
  const exactMatch = employees.find((employee) => employee.id === item.assigneeId);
  if (exactMatch) return exactMatch;

  const legacyEmployeeName = seedEmployees.find((employee) => employee.id === item.assigneeId)?.name;
  if (!legacyEmployeeName) return null;

  return employees.find((employee) => employee.name === legacyEmployeeName) || null;
}

function formatTaskTypeLabel(type: string) {
  return type === '영업 브리핑' ? '브리핑' : type;
}

function getTaskReadLabel(task: Task) {
  return task.readAt ? '읽음' : '안읽음';
}

function getTaskRecipientIds(task: Task) {
  return task.recipientIds?.length ? task.recipientIds : task.assigneeId ? [task.assigneeId] : [];
}

function isUnreadForUser(task: Task, currentUser: AppUser | null) {
  return needsTaskAttention(task, currentUser);
}

function needsTaskAttention(task: Task, currentUser: AppUser | null) {
  if (!currentUser) return false;
  const isAssignee = getTaskRecipientIds(task).includes(currentUser.id) || (currentUser.isPrototype && task.to.split(', ').includes(currentUser.name));
  const isCreator = task.creatorId === currentUser.id || (currentUser.isPrototype && task.from === currentUser.name);

  return (isAssignee && !task.readAt) || (isCreator && task.status === '완료 요청' && !task.creatorReadAt);
}

function isTaskParticipant(task: Task, currentUser: AppUser | null) {
  if (!currentUser) return false;
  return (
    getTaskRecipientIds(task).includes(currentUser.id) ||
    task.creatorId === currentUser.id ||
    (currentUser.isPrototype && (task.to.split(', ').includes(currentUser.name) || task.from === currentUser.name))
  );
}

function canViewTask(task: Task, currentUser: AppUser | null) {
  if (task.type === '보고' || task.type === '제안') {
    return isTaskParticipant(task, currentUser);
  }
  return true;
}

function getTaskStatusTone(status: TaskStatus) {
  if (status === '진행중') return 'blue';
  if (status === '완료 요청') return 'amber';
  if (status === '보류') return 'red';
  if (status === '완료') return 'green';
  return 'gray';
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authReady, setAuthReady] = useState(!hasSupabaseConfig);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [viewHistory, setViewHistory] = useState<ActiveView[]>([]);
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [clients, setClients] = useState<Client[]>(seedClients);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMessages, setProjectMessages] = useState<ProjectMessage[]>([]);
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees);
  const [operations, setOperations] = useState<OperationItem[]>(getInitialOperations);
  const [googleCalendarSettings, setGoogleCalendarSettings] = useState<GoogleCalendarSettings>(getInitialGoogleCalendarSettings);
  const [jobTypes, setJobTypes] = useState(seedJobTypes);
  const [taskTypes, setTaskTypes] = useState(fallbackTaskTypes);
  const [backendStatus, setBackendStatus] = useState('프로토타입 데이터');
  const [pushStatus, setPushStatus] = useState('종 버튼을 누르면 이 기기 업무 푸시알림을 켤 수 있습니다.');
  const [pushLoading, setPushLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushPreferences, setPushPreferences] = useState<PushPreferences>(defaultPushPreferences);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installStatus, setInstallStatus] = useState('브라우저 메뉴 또는 설치 버튼으로 Plander Works를 앱처럼 설치할 수 있습니다.');
  const [appInstalled, setAppInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true,
  );
  const [popupMessage, setPopupMessage] = useState('');
  const [confirmRequest, setConfirmRequest] = useState<{ id: number; message: string } | null>(null);
  const [forwardHistory, setForwardHistory] = useState<ActiveView[]>([]);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectCreateOpen, setProjectCreateOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [taskListFilters, setTaskListFilters] = useState<Partial<Record<ActiveView, TaskListFilter>>>({});
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const appHistoryReady = useRef(false);
  const lastUserId = useRef<string | null>(null);
  const realtimeRefreshTimer = useRef<number | null>(null);

  const getAppHistoryUrl = (view: ActiveView) => `${window.location.pathname}#${view}`;

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      setInstallStatus('서비스 워커 등록에 실패했습니다. 브라우저 새로고침 후 다시 시도해주세요.');
    });
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstallStatus('이 기기에 Plander Works를 설치할 수 있습니다.');
    };
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setAppInstalled(true);
      setInstallStatus('이 기기에 Plander Works가 설치되었습니다.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    applyTheme(themeMode);
    localStorage.setItem('plander-theme', themeMode);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemTheme = () => {
      if (themeMode === 'system') applyTheme('system');
    };

    media.addEventListener('change', syncSystemTheme);
    return () => media.removeEventListener('change', syncSystemTheme);
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem(operationStorageKey, JSON.stringify(operations));
  }, [operations]);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setCurrentUser(getUserFromSession(data.session));
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(getUserFromSession(session));
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      lastUserId.current = null;
      return;
    }

    if (lastUserId.current === currentUser.id) return;
    lastUserId.current = currentUser.id;
    appHistoryReady.current = false;
    setActiveView('dashboard');
    setViewHistory([]);
    setForwardHistory([]);
    setSidebarOpen(false);
    setTaskListFilters({});

    if (!new URLSearchParams(window.location.search).get('taskId')) {
      setSelectedTaskId(null);
    }
  }, [currentUser?.id]);

  const loadBackendData = async () => {
    if (!supabase || !currentUser || currentUser.isPrototype) {
      return;
    }

    setBackendStatus('Supabase 동기화중');

    const [
      profilesResult,
      jobTypesResult,
      taskTypesResult,
      clientsResult,
      projectsResult,
      projectMembersResult,
      projectMessagesResult,
      projectMessageReadsResult,
      workSchedulesResult,
      pushPreferencesResult,
      tasksResult,
      commentsResult,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, name, phone, role, avatar_url, job_types(name)')
        .order('created_at', { ascending: true }),
      supabase
        .from('job_types')
        .select('name')
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
      supabase
        .from('task_types')
        .select('name')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('clients')
        .select('id, name, contact_name, phone, region, memo, created_by')
        .order('created_at', { ascending: false }),
      supabase
        .from('projects')
        .select('id, name, status, client_id, created_by, client:clients(name)')
        .order('created_at', { ascending: false }),
      supabase
        .from('project_members')
        .select('project_id, user_id, user:profiles!project_members_user_id_fkey(name, avatar_url)')
        .order('created_at', { ascending: true }),
      supabase
        .from('project_messages')
        .select('id, project_id, user_id, content, created_at, user:profiles!project_messages_user_id_fkey(name, avatar_url)')
        .order('created_at', { ascending: true }),
      supabase
        .from('project_message_reads')
        .select('message_id, user_id, read_at, user:profiles!project_message_reads_user_id_fkey(name, avatar_url)')
        .order('read_at', { ascending: true }),
      supabase
        .from('calendar_schedules')
        .select('id, title, start_at, end_at, memo, created_by, creator:profiles!calendar_schedules_created_by_fkey(name)')
        .order('start_at', { ascending: true }),
      supabase
        .from('push_preferences')
        .select('task_enabled, report_enabled, project_message_enabled')
        .eq('user_id', currentUser.id)
        .maybeSingle(),
      supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          task_type,
          status,
          priority,
          due_at,
          started_at,
          read_at,
          creator_read_at,
          creator_id,
          assignee_id,
          client_id,
          project_id,
          creator:profiles!tasks_creator_id_fkey(name, avatar_url),
          assignee:profiles!tasks_assignee_id_fkey(name, avatar_url),
          client:clients(name),
          project:projects(name),
          task_watchers(user_id, user:profiles(name, avatar_url)),
          task_files(id, file_name, file_path, file_size, mime_type)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('task_comments')
        .select('id, task_id, parent_comment_id, user_id, content, created_at, user:profiles!task_comments_user_id_fkey(name, avatar_url)')
        .order('created_at', { ascending: true }),
    ]);

    if (
      profilesResult.error ||
      jobTypesResult.error ||
      taskTypesResult.error ||
      clientsResult.error ||
      projectsResult.error ||
      projectMembersResult.error ||
      projectMessagesResult.error ||
      projectMessageReadsResult.error ||
      workSchedulesResult.error ||
      pushPreferencesResult.error ||
      tasksResult.error ||
      commentsResult.error
    ) {
      setBackendStatus('Supabase 테이블 준비 필요');
      return;
    }

    const rawTasks = (tasksResult.data || []) as any[];
    const commentsByTask = ((commentsResult.data || []) as any[]).reduce<Record<string, TaskComment[]>>((groups, comment) => {
      const nextComment: TaskComment = {
        id: comment.id,
        taskId: comment.task_id,
        parentId: comment.parent_comment_id,
        userId: comment.user_id,
        author: comment.user?.name || '알 수 없음',
        avatarUrl: comment.user?.avatar_url || null,
        content: comment.content,
        createdAt: comment.created_at,
      };
      return {
        ...groups,
        [comment.task_id]: [...(groups[comment.task_id] || []), nextComment],
      };
    }, {});

    const nextTasks: Task[] = rawTasks.map((task) => {
      const watcherNames = (task.task_watchers || []).map((watcher: any) => watcher.user?.name).filter(Boolean);
      const watcherIds = (task.task_watchers || []).map((watcher: any) => watcher.user_id).filter(Boolean);
      const recipientNames = watcherNames.length ? watcherNames : [task.assignee?.name || '미지정'];
      const recipientIds = watcherIds.length ? watcherIds : task.assignee_id ? [task.assignee_id] : [];

      return {
        id: task.id,
        title: task.title,
        from: task.creator?.name || '알 수 없음',
        to: recipientNames.join(', '),
        creatorId: task.creator_id,
        assigneeId: task.assignee_id,
        recipientIds,
        clientId: task.client_id,
        projectId: task.project_id,
        projectName: task.project?.name || '',
        client: task.client?.name || '내부',
        dueAt: task.due_at,
        startedAt: task.started_at,
        readAt: task.read_at,
        creatorReadAt: task.creator_read_at,
        due: formatDueDate(task.due_at),
        status: statusFromDb[task.status] || '대기',
        priority: priorityFromDb[task.priority] || '보통',
        type: task.task_type || '업무 요청',
        summary: task.description || '',
        watchers: recipientNames,
        files: (task.task_files || []).map((file: any) => ({
          id: file.id,
          name: file.file_name,
          path: file.file_path,
          size: file.file_size,
          mimeType: file.mime_type,
        })),
        comments: commentsByTask[task.id] || [],
        creatorAvatarUrl: task.creator?.avatar_url || null,
        assigneeAvatarUrl: task.assignee?.avatar_url || null,
      };
    });

    const loadByUser = new Map<string, number>();
    nextTasks.forEach((task) => {
      getTaskRecipientIds(task).forEach((recipientId) => {
        loadByUser.set(recipientId, (loadByUser.get(recipientId) || 0) + 1);
      });
    });

    const nextEmployees: Employee[] = ((profilesResult.data || []) as any[]).map((profile) => ({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone || '',
      jobType: profile.job_types?.name || '미지정',
      role: roleFromDb[profile.role] || '사용자',
      load: loadByUser.get(profile.id) || 0,
      avatarUrl: profile.avatar_url || null,
    }));

    const currentProfile = nextEmployees.find((employee) => employee.id === currentUser.id);

    if (currentProfile) {
      setCurrentUser((user) =>
        user
          ? {
              ...user,
              name: currentProfile.name,
              role: currentProfile.jobType,
              accountRole: currentProfile.role === '관리자' ? 'admin' : 'staff',
              email: currentProfile.email,
              avatarUrl: currentProfile.avatarUrl || null,
            }
          : user,
      );
    }

    const nextClients: Client[] = ((clientsResult.data || []) as any[]).map((client) => ({
      id: client.id,
      name: client.name,
      manager: client.contact_name || nextEmployees.find((employee) => employee.id === client.created_by)?.name || '미지정',
      phone: client.phone || '',
      region: client.region || '',
      memo: client.memo || '',
    }));

    const projectMembersByProject = ((projectMembersResult.data || []) as any[]).reduce<Record<string, { ids: string[]; names: string[] }>>((groups, member) => {
      const current = groups[member.project_id] || { ids: [], names: [] };
      return {
        ...groups,
        [member.project_id]: {
          ids: [...current.ids, member.user_id].filter(Boolean),
          names: [...current.names, member.user?.name].filter(Boolean),
        },
      };
    }, {});

    const nextProjects: Project[] = ((projectsResult.data || []) as any[]).map((project) => ({
      id: project.id,
      name: project.name,
      clientId: project.client_id,
      client: project.client?.name || '업체 미지정',
      status: project.status || 'active',
      createdBy: project.created_by,
      memberIds: projectMembersByProject[project.id]?.ids || [],
      memberNames: projectMembersByProject[project.id]?.names || [],
    }));
    const messageReadsByMessage = ((projectMessageReadsResult.data || []) as any[]).reduce<Record<string, { ids: string[]; names: string[] }>>((groups, read) => {
      const current = groups[read.message_id] || { ids: [], names: [] };
      return {
        ...groups,
        [read.message_id]: {
          ids: [...current.ids, read.user_id].filter(Boolean),
          names: [...current.names, read.user?.name].filter(Boolean),
        },
      };
    }, {});
    const nextProjectMessages: ProjectMessage[] = ((projectMessagesResult.data || []) as any[]).map((message) => ({
      id: message.id,
      projectId: message.project_id,
      userId: message.user_id,
      author: message.user?.name || '알 수 없음',
      avatarUrl: message.user?.avatar_url || null,
      content: message.content,
      createdAt: message.created_at,
      readByIds: messageReadsByMessage[message.id]?.ids || [],
      readBy: messageReadsByMessage[message.id]?.names || [],
    }));
    const nextWorkSchedules: WorkSchedule[] = ((workSchedulesResult.data || []) as any[]).map((schedule) => ({
      id: schedule.id,
      title: schedule.title,
      startAt: schedule.start_at,
      endAt: schedule.end_at,
      memo: schedule.memo || '',
      createdBy: schedule.created_by,
      creatorName: schedule.creator?.name || '알 수 없음',
    }));
    const nextPushPreferences = pushPreferencesResult.data
      ? {
          task: Boolean((pushPreferencesResult.data as any).task_enabled),
          report: Boolean((pushPreferencesResult.data as any).report_enabled),
          projectMessage: Boolean((pushPreferencesResult.data as any).project_message_enabled),
        }
      : defaultPushPreferences;

    const nextJobTypes = (jobTypesResult.data || []).map((jobType) => jobType.name);
    const nextTaskTypes = (taskTypesResult.data || []).map((taskType) => taskType.name);

    setTasks(nextTasks);
    setEmployees(nextEmployees.length ? nextEmployees : seedEmployees);
    setClients(nextClients);
    setProjects(nextProjects);
    setProjectMessages(nextProjectMessages);
    setWorkSchedules(nextWorkSchedules);
    setPushPreferences(nextPushPreferences);
    setJobTypes(nextJobTypes.length ? nextJobTypes : seedJobTypes);
    setTaskTypes(nextTaskTypes.length ? nextTaskTypes : fallbackTaskTypes);
    setBackendStatus('Supabase 연결됨');
  };

  useEffect(() => {
    loadBackendData();
  }, [currentUser?.id, currentUser?.isPrototype]);

  useEffect(() => {
    if (!supabase || !currentUser || currentUser.isPrototype) return;

    const queueRefresh = () => {
      if (realtimeRefreshTimer.current) {
        window.clearTimeout(realtimeRefreshTimer.current);
      }

      realtimeRefreshTimer.current = window.setTimeout(() => {
        void loadBackendData();
      }, 250);
    };

    const channel = supabase
      .channel(`planderworks-tasks-${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_watchers' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_members' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_messages' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_message_reads' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_schedules' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'push_preferences' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments' }, queueRefresh)
      .subscribe();

    return () => {
      if (realtimeRefreshTimer.current) {
        window.clearTimeout(realtimeRefreshTimer.current);
        realtimeRefreshTimer.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [currentUser?.id, currentUser?.isPrototype]);

  useEffect(() => {
    if (!supabase || !currentUser || currentUser.isPrototype) return;

    const syncVisibleData = () => {
      if (document.hidden) return;
      void loadBackendData();
    };

    syncVisibleData();
    window.addEventListener('focus', syncVisibleData);
    document.addEventListener('visibilitychange', syncVisibleData);

    return () => {
      window.removeEventListener('focus', syncVisibleData);
      document.removeEventListener('visibilitychange', syncVisibleData);
    };
  }, [currentUser?.id, currentUser?.isPrototype]);

  useEffect(() => {
    if (!currentUser) return;
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('taskId');
    const projectId = params.get('projectId');
    if (taskId) setSelectedTaskId(taskId);
    if (projectId) {
      setSelectedProjectId(projectId);
      setActiveView('project');
    }
  }, [currentUser?.id, tasks.length, projects.length]);

  useEffect(() => {
    const handleActionComplete = (event: Event) => {
      const message = (event as CustomEvent<string>).detail;
      if (message) setPopupMessage(message);
    };

    window.addEventListener('plander-action-complete', handleActionComplete);
    return () => window.removeEventListener('plander-action-complete', handleActionComplete);
  }, []);

  useEffect(() => {
    const handleConfirmRequest = (event: Event) => {
      const detail = (event as CustomEvent<{ id: number; message: string }>).detail;
      if (detail) setConfirmRequest(detail);
    };

    window.addEventListener('plander-action-confirm-request', handleConfirmRequest);
    return () => window.removeEventListener('plander-action-confirm-request', handleConfirmRequest);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      appHistoryReady.current = false;
      return;
    }

    if (!appHistoryReady.current && activeView !== 'dashboard') return;

    if (!appHistoryReady.current) {
      window.history.replaceState({ plander: true, view: activeView, guard: true }, '', getAppHistoryUrl(activeView));
      window.history.pushState({ plander: true, view: activeView }, '', getAppHistoryUrl(activeView));
      appHistoryReady.current = true;
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as { plander?: boolean; view?: unknown; filter?: TaskListFilter; guard?: boolean } | null;
      if (!state?.plander) return;

      if (state.guard) {
        window.history.pushState({ plander: true, view: activeView }, '', getAppHistoryUrl(activeView));
        return;
      }

      if (!isActiveView(state.view)) return;
      setActiveView(state.view);
      setSidebarOpen(false);
      setSelectedTaskId(null);
      if (state.filter) setTaskListFilters((current) => ({ ...current, [state.view as ActiveView]: state.filter }));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeView, currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.isPrototype || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushEnabled(false);
      return;
    }

    let mounted = true;

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (!mounted) return;
        setPushEnabled(Boolean(subscription));
        setPushStatus(
          subscription
            ? '이 기기 업무 푸시알림이 켜져 있습니다.'
            : '종 버튼을 누르면 이 기기 업무 푸시알림을 켤 수 있습니다.',
        );
      })
      .catch(() => {
        if (!mounted) return;
        setPushEnabled(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentUser?.id, currentUser?.isPrototype]);

  const inboxTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (
            (currentUser?.id && getTaskRecipientIds(task).includes(currentUser.id)) ||
            task.to.split(', ').includes(currentUser?.name || '') ||
            (currentUser?.isPrototype && task.to.split(', ').includes('인성이형'))
          ) &&
          task.type !== '보고' &&
          task.type !== '제안',
      ),
    [currentUser?.id, currentUser?.isPrototype, currentUser?.name, tasks],
  );

  const sentTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (task.creatorId === currentUser?.id || task.from === currentUser?.name || (currentUser?.isPrototype && task.from === '인성이형')) &&
          task.type !== '보고' &&
          task.type !== '제안',
      ),
    [currentUser?.id, currentUser?.isPrototype, currentUser?.name, tasks],
  );

  const visibleTasks = useMemo(() => tasks.filter((task) => canViewTask(task, currentUser)), [currentUser, tasks]);

  const reportTasks = useMemo(
    () => visibleTasks.filter((task) => task.type === '보고' || task.type === '제안'),
    [visibleTasks],
  );

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  );

  const selectedProjectTasks = useMemo(
    () => (selectedProject ? visibleTasks.filter((task) => task.projectId === selectedProject.id) : []),
    [selectedProject, visibleTasks],
  );
  const selectedProjectMessages = useMemo(
    () => (selectedProject ? projectMessages.filter((message) => message.projectId === selectedProject.id) : []),
    [projectMessages, selectedProject],
  );

  const selectedTask = useMemo(
    () => visibleTasks.find((task) => task.id === selectedTaskId) || null,
    [selectedTaskId, visibleTasks],
  );

  const editingTask = useMemo(
    () => visibleTasks.find((task) => task.id === editingTaskId) || null,
    [editingTaskId, visibleTasks],
  );
  const editingProject = useMemo(
    () => projects.find((project) => project.id === editingProjectId) || null,
    [editingProjectId, projects],
  );

  const dueSoonTasks = useMemo(
    () =>
      inboxTasks.filter((task) => task.due !== '미정' && task.due !== '검토 대기' && task.status !== '완료'),
    [inboxTasks],
  );

  const navBadges: Partial<Record<ActiveView, number>> = {
    inbox: inboxTasks.length,
    sent: sentTasks.length,
    reports: reportTasks.length,
  };
  const navUnreadBadges: Partial<Record<ActiveView, number>> = {
    inbox: inboxTasks.filter((task) => needsTaskAttention(task, currentUser)).length,
    sent: sentTasks.filter((task) => needsTaskAttention(task, currentUser)).length,
    reports: reportTasks.filter((task) => needsTaskAttention(task, currentUser)).length,
  };

  const dashboardStats = useMemo(
    () => [
      { label: '받은 업무', value: inboxTasks.length, hint: '내 담당 기준', tone: 'silver', target: 'inbox' as ActiveView },
      { label: '진행중', value: inboxTasks.filter((task) => task.status === '진행중').length, hint: '담당자 확인중', tone: 'blue', target: 'inbox' as ActiveView, filter: '진행중' as TaskListFilter },
      { label: '완료 요청', value: inboxTasks.filter((task) => task.status === '완료 요청').length, hint: '검토 필요', tone: 'amber', target: 'inbox' as ActiveView, filter: '완료 요청' as TaskListFilter },
      { label: '마감 임박', value: dueSoonTasks.length, hint: '마감일 입력 기준', tone: 'red', target: 'calendar' as ActiveView },
    ],
    [dueSoonTasks.length, inboxTasks],
  );

  const handlePrototypeLogin = () => {
    setCurrentUser({
      id: 'prototype',
      name: '인성이형',
      email: 'prototype@plander.co.kr',
      role: '일본 마케팅',
      accountRole: 'admin',
      avatarUrl: null,
      isPrototype: true,
    });
  };

  const navigateTo = (view: ActiveView, filter?: TaskListFilter) => {
    if (filter) setTaskListFilters((current) => ({ ...current, [view]: filter }));
    if (!filter && (view === 'inbox' || view === 'sent' || view === 'allTasks')) {
      setTaskListFilters((current) => ({ ...current, [view]: '전체' }));
    }
    if (view !== 'project') setSelectedProjectId(null);
    if (view === activeView) return;
    setViewHistory((history) => [...history, activeView].slice(-12));
    setForwardHistory([]);
    setActiveView(view);
    if (appHistoryReady.current) {
      window.history.pushState({ plander: true, view, filter }, '', getAppHistoryUrl(view));
    }
  };

  const openProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setViewHistory((history) => [...history, activeView].slice(-12));
    setForwardHistory([]);
    setSelectedTaskId(null);
    setActiveView('project');
    if (appHistoryReady.current) {
      window.history.pushState({ plander: true, view: 'project' }, '', getAppHistoryUrl('project'));
    }
  };

  const navigateBack = () => {
    setViewHistory((history) => {
      const previous = history[history.length - 1] || 'dashboard';
      setForwardHistory((forward) => [activeView, ...forward].slice(0, 12));
      setActiveView(previous);
      return history.slice(0, -1);
    });
  };

  const navigateForward = () => {
    setForwardHistory((forward) => {
      const next = forward[0];
      if (!next) return forward;
      setViewHistory((history) => [...history, activeView].slice(-12));
      setActiveView(next);
      return forward.slice(1);
    });
  };

  const handleWorkspaceTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    if (window.innerWidth > 760) return;
    const touch = event.touches[0];
    swipeStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleWorkspaceTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    if (window.innerWidth > 760 || !swipeStart.current) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - swipeStart.current.x;
    const deltaY = Math.abs(touch.clientY - swipeStart.current.y);

    if (deltaY > 50) return;

    const canSwipeBack = deltaX > 0 && activeView !== 'dashboard' && viewHistory.length > 0;
    const canSwipeForward = deltaX < 0 && forwardHistory.length > 0;

    if (!canSwipeBack && !canSwipeForward) {
      setSwipeOffset(0);
      return;
    }

    setSwipeOffset(Math.max(-72, Math.min(72, deltaX * 0.35)));
  };

  const handleWorkspaceTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (window.innerWidth > 760 || !swipeStart.current) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - swipeStart.current.x;
    const deltaY = Math.abs(touch.clientY - swipeStart.current.y);
    swipeStart.current = null;
    setSwipeOffset(0);

    if (deltaX > 80 && deltaY < 60 && activeView !== 'dashboard' && viewHistory.length > 0) {
      navigateBack();
      return;
    }

    if (deltaX < -80 && deltaY < 60 && forwardHistory.length > 0) {
      navigateForward();
    }
  };

  const handleLogout = async () => {
    if (currentUser?.isPrototype) {
      setCurrentUser(null);
      return;
    }

    await supabase?.auth.signOut();
    setCurrentUser(null);
  };

  const uploadTaskFiles = async (taskId: string, files: File[] = []) => {
    if (!supabase || !currentUser || !files.length) return null;
    const sizeError = getTaskFileSizeError(files);
    if (sizeError) return sizeError;

    const uploadedFiles: Array<{
      task_id: string;
      uploaded_by: string;
      file_name: string;
      file_path: string;
      file_size: number;
      mime_type: string;
    }> = [];

    for (const file of files) {
      const safeName = file.name.replace(/[^\w.\-가-힣]/g, '_');
      const filePath = `${taskId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('task-files').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) return uploadError.message;

      uploadedFiles.push({
        task_id: taskId,
        uploaded_by: currentUser.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      });
    }

    if (!uploadedFiles.length) return null;
    const { error } = await supabase.from('task_files').insert(uploadedFiles);
    return error?.message || null;
  };

  const createTask = async (task: TaskDraft): Promise<string> => {
    const recipientIds = Array.from(new Set(task.toIds || []));
    const recipients = (task.toList?.length ? task.toList : [task.to]).filter(Boolean);
    const uniqueRecipients = Array.from(new Set(recipients));
    let assignees = (recipientIds.length
      ? recipientIds.map((id) => employees.find((employee) => employee.id === id))
      : uniqueRecipients.map((name) => employees.find((employee) => employee.name === name))
    ).filter((employee): employee is Employee => Boolean(employee));
    const project = task.projectId ? projects.find((item) => item.id === task.projectId) : null;
    const projectClient = project?.clientId ? clients.find((item) => item.id === project.clientId) : null;
    const client = projectClient || (task.clientId && isUuid(task.clientId)
      ? clients.find((item) => item.id === task.clientId)
      : clients.find((item) => item.name === task.client));
    const clientId = client?.id && isUuid(client.id) ? client.id : null;

    if (!assignees.length) {
      const message = '실제 등록된 담당자를 한 명 이상 선택해주세요.';
      setBackendStatus(message);
      return message;
    }

    if (supabase && currentUser && !currentUser.isPrototype) {
      assignees = assignees.filter((assignee) => isUuid(assignee.id));

      if (!assignees.length) {
        const message = '담당자 정보가 아직 동기화되지 않았습니다. 새로고침 후 다시 전송해주세요.';
        setBackendStatus(message);
        return message;
      }

      const primaryAssignee = assignees[0];
      const row = {
        title: task.title,
        description: task.summary,
        task_type: task.type,
        status: statusToDb[task.status || '대기'],
        started_at: task.status === '진행중' ? new Date().toISOString() : null,
        priority: priorityToDb[task.priority],
        creator_id: currentUser.id,
        assignee_id: primaryAssignee.id,
        client_id: clientId,
        project_id: task.projectId && isUuid(task.projectId) ? task.projectId : null,
        due_at: parseDueDate(task.due),
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert(row)
        .select('id')
        .single();

      if (error) {
        const message = `업무 저장 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      const watcherRows = assignees.map((assignee) => ({
        task_id: data.id,
        user_id: assignee.id,
      }));
      const { error: watcherError } = await supabase.from('task_watchers').insert(watcherRows);

      if (watcherError) {
        const message = `수신자 저장 실패: ${watcherError.message}`;
        setBackendStatus(message);
        return message;
      }

      const fileError = await uploadTaskFiles(data.id, task.files || []);
      if (fileError) {
        const message = `첨부파일 저장 실패: ${fileError}`;
        setBackendStatus(message);
        return message;
      }

      await supabase.functions.invoke('send-task-notification', {
        body: { taskId: data.id },
      });

      await loadBackendData();
      const message = `업무 1건을 ${assignees.length}명에게 전송했습니다.`;
      setBackendStatus(message);
      setViewHistory((history) => [...history, activeView].slice(-12));
      setActiveView('sent');
      return message;
    }

    const prototypeAssignees = assignees.length
      ? assignees
      : uniqueRecipients.map((name) => employees.find((employee) => employee.name === name)).filter(Boolean) as Employee[];

    const recipientNames = prototypeAssignees.map((assignee) => assignee.name);
    const nextTask: Task = {
      id: `${Date.now()}`,
      status: task.status || '대기',
      startedAt: task.status === '진행중' ? new Date().toISOString() : null,
      watchers: recipientNames,
      comments: [],
      ...task,
      recipientIds: prototypeAssignees.map((assignee) => assignee.id),
      assigneeId: prototypeAssignees[0]?.id,
      files: (task.files || []).map((file, fileIndex) => ({
        id: `${Date.now()}-${fileIndex}`,
        name: file.name,
        path: '',
        size: file.size,
        mimeType: file.type,
      })),
      from: currentUser?.name || task.from,
      to: recipientNames.join(', '),
    };

    setTasks((current) => [nextTask, ...current]);
    setViewHistory((history) => [...history, activeView].slice(-12));
    setActiveView('sent');
    return `업무 1건을 ${prototypeAssignees.length}명에게 전송했습니다.`;
  };

  const createProjectTask = async (task: TaskDraft): Promise<string> => {
    const message = await createTask(task);
    if (!message.includes('실패') && task.projectId) {
      setSelectedProjectId(task.projectId);
      setActiveView('project');
    }
    return message;
  };

  const addClient = async (client: Omit<Client, 'id'>): Promise<string> => {
    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase.from('clients').insert({
        name: client.name,
        contact_name: client.manager,
        phone: client.phone,
        region: client.region,
        memo: client.memo,
        created_by: currentUser.id,
      });

      if (error) {
        const message = `업체 저장 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return '업체를 추가했습니다.';
    }

    setClients((current) => [{ id: String(Date.now()), ...client }, ...current]);
    return '업체를 추가했습니다.';
  };

  const updateClient = async (clientId: string, client: Omit<Client, 'id'>): Promise<string> => {
    if (!isUuid(clientId)) {
      setClients((current) => current.map((item) => (item.id === clientId ? { id: clientId, ...client } : item)));
      return '업체가 저장되었습니다.';
    }

    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase
        .from('clients')
        .update({
          name: client.name,
          contact_name: client.manager,
          phone: client.phone,
          region: client.region,
          memo: client.memo,
        })
        .eq('id', clientId);

      if (error) {
        const message = `업체 저장 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return '업체가 저장되었습니다.';
    }

    setClients((current) => current.map((item) => (item.id === clientId ? { id: clientId, ...client } : item)));
    return '업체가 저장되었습니다.';
  };

  const deleteClient = async (client: Client): Promise<string> => {
    if (!isUuid(client.id)) {
      setClients((current) => current.filter((item) => item.id !== client.id));
      return '업체가 삭제되었습니다.';
    }

    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase.from('clients').delete().eq('id', client.id);

      if (error) {
        const message = `업체 삭제 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return '업체가 삭제되었습니다.';
    }

    setClients((current) => current.filter((item) => item.id !== client.id));
    return '업체가 삭제되었습니다.';
  };

  const createProject: ProjectSubmitHandler = async (project) => {
    const name = project.name.trim();
    const client = clients.find((item) => item.id === project.clientId);
    const memberIds = Array.from(new Set([...(project.memberIds || []), currentUser?.id].filter((id): id is string => Boolean(id))));
    const memberNames = memberIds.map((id) => employees.find((employee) => employee.id === id)?.name).filter((name): name is string => Boolean(name));

    if (!name) return '프로젝트명을 입력해주세요.';
    if (!client) return '연결할 업체를 선택해주세요.';
    if (!memberIds.length) return '참여 직원을 선택해주세요.';

    if (!supabase || !currentUser || currentUser.isPrototype || !isUuid(client.id)) {
      const nextProject: Project = {
        id: String(Date.now()),
        name,
        clientId: client.id,
        client: client.name,
        status: 'active',
        createdBy: currentUser?.id || null,
        memberIds,
        memberNames,
      };
      setProjects((current) => [nextProject, ...current]);
      setSelectedProjectId(nextProject.id);
      setActiveView('project');
      return '프로젝트가 생성되었습니다.';
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name,
        client_id: client.id,
        status: 'active',
        created_by: currentUser.id,
      })
      .select('id, name, status, client_id, client:clients(name)')
      .single();

    if (error) {
      const message = `프로젝트 생성 실패: ${error.message}`;
      setBackendStatus(message);
      return message;
    }

    const projectMemberRows = memberIds.filter(isUuid).map((userId) => ({
      project_id: data.id,
      user_id: userId,
    }));

    if (projectMemberRows.length) {
      const { error: memberError } = await supabase.from('project_members').insert(projectMemberRows);

      if (memberError) {
        const message = `프로젝트 참여자 저장 실패: ${memberError.message}`;
        setBackendStatus(message);
        return message;
      }
    }

    const nextProject: Project = {
      id: data.id,
      name: data.name,
      clientId: data.client_id,
      client: (data as any).client?.name || client.name,
      status: data.status || 'active',
      createdBy: data.created_by || currentUser.id,
      memberIds,
      memberNames,
    };

    setProjects((current) => [nextProject, ...current.filter((item) => item.id !== nextProject.id)]);
    setSelectedProjectId(nextProject.id);
    setActiveView('project');
    setBackendStatus('프로젝트가 생성되었습니다.');
    return '프로젝트가 생성되었습니다.';
  };

  const updateProject: ProjectUpdateHandler = async (projectId, project) => {
    const name = project.name.trim();
    const client = clients.find((item) => item.id === project.clientId);
    const existingProject = projects.find((item) => item.id === projectId);
    const memberIds = Array.from(new Set([...(project.memberIds || []), currentUser?.id].filter((id): id is string => Boolean(id))));
    const memberNames = memberIds.map((id) => employees.find((employee) => employee.id === id)?.name).filter((item): item is string => Boolean(item));

    if (!existingProject) return '수정할 프로젝트를 찾을 수 없습니다.';
    if (!name) return '프로젝트명을 입력해주세요.';
    if (!client) return '연결할 업체를 선택해주세요.';
    if (!memberIds.length) return '참여 직원을 선택해주세요.';

    if (!supabase || !currentUser || currentUser.isPrototype || !isUuid(projectId) || !isUuid(client.id)) {
      const nextProject: Project = {
        ...existingProject,
        name,
        clientId: client.id,
        client: client.name,
        memberIds,
        memberNames,
      };
      setProjects((current) => current.map((item) => (item.id === projectId ? nextProject : item)));
      return '프로젝트가 수정되었습니다.';
    }

    const { error } = await supabase
      .from('projects')
      .update({
        name,
        client_id: client.id,
      })
      .eq('id', projectId);

    if (error) {
      const message = `프로젝트 수정 실패: ${error.message}`;
      setBackendStatus(message);
      return message;
    }

    const { error: deleteError } = await supabase.from('project_members').delete().eq('project_id', projectId);

    if (deleteError) {
      const message = `프로젝트 참여자 갱신 실패: ${deleteError.message}`;
      setBackendStatus(message);
      return message;
    }

    const memberRows = memberIds.filter(isUuid).map((userId) => ({
      project_id: projectId,
      user_id: userId,
    }));

    if (memberRows.length) {
      const { error: memberError } = await supabase.from('project_members').insert(memberRows);

      if (memberError) {
        const message = `프로젝트 참여자 저장 실패: ${memberError.message}`;
        setBackendStatus(message);
        return message;
      }
    }

    await loadBackendData();
    setBackendStatus('프로젝트가 수정되었습니다.');
    return '프로젝트가 수정되었습니다.';
  };

  const addProjectMessage = async (projectId: string, content: string): Promise<string> => {
    const nextContent = content.trim();
    if (!nextContent) return '메시지를 입력해주세요.';

    if (supabase && currentUser && !currentUser.isPrototype) {
      const { data, error } = await supabase
        .from('project_messages')
        .insert({
          project_id: projectId,
          user_id: currentUser.id,
          content: nextContent,
        })
        .select('id')
        .single();

      if (error) {
        const message = `메시지 저장 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      if (data?.id) {
        await supabase.functions.invoke('send-project-message-notification', {
          body: { messageId: data.id },
        });
      }

      await loadBackendData();
      return '메시지가 등록되었습니다.';
    }

    const nextMessage: ProjectMessage = {
      id: `${Date.now()}`,
      projectId,
      userId: currentUser?.id || 'prototype',
      author: currentUser?.name || '나',
      avatarUrl: currentUser?.avatarUrl || null,
      content: nextContent,
      createdAt: new Date().toISOString(),
      readByIds: [],
      readBy: [],
    };
    setProjectMessages((current) => [...current, nextMessage]);
    return '메시지가 등록되었습니다.';
  };

  const addWorkSchedule: WorkScheduleSubmitHandler = async (schedule) => {
    const title = schedule.title.trim();
    const memo = schedule.memo.trim();
    const startDate = parseDateTimeLocalValue(schedule.startAt);
    const endDate = parseDateTimeLocalValue(schedule.endAt);

    if (!title) return '스케줄 제목을 입력해주세요.';
    if (!startDate || !endDate) return '시작일과 종료일을 선택해주세요.';
    if (endDate.getTime() < startDate.getTime()) return '종료일은 시작일보다 늦게 선택해주세요.';

    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase.from('calendar_schedules').insert({
        title,
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        memo,
        created_by: currentUser.id,
      });

      if (error) {
        const message = `스케줄 저장 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      setBackendStatus('스케줄이 추가되었습니다.');
      return '스케줄이 추가되었습니다.';
    }

    const nextSchedule: WorkSchedule = {
      id: `${Date.now()}`,
      title,
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
      memo,
      createdBy: currentUser?.id || 'prototype',
      creatorName: currentUser?.name || '나',
    };
    setWorkSchedules((current) => [...current, nextSchedule].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
    return '스케줄이 추가되었습니다.';
  };

  const markProjectMessagesRead = async (messageIds: string[]) => {
    const uniqueMessageIds = Array.from(new Set(messageIds.filter(Boolean)));
    if (!uniqueMessageIds.length || !currentUser) return;

    if (supabase && !currentUser.isPrototype) {
      const rows = uniqueMessageIds.map((messageId) => ({
        message_id: messageId,
        user_id: currentUser.id,
        read_at: new Date().toISOString(),
      }));
      const { error } = await supabase.from('project_message_reads').upsert(rows, { onConflict: 'message_id,user_id' });

      if (error) {
        setBackendStatus(`대화 읽음 처리 실패: ${error.message}`);
        return;
      }
    }

    setProjectMessages((current) =>
      current.map((message) =>
        uniqueMessageIds.includes(message.id) && !message.readByIds.includes(currentUser.id)
          ? {
              ...message,
              readByIds: [...message.readByIds, currentUser.id],
              readBy: [...message.readBy, currentUser.name],
            }
          : message,
      ),
    );
  };

  const addJobType = async (name: string): Promise<string> => {
    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase.from('job_types').insert({ name });

      if (error) {
        const message = `담당업무 저장 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return '담당업무를 추가했습니다.';
    }

    setJobTypes((current) => [name, ...current]);
    return '담당업무를 추가했습니다.';
  };

  const deleteJobType = async (name: string): Promise<string> => {
    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase.from('job_types').update({ is_active: false }).eq('name', name);

      if (error) {
        const message = `담당업무 삭제 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return '담당업무를 삭제했습니다.';
    }

    setJobTypes((current) => current.filter((jobType) => jobType !== name));
    return '담당업무를 삭제했습니다.';
  };

  const addTaskType = async (name: string): Promise<string> => {
    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase.from('task_types').insert({
        name,
        sort_order: (taskTypes.length + 1) * 10,
      });

      if (error) {
        const message = `업무유형 저장 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return '업무유형을 추가했습니다.';
    }

    setTaskTypes((current) => [name, ...current]);
    return '업무유형을 추가했습니다.';
  };

  const deleteTaskType = async (name: string): Promise<string> => {
    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase.from('task_types').update({ is_active: false }).eq('name', name);

      if (error) {
        const message = `업무유형 삭제 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return '업무유형을 삭제했습니다.';
    }

    setTaskTypes((current) => current.filter((taskType) => taskType !== name));
    return '업무유형을 삭제했습니다.';
  };

  const addEmployee = async (employee: NewEmployee): Promise<string> => {
    if (supabase && currentUser && !currentUser.isPrototype) {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) return '계정 생성 실패: 로그인 세션이 만료되었습니다. 다시 로그인해주세요.';

      const { data, error } = await supabase.functions.invoke('create-user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          name: employee.name,
          email: employee.email,
          password: employee.password,
          phone: employee.phone,
          jobType: employee.jobType,
          role: roleToDb[employee.role],
          avatarUrl: employee.avatarUrl || null,
        },
      });

      if (error || data?.error) {
        const message = `계정 생성 실패: ${await getEdgeFunctionErrorMessage(data, error)}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return '계정을 생성했습니다.';
    }

    const { password: _password, ...employeeProfile } = employee;
    void _password;
    setEmployees((current) => [{ id: String(Date.now()), load: 0, ...employeeProfile }, ...current]);
    return '계정을 생성했습니다.';
  };

  const updateEmployee = async (employeeId: string, updates: EmployeeUpdate): Promise<string> => {
    if (supabase && currentUser && !currentUser.isPrototype) {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) return '직원 정보 수정 실패: 로그인 세션이 만료되었습니다. 다시 로그인해주세요.';

      const { data, error } = await supabase.functions.invoke('update-user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          userId: employeeId,
          name: updates.name,
          phone: updates.phone,
          jobType: updates.jobType,
          role: roleToDb[updates.role] || 'staff',
          password: updates.password,
          avatarUrl: updates.avatarUrl || null,
        },
      });

      if (error || data?.error) {
        const message = `직원 정보 수정 실패: ${await getEdgeFunctionErrorMessage(data, error)}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return updates.password ? '직원 정보와 비밀번호를 저장했습니다.' : '직원 정보를 저장했습니다.';
    }

    setEmployees((current) =>
      current.map((employee) => (employee.id === employeeId ? { ...employee, ...updates } : employee)),
    );
    return updates.password ? '직원 정보와 비밀번호를 저장했습니다.' : '직원 정보를 저장했습니다.';
  };

  const updateOwnProfile = async (updates: OwnProfileUpdate) => {
    if (!currentUser) return '로그인이 필요합니다.';

    if (supabase && !currentUser.isPrototype) {
      const { data: jobTypeData, error: jobTypeError } = await supabase
        .from('job_types')
        .upsert({ name: updates.jobType }, { onConflict: 'name' })
        .select('id')
        .single();

      if (jobTypeError) return `담당업무 조회 실패: ${jobTypeError.message}`;

      if (updates.password) {
        const { error: passwordError } = await supabase.auth.updateUser({ password: updates.password });
        if (passwordError) return `비밀번호 변경 실패: ${passwordError.message}`;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          phone: updates.phone,
          job_type_id: jobTypeData.id,
          avatar_url: updates.avatarUrl || null,
        })
        .eq('id', currentUser.id);

      if (profileError) return `내 정보 저장 실패: ${profileError.message}`;

      await loadBackendData();
      return updates.password ? '내 정보와 비밀번호가 저장되었습니다.' : '내 정보가 저장되었습니다.';
    }

    setEmployees((current) =>
      current.map((employee) =>
        employee.id === currentUser.id
          ? { ...employee, name: updates.name, phone: updates.phone, jobType: updates.jobType, avatarUrl: updates.avatarUrl || null }
          : employee,
      ),
    );

    return '내 정보가 저장되었습니다.';
  };

  const addOperation = async (draft: OperationDraft) => {
    setOperations((current) => [{ id: `op-${Date.now()}`, ...draft, lastCompletedAt: null }, ...current]);
    return '운영 항목을 추가했습니다.';
  };

  const updateOperation = async (operationId: string, draft: OperationDraft) => {
    setOperations((current) =>
      current.map((item) =>
        item.id === operationId
          ? {
              ...item,
              ...draft,
              lastCompletedAt: draft.frequency === '1회' ? item.lastCompletedAt || draft.lastCompletedAt || null : draft.lastCompletedAt || null,
            }
          : item,
      ),
    );
    return '운영 항목을 저장했습니다.';
  };

  const deleteOperation = async (operationId: string) => {
    setOperations((current) => current.filter((item) => item.id !== operationId));
    return '운영 항목을 삭제했습니다.';
  };

  const completeOperation = async (operationId: string) => {
    const target = operations.find((item) => item.id === operationId);
    if (!target) return '대상을 찾지 못했습니다.';

    const completedAt = new Date().toISOString();
    setOperations((current) =>
      current.map((item) => {
        if (item.id !== operationId) return item;
        if (item.frequency === '1회') {
          return {
            ...item,
            lastCompletedAt: completedAt,
          };
        }
        return {
          ...item,
          dueDate: addOperationCycle(item.dueDate, item.frequency),
          lastCompletedAt: completedAt,
        };
      }),
    );

    return target.frequency === '1회' ? '운영 항목을 완료 처리했습니다.' : '이번 회차를 완료하고 다음 일정으로 넘겼습니다.';
  };

  const saveGoogleCalendarSettings: GoogleCalendarSettingsHandler = async (settings) => {
    const normalizedSettings = normalizeGoogleCalendarSettings(settings);
    setGoogleCalendarSettings(normalizedSettings);
    localStorage.setItem(googleCalendarSettingsStorageKey, JSON.stringify(normalizedSettings));
    return 'Google Calendar 설정을 저장했습니다.';
  };

  const updatePushPreferences: PushPreferencesUpdateHandler = async (preferences) => {
    setPushPreferences(preferences);

    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase.from('push_preferences').upsert(
        {
          user_id: currentUser.id,
          task_enabled: preferences.task,
          report_enabled: preferences.report,
          project_message_enabled: preferences.projectMessage,
        },
        { onConflict: 'user_id' },
      );

      if (error) {
        const message = `푸시알림 설정 저장 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      return '푸시알림 설정을 저장했습니다.';
    }

    return '푸시알림 설정을 저장했습니다.';
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<string> => {
    if (supabase && currentUser && !currentUser.isPrototype) {
      const currentTask = tasks.find((task) => task.id === taskId);
      const updates = {
        status: statusToDb[status],
        ...(status === '진행중' && !currentTask?.startedAt ? { started_at: new Date().toISOString() } : {}),
        ...(status === '완료 요청' ? { creator_read_at: null } : {}),
      };
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) {
        const message = `업무 상태 변경 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return `업무 상태를 ${status}(으)로 변경했습니다.`;
    }

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
              startedAt: status === '진행중' ? task.startedAt || new Date().toISOString() : task.startedAt,
              creatorReadAt: status === '완료 요청' ? null : task.creatorReadAt,
            }
          : task,
      ),
    );
    return `업무 상태를 ${status}(으)로 변경했습니다.`;
  };

  const updateTask: TaskUpdateHandler = async (task, updates) => {
    const canEdit =
      currentUser?.accountRole === 'admin' ||
      task.creatorId === currentUser?.id ||
      (currentUser?.isPrototype && task.from === currentUser.name);

    if (!canEdit) return '업무 수정 권한이 없습니다.';

    const title = updates.title.trim();
    const summary = updates.summary.trim();
    const assignee = employees.find((employee) => employee.id === updates.assigneeId);
    const project = updates.projectId ? projects.find((item) => item.id === updates.projectId) : null;
    const client = project?.clientId ? clients.find((item) => item.id === project.clientId) : clients.find((item) => item.id === updates.clientId);

    if (!title || !summary || !updates.type || !assignee || !project || !client || !updates.due || !updates.priority) {
      return '모든 항목을 입력해주세요.';
    }

    const nextDueAt = parseDueDate(updates.due);
    if (!nextDueAt) return '마감기한을 선택해주세요.';

    const nextProjectId = project?.id && isUuid(project.id) ? project.id : null;
    const assigneeChanged = assignee.id !== task.assigneeId;

    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase
        .from('tasks')
        .update({
          title,
          description: summary,
          task_type: updates.type,
          priority: priorityToDb[updates.priority],
          assignee_id: assignee.id,
          client_id: isUuid(client.id) ? client.id : null,
          project_id: nextProjectId,
          due_at: nextDueAt,
          ...(assigneeChanged ? { read_at: null } : {}),
        })
        .eq('id', task.id);

      if (error) {
        const message = `업무 수정 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return '업무가 수정되었습니다.';
    }

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? {
              ...item,
              title,
              summary,
              type: updates.type,
              priority: updates.priority,
              assigneeId: assignee.id,
              to: assignee.name,
              clientId: client.id,
              client: client.name,
              projectId: project?.id || null,
              projectName: project?.name || '',
              due: formatDueDate(nextDueAt),
              dueAt: nextDueAt,
              readAt: assigneeChanged ? null : item.readAt,
            }
          : item,
      ),
    );
    return '업무가 수정되었습니다.';
  };

  const markTaskRead = async (task: Task) => {
    if (!currentUser) return;
    const readAt = new Date().toISOString();
    const shouldMarkAssigneeRead = !task.readAt && (getTaskRecipientIds(task).includes(currentUser.id) || (currentUser.isPrototype && task.to.split(', ').includes(currentUser.name)));
    const shouldMarkCreatorRead = !task.creatorReadAt && task.status === '완료 요청' && (task.creatorId === currentUser.id || (currentUser.isPrototype && task.from === currentUser.name));

    if (!shouldMarkAssigneeRead && !shouldMarkCreatorRead) return;

    if (supabase && !currentUser.isPrototype) {
      const updates = {
        ...(shouldMarkAssigneeRead ? { read_at: readAt } : {}),
        ...(shouldMarkCreatorRead ? { creator_read_at: readAt } : {}),
      };
      const { error } = await supabase.from('tasks').update(updates).eq('id', task.id);
      if (error) {
        setBackendStatus(`읽음 처리 실패: ${error.message}`);
        return;
      }
    }

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? {
              ...item,
              readAt: shouldMarkAssigneeRead ? readAt : item.readAt,
              creatorReadAt: shouldMarkCreatorRead ? readAt : item.creatorReadAt,
            }
          : item,
      ),
    );
  };

  const addTaskComment = async (task: Task, content: string, parentCommentId: string | null = null): Promise<string> => {
    const nextContent = content.trim();
    if (!nextContent) return '댓글 내용을 입력해주세요.';

    const parentComment = parentCommentId ? task.comments.find((comment) => comment.id === parentCommentId) : null;
    if (parentComment?.parentId) return '대댓글에는 답글을 달 수 없습니다.';

    if (supabase && currentUser && !currentUser.isPrototype) {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: task.id,
          parent_comment_id: parentCommentId,
          user_id: currentUser.id,
          content: nextContent,
        })
        .select('id')
        .single();

      if (error) {
        const message = `댓글 등록 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      if (data?.id) {
        await supabase.functions.invoke('send-comment-notification', {
          body: { commentId: data.id },
        });
      }

      await loadBackendData();
      return '댓글이 등록되었습니다.';
    }

    const nextComment: TaskComment = {
      id: `${Date.now()}`,
      taskId: task.id,
      parentId: parentCommentId,
      userId: currentUser?.id,
      author: currentUser?.name || '나',
      avatarUrl: currentUser?.avatarUrl || null,
      content: nextContent,
      createdAt: new Date().toISOString(),
    };

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? { ...item, comments: [...item.comments, nextComment] }
          : item,
      ),
    );

    return '댓글이 등록되었습니다.';
  };

  const deleteTaskComment = async (task: Task, comment: TaskComment): Promise<string> => {
    if (!currentUser || comment.userId !== currentUser.id) return '내가 쓴 댓글만 삭제할 수 있습니다.';

    if (!(await requestActionConfirm('댓글을 삭제하시겠습니까?'))) return '댓글 삭제를 취소했습니다.';

    if (supabase && !currentUser.isPrototype) {
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', comment.id)
        .eq('user_id', currentUser.id);

      if (error) {
        const message = `댓글 삭제 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return '댓글이 삭제되었습니다.';
    }

    const deleteIds = new Set([comment.id, ...task.comments.filter((item) => item.parentId === comment.id).map((item) => item.id)]);
    setTasks((current) =>
      current.map((item) =>
        item.id === task.id
          ? { ...item, comments: item.comments.filter((taskComment) => !deleteIds.has(taskComment.id)) }
          : item,
      ),
    );

    return '댓글이 삭제되었습니다.';
  };

  const openTaskFile = async (file: TaskFile) => {
    if (!file.path || !supabase || currentUser?.isPrototype) {
      showActionPopup('프로토타입 첨부파일은 미리보기만 가능합니다.');
      return;
    }

    const { data, error } = await supabase.storage.from('task-files').createSignedUrl(file.path, 60 * 10);
    if (error || !data?.signedUrl) {
      showActionPopup(`첨부파일 열기 실패: ${error?.message || 'URL 생성 실패'}`);
      return;
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  const deleteTask = async (task: Task): Promise<string> => {
    const canDelete =
      currentUser?.accountRole === 'admin' ||
      task.creatorId === currentUser?.id ||
      (currentUser?.isPrototype && task.from === currentUser.name);

    if (!canDelete) {
      return '삭제 권한이 없습니다.';
    }

    if (supabase && currentUser && !currentUser.isPrototype) {
      const { data, error } = await supabase.functions.invoke('delete-task', {
        body: { taskId: task.id },
      });

      if (error || data?.error) {
        const message = `업무 삭제 실패: ${data?.error || error?.message}`;
        setBackendStatus(message);
        return message;
      }

      setTasks((current) => current.filter((item) => item.id !== task.id));
      setSelectedTaskId((current) => (current === task.id ? null : current));
      window.setTimeout(() => {
        void loadBackendData();
      }, 400);
      return '업무를 삭제했습니다.';
    }

    setTasks((current) => current.filter((item) => item.id !== task.id));
    setSelectedTaskId((current) => (current === task.id ? null : current));
    return '업무를 삭제했습니다.';
  };

  const registerPushNotifications = async () => {
    if (!supabase || !currentUser || currentUser.isPrototype) {
      return '실제 로그인 후 푸시알림을 켤 수 있습니다.';
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return '이 브라우저는 웹푸시를 지원하지 않습니다.';
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

    if (!vapidPublicKey) {
      return 'VAPID public key가 설정되지 않았습니다.';
    }

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      return '브라우저 알림 권한이 허용되지 않았습니다.';
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    const existingSubscription = await registration.pushManager.getSubscription();

    if (existingSubscription) {
      const endpoint = existingSubscription.endpoint;
      await existingSubscription.unsubscribe();

      const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);

      if (error) {
        return `푸시 구독 해제 실패: ${error.message}`;
      }

      setPushEnabled(false);
      return '이 기기 업무 푸시알림이 꺼졌습니다.';
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
    const subscriptionJson = subscription.toJSON();

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: currentUser.id,
        endpoint: subscriptionJson.endpoint,
        p256dh: subscriptionJson.keys?.p256dh,
        auth: subscriptionJson.keys?.auth,
        user_agent: navigator.userAgent,
      },
      { onConflict: 'endpoint' },
    );

    if (error) {
      return `푸시 구독 저장 실패: ${error.message}`;
    }

    setPushEnabled(true);
    return '이 기기에서 업무 푸시알림이 켜졌습니다.';
  };

  const handleRegisterPush = async () => {
    if (pushLoading) return;
    setPushLoading(true);
    const message = await registerPushNotifications();
    setPushStatus(message);
    showActionPopup(message);
    setPushLoading(false);
  };

  const handleInstallApp = async () => {
    if (appInstalled) {
      const message = '이미 앱으로 설치된 상태입니다.';
      setInstallStatus(message);
      showActionPopup(message);
      return;
    }

    if (!installPrompt) {
      const message = '브라우저 메뉴의 “앱 설치” 또는 “홈 화면에 추가”를 사용해주세요.';
      setInstallStatus(message);
      showActionPopup(message);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setInstallPrompt(null);
      setAppInstalled(true);
      setInstallStatus('이 기기에 Plander Works가 설치되었습니다.');
      showActionPopup('앱 설치가 완료되었습니다.');
      return;
    }

    setInstallStatus('앱 설치가 취소되었습니다.');
  };

  if (!authReady) {
    return (
      <div className="auth-shell">
        <div className="auth-card loading-card">
          <div className="brand-mark">P</div>
          <p>로그인 상태 확인중</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginScreen
        themeMode={themeMode}
        onThemeChange={setThemeMode}
        onPrototypeLogin={handlePrototypeLogin}
      />
    );
  }

  const isAdmin = currentUser.accountRole === 'admin';

  return (
    <div className="app">
      <Sidebar
        activeView={activeView}
        activeProjectId={selectedProjectId}
        currentUser={currentUser}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCreateProject={() => {
          setProjectCreateOpen(true);
          setSidebarOpen(false);
        }}
        onInstallApp={handleInstallApp}
        onLogout={handleLogout}
        onOpenProfile={() => {
          setProfileOpen(true);
          setSidebarOpen(false);
        }}
        unreadBadges={navUnreadBadges}
        onNavigate={(view) => {
          if (!isAdmin && (view === 'employees' || view === 'operations')) return;
          navigateTo(view);
          setSidebarOpen(false);
        }}
        onOpenProject={(projectId) => {
          openProject(projectId);
          setSidebarOpen(false);
        }}
        badges={navBadges}
        projects={projects}
        showAdmin={isAdmin}
      />
      <div className="mobile-overlay" data-open={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      {projectCreateOpen ? (
        <ProjectCreateModal
          clients={clients}
          currentUser={currentUser}
          employees={employees}
          onClose={() => setProjectCreateOpen(false)}
          onCreateProject={createProject}
          onUpdateProject={updateProject}
        />
      ) : null}

      {editingProject ? (
        <ProjectCreateModal
          clients={clients}
          currentUser={currentUser}
          employees={employees}
          onClose={() => setEditingProjectId(null)}
          onCreateProject={createProject}
          onUpdateProject={updateProject}
          project={editingProject}
        />
      ) : null}

      <main
        className="workspace"
        data-swiping={swipeOffset !== 0}
        onTouchStart={handleWorkspaceTouchStart}
        onTouchMove={handleWorkspaceTouchMove}
        onTouchEnd={handleWorkspaceTouchEnd}
        style={{ transform: `translateX(${swipeOffset}px)` }}
      >
        <Topbar
          currentUser={currentUser}
          pushEnabled={pushEnabled}
          pushLoading={pushLoading}
          pushStatus={pushStatus}
          showSearch={activeView === 'dashboard'}
          themeMode={themeMode}
          onLogout={handleLogout}
          onNavigate={navigateTo}
          onOpenProfile={() => setProfileOpen(true)}
          onRegisterPush={handleRegisterPush}
          onThemeChange={setThemeMode}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {activeView === 'dashboard' ? (
          <Dashboard
            stats={dashboardStats}
            tasks={inboxTasks}
            sentTasks={sentTasks}
            reportTasks={reportTasks}
            clients={clients}
            employees={employees}
            onNavigate={navigateTo}
            onOpenTask={(task) => setSelectedTaskId(task.id)}
            currentUser={currentUser}
          />
        ) : null}
        {activeView === 'inbox' ? (
          <TaskListPage title="받은 업무" initialStatus={taskListFilters.inbox || '전체'} tasks={inboxTasks} currentUser={currentUser} onOpenTask={(task) => setSelectedTaskId(task.id)} onDeleteTask={deleteTask} onUpdateTaskStatus={updateTaskStatus} />
        ) : null}
        {activeView === 'sent' ? (
          <TaskListPage title="보낸 업무" initialStatus={taskListFilters.sent || '전체'} tasks={sentTasks} currentUser={currentUser} onOpenTask={(task) => setSelectedTaskId(task.id)} onDeleteTask={deleteTask} onUpdateTaskStatus={updateTaskStatus} />
        ) : null}
        {activeView === 'create' ? <TaskCreatePage clients={clients} employees={employees} projects={projects} taskTypes={taskTypes} onCreateTask={createTask} /> : null}
        {activeView === 'reports' ? (
          <ReportsPage tasks={reportTasks} employees={employees} currentUser={currentUser} onOpenTask={(task) => setSelectedTaskId(task.id)} onCreateTask={createTask} onDeleteTask={deleteTask} onUpdateTaskStatus={updateTaskStatus} />
        ) : null}
        {activeView === 'allTasks' ? (
          <TaskListPage title="전체 업무보기" initialStatus={taskListFilters.allTasks || '전체'} tasks={visibleTasks} employees={employees} currentUser={currentUser} onOpenTask={(task) => setSelectedTaskId(task.id)} onDeleteTask={deleteTask} onUpdateTaskStatus={updateTaskStatus} />
        ) : null}
        {activeView === 'project' ? (
          <ProjectPage
            clients={clients}
            currentUser={currentUser}
            employees={employees}
            messages={selectedProjectMessages}
            project={selectedProject}
            projects={projects}
            taskTypes={taskTypes}
            tasks={selectedProjectTasks}
            onAddMessage={addProjectMessage}
            onCreateTask={createProjectTask}
            onDeleteTask={deleteTask}
            onEditProject={(projectId) => setEditingProjectId(projectId)}
            onMarkMessagesRead={markProjectMessagesRead}
            onOpenTask={(task) => setSelectedTaskId(task.id)}
            onUpdateTaskStatus={updateTaskStatus}
          />
        ) : null}
        {activeView === 'calendar' ? (
          <CalendarPage
            currentUser={currentUser}
            googleCalendarSettings={googleCalendarSettings}
            operations={isAdmin ? operations : []}
            schedules={workSchedules}
            onAddSchedule={addWorkSchedule}
            onOpenOperations={() => navigateTo('operations')}
            onOpenTask={(task) => setSelectedTaskId(task.id)}
            tasks={tasks}
          />
        ) : null}
        {activeView === 'clients' ? <ClientsPage clients={clients} employees={employees} onAddClient={addClient} onDeleteClient={deleteClient} onUpdateClient={updateClient} /> : null}
        {activeView === 'employees' && isAdmin ? (
          <EmployeesPage
            currentUser={currentUser}
            employees={employees}
            jobTypes={jobTypes}
            onAddEmployee={addEmployee}
            onUpdateEmployee={updateEmployee}
          />
        ) : null}
        {activeView === 'operations' && isAdmin ? (
          <OperationsPage
            employees={employees}
            items={operations}
            onAddOperation={addOperation}
            onCompleteOperation={completeOperation}
            onDeleteOperation={deleteOperation}
            onUpdateOperation={updateOperation}
          />
        ) : null}
        {activeView === 'settings' ? (
          <SettingsPage
            backendStatus={backendStatus}
            currentUser={currentUser}
            employees={employees}
            googleCalendarSettings={googleCalendarSettings}
            jobTypes={jobTypes}
            taskTypes={taskTypes}
            themeMode={themeMode}
            pushEnabled={pushEnabled}
            pushLoading={pushLoading}
            pushPreferences={pushPreferences}
            pushStatus={pushStatus}
            installStatus={installStatus}
            appInstalled={appInstalled}
            canPromptInstall={Boolean(installPrompt)}
            onRegisterPush={handleRegisterPush}
            onInstallApp={handleInstallApp}
            onAddJobType={addJobType}
            onDeleteJobType={deleteJobType}
            onAddTaskType={addTaskType}
            onDeleteTaskType={deleteTaskType}
            onSaveGoogleCalendarSettings={saveGoogleCalendarSettings}
            onUpdatePushPreferences={updatePushPreferences}
            onUpdateOwnProfile={updateOwnProfile}
            onThemeChange={setThemeMode}
          />
        ) : null}
      </main>
      {profileOpen ? (
        <ProfileModal
          currentUser={currentUser}
          employees={employees}
          jobTypes={jobTypes}
          onClose={() => setProfileOpen(false)}
          onUpdateOwnProfile={updateOwnProfile}
        />
      ) : null}
      <TaskDetailModal
        task={selectedTask}
        currentUser={currentUser}
        employees={employees}
        onAddComment={addTaskComment}
        onClose={() => setSelectedTaskId(null)}
        onDeleteComment={deleteTaskComment}
        onDownloadFile={openTaskFile}
        onEditTask={(task) => {
          setSelectedTaskId(null);
          setEditingTaskId(task.id);
        }}
        onMarkRead={markTaskRead}
      />
      {editingTask ? (
        <TaskEditModal
          clients={clients}
          employees={employees}
          projects={projects}
          task={editingTask}
          taskTypes={taskTypes}
          onClose={() => setEditingTaskId(null)}
          onUpdateTask={updateTask}
        />
      ) : null}
      <ConfirmPopup
        request={confirmRequest}
        onResolve={(id, confirmed) => {
          resolveActionConfirm(id, confirmed);
          setConfirmRequest(null);
        }}
      />
      <CompletionPopup message={popupMessage} onClose={() => setPopupMessage('')} />
    </div>
  );
}

function LoginScreen({
  themeMode,
  onThemeChange,
  onPrototypeLogin,
}: {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onPrototypeLogin: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!supabase) {
      setError('Supabase 환경변수가 아직 설정되지 않았습니다.');
      return;
    }

    setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (loginError) {
      setError('이메일 또는 비밀번호를 확인해주세요.');
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-brand">
        <img className="auth-logo" src="/logo.svg" alt="Plander" />
        <p className="eyebrow">Plander Works</p>
        <h1>업무가 흩어지지 않게, 요청부터 보고까지 한 흐름으로.</h1>
        <p>
          관리자가 만든 계정으로 로그인하고, 받은 업무와 보낸 업무를 사람별로 확인하는 내부 업무관리 MVP입니다.
        </p>
      </section>

      <section className="auth-card">
        <div className="auth-card-head">
          <div>
            <p className="eyebrow">Sign In</p>
            <h2>로그인</h2>
          </div>
          <ThemeSwitcher value={themeMode} onChange={onThemeChange} />
        </div>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label>
            이메일
            <input
              autoComplete="email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@plander.co.kr"
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            비밀번호
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
              required
              type="password"
              value={password}
            />
          </label>
          {error ? <p className="auth-error">{error}</p> : null}
          <button className="primary-action wide" disabled={loading} type="submit">
            <ShieldCheck size={17} />
            {loading ? '진행중...' : '로그인'}
          </button>
        </form>

        <button className="ghost-action" onClick={onPrototypeLogin} type="button">
          계정 생성 전 프로토타입 보기
        </button>
      </section>
    </main>
  );
}

function ProjectCreateModal({
  clients,
  currentUser,
  employees,
  onClose,
  onCreateProject,
  onUpdateProject,
  project,
}: {
  clients: Client[];
  currentUser: AppUser;
  employees: Employee[];
  onClose: () => void;
  onCreateProject: ProjectSubmitHandler;
  onUpdateProject?: ProjectUpdateHandler;
  project?: Project | null;
}) {
  const [form, setForm] = useState<ProjectDraft>({
    name: project?.name || '',
    clientId: project?.clientId || clients[0]?.id || '',
    memberIds: project?.memberIds?.length ? project.memberIds : [currentUser.id],
  });
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(project);

  useEffect(() => {
    if (!form.clientId && clients[0]?.id) {
      setForm((current) => ({ ...current, clientId: clients[0].id }));
    }
  }, [clients, form.clientId]);

  useEffect(() => {
    setForm({
      name: project?.name || '',
      clientId: project?.clientId || clients[0]?.id || '',
      memberIds: project?.memberIds?.length ? project.memberIds : [currentUser.id],
    });
  }, [clients, currentUser.id, project]);

  const toggleMember = (employeeId: string) => {
    setForm((current) => {
      const selected = current.memberIds.includes(employeeId);
      return {
        ...current,
        memberIds: selected ? current.memberIds.filter((id) => id !== employeeId) : [...current.memberIds, employeeId],
      };
    });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    if (!form.name.trim()) {
      showActionPopup('프로젝트명을 입력해주세요.');
      return;
    }
    if (!form.clientId) {
      showActionPopup('연결할 업체를 선택해주세요.');
      return;
    }
    if (!form.memberIds.length) {
      showActionPopup('참여 직원을 선택해주세요.');
      return;
    }
    if (!(await requestActionConfirm(isEdit ? '프로젝트를 수정하시겠습니까?' : '프로젝트를 생성하시겠습니까?'))) return;

    setLoading(true);
    const message = isEdit && project && onUpdateProject ? await onUpdateProject(project.id, form) : await onCreateProject(form);
    setLoading(false);
    showActionPopup(message);
    if (!message.includes('실패') && !message.includes('선택') && !message.includes('입력')) onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <form className="modal-card form-stack" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">{isEdit ? 'Edit Project' : 'New Project'}</p>
            <h2>{isEdit ? '프로젝트 수정' : '프로젝트 생성'}</h2>
          </div>
          <button className="icon-button" aria-label="닫기" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <label>
          프로젝트명
          <input
            autoFocus
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="예: A업체 일본 인플루언서 캠페인"
          />
        </label>
        <label>
          연결 업체
          <select value={form.clientId} onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}>
            {clients.length ? (
              clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))
            ) : (
              <option value="">등록된 업체가 없습니다</option>
            )}
          </select>
        </label>
        <div className="field-block">
          <span>참여 직원</span>
          <div className="multi-picker compact">
            {employees.map((employee) => (
              <button
                className="select-chip"
                data-selected={form.memberIds.includes(employee.id)}
                key={employee.id}
                onClick={() => toggleMember(employee.id)}
                type="button"
              >
                {employee.name}
              </button>
            ))}
          </div>
        </div>
        <button className="primary-action wide" disabled={loading || !clients.length} type="submit">
          <FolderKanban size={17} />
          {loading ? '진행중...' : isEdit ? '프로젝트 저장' : '프로젝트 생성'}
        </button>
      </form>
    </div>
  );
}

function Sidebar({
  activeView,
  activeProjectId,
  badges,
  currentUser,
  open,
  onClose,
  onCreateProject,
  onInstallApp,
  onLogout,
  onNavigate,
  onOpenProject,
  onOpenProfile,
  projects,
  showAdmin,
  unreadBadges,
}: {
  activeView: ActiveView;
  activeProjectId: string | null;
  badges: Partial<Record<ActiveView, number>>;
  currentUser: AppUser;
  open: boolean;
  onClose: () => void;
  onCreateProject: () => void;
  onInstallApp: () => void;
  onLogout: () => void;
  onNavigate: (view: ActiveView) => void;
  onOpenProject: (projectId: string) => void;
  onOpenProfile: () => void;
  projects: Project[];
  showAdmin: boolean;
  unreadBadges: Partial<Record<ActiveView, number>>;
}) {
  const [adminOpen, setAdminOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);

  return (
    <aside className="sidebar" data-open={open}>
      <div className="brand-row">
        <img className="brand-logo" src="/logo.svg" alt="Plander" />
        <span className="brand-subtitle">Works</span>
        <button className="icon-button close-sidebar" aria-label="메뉴 닫기" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="주 메뉴">
        <div className="sidebar-create-split">
          <button className="create-split-button" onClick={onCreateProject} type="button">
            <FolderKanban size={16} />
            <span>프로젝트 생성</span>
          </button>
        </div>
        {primaryNavItems
          .filter((item) => (showAdmin ? true : item.id !== 'operations'))
          .map((item) => {
          const Icon = item.icon;
          const badge = badges[item.id] || 0;
          const unreadBadge = unreadBadges[item.id] || 0;
          return (
            <React.Fragment key={item.id}>
            <button className="nav-button" data-active={activeView === item.id} data-featured={item.id === 'create'} key={item.id} onClick={() => onNavigate(item.id)}>
              <Icon size={18} />
              <span>{item.label}</span>
              <span className="nav-badges">
                {unreadBadge > 0 ? <small className="nav-unread-badge">{unreadBadge}</small> : null}
                {badge > 0 ? <small>{badge}</small> : null}
              </span>
            </button>
            {item.id === 'clients' ? (
              <div className="sidebar-projects">
                <button className="nav-button project-toggle" data-active={activeView === 'project'} onClick={() => setProjectsOpen((open) => !open)} type="button">
                  <FolderKanban size={18} />
                  <span>프로젝트</span>
                  <ChevronDown size={16} data-open={projectsOpen} />
                </button>
                {projectsOpen ? (
                  <div className="project-nav-list">
                    {projects.length ? (
                      projects.map((project) => (
                        <button className="project-nav-button" data-active={activeProjectId === project.id} key={project.id} onClick={() => onOpenProject(project.id)} type="button">
                          <span>{project.name}</span>
                          <small>{project.client}</small>
                        </button>
                      ))
                    ) : (
                      <p className="project-nav-empty">등록된 프로젝트가 없습니다.</p>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
            </React.Fragment>
          );
        })}
      </nav>

      <div className="sidebar-bottom-layer">
        {adminOpen ? (
          showAdmin ? (
            <div className="sidebar-section">
              <p>관리</p>
              <button className="nav-button compact" onClick={onOpenProfile} type="button">
                <CircleUserRound size={18} />
                <span>내 정보관리</span>
              </button>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button className="nav-button compact" data-active={activeView === item.id} key={item.id} onClick={() => onNavigate(item.id)}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <button className="nav-button compact" onClick={onLogout} type="button">
                <LogOut size={18} />
                <span>로그아웃</span>
              </button>
            </div>
          ) : (
            <div className="sidebar-section">
              <p>계정</p>
              <button className="nav-button compact" onClick={onOpenProfile} type="button">
                <CircleUserRound size={18} />
                <span>내 정보관리</span>
              </button>
              <button className="nav-button compact" data-active={activeView === 'settings'} onClick={() => onNavigate('settings')}>
                <Settings size={18} />
                <span>설정</span>
              </button>
              <button className="nav-button compact" onClick={onLogout} type="button">
                <LogOut size={18} />
                <span>로그아웃</span>
              </button>
            </div>
          )
        ) : null}

        <button className="sidebar-install-button" onClick={onInstallApp} type="button">
          <Download size={17} />
          <span>앱 다운로드</span>
        </button>

        <div className="profile-card">
          <button className="profile-card-main" onClick={() => setAdminOpen((open) => !open)} type="button">
            <Avatar name={currentUser.name} src={currentUser.avatarUrl} size="lg" />
            <div>
              <strong>{currentUser.name}</strong>
              <span>{currentUser.role}</span>
            </div>
          </button>
          <button className="profile-toggle" aria-label="계정 메뉴" data-open={adminOpen} onClick={() => setAdminOpen((open) => !open)} type="button">
            <ChevronDown size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function Topbar({
  currentUser,
  pushEnabled,
  pushLoading,
  pushPreferences,
  pushStatus,
  showSearch,
  themeMode,
  onLogout,
  onNavigate,
  onOpenProfile,
  onRegisterPush,
  onThemeChange,
  onMenuClick,
}: {
  currentUser: AppUser;
  pushEnabled: boolean;
  pushLoading: boolean;
  pushStatus: string;
  showSearch: boolean;
  themeMode: ThemeMode;
  onLogout: () => void;
  onNavigate: (view: ActiveView) => void;
  onOpenProfile: () => void;
  onRegisterPush: () => void;
  onThemeChange: (mode: ThemeMode) => void;
  onMenuClick: () => void;
}) {
  const PushIcon = pushEnabled ? Bell : BellOff;
  const [accountOpen, setAccountOpen] = useState(false);

  const goSettings = () => {
    onNavigate('settings');
    setAccountOpen(false);
  };

  const openProfile = () => {
    onOpenProfile();
    setAccountOpen(false);
  };

  const logout = () => {
    setAccountOpen(false);
    onLogout();
  };

  return (
    <header className="topbar">
      <button className="icon-button menu-button" aria-label="메뉴 열기" onClick={onMenuClick}>
        <Menu size={21} />
      </button>

      {showSearch ? (
        <label className="search-box">
          <Search size={18} />
          <input placeholder="업무, 업체, 담당자 검색" />
        </label>
      ) : null}

      <div className="top-actions">
        <ThemeSwitcher value={themeMode} onChange={onThemeChange} />
        <button
          className="icon-button"
          aria-label={pushEnabled ? '푸시알림 끄기' : '푸시알림 켜기'}
          data-active={pushEnabled}
          disabled={pushLoading}
          onClick={onRegisterPush}
          title={pushStatus}
          type="button"
        >
          <PushIcon size={19} />
        </button>
        <div className="account-menu">
          <button className="account-button" onClick={() => setAccountOpen((open) => !open)} type="button">
            <CircleUserRound size={20} />
            <span>{currentUser.name}</span>
            <ChevronDown size={16} />
          </button>
          {accountOpen ? (
            <div className="account-popover">
              <button onClick={openProfile} type="button">
                내 정보 수정
              </button>
              <button onClick={goSettings} type="button">
                설정
              </button>
              <button onClick={logout} type="button">
                로그아웃
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function ThemeSwitcher({ value, onChange }: { value: ThemeMode; onChange: (mode: ThemeMode) => void }) {
  const options: Array<{ value: ThemeMode; icon: React.ElementType; label: string }> = [
    { value: 'light', icon: Sun, label: '라이트' },
    { value: 'dark', icon: Moon, label: '다크' },
    { value: 'system', icon: Settings, label: '시스템' },
  ];

  return (
    <div className="theme-switcher" aria-label="테마 설정">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            aria-label={option.label}
            data-active={value === option.value}
            key={option.value}
            onClick={() => onChange(option.value)}
            title={option.label}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}

function CompletionPopup({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="modal-backdrop action-popup-backdrop" role="presentation" onClick={onClose}>
      <div className="action-popup" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <CheckCircle2 size={26} />
        <h2>완료</h2>
        <p>{message}</p>
        <button className="primary-action wide" onClick={onClose} type="button">
          확인
        </button>
      </div>
    </div>
  );
}

function ConfirmPopup({
  request,
  onResolve,
}: {
  request: { id: number; message: string } | null;
  onResolve: (id: number, confirmed: boolean) => void;
}) {
  useEffect(() => {
    if (!request) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        onResolve(request.id, true);
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        onResolve(request.id, false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onResolve, request]);

  if (!request) return null;

  return (
    <div className="modal-backdrop action-popup-backdrop" role="presentation" onClick={() => onResolve(request.id, false)}>
      <div className="action-popup" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <CheckCircle2 size={26} />
        <h2>확인</h2>
        <p>{request.message}</p>
        <div className="confirm-actions">
          <button className="secondary-action" onClick={() => onResolve(request.id, false)} type="button">
            취소
          </button>
          <button className="primary-action" onClick={() => onResolve(request.id, true)} type="button">
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

function TaskDetailModal({
  task,
  currentUser,
  employees,
  onAddComment,
  onClose,
  onDeleteComment,
  onDownloadFile,
  onEditTask,
  onMarkRead,
}: {
  task: Task | null;
  currentUser: AppUser;
  employees: Employee[];
  onAddComment: TaskCommentSubmitHandler;
  onClose: () => void;
  onDeleteComment: TaskCommentDeleteHandler;
  onDownloadFile: (file: TaskFile) => void;
  onEditTask: (task: Task) => void;
  onMarkRead: (task: Task) => void;
}) {
  const [comment, setComment] = useState('');
  const [commentStatus, setCommentStatus] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  useEffect(() => {
    setComment('');
    setCommentStatus('');
    setReplyTargetId(null);
    setReplyText('');
  }, [task?.id]);

  useEffect(() => {
    if (!task) return;
    onMarkRead(task);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onMarkRead, task]);

  if (!task) return null;

  const rootComments = task.comments.filter((item) => !item.parentId);
  const getReplies = (commentId: string) => task.comments.filter((item) => item.parentId === commentId);
  const recipients = (task.watchers.length ? task.watchers : task.to.split(', ')).map((name) => name.trim()).filter(Boolean);
  const getRecipientAvatarUrl = (name: string) =>
    employees.find((employee) => employee.name === name)?.avatarUrl ||
    (recipients.length === 1 ? task.assigneeAvatarUrl : null);
  const canEdit =
    currentUser.accountRole === 'admin' ||
    task.creatorId === currentUser.id ||
    (currentUser.isPrototype && task.from === currentUser.name);

  const submitComment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (commentLoading) return;
    setCommentLoading(true);
    setCommentStatus('등록중입니다.');
    const message = await onAddComment(task, comment);
    setCommentLoading(false);
    setCommentStatus(message);
    if (!message.includes('실패') && !message.includes('입력')) {
      setComment('');
      showActionPopup(message);
    }
  };

  const submitReply = async (event: React.FormEvent<HTMLFormElement>, parentCommentId: string) => {
    event.preventDefault();
    if (replyLoading) return;
    setReplyLoading(true);
    setCommentStatus('답글 등록중입니다.');
    const message = await onAddComment(task, replyText, parentCommentId);
    setReplyLoading(false);
    setCommentStatus(message);
    if (!message.includes('실패') && !message.includes('입력')) {
      setReplyText('');
      setReplyTargetId(null);
      showActionPopup(message);
    }
  };

  const removeComment = async (item: TaskComment) => {
    if (deleteLoadingId) return;
    setDeleteLoadingId(item.id);
    const message = await onDeleteComment(task, item);
    setDeleteLoadingId(null);
    setCommentStatus(message);
    if (!message.includes('실패') && !message.includes('취소')) showActionPopup(message);
  };

  const renderComment = (item: TaskComment, isReply = false) => (
    <article className="comment-item" data-own={item.userId === currentUser.id} data-reply={isReply} key={item.id}>
      <div className="comment-head">
        <div className="comment-author">
          <Avatar name={item.author} src={item.avatarUrl} size="sm" />
          <div>
            <strong>{item.author}</strong>
            <small>{new Date(item.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
          </div>
        </div>
        <div className="comment-actions">
          {!isReply ? (
            <button className="icon-button" aria-label="답글" onClick={() => setReplyTargetId(replyTargetId === item.id ? null : item.id)} type="button">
              <Reply size={15} />
            </button>
          ) : null}
          {item.userId === currentUser.id ? (
            <button className="icon-button danger-icon" aria-label="삭제" disabled={deleteLoadingId === item.id} onClick={() => removeComment(item)} type="button">
              <Trash2 size={15} />
            </button>
          ) : null}
        </div>
      </div>
      <p>{item.content}</p>
      {!isReply && replyTargetId === item.id ? (
        <form className="comment-form reply-form" onSubmit={(event) => submitReply(event, item.id)}>
          <textarea
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
            placeholder={`${item.author}에게 답글`}
            rows={2}
          />
          <div className="comment-form-actions">
            <button className="secondary-action" disabled={replyLoading} onClick={() => setReplyTargetId(null)} type="button">
              취소
            </button>
            <button className="primary-action" disabled={replyLoading} type="submit">
              {replyLoading ? '진행중...' : '답글 등록'}
            </button>
          </div>
        </form>
      ) : null}
    </article>
  );

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <article className="modal-card task-detail-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">{formatTaskTypeLabel(task.type)}</p>
            <h2>{task.title}</h2>
          </div>
          <div className="modal-head-actions">
            {canEdit ? (
              <button className="secondary-action" onClick={() => onEditTask(task)} type="button">
                <Pencil size={15} />
                수정
              </button>
            ) : null}
            <button className="icon-button" aria-label="닫기" onClick={onClose} type="button">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="task-detail-meta">
          <span>
            보낸 사람:
            <Avatar name={task.from} src={task.creatorAvatarUrl} size="xs" />
            {task.from}
          </span>
          <span className="task-detail-recipients">
            받는 사람:
            <span className="task-detail-recipient-list">
              {recipients.map((recipient) => (
                <span className="task-detail-person" key={recipient}>
                  <Avatar name={recipient} src={getRecipientAvatarUrl(recipient)} size="xs" />
                  {recipient}
                </span>
              ))}
            </span>
            <strong className="read-badge" data-read={getTaskReadLabel(task)}>{getTaskReadLabel(task)}</strong>
          </span>
          <span>관련 업체: {task.client}</span>
          <span>프로젝트: {task.projectName || '미지정'}</span>
          <span>마감기한: {task.due}</span>
          <span>상태: {task.status}</span>
        </div>
        <div className="task-detail-body">
          <h3>내용</h3>
          <p>{task.summary ? renderLinkedText(task.summary) : '내용이 없습니다.'}</p>
        </div>
        <div className="detail-files">
          <h3>첨부파일</h3>
          {task.files.length ? (
            task.files.map((file) => (
              <button className="file-row" key={file.id} onClick={() => onDownloadFile(file)} type="button">
                <Paperclip size={16} />
                <span>{file.name}</span>
                <small>{file.size ? `${Math.ceil(file.size / 1024)}KB` : '파일'}</small>
              </button>
            ))
          ) : (
            <p>첨부파일이 없습니다.</p>
          )}
        </div>
        <div className="task-comments">
          <h3>댓글</h3>
          <div className="comment-list">
            {rootComments.length ? (
              rootComments.map((item) => (
                <div className="comment-thread" key={item.id}>
                  {renderComment(item)}
                  {getReplies(item.id).length ? (
                    <div className="reply-list">
                      {getReplies(item.id).map((reply) => renderComment(reply, true))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="mini-empty">아직 댓글이 없습니다.</p>
            )}
          </div>
          <form className="comment-form" onSubmit={submitComment}>
            <div className="comment-input-row">
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="댓글을 입력하세요"
                rows={2}
              />
              <button className="primary-action comment-submit-button" disabled={commentLoading} type="submit">
                <MessageSquareText size={16} />
                {commentLoading ? '진행중...' : '등록'}
              </button>
            </div>
            {commentStatus ? <p className="admin-note">{commentStatus}</p> : null}
          </form>
        </div>
        {needsTaskAttention(task, currentUser) ? <p className="admin-note">파란 점 표시: 확인이 필요한 업무입니다.</p> : null}
        <button className="primary-action wide" onClick={onClose} type="button">
          확인
        </button>
      </article>
    </div>
  );
}

function TaskEditModal({
  clients,
  employees,
  projects,
  task,
  taskTypes,
  onClose,
  onUpdateTask,
}: {
  clients: Client[];
  employees: Employee[];
  projects: Project[];
  task: Task;
  taskTypes: string[];
  onClose: () => void;
  onUpdateTask: TaskUpdateHandler;
}) {
  const typeOptions = taskTypes.length ? taskTypes : fallbackTaskTypes;
  const fallbackAssigneeId = task.assigneeId || employees.find((employee) => employee.name === task.to)?.id || employees[0]?.id || '';
  const fallbackProjectId = task.projectId || projects[0]?.id || '';
  const fallbackProject = projects.find((project) => project.id === fallbackProjectId);
  const fallbackClientId = fallbackProject?.clientId || task.clientId || clients.find((client) => client.name === task.client)?.id || clients[0]?.id || '';
  const [form, setForm] = useState<TaskUpdateDraft>({
    title: task.title,
    summary: task.summary,
    type: task.type,
    assigneeId: fallbackAssigneeId,
    clientId: fallbackClientId,
    projectId: fallbackProjectId,
    due: task.dueAt || '',
    priority: task.priority,
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const sortedProjects = [...projects].sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));

  useEffect(() => {
    const nextAssigneeId = task.assigneeId || employees.find((employee) => employee.name === task.to)?.id || employees[0]?.id || '';
    const nextProjectId = task.projectId || projects[0]?.id || '';
    const nextProject = projects.find((project) => project.id === nextProjectId);
    const nextClientId = nextProject?.clientId || task.clientId || clients.find((client) => client.name === task.client)?.id || clients[0]?.id || '';
    setForm({
      title: task.title,
      summary: task.summary,
      type: task.type,
      assigneeId: nextAssigneeId,
      clientId: nextClientId,
      projectId: nextProjectId,
      due: task.dueAt || '',
      priority: task.priority,
    });
    setStatus('');
  }, [clients, employees, projects, task]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    if (!form.title.trim() || !form.summary.trim() || !form.type || !form.assigneeId || !form.projectId || !form.due || !form.priority) {
      setStatus('모든 항목을 입력해주세요.');
      return;
    }
    if (!(await requestActionConfirm('업무 내용을 수정하시겠습니까?'))) return;

    setLoading(true);
    setStatus('저장중입니다.');
    const message = await onUpdateTask(task, form);
    setLoading(false);
    setStatus(message);
    showActionPopup(message);
    if (!message.includes('실패') && !message.includes('권한') && !message.includes('입력') && !message.includes('선택')) onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <form className="modal-card form-stack task-edit-modal" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">Edit Task</p>
            <h2>업무 수정</h2>
          </div>
          <button className="icon-button" aria-label="닫기" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="form-grid compact-form-grid">
          <label>
            유형
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as TaskType })}>
              {typeOptions.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            담당자
            <select value={form.assigneeId} onChange={(event) => setForm({ ...form, assigneeId: event.target.value })}>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
            </select>
          </label>
          <label>
            프로젝트
            <select value={form.projectId || ''} onChange={(event) => {
              const project = projects.find((item) => item.id === event.target.value);
              setForm({ ...form, projectId: project?.id || '', clientId: project?.clientId || '' });
            }}>
              <option value="">프로젝트 선택</option>
              {sortedProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name} · {project.client}
                </option>
              ))}
            </select>
          </label>
          <label>
            마감기한
            <DateTimeConfirmField value={form.due} onChange={(due) => setForm({ ...form, due })} />
          </label>
          <label>
            우선순위
            <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}>
              <option>높음</option>
              <option>보통</option>
              <option>낮음</option>
            </select>
          </label>
          <label className="span-2">
            제목
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label className="span-2">
            내용
            <textarea value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
          </label>
        </div>
        {status ? <p className="admin-note">{status}</p> : null}
        <button className="primary-action wide" disabled={loading} type="submit">
          <CheckCircle2 size={17} />
          {loading ? '진행중...' : '저장'}
        </button>
      </form>
    </div>
  );
}

function Dashboard({
  stats,
  tasks,
  sentTasks,
  reportTasks,
  clients,
  employees,
  currentUser,
  onNavigate,
  onOpenTask,
}: {
  stats: Array<{ label: string; value: number; hint: string; tone: string; target: ActiveView; filter?: TaskListFilter }>;
  tasks: Task[];
  sentTasks: Task[];
  reportTasks: Task[];
  clients: Client[];
  employees: Employee[];
  currentUser: AppUser;
  onNavigate: (view: ActiveView, filter?: TaskListFilter) => void;
  onOpenTask: (task: Task) => void;
}) {
  return (
    <>
      <section className="stats-grid" aria-label="업무 요약">
        {stats.map((item) => (
          <button className="stat-card" data-tone={item.tone} key={item.label} onClick={() => onNavigate(item.target, item.filter || '전체')} type="button">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.hint}</small>
          </button>
        ))}
      </section>

      <section className="dashboard-stack">
        <div className="dashboard-flow">
          <DashboardTaskSection title="받은 업무" eyebrow="Inbox" tone="blue" tasks={tasks} target="inbox" onNavigate={onNavigate} onOpenTask={onOpenTask} currentUser={currentUser} />
          <DashboardTaskSection title="보낸 업무" eyebrow="Sent" tasks={sentTasks} target="sent" onNavigate={onNavigate} onOpenTask={onOpenTask} currentUser={currentUser} />
          <DashboardTaskSection title="보고·제안" eyebrow="Reports" tone="amber" tasks={reportTasks} target="reports" onNavigate={onNavigate} onOpenTask={onOpenTask} currentUser={currentUser} />
          <DashboardClientSection clients={clients} onNavigate={() => onNavigate('clients')} />
        </div>
        <TeamLoad employees={employees} />
      </section>
    </>
  );
}

function DashboardTaskSection({
  title,
  eyebrow,
  tasks,
  target,
  tone,
  currentUser,
  onNavigate,
  onOpenTask,
}: {
  title: string;
  eyebrow: string;
  tasks: Task[];
  target: ActiveView;
  tone?: string;
  currentUser: AppUser;
  onNavigate: (view: ActiveView, filter?: TaskListFilter) => void;
  onOpenTask: (task: Task) => void;
}) {
  return (
    <section className="dashboard-flow-section" data-tone={tone}>
      <button className="dashboard-flow-head" onClick={() => onNavigate(target, '전체')} type="button">
        <span>
          <small>{eyebrow}</small>
          <strong>{title}</strong>
        </span>
        <ChevronDown size={16} />
      </button>
      <div className="dashboard-flow-list">
        {tasks.slice(0, 5).map((task) => (
          <button
            className="dashboard-flow-row"
            data-attention={needsTaskAttention(task, currentUser)}
            data-status-tone={getTaskStatusTone(task.status)}
            key={task.id}
            onClick={() => onOpenTask(task)}
            type="button"
          >
            <span>{task.title}</span>
            <small>{task.due}</small>
          </button>
        ))}
        {!tasks.length ? <p className="mini-empty">표시할 항목이 없습니다.</p> : null}
      </div>
    </section>
  );
}

function DashboardClientSection({ clients, onNavigate }: { clients: Client[]; onNavigate: () => void }) {
  return (
    <section className="dashboard-flow-section">
      <button className="dashboard-flow-head" onClick={onNavigate} type="button">
        <span>
          <small>Clients</small>
          <strong>업체</strong>
        </span>
        <ChevronDown size={16} />
      </button>
      <div className="dashboard-flow-list">
        {clients.slice(0, 5).map((client) => (
          <button className="dashboard-flow-row" key={client.id} onClick={onNavigate} type="button">
            <span>{client.name}</span>
            <small>{client.manager}</small>
          </button>
        ))}
        {!clients.length ? <p className="mini-empty">등록된 업체가 없습니다.</p> : null}
      </div>
    </section>
  );
}

function TaskListPage({
  title,
  initialStatus,
  tasks,
  employees = [],
  currentUser,
  onOpenTask,
  onDeleteTask,
  onUpdateTaskStatus,
}: {
  title: string;
  initialStatus: TaskListFilter;
  tasks: Task[];
  employees?: Employee[];
  currentUser: AppUser;
  onOpenTask: (task: Task) => void;
  onDeleteTask: TaskDeleteHandler;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => Promise<string>;
}) {
  const [status, setStatus] = useState<TaskListFilter>(initialStatus);
  const [employeeId, setEmployeeId] = useState('전체');
  const statusFilteredTasks = status === '전체' ? tasks : tasks.filter((task) => task.status === status);
  const filteredTasks =
    !employees.length || employeeId === '전체'
      ? statusFilteredTasks
      : statusFilteredTasks.filter((task) => task.creatorId === employeeId || getTaskRecipientIds(task).includes(employeeId));

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (!employees.length) setEmployeeId('전체');
  }, [employees.length]);

  return (
    <section className="page-shell">
      <div className="page-head">
        <div>
          <p className="eyebrow">Tasks</p>
          <h1>{title}</h1>
        </div>
        <div className="filters">
          {employees.length ? (
            <select className="task-person-filter" value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} aria-label="직원별 업무 필터">
              <option value="전체">직원 전체</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          ) : null}
          {(['전체', '대기', '진행중', '완료 요청', '보류', '완료'] as Array<'전체' | TaskStatus>).map((item) => (
            <button data-active={status === item} key={item} onClick={() => setStatus(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="task-board list-surface">
        <div className="task-list">
          {filteredTasks.length ? (
            filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} currentUser={currentUser} onOpenTask={onOpenTask} onDeleteTask={onDeleteTask} onUpdateStatus={onUpdateTaskStatus} />
            ))
          ) : (
            <EmptyState text="조건에 맞는 업무가 없습니다." />
          )}
        </div>
      </div>
    </section>
  );
}

function ProjectPage({
  clients,
  currentUser,
  employees,
  messages,
  project,
  projects,
  taskTypes,
  tasks,
  onAddMessage,
  onCreateTask,
  onDeleteTask,
  onEditProject,
  onMarkMessagesRead,
  onOpenTask,
  onUpdateTaskStatus,
}: {
  clients: Client[];
  currentUser: AppUser;
  employees: Employee[];
  messages: ProjectMessage[];
  project: Project | null;
  projects: Project[];
  taskTypes: string[];
  tasks: Task[];
  onAddMessage: (projectId: string, content: string) => Promise<string>;
  onCreateTask: TaskSubmitHandler;
  onDeleteTask: TaskDeleteHandler;
  onEditProject: (projectId: string) => void;
  onMarkMessagesRead: (messageIds: string[]) => Promise<void>;
  onOpenTask: (task: Task) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => Promise<string>;
}) {
  const activeTasks = tasks.filter((task) => task.status !== '완료');
  const [message, setMessage] = useState('');
  const [messageStatus, setMessageStatus] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [taskCreateOpen, setTaskCreateOpen] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const messageRows = Math.min(5, Math.max(1, message.split('\n').length));
  const latestMessageId = messages[messages.length - 1]?.id;
  const canEditProject = Boolean(project && (currentUser.accountRole === 'admin' || project.createdBy === currentUser.id || currentUser.isPrototype));
  const projectEmployees = project?.memberIds.length
    ? employees.filter((employee) => project.memberIds.includes(employee.id))
    : employees;

  useEffect(() => {
    const list = messageListRef.current;
    if (!list) return;
    requestAnimationFrame(() => {
      list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
    });
  }, [latestMessageId, project?.id]);

  useEffect(() => {
    if (!project || !messages.length) return;
    const unreadMessageIds = messages
      .filter((item) => item.userId !== currentUser.id && !item.readByIds.includes(currentUser.id))
      .map((item) => item.id);

    if (unreadMessageIds.length) {
      void onMarkMessagesRead(unreadMessageIds);
    }
  }, [currentUser.id, messages, onMarkMessagesRead, project]);

  const sendMessage = async () => {
    if (!project || messageLoading) return;
    setMessageLoading(true);
    const result = await onAddMessage(project.id, message);
    setMessageLoading(false);
    if (result.includes('실패') || result.includes('입력')) {
      setMessageStatus(result);
      return;
    }
    setMessageStatus('');
    setMessage('');
  };

  const submitMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await sendMessage();
  };

  const handleMessageKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    await sendMessage();
  };

  return (
    <section className="page-shell">
      <div className="page-head project-page-head">
        <div>
          <p className="eyebrow">Project</p>
          <div className="project-title-row">
            <h1>{project?.name || '프로젝트'}</h1>
            {project && canEditProject ? (
              <button className="icon-button project-edit-button" aria-label="프로젝트 수정" onClick={() => onEditProject(project.id)} type="button">
                <Pencil size={16} />
              </button>
            ) : null}
          </div>
          {project ? (
            <p>
              {project.client} · 진행 업무 {activeTasks.length}건 · 전체 업무 {tasks.length}건
              {project.memberNames.length ? ` · 참여 ${project.memberNames.join(', ')}` : ''}
            </p>
          ) : null}
        </div>
        {project ? (
          <button className="primary-action" onClick={() => setTaskCreateOpen(true)} type="button">
            <Plus size={17} />
            업무 생성
          </button>
        ) : null}
      </div>

      {project && taskCreateOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setTaskCreateOpen(false)}>
          <article className="modal-card task-create-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">New Task</p>
                <h2>{project.name} 업무 생성</h2>
              </div>
              <button className="icon-button" aria-label="닫기" onClick={() => setTaskCreateOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>
            <TaskForm
              clients={clients}
              employees={projectEmployees.length ? projectEmployees : employees}
              fixedProjectId={project.id}
              onSubmit={onCreateTask}
              onSuccess={() => setTaskCreateOpen(false)}
              projects={projects}
              taskTypes={taskTypes}
            />
          </article>
        </div>
      ) : null}

      <div className="project-detail-grid">
        <div className="task-board list-surface">
          <div className="task-list">
            {project ? (
              tasks.length ? (
                tasks.map((task) => (
                  <TaskCard key={task.id} task={task} currentUser={currentUser} onOpenTask={onOpenTask} onDeleteTask={onDeleteTask} onUpdateStatus={onUpdateTaskStatus} />
                ))
              ) : (
                <EmptyState text="이 프로젝트에 연결된 업무가 없습니다." />
              )
            ) : (
              <EmptyState text="프로젝트를 선택해주세요." />
            )}
          </div>
        </div>
        {project ? (
          <aside className="project-chat-panel">
            <div className="section-head tight">
              <div>
                <p className="eyebrow">Project Chat</p>
                <h2>프로젝트 대화</h2>
              </div>
              <MessageSquareText size={22} />
            </div>
            <div className="project-message-list" ref={messageListRef}>
              {messages.length ? (
                messages.map((item) => (
                  <article className="project-message" data-own={item.userId === currentUser.id} key={item.id}>
                    <div className="project-message-head">
                      <Avatar name={item.author} src={item.avatarUrl} size="sm" />
                      <div>
                        <strong>{item.author}</strong>
                        <small>{new Date(item.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
                      </div>
                    </div>
                    <p>{item.content}</p>
                    {item.readBy.filter((name) => name !== item.author).length ? (
                      <small className="project-message-readers">
                        읽음: {item.readBy.filter((name) => name !== item.author).join(', ')}
                      </small>
                    ) : null}
                  </article>
                ))
              ) : (
                <p className="mini-empty">아직 대화가 없습니다.</p>
              )}
            </div>
            <form className="project-chat-form" onSubmit={submitMessage}>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleMessageKeyDown}
                placeholder="프로젝트 대화를 입력하세요"
                rows={messageRows}
              />
              {messageStatus ? <p className="admin-note">{messageStatus}</p> : null}
              <button className="project-chat-send-button" aria-label="대화 전송" disabled={messageLoading} type="submit">
                <SendHorizontal size={18} />
              </button>
            </form>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

function TaskCreatePage({
  clients,
  employees,
  projects,
  taskTypes,
  onCreateTask,
}: {
  clients: Client[];
  employees: Employee[];
  projects: Project[];
  taskTypes: string[];
  onCreateTask: TaskSubmitHandler;
}) {
  return (
    <section className="page-shell">
      <div className="page-head">
        <div>
          <p className="eyebrow">Create</p>
          <h1>업무 생성</h1>
        </div>
      </div>
      <div className="page-card">
        <TaskForm clients={clients} employees={employees} projects={projects} taskTypes={taskTypes} onSubmit={onCreateTask} />
      </div>
    </section>
  );
}

function ReportsPage({
  tasks,
  employees,
  currentUser,
  onOpenTask,
  onCreateTask,
  onDeleteTask,
  onUpdateTaskStatus,
}: {
  tasks: Task[];
  employees: Employee[];
  currentUser: AppUser;
  onOpenTask: (task: Task) => void;
  onCreateTask: TaskSubmitHandler;
  onDeleteTask: TaskDeleteHandler;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => Promise<string>;
}) {
  const reportTasks = tasks.filter((task) => task.type === '보고' || task.type === '제안');

  return (
    <section className="page-shell">
      <div className="page-head">
        <div>
          <p className="eyebrow">Reports</p>
          <h1>보고·제안</h1>
        </div>
      </div>
      <div className="split-layout reports-layout">
        <div className="task-list report-task-list">
          {reportTasks.length ? (
            reportTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                currentUser={currentUser}
                direction={task.creatorId === currentUser.id || (currentUser.isPrototype && task.from === currentUser.name) ? 'sent' : 'received'}
                onOpenTask={onOpenTask}
                onDeleteTask={onDeleteTask}
                onUpdateStatus={onUpdateTaskStatus}
              />
            ))
          ) : (
            <EmptyState text="표시할 보고·제안이 없습니다." />
          )}
        </div>
        <div className="page-card">
          <ReportForm employees={employees} onCreateTask={onCreateTask} />
        </div>
      </div>
    </section>
  );
}

function CalendarPage({
  currentUser,
  googleCalendarSettings,
  tasks,
  operations,
  schedules,
  onAddSchedule,
  onOpenTask,
  onOpenOperations,
}: {
  currentUser: AppUser;
  googleCalendarSettings: GoogleCalendarSettings;
  tasks: Task[];
  operations: OperationItem[];
  schedules: WorkSchedule[];
  onAddSchedule: WorkScheduleSubmitHandler;
  onOpenTask: (task: Task) => void;
  onOpenOperations: () => void;
}) {
  const [mode, setMode] = useState<'일' | '주' | '월'>('월');
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [scheduleCreateOpen, setScheduleCreateOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
  const [googleSyncLoading, setGoogleSyncLoading] = useState(false);
  const [googleSyncStatus, setGoogleSyncStatus] = useState('');
  const calendarTasks = tasks.filter((task) =>
    getTaskRecipientIds(task).includes(currentUser.id) ||
    task.creatorId === currentUser.id ||
    (currentUser.isPrototype && (task.to === currentUser.name || task.from === currentUser.name)),
  );
  const taskCalendarEvents = calendarTasks
    .map((task) => {
      const range = getTaskCalendarRange(task);
      const kind =
        task.creatorId === currentUser.id || (currentUser.isPrototype && task.from === currentUser.name) ? '보낸 업무' : '받은 업무';
      return range
        ? {
            id: `task-${task.id}`,
            title: task.title,
            start: range.start,
            end: range.end,
            days: range.days,
            kind,
            description: `${task.summary || '내용 없음'}\n담당: ${task.to}\n업체: ${task.client}\n상태: ${task.status}`,
            sourceUrl: `${window.location.origin}/?taskId=${task.id}`,
            allDay: false,
            onClick: () => onOpenTask(task),
          }
        : null;
    })
    .filter((item): item is CalendarEventItem => Boolean(item));
  const scheduleCalendarEvents = schedules
    .map((schedule) => {
      const startDate = parseTaskDate(schedule.startAt);
      const endDate = parseTaskDate(schedule.endAt);
      if (!startDate || !endDate) return null;
      const rangeEnd = endDate.getTime() >= startDate.getTime() ? endDate : startDate;

      return {
        id: `schedule-${schedule.id}`,
        title: `${schedule.creatorName} - ${schedule.title}`,
        start: startDate,
        end: rangeEnd,
        days: Math.max(1, diffCalendarDays(startDate, rangeEnd) + 1),
        kind: '업무 스케줄',
        description: `${schedule.memo || '메모 없음'}\n작성: ${schedule.creatorName}`,
        sourceUrl: `${window.location.origin}/#calendar`,
        allDay: false,
        onClick: () => setSelectedSchedule(schedule),
      };
    })
    .filter((item): item is CalendarEventItem => Boolean(item));
  const operationCalendarEvents = operations
    .filter((item) => item.active)
    .map((item) => {
      const dueDate = parseOperationDate(item.dueDate);
      return dueDate
        ? {
            id: `operation-${item.id}`,
            title: item.title,
            start: dueDate,
            end: dueDate,
            days: 1,
            kind: '구독/정산관리',
            description: `${item.provider}\n${item.memo || '메모 없음'}\n금액: ${formatOperationAmount(item.amount)}\n주기: ${item.frequency}`,
            sourceUrl: `${window.location.origin}/#operations`,
            allDay: true,
            onClick: onOpenOperations,
          }
        : null;
    })
    .filter((item): item is CalendarEventItem => Boolean(item));
  const calendarEvents = [...taskCalendarEvents, ...scheduleCalendarEvents, ...operationCalendarEvents]
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const monthEnd = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0);
  const startOfWeek = startOfCalendarDay(addCalendarDays(anchorDate, -anchorDate.getDay()));
  const monthCalendarStart = addCalendarDays(monthStart, -monthStart.getDay());
  const monthCalendarEnd = addCalendarDays(monthEnd, 6 - monthEnd.getDay());
  const monthWeeks = Array.from({ length: Math.ceil((diffCalendarDays(monthCalendarStart, monthCalendarEnd) + 1) / 7) }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => addCalendarDays(monthCalendarStart, weekIndex * 7 + dayIndex)),
  );
  const hours = Array.from({ length: 14 }, (_, index) => index + 8);
  const isSameCalendarDay = (first: Date, second: Date) => startOfCalendarDay(first).getTime() === startOfCalendarDay(second).getTime();
  const eventIntersectsDay = (event: { start: Date; end: Date }, day: Date) => {
    const dayStart = startOfCalendarDay(day);
    const dayEnd = addCalendarDays(dayStart, 1);
    return event.start.getTime() < dayEnd.getTime() && event.end.getTime() >= dayStart.getTime();
  };
  const eventsForDay = (day: Date) => calendarEvents.filter((event) => eventIntersectsDay(event, day));
  const eventSegmentsForWeek = (week: Date[]) =>
    calendarEvents
      .map((event) => {
        const weekStart = week[0];
        const weekEnd = addCalendarDays(week[6], 1);
        if (event.end.getTime() < weekStart.getTime() || event.start.getTime() >= weekEnd.getTime()) return null;
        const segmentStart = event.start.getTime() > weekStart.getTime() ? startOfCalendarDay(event.start) : weekStart;
        const segmentEnd = event.end.getTime() < weekEnd.getTime() ? startOfCalendarDay(event.end) : week[6];
        const columnStart = diffCalendarDays(weekStart, segmentStart) + 1;
        const span = Math.max(1, diffCalendarDays(segmentStart, segmentEnd) + 1);
        const firstDay = diffCalendarDays(startOfCalendarDay(event.start), segmentStart) + 1;
        const lastDay = firstDay + span - 1;
        return { ...event, columnStart, span, firstDay, lastDay };
      })
      .filter((item): item is { id: string; title: string; kind: string; onClick: () => void; start: Date; end: Date; days: number; columnStart: number; span: number; firstDay: number; lastDay: number } => Boolean(item));
  const moveCalendar = (direction: -1 | 1) => {
    setAnchorDate((current) => {
      if (mode === '일') return addCalendarDays(current, direction);
      if (mode === '주') return addCalendarDays(current, direction * 7);
      return new Date(current.getFullYear(), current.getMonth() + direction, 1);
    });
  };
  const currentDateLabel = mode === '월'
    ? anchorDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
    : mode === '주'
      ? `${startOfWeek.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} ~ ${addCalendarDays(startOfWeek, 6).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`
      : anchorDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const syncGoogleCalendar = async () => {
    if (googleSyncLoading) return;
    if (currentUser.accountRole !== 'admin') return;

    if (!(await requestActionConfirm(`Google Calendar로 스케줄 ${calendarEvents.length}건을 옮기시겠습니까?`))) return;

    setGoogleSyncLoading(true);
    setGoogleSyncStatus('Google Calendar 동기화중');

    try {
      const result = await syncEventsToGoogleCalendar(googleCalendarSettings, calendarEvents);
      const message = `Google Calendar로 ${result.created}건 생성, ${result.updated}건 갱신했습니다.${result.failed ? ` 실패 ${result.failed}건` : ''}`;
      setGoogleSyncStatus(message);
      showActionPopup(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google Calendar 동기화에 실패했습니다.';
      setGoogleSyncStatus(message);
      showActionPopup(message);
    } finally {
      setGoogleSyncLoading(false);
    }
  };

  return (
    <section className="page-shell">
      <div className="page-head">
        <div>
          <p className="eyebrow">Calendar</p>
          <h1>캘린더</h1>
          <p className="calendar-current-date">{currentDateLabel}</p>
        </div>
        <div className="calendar-controls">
          <button className="primary-action" onClick={() => setScheduleCreateOpen(true)} type="button">
            <Plus size={16} />
            스케줄 추가
          </button>
          {currentUser.accountRole === 'admin' ? (
            <button className="primary-action calendar-sync-button" disabled={googleSyncLoading || !calendarEvents.length} onClick={syncGoogleCalendar} type="button">
              <SendHorizontal size={16} />
              {googleSyncLoading ? '진행중...' : '구글캘린더로 스케줄 옮기기'}
            </button>
          ) : null}
          <button className="icon-button" aria-label="이전" onClick={() => moveCalendar(-1)} type="button">
            <ChevronLeft size={18} />
          </button>
          <div className="filters">
            {(['일', '주', '월'] as const).map((item) => (
              <button data-active={mode === item} key={item} onClick={() => setMode(item)} type="button">
                {item}
              </button>
            ))}
          </div>
          <button className="icon-button" aria-label="다음" onClick={() => moveCalendar(1)} type="button">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      {googleSyncStatus ? <p className="calendar-sync-status">{googleSyncStatus}</p> : null}
      {scheduleCreateOpen ? (
        <ScheduleCreateModal
          onAddSchedule={onAddSchedule}
          onClose={() => setScheduleCreateOpen(false)}
        />
      ) : null}
      {selectedSchedule ? (
        <ScheduleDetailModal
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
        />
      ) : null}

      <div className="page-card calendar-panel" data-mode={mode}>
        {mode === '월' ? (
          <div className="month-board">
            {monthWeeks.map((week) => (
              <div className="month-week" key={week[0].toISOString()}>
                <div className="month-days">
                  {week.map((day) => (
                    <div className="month-cell" data-outside-month={day.getMonth() !== anchorDate.getMonth()} key={day.toISOString()}>
                      <strong>{day.getDate()}</strong>
                    </div>
                  ))}
                </div>
                <div className="month-events">
                  {eventSegmentsForWeek(week).slice(0, 5).map((event) => (
                    <button
                      className="calendar-range-pill"
                      data-kind={event.kind}
                      key={`${event.id}-${week[0].toISOString()}`}
                      onClick={event.onClick}
                      style={{ gridColumn: `${event.columnStart} / span ${event.span}` }}
                      type="button"
                    >
                      <span>{event.title}</span>
                      <small>{event.days > 1 ? `${event.firstDay}~${event.lastDay}일차` : event.end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</small>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : mode === '주' ? (
          <div className="week-calendar">
            <div className="week-range-grid">
              {Array.from({ length: 7 }, (_, index) => addCalendarDays(startOfWeek, index)).map((day) => (
                <strong key={day.toISOString()}>{day.toLocaleDateString('ko-KR', { weekday: 'short', day: 'numeric' })}</strong>
              ))}
              {eventSegmentsForWeek(Array.from({ length: 7 }, (_, index) => addCalendarDays(startOfWeek, index))).map((event) => (
                <button
                  className="calendar-range-pill"
                  data-kind={event.kind}
                  key={event.id}
                  onClick={event.onClick}
                  style={{ gridColumn: `${event.columnStart} / span ${event.span}` }}
                  type="button"
                >
                  <span>{event.title}</span>
                  <small>{event.days > 1 ? `${event.firstDay}~${event.lastDay}일차` : event.end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</small>
                </button>
              ))}
            </div>
            <div className="week-timeline">
              {hours.map((hour) => {
                const columns = Array.from({ length: 7 }, (_, index) => addCalendarDays(startOfWeek, index));
                return (
                  <div className="time-row" key={hour}>
                    <span>{String(hour).padStart(2, '0')}:00</span>
                    {columns.map((day) => {
                      const hourEvents = eventsForDay(day).filter(({ start, end }) => {
                        const isStartDay = isSameCalendarDay(start, day);
                        const isEndDay = isSameCalendarDay(end, day);
                        return (isStartDay && start.getHours() === hour) || (isEndDay && end.getHours() === hour);
                      });
                      return (
                        <div className="time-slot" key={`${day.toDateString()}-${hour}`}>
                          {hourEvents.map((event) => (
                            <button className="calendar-task-pill" data-kind={event.kind} key={event.id} onClick={event.onClick} type="button">
                              <span>{event.title}</span>
                              <small>{event.days > 1 ? `${event.days}일 일정` : event.kind}</small>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="day-timeline">
            {hours.map((hour) => {
              const hourEvents = eventsForDay(anchorDate).filter(({ start, end }) => {
                const isStartDay = isSameCalendarDay(start, anchorDate);
                const isEndDay = isSameCalendarDay(end, anchorDate);
                return (isStartDay && start.getHours() === hour) || (isEndDay && end.getHours() === hour);
              });
              return (
                <div className="time-row" key={hour}>
                  <span>{String(hour).padStart(2, '0')}:00</span>
                  <div className="time-slot">
                    {hourEvents.map((event) => (
                      <button className="calendar-task-pill" data-kind={event.kind} key={event.id} onClick={event.onClick} type="button">
                        <span>{event.title}</span>
                        <small>
                          {event.days > 1
                            ? `${event.start.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}~${event.end.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`
                            : event.kind}
                        </small>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function ScheduleCreateModal({
  onAddSchedule,
  onClose,
}: {
  onAddSchedule: WorkScheduleSubmitHandler;
  onClose: () => void;
}) {
  const defaultStart = toDateTimeLocalValue(new Date());
  const defaultEndDate = new Date();
  defaultEndDate.setHours(defaultEndDate.getHours() + 1);
  const [form, setForm] = useState({
    title: '',
    startAt: defaultStart,
    endAt: toDateTimeLocalValue(defaultEndDate),
    memo: '',
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    if (!form.title.trim() || !form.startAt || !form.endAt) {
      setStatus('제목, 시작일, 종료일을 입력해주세요.');
      return;
    }
    if (!(await requestActionConfirm('스케줄을 추가하시겠습니까?'))) return;

    setLoading(true);
    setStatus('저장중입니다.');
    const message = await onAddSchedule(form);
    setLoading(false);
    setStatus(message);
    showActionPopup(message);
    if (!message.includes('실패') && !message.includes('입력') && !message.includes('선택')) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <form className="modal-card form-stack" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">Schedule</p>
            <h2>스케줄 추가</h2>
          </div>
          <button className="icon-button" aria-label="닫기" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <label>
          제목
          <input autoFocus required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label>
          시작일
          <DateTimeConfirmField value={form.startAt} onChange={(startAt) => setForm({ ...form, startAt })} />
        </label>
        <label>
          종료일
          <DateTimeConfirmField value={form.endAt} onChange={(endAt) => setForm({ ...form, endAt })} />
        </label>
        <label>
          메모
          <textarea value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} />
        </label>
        {status ? <p className="admin-note">{status}</p> : null}
        <button className="primary-action wide" disabled={loading} type="submit">
          <Plus size={17} />
          {loading ? '진행중...' : '스케줄 추가'}
        </button>
      </form>
    </div>
  );
}

function ScheduleDetailModal({
  schedule,
  onClose,
}: {
  schedule: WorkSchedule;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <article className="modal-card schedule-detail-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">Schedule</p>
            <h2>{schedule.creatorName} - {schedule.title}</h2>
          </div>
          <button className="icon-button" aria-label="닫기" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="task-detail-meta schedule-detail-meta">
          <span>작성자: {schedule.creatorName}</span>
          <span>시작: {formatDueDate(schedule.startAt)}</span>
          <span>종료: {formatDueDate(schedule.endAt)}</span>
        </div>
        <div className="task-detail-body">
          <h3>내용</h3>
          <p>{schedule.memo || '내용이 없습니다.'}</p>
        </div>
        <button className="primary-action wide" onClick={onClose} type="button">
          확인
        </button>
      </article>
    </div>
  );
}

function ClientsPage({
  clients,
  employees,
  onAddClient,
  onDeleteClient,
  onUpdateClient,
}: {
  clients: Client[];
  employees: Employee[];
  onAddClient: ClientSubmitHandler;
  onDeleteClient: ClientDeleteHandler;
  onUpdateClient: ClientUpdateHandler;
}) {
  const [regions, setRegions] = useState(['서울', '경기', '제주', '부산', '대구', '평택']);
  const [newRegion, setNewRegion] = useState('');
  const defaultManager = employees[0]?.name || '';
  const [form, setForm] = useState({ name: '', manager: defaultManager, phone: '', region: regions[0], memo: '' });
  const [clientCreateOpen, setClientCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editForm, setEditForm] = useState<Omit<Client, 'id'>>({ name: '', manager: '', phone: '', region: regions[0], memo: '' });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    if (!employees.length) return;
    setForm((current) => (employees.some((employee) => employee.name === current.manager) ? current : { ...current, manager: employees[0].name }));
    setEditForm((current) => {
      if (!current.manager || employees.some((employee) => employee.name === current.manager)) return current;
      return { ...current, manager: employees[0].name };
    });
  }, [employees]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || !form.manager || loading) return;
    setLoading(true);
    const message = await onAddClient(form);
    setLoading(false);
    showActionPopup(message);
    if (!message.includes('실패')) {
      setForm({ name: '', manager: employees[0]?.name || '', phone: '', region: regions[0] || '', memo: '' });
      setClientCreateOpen(false);
    }
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setEditForm({
      name: client.name,
      manager: employees.some((employee) => employee.name === client.manager) ? client.manager : employees[0]?.name || client.manager,
      phone: formatMobilePhone(client.phone),
      region: client.region || regions[0] || '',
      memo: client.memo,
    });
  };

  const saveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingClient || actionLoading) return;
    if (!editForm.name.trim() || !editForm.manager) return;
    if (!(await requestActionConfirm('업체 정보를 저장하시겠습니까?'))) return;
    setActionLoading('save');
    const message = await onUpdateClient(editingClient.id, editForm);
    setActionLoading('');
    showActionPopup(message);
    if (!message.includes('실패')) setEditingClient(null);
  };

  const removeClient = async (client: Client) => {
    if (actionLoading) return;
    if (!(await requestActionConfirm(`${client.name} 업체를 삭제하시겠습니까?`))) return;
    setActionLoading(client.id);
    const message = await onDeleteClient(client);
    setActionLoading('');
    showActionPopup(message);
  };

  const addRegion = () => {
    const nextRegion = newRegion.trim();
    if (!nextRegion || regions.includes(nextRegion)) return;
    setRegions((current) => [...current, nextRegion]);
    setForm((current) => ({ ...current, region: nextRegion }));
    setEditForm((current) => ({ ...current, region: nextRegion }));
    setNewRegion('');
  };

  const deleteRegion = (region: string) => {
    setRegions((current) => {
      const nextRegions = current.filter((item) => item !== region);
      const fallbackRegion = nextRegions[0] || '';
      setForm((formCurrent) => ({ ...formCurrent, region: formCurrent.region === region ? fallbackRegion : formCurrent.region }));
      setEditForm((editCurrent) => ({ ...editCurrent, region: editCurrent.region === region ? fallbackRegion : editCurrent.region }));
      return nextRegions;
    });
  };

  return (
    <section className="page-shell">
      <div className="page-head">
        <div>
          <p className="eyebrow">Clients</p>
          <h1>업체</h1>
        </div>
        <button className="primary-action" onClick={() => setClientCreateOpen(true)} type="button">
          <Plus size={17} />
          업체 추가
        </button>
      </div>

      <div className="page-card">
        <div className="client-grid">
          {clients.map((client) => (
            <article className="client-card" key={client.id}>
              <strong>{client.name}</strong>
              <span>담당: {client.manager}</span>
              <span>{client.phone}</span>
              <span>지역: {client.region || '미지정'}</span>
              <p>{client.memo}</p>
              <div className="client-actions">
                <button className="secondary-action" onClick={() => openEdit(client)} type="button">수정</button>
                <button className="secondary-action danger-action" disabled={actionLoading === client.id} onClick={() => removeClient(client)} type="button">
                  {actionLoading === client.id ? '진행중...' : '삭제'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
      {clientCreateOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setClientCreateOpen(false)}>
          <form className="modal-card form-stack" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">New Client</p>
                <h2>업체 추가</h2>
              </div>
              <button className="icon-button" aria-label="닫기" onClick={() => setClientCreateOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>
            <label>
              업체명
              <input autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label>
              담당자
              <select value={form.manager} onChange={(event) => setForm({ ...form, manager: event.target.value })}>
                {employees.length ? (
                  employees.map((employee) => <option key={employee.id} value={employee.name}>{employee.name}</option>)
                ) : (
                  <option value="">직원 없음</option>
                )}
              </select>
            </label>
            <label>
              전화번호
              <input
                inputMode="numeric"
                maxLength={13}
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: formatMobilePhone(event.target.value) })}
              />
            </label>
            <label>
              지역
              <RegionEditor
                regions={regions}
                selectedRegion={form.region}
                newRegion={newRegion}
                onAdd={addRegion}
                onChangeNewRegion={setNewRegion}
                onDelete={deleteRegion}
                onSelect={(region) => setForm({ ...form, region })}
              />
            </label>
            <label>
              메모
              <textarea value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} />
            </label>
            <button className="primary-action wide" disabled={loading} type="submit">
              <Plus size={17} />
              {loading ? '진행중...' : '업체 추가'}
            </button>
          </form>
        </div>
      ) : null}
      {editingClient ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setEditingClient(null)}>
          <form className="modal-card form-stack" onClick={(event) => event.stopPropagation()} onSubmit={saveEdit}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">Edit Client</p>
                <h2>업체 수정</h2>
              </div>
              <button className="icon-button" aria-label="닫기" onClick={() => setEditingClient(null)} type="button">
                <X size={18} />
              </button>
            </div>
            <label>
              업체명
              <input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
            </label>
            <label>
              담당자
              <select value={editForm.manager} onChange={(event) => setEditForm({ ...editForm, manager: event.target.value })}>
                {employees.length ? (
                  employees.map((employee) => <option key={employee.id} value={employee.name}>{employee.name}</option>)
                ) : (
                  <option value="">직원 없음</option>
                )}
              </select>
            </label>
            <label>
              전화번호
              <input
                inputMode="numeric"
                maxLength={13}
                value={editForm.phone}
                onChange={(event) => setEditForm({ ...editForm, phone: formatMobilePhone(event.target.value) })}
              />
            </label>
            <label>
              지역
              <RegionEditor
                regions={regions}
                selectedRegion={editForm.region}
                newRegion={newRegion}
                onAdd={addRegion}
                onChangeNewRegion={setNewRegion}
                onDelete={deleteRegion}
                onSelect={(region) => setEditForm({ ...editForm, region })}
              />
            </label>
            <label>
              메모
              <textarea value={editForm.memo} onChange={(event) => setEditForm({ ...editForm, memo: event.target.value })} />
            </label>
            <button className="primary-action wide" disabled={actionLoading === 'save'} type="submit">
              <CheckCircle2 size={17} />
              {actionLoading === 'save' ? '진행중...' : '저장'}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function RegionEditor({
  regions,
  selectedRegion,
  newRegion,
  onAdd,
  onChangeNewRegion,
  onDelete,
  onSelect,
}: {
  regions: string[];
  selectedRegion: string;
  newRegion: string;
  onAdd: () => void;
  onChangeNewRegion: (region: string) => void;
  onDelete: (region: string) => void;
  onSelect: (region: string) => void;
}) {
  return (
    <div className="region-editor">
      <div className="multi-picker compact">
        {regions.map((region) => (
          <span className="select-chip region-chip" data-selected={selectedRegion === region} key={region}>
            <button className="region-chip-select" onClick={() => onSelect(region)} type="button">
              {region}
            </button>
            <button
              aria-label={`${region} 삭제`}
              className="region-chip-delete"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(region);
              }}
              type="button"
            >
              x
            </button>
          </span>
        ))}
      </div>
      <div className="inline-form">
        <input value={newRegion} onChange={(event) => onChangeNewRegion(event.target.value)} placeholder="지역 추가" />
        <button className="secondary-action" onClick={onAdd} type="button">추가</button>
      </div>
    </div>
  );
}

function AvatarFileField({
  currentUrl,
  file,
  label = '프로필 사진',
  onChange,
}: {
  currentUrl?: string | null;
  file: File | null;
  label?: string;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!file && inputRef.current) inputRef.current.value = '';
  }, [file]);

  return (
    <label className="avatar-upload-field">
      {label}
      <input
        accept={AVATAR_FILE_TYPES.join(',')}
        ref={inputRef}
        type="file"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
      <small>
        {file
          ? file.name
          : currentUrl
            ? `기존 사진 유지 · JPG/PNG/WebP, ${MAX_AVATAR_FILE_SIZE_LABEL} 이하`
            : `선택된 사진 없음 · JPG/PNG/WebP, ${MAX_AVATAR_FILE_SIZE_LABEL} 이하`}
      </small>
    </label>
  );
}

function EmployeesPage({
  currentUser,
  employees,
  jobTypes,
  onAddEmployee,
  onUpdateEmployee,
}: {
  currentUser: AppUser;
  employees: Employee[];
  jobTypes: string[];
  onAddEmployee: EmployeeSubmitHandler;
  onUpdateEmployee: EmployeeUpdateHandler;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    avatarUrl: '',
    jobType: jobTypes[0] || '',
    role: '사용자' as Employee['role'],
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    jobType: jobTypes[0] || '',
    role: '사용자' as Employee['role'],
    avatarUrl: '',
    password: '',
    passwordConfirm: '',
  });
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const openEdit = (employee: Employee) => {
    setError('');
    setEditingEmployee(employee);
    setEditAvatarFile(null);
    setEditForm({
      name: employee.name,
      phone: formatMobilePhone(employee.phone),
      avatarUrl: employee.avatarUrl || '',
      jobType: employee.jobType,
      role: employee.role,
      password: '',
      passwordConfirm: '',
    });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    setError('');

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호 확인이 맞지 않습니다.');
      return;
    }

    if (!hasValidMobilePhoneLength(form.phone)) {
      setError('전화번호는 숫자 11자리로 입력해주세요.');
      return;
    }

    setLoading(true);
    let avatarUrl = form.avatarUrl || null;
    if (avatarFile) {
      const uploadedAvatar = await uploadAvatarImage(currentUser.id, avatarFile);
      if (uploadedAvatar.error) {
        setLoading(false);
        setError(uploadedAvatar.error);
        return;
      }
      avatarUrl = uploadedAvatar.url;
    }
    const message = await onAddEmployee({
      name: form.name || form.email.split('@')[0],
      email: form.email,
      password: form.password,
      phone: form.phone,
      avatarUrl,
      jobType: form.jobType,
      role: form.role,
    });
    setLoading(false);
    showActionPopup(message);
    if (!message.includes('실패')) {
      setForm({ name: '', email: '', password: '', passwordConfirm: '', phone: '', avatarUrl: '', jobType: jobTypes[0] || '', role: '사용자' });
      setAvatarFile(null);
    }
  };

  const submitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (editLoading) return;
    setError('');
    if (!editingEmployee) return;

    if (editForm.password && editForm.password !== editForm.passwordConfirm) {
      setError('비밀번호 확인이 맞지 않습니다.');
      return;
    }

    if (!hasValidMobilePhoneLength(editForm.phone)) {
      setError('전화번호는 숫자 11자리로 입력해주세요.');
      return;
    }

    setEditLoading(true);
    let avatarUrl = editForm.avatarUrl || null;
    if (editAvatarFile) {
      const uploadedAvatar = await uploadAvatarImage(currentUser.id, editAvatarFile);
      if (uploadedAvatar.error) {
        setEditLoading(false);
        setError(uploadedAvatar.error);
        return;
      }
      avatarUrl = uploadedAvatar.url;
    }
    const message = await onUpdateEmployee(editingEmployee.id, {
      name: editForm.name,
      phone: editForm.phone,
      avatarUrl,
      jobType: editForm.jobType,
      role: editForm.role,
      password: editForm.password || undefined,
    });
    setEditLoading(false);
    showActionPopup(message);
    if (!message.includes('실패')) {
      setEditingEmployee(null);
      setEditAvatarFile(null);
    }
  };

  return (
    <section className="page-shell">
      <div className="page-head">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>직원 관리</h1>
        </div>
      </div>

      <div className="split-layout wide-left">
        <div className="page-card">
          <div className="table-list">
            {employees.map((employee) => (
              <div className="table-row employee-row" key={employee.id}>
                <div className="employee-identity">
                  <Avatar name={employee.name} src={employee.avatarUrl} size="sm" />
                  <div>
                    <strong>{employee.name}</strong>
                    <span>{employee.email}</span>
                  </div>
                </div>
                <span>{employee.jobType}</span>
                <span>{employee.role}</span>
                <small>{employee.load}건</small>
                <button className="secondary-action" onClick={() => openEdit(employee)} type="button">
                  수정
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-forms">
          <form className="page-card form-stack" onSubmit={submit}>
          <div>
            <p className="eyebrow">Create User</p>
            <h2>계정 생성 폼</h2>
          </div>
          <p className="admin-note">관리자만 사용자 계정을 생성할 수 있습니다. 초기 비밀번호는 로그인 후 변경하도록 안내하세요.</p>
          <label>
            이름
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <AvatarFileField currentUrl={form.avatarUrl} file={avatarFile} onChange={setAvatarFile} />
          <label>
            이메일
            <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label>
            비밀번호
            <input required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          </label>
          <label>
            비밀번호 확인
            <input required type="password" value={form.passwordConfirm} onChange={(event) => setForm({ ...form, passwordConfirm: event.target.value })} />
          </label>
          <label>
            담당업무
            <select value={form.jobType} onChange={(event) => setForm({ ...form, jobType: event.target.value })}>
              {jobTypes.map((jobType) => <option key={jobType}>{jobType}</option>)}
            </select>
          </label>
          <label>
            전화번호
            <input
              inputMode="numeric"
              maxLength={13}
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: formatMobilePhone(event.target.value) })}
            />
          </label>
          <label>
            권한
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Employee['role'] })}>
              <option>관리자</option>
              <option>사용자</option>
            </select>
          </label>
          {error ? <p className="auth-error">{error}</p> : null}
          <button className="primary-action wide" disabled={loading} type="submit">
            <Plus size={17} />
            {loading ? '진행중...' : '계정 추가'}
          </button>
          </form>
        </div>
      </div>

      {editingEmployee ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setEditingEmployee(null)}>
          <form className="modal-card form-stack" onClick={(event) => event.stopPropagation()} onSubmit={submitEdit}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">Edit User</p>
                <h2>직원 정보 수정</h2>
              </div>
              <button className="icon-button" aria-label="닫기" onClick={() => setEditingEmployee(null)} type="button">
                <X size={18} />
              </button>
            </div>
            <label>
              이름
              <input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
            </label>
            <label>
              전화번호
              <input
                inputMode="numeric"
                maxLength={13}
                value={editForm.phone}
                onChange={(event) => setEditForm({ ...editForm, phone: formatMobilePhone(event.target.value) })}
              />
            </label>
            <AvatarFileField currentUrl={editForm.avatarUrl} file={editAvatarFile} onChange={setEditAvatarFile} />
            <label>
              새 비밀번호
              <input
                autoComplete="new-password"
                type="password"
                value={editForm.password}
                onChange={(event) => setEditForm({ ...editForm, password: event.target.value })}
              />
            </label>
            <label>
              새 비밀번호 확인
              <input
                autoComplete="new-password"
                type="password"
                value={editForm.passwordConfirm}
                onChange={(event) => setEditForm({ ...editForm, passwordConfirm: event.target.value })}
              />
            </label>
            <label>
              담당업무
              <select value={editForm.jobType} onChange={(event) => setEditForm({ ...editForm, jobType: event.target.value })}>
                {jobTypes.map((jobType) => <option key={jobType}>{jobType}</option>)}
              </select>
            </label>
            <label>
              권한
              <select value={editForm.role} onChange={(event) => setEditForm({ ...editForm, role: event.target.value as Employee['role'] })}>
                <option>관리자</option>
                <option>사용자</option>
              </select>
            </label>
            {error ? <p className="auth-error">{error}</p> : null}
            <button className="primary-action wide" disabled={editLoading} type="submit">
              <CheckCircle2 size={17} />
              {editLoading ? '진행중...' : '정보 저장'}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function JobTypesPage({
  employees,
  jobTypes,
  onAddJobType,
}: {
  employees: Employee[];
  jobTypes: string[];
  onAddJobType: JobTypeSubmitHandler;
}) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || loading) return;
    setLoading(true);
    const message = await onAddJobType(name.trim());
    setLoading(false);
    showActionPopup(message);
    if (!message.includes('실패')) setName('');
  };

  return (
    <section className="page-shell">
      <div className="page-head">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>담당업무 관리</h1>
        </div>
      </div>

      <div className="split-layout">
        <div className="page-card job-type-list">
          {jobTypes.map((jobType) => {
            const assignedEmployees = employees.filter((employee) => employee.jobType === jobType);

            return (
              <article className="job-type-card" key={jobType}>
                <div className="job-type-head">
                  <strong>{jobType}</strong>
                  <small>{assignedEmployees.length}명</small>
                </div>
                <div className="job-type-members">
                  {assignedEmployees.length ? (
                    assignedEmployees.map((employee) => (
                      <div className="member-chip" key={employee.id}>
                        <span>{employee.name}</span>
                        <small>{employee.role}</small>
                      </div>
                    ))
                  ) : (
                    <p>배정된 직원이 없습니다.</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        <form className="page-card form-stack" onSubmit={submit}>
          <div>
            <p className="eyebrow">Job Type</p>
            <h2>항목 추가</h2>
          </div>
          <label>
            담당업무명
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <button className="primary-action wide" disabled={loading} type="submit">
            <Plus size={17} />
            {loading ? '진행중...' : '추가'}
          </button>
        </form>
      </div>
    </section>
  );
}

function ProfileModal({
  currentUser,
  employees,
  jobTypes,
  onClose,
  onUpdateOwnProfile,
}: {
  currentUser: AppUser;
  employees: Employee[];
  jobTypes: string[];
  onClose: () => void;
  onUpdateOwnProfile: (updates: OwnProfileUpdate) => Promise<string>;
}) {
  const currentEmployee = employees.find((employee) => employee.id === currentUser.id);
  const [profileForm, setProfileForm] = useState({
    name: currentEmployee?.name || currentUser.name,
    phone: formatMobilePhone(currentEmployee?.phone || ''),
    avatarUrl: currentEmployee?.avatarUrl || currentUser.avatarUrl || '',
    jobType: currentEmployee?.jobType || currentUser.role,
    password: '',
    passwordConfirm: '',
  });
  const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(null);
  const [profileStatus, setProfileStatus] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    setProfileForm({
      name: currentEmployee?.name || currentUser.name,
      phone: formatMobilePhone(currentEmployee?.phone || ''),
      avatarUrl: currentEmployee?.avatarUrl || currentUser.avatarUrl || '',
      jobType: currentEmployee?.jobType || currentUser.role,
      password: '',
      passwordConfirm: '',
    });
    setProfileAvatarFile(null);
  }, [currentEmployee?.id, currentEmployee?.name, currentEmployee?.phone, currentEmployee?.avatarUrl, currentEmployee?.jobType, currentUser.name, currentUser.avatarUrl, currentUser.role]);

  const submitProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (profileLoading) return;
    if (!hasValidMobilePhoneLength(profileForm.phone)) {
      setProfileStatus('전화번호는 숫자 11자리로 입력해주세요.');
      return;
    }
    if (profileForm.password && profileForm.password !== profileForm.passwordConfirm) {
      setProfileStatus('비밀번호 확인이 맞지 않습니다.');
      return;
    }
    setProfileLoading(true);
    let avatarUrl = profileForm.avatarUrl || null;
    if (profileAvatarFile) {
      const uploadedAvatar = await uploadAvatarImage(currentUser.id, profileAvatarFile);
      if (uploadedAvatar.error) {
        setProfileLoading(false);
        setProfileStatus(uploadedAvatar.error);
        return;
      }
      avatarUrl = uploadedAvatar.url;
    }
    const message = await onUpdateOwnProfile({
      name: profileForm.name,
      phone: profileForm.phone,
      avatarUrl,
      jobType: profileForm.jobType,
      password: profileForm.password || undefined,
    });
    setProfileLoading(false);
    setProfileStatus(message);
    showActionPopup(message);
    setProfileForm((current) => ({ ...current, password: '', passwordConfirm: '' }));
    if (!message.includes('실패')) setProfileAvatarFile(null);
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <form className="modal-card form-stack" onClick={(event) => event.stopPropagation()} onSubmit={submitProfile}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">My Profile</p>
            <h2>내 정보 수정</h2>
          </div>
          <button className="icon-button" aria-label="닫기" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <label>
          이름
          <input value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} />
        </label>
        <label>
          전화번호
          <input
            inputMode="numeric"
            maxLength={13}
            value={profileForm.phone}
            onChange={(event) => setProfileForm({ ...profileForm, phone: formatMobilePhone(event.target.value) })}
          />
        </label>
        <AvatarFileField currentUrl={profileForm.avatarUrl} file={profileAvatarFile} onChange={setProfileAvatarFile} />
        <label>
          담당업무
          <select value={profileForm.jobType} onChange={(event) => setProfileForm({ ...profileForm, jobType: event.target.value })}>
            {jobTypes.map((jobType) => <option key={jobType}>{jobType}</option>)}
          </select>
        </label>
        <label>
          새 비밀번호
          <input
            autoComplete="new-password"
            type="password"
            value={profileForm.password}
            onChange={(event) => setProfileForm({ ...profileForm, password: event.target.value })}
          />
        </label>
        <label>
          새 비밀번호 확인
          <input
            autoComplete="new-password"
            type="password"
            value={profileForm.passwordConfirm}
            onChange={(event) => setProfileForm({ ...profileForm, passwordConfirm: event.target.value })}
          />
        </label>
        {profileStatus ? <p className="admin-note">{profileStatus}</p> : null}
        <button className="primary-action wide" disabled={profileLoading} type="submit">
          <CheckCircle2 size={17} />
          {profileLoading ? '진행중...' : '내 정보 저장'}
        </button>
      </form>
    </div>
  );
}

function OperationsPage({
  items,
  employees,
  onAddOperation,
  onUpdateOperation,
  onDeleteOperation,
  onCompleteOperation,
}: {
  items: OperationItem[];
  employees: Employee[];
  onAddOperation: (draft: OperationDraft) => Promise<string>;
  onUpdateOperation: (operationId: string, draft: OperationDraft) => Promise<string>;
  onDeleteOperation: (operationId: string) => Promise<string>;
  onCompleteOperation: (operationId: string) => Promise<string>;
}) {
  const createDraft = (): OperationDraft => ({
    title: '',
    category: '서버',
    provider: '',
    amount: 0,
    dueDate: formatDateInputValue(new Date()),
    frequency: '매월',
    assigneeId: employees[0]?.id || '',
    reminders: [7, 1, 0],
    memo: '',
    link: '',
    active: true,
    lastCompletedAt: null,
  });

  const [filter, setFilter] = useState<OperationFilter>('전체');
  const [editingItem, setEditingItem] = useState<OperationItem | null>(null);
  const [form, setForm] = useState<OperationDraft>(createDraft);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm((current) => {
      if (employees.some((employee) => employee.id === current.assigneeId)) return current;
      return { ...current, assigneeId: employees[0]?.id || '' };
    });
  }, [employees]);

  const sortedItems = useMemo(() => sortOperationsByDueDate(items), [items]);
  const filteredItems = useMemo(() => sortedItems.filter((item) => matchesOperationFilter(item, filter)), [filter, sortedItems]);
  const urgentItems = useMemo(
    () =>
      sortedItems.filter((item) => {
        const status = getOperationStatus(item);
        return status === '오늘' || status === '임박';
      }),
    [sortedItems],
  );

  const summary = {
    today: items.filter((item) => getOperationStatus(item) === '오늘').length,
    dueSoon: items.filter((item) => {
      const days = getOperationDaysLeft(item.dueDate);
      return getOperationStatus(item) !== '완료' && getOperationStatus(item) !== '보류' && days !== null && days <= 7;
    }).length,
    pending: items.filter((item) => {
      const status = getOperationStatus(item);
      return status !== '완료' && status !== '보류';
    }).length,
    monthAmount: items
      .filter((item) => {
        const dueDate = parseOperationDate(item.dueDate);
        const now = new Date();
        return dueDate && dueDate.getFullYear() === now.getFullYear() && dueDate.getMonth() === now.getMonth() && getOperationStatus(item) !== '보류';
      })
      .reduce((total, item) => total + item.amount, 0),
  };

  const openCreate = () => {
    setEditingItem(null);
    setError('');
    setForm({
      ...createDraft(),
      assigneeId: employees[0]?.id || '',
    });
    setFormOpen(true);
  };

  const openEdit = (item: OperationItem) => {
    setEditingItem(item);
    setError('');
    setForm({
      title: item.title,
      category: item.category,
      provider: item.provider,
      amount: item.amount,
      dueDate: item.dueDate,
      frequency: item.frequency,
      assigneeId: item.assigneeId,
      reminders: item.reminders,
      memo: item.memo,
      link: item.link,
      active: item.active,
      lastCompletedAt: item.lastCompletedAt || null,
    });
    setFormOpen(true);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    if (!form.title.trim() || !form.provider.trim() || !form.dueDate || !form.assigneeId) {
      setError('항목명, 서비스명, 기준일, 담당자를 입력해주세요.');
      return;
    }

    setLoading(true);
    const message = editingItem ? await onUpdateOperation(editingItem.id, form) : await onAddOperation(form);
    setLoading(false);
    setError(message.includes('실패') ? message : '');
    showActionPopup(message);
    if (!message.includes('실패')) setFormOpen(false);
  };

  const completeItem = async (item: OperationItem) => {
    if (!(await requestActionConfirm(`${item.title} 항목을 완료 처리할까요?`))) return;
    const message = await onCompleteOperation(item.id);
    showActionPopup(message);
  };

  const removeItem = async (item: OperationItem) => {
    if (!(await requestActionConfirm(`${item.title} 항목을 삭제할까요?`))) return;
    const message = await onDeleteOperation(item.id);
    showActionPopup(message);
  };

  return (
    <section className="page-shell">
      <div className="page-head">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>구독/정산관리</h1>
        </div>
        <button className="primary-action" onClick={openCreate} type="button">
          <Plus size={17} />
          항목 추가
        </button>
      </div>

      <section className="stats-grid" aria-label="구독/정산관리 요약">
        <button className="stat-card" data-tone="red" onClick={() => setFilter('오늘')} type="button">
          <span>오늘 처리</span>
          <strong>{summary.today}</strong>
          <small>당일 확인 필요</small>
        </button>
        <button className="stat-card" data-tone="amber" onClick={() => setFilter('7일 이내')} type="button">
          <span>7일 이내</span>
          <strong>{summary.dueSoon}</strong>
          <small>결제/만료 임박</small>
        </button>
        <button className="stat-card" data-tone="blue" onClick={() => setFilter('미완료')} type="button">
          <span>미완료</span>
          <strong>{summary.pending}</strong>
          <small>활성 항목 기준</small>
        </button>
        <button className="stat-card" data-tone="green" onClick={() => setFilter('이번달')} type="button">
          <span>이번달 예정액</span>
          <strong>{new Intl.NumberFormat('ko-KR').format(summary.monthAmount)}</strong>
          <small>원화 합계</small>
        </button>
      </section>

      <div className="page-card operations-urgent-panel">
        <div className="section-head tight">
          <div>
            <p className="eyebrow">Urgent</p>
            <h2>오늘 / 임박 항목</h2>
          </div>
          <small>{urgentItems.length}건</small>
        </div>
        <div className="operations-urgent-list">
          {urgentItems.length ? (
            urgentItems.slice(0, 6).map((item) => {
              const assignee = resolveOperationAssignee(item, employees);
              return (
                <div className="operations-urgent-card" key={item.id}>
                  <div className="operations-badges">
                    <span className="operation-category" data-category={item.category}>{item.category}</span>
                    <span className="operation-status" data-status={getOperationStatus(item)}>{getOperationStatus(item)}</span>
                  </div>
                  <strong>{item.title}</strong>
                  <span>{item.provider}</span>
                  <small>{formatOperationDueDate(item.dueDate)} · {assignee?.name || '담당자 미지정'}</small>
                </div>
              );
            })
          ) : (
            <p className="mini-empty">지금 바로 확인할 운영 항목이 없습니다.</p>
          )}
        </div>
      </div>

      <div className="page-card">
        <div className="page-head operations-table-head">
          <div>
            <p className="eyebrow">Overview</p>
            <h2>전체 항목</h2>
          </div>
          <div className="filters">
            {(['전체', '오늘', '7일 이내', '이번달', '미완료'] as OperationFilter[]).map((item) => (
              <button data-active={filter === item} key={item} onClick={() => setFilter(item)} type="button">
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="operations-table-columns" aria-hidden="true">
          <span>항목</span>
          <span>기준일</span>
          <span>금액 / 담당</span>
          <span>알림 시점</span>
          <span>작업</span>
        </div>

        <div className="table-list">
          {filteredItems.length ? (
            filteredItems.map((item) => {
              const assignee = resolveOperationAssignee(item, employees);
              const days = getOperationDaysLeft(item.dueDate);
              return (
                <div className="table-row operations-row" key={item.id}>
                  <div className="operations-cell operations-cell-main">
                    <div className="operations-badges operations-table-badges">
                      <span className="operation-category-table" data-category={item.category}>
                        <span>{item.category}</span>
                      </span>
                      <span className="operation-status-table" data-status={getOperationStatus(item)}>
                        <span>{getOperationStatus(item)}</span>
                      </span>
                    </div>
                    <strong>{item.title}</strong>
                    <span className="operation-provider">{item.provider}</span>
                    {item.memo ? <small className="operation-inline-note">{item.memo}</small> : null}
                  </div>
                  <div className="operations-cell operations-cell-date">
                    <strong>{formatOperationDueDate(item.dueDate)}</strong>
                    <span className="operation-meta">{item.frequency}</span>
                    <span className="operation-meta">{days === null ? '미정' : days < 0 ? `${Math.abs(days)}일 지남` : days === 0 ? '오늘' : `${days}일 남음`}</span>
                  </div>
                  <div className="operations-cell operations-cell-amount">
                    <strong>{formatOperationAmount(item.amount)}</strong>
                    <span className="operation-meta">{assignee?.name || '담당자 미지정'}</span>
                  </div>
                  <div className="operations-cell operations-reminders-wrap">
                    <div className="operations-reminders">
                    {item.reminders.map((reminder) => (
                      <span className="reminder-chip" key={`${item.id}-${reminder}`}>{getOperationReminderLabel(reminder)}</span>
                    ))}
                    </div>
                  </div>
                  <div className="operations-cell operations-actions-wrap">
                    <div className="operations-actions">
                    <button className="secondary-action" onClick={() => completeItem(item)} type="button">
                      완료
                    </button>
                    <button className="secondary-action" onClick={() => openEdit(item)} type="button">
                      수정
                    </button>
                    <button className="secondary-action danger-action" onClick={() => removeItem(item)} type="button">
                      삭제
                    </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="mini-empty">조건에 맞는 운영 항목이 없습니다.</p>
          )}
        </div>
      </div>

      {formOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setFormOpen(false)}>
          <form className="modal-card form-stack operations-form" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">{editingItem ? 'Edit Operation' : 'New Operation'}</p>
                <h2>{editingItem ? '운영 항목 수정' : '운영 항목 추가'}</h2>
              </div>
              <button className="icon-button" aria-label="닫기" onClick={() => setFormOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>
            <label>
              항목명
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </label>
            <label>
              카테고리
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as OperationCategory })}>
                {operationCategories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <label>
              서비스/업체명
              <input value={form.provider} onChange={(event) => setForm({ ...form, provider: event.target.value })} />
            </label>
            <label>
              금액
              <input inputMode="numeric" value={String(form.amount || '')} onChange={(event) => setForm({ ...form, amount: Number(event.target.value.replace(/[^\d]/g, '')) || 0 })} />
            </label>
            <label>
              기준일
              <input type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
            </label>
            <label>
              반복주기
              <select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value as OperationFrequency })}>
                {operationFrequencies.map((frequency) => <option key={frequency}>{frequency}</option>)}
              </select>
            </label>
            <label>
              담당자
              <select value={form.assigneeId} onChange={(event) => setForm({ ...form, assigneeId: event.target.value })}>
                {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
              </select>
            </label>
            <label className="span-2">
              알림 시점
              <div className="multi-picker compact">
                {operationReminderOptions.map((reminder) => (
                  <button
                    className="select-chip"
                    data-selected={form.reminders.includes(reminder)}
                    key={reminder}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        reminders: current.reminders.includes(reminder)
                          ? current.reminders.filter((item) => item !== reminder)
                          : [...current.reminders, reminder].sort((first, second) => second - first) as Array<0 | 1 | 3 | 7>,
                      }))
                    }
                    type="button"
                  >
                    {getOperationReminderLabel(reminder)}
                  </button>
                ))}
              </div>
            </label>
            <label className="span-2">
              메모
              <textarea value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} />
            </label>
            <label className="span-2">
              관련 링크
              <input placeholder="https://..." value={form.link} onChange={(event) => setForm({ ...form, link: event.target.value })} />
            </label>
            <label className="checkbox-row">
              <input checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} type="checkbox" />
              <span>활성 항목으로 사용</span>
            </label>
            <p className="admin-note">현재는 이 브라우저 로컬 저장으로만 관리됩니다. 나중에 Supabase 테이블과 푸시 스케줄러를 붙이면 기기 간 동기화와 알림 자동화를 붙일 수 있습니다.</p>
            {error ? <p className="auth-error">{error}</p> : null}
            <button className="primary-action wide" disabled={loading} type="submit">
              <CheckCircle2 size={17} />
              {loading ? '진행중...' : editingItem ? '저장' : '추가'}
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

function SettingsPage({
  backendStatus,
  currentUser,
  employees,
  googleCalendarSettings,
  jobTypes,
  taskTypes,
  pushEnabled,
  pushLoading,
  pushPreferences,
  pushStatus,
  installStatus,
  appInstalled,
  canPromptInstall,
  themeMode,
  onRegisterPush,
  onInstallApp,
  onAddJobType,
  onDeleteJobType,
  onAddTaskType,
  onDeleteTaskType,
  onSaveGoogleCalendarSettings,
  onUpdatePushPreferences,
  onUpdateOwnProfile,
  onThemeChange,
}: {
  backendStatus: string;
  currentUser: AppUser;
  employees: Employee[];
  googleCalendarSettings: GoogleCalendarSettings;
  jobTypes: string[];
  taskTypes: string[];
  pushEnabled: boolean;
  pushLoading: boolean;
  pushPreferences: PushPreferences;
  pushStatus: string;
  installStatus: string;
  appInstalled: boolean;
  canPromptInstall: boolean;
  themeMode: ThemeMode;
  onRegisterPush: () => void;
  onInstallApp: () => void;
  onAddJobType: JobTypeSubmitHandler;
  onDeleteJobType: JobTypeDeleteHandler;
  onAddTaskType: TaskTypeSubmitHandler;
  onDeleteTaskType: TaskTypeDeleteHandler;
  onSaveGoogleCalendarSettings: GoogleCalendarSettingsHandler;
  onUpdatePushPreferences: PushPreferencesUpdateHandler;
  onUpdateOwnProfile: (updates: OwnProfileUpdate) => Promise<string>;
  onThemeChange: (mode: ThemeMode) => void;
}) {
  const currentEmployee = employees.find((employee) => employee.id === currentUser.id);
  const [profileForm, setProfileForm] = useState({
    name: currentEmployee?.name || currentUser.name,
    phone: formatMobilePhone(currentEmployee?.phone || ''),
    avatarUrl: currentEmployee?.avatarUrl || currentUser.avatarUrl || '',
    jobType: currentEmployee?.jobType || currentUser.role,
    password: '',
    passwordConfirm: '',
  });
  const [profileAvatarFile, setProfileAvatarFile] = useState<File | null>(null);
  const [profileStatus, setProfileStatus] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [jobTypeOpen, setJobTypeOpen] = useState(false);
  const [taskTypeOpen, setTaskTypeOpen] = useState(false);
  const [googleForm, setGoogleForm] = useState<GoogleCalendarSettings>(googleCalendarSettings);
  const [googleStatus, setGoogleStatus] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pushPreferencesLoading, setPushPreferencesLoading] = useState(false);

  useEffect(() => {
    setProfileForm({
      name: currentEmployee?.name || currentUser.name,
      phone: formatMobilePhone(currentEmployee?.phone || ''),
      avatarUrl: currentEmployee?.avatarUrl || currentUser.avatarUrl || '',
      jobType: currentEmployee?.jobType || currentUser.role,
      password: '',
      passwordConfirm: '',
    });
    setProfileAvatarFile(null);
  }, [currentEmployee?.id, currentEmployee?.name, currentEmployee?.phone, currentEmployee?.avatarUrl, currentEmployee?.jobType, currentUser.name, currentUser.avatarUrl, currentUser.role]);

  useEffect(() => {
    setGoogleForm(googleCalendarSettings);
  }, [googleCalendarSettings]);

  const submitProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (profileLoading) return;
    if (!hasValidMobilePhoneLength(profileForm.phone)) {
      setProfileStatus('전화번호는 숫자 11자리로 입력해주세요.');
      return;
    }
    if (profileForm.password && profileForm.password !== profileForm.passwordConfirm) {
      setProfileStatus('비밀번호 확인이 맞지 않습니다.');
      return;
    }
    setProfileLoading(true);
    let avatarUrl = profileForm.avatarUrl || null;
    if (profileAvatarFile) {
      const uploadedAvatar = await uploadAvatarImage(currentUser.id, profileAvatarFile);
      if (uploadedAvatar.error) {
        setProfileLoading(false);
        setProfileStatus(uploadedAvatar.error);
        return;
      }
      avatarUrl = uploadedAvatar.url;
    }
    const message = await onUpdateOwnProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        avatarUrl,
        jobType: profileForm.jobType,
        password: profileForm.password || undefined,
      });
    setProfileLoading(false);
    setProfileStatus(message);
    showActionPopup(message);
    setProfileForm((current) => ({ ...current, password: '', passwordConfirm: '' }));
    if (!message.includes('실패')) setProfileAvatarFile(null);
  };
  const submitGoogleCalendarSettings = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (googleLoading) return;
    setGoogleLoading(true);
    const message = await onSaveGoogleCalendarSettings(googleForm);
    setGoogleLoading(false);
    setGoogleStatus(message);
    showActionPopup(message);
  };
  const changePushPreference = async (key: keyof PushPreferences, enabled: boolean) => {
    if (pushPreferencesLoading) return;
    setPushPreferencesLoading(true);
    const message = await onUpdatePushPreferences({ ...pushPreferences, [key]: enabled });
    setPushPreferencesLoading(false);
    showActionPopup(message);
  };

  return (
    <section className="page-shell">
      <div className="page-head">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>설정</h1>
        </div>
      </div>

      <div className="settings-layout">
        <div className="settings-side">
          <div className="page-card settings-card">
            <h2>테마</h2>
            <p>업무 영역은 라이트/다크/시스템 설정을 따르고, 사이드바는 Plander 블랙을 유지합니다.</p>
            <ThemeSwitcher value={themeMode} onChange={onThemeChange} />
          </div>
          <div className="page-card settings-card">
            <h2>앱 설치</h2>
            <p>{installStatus}</p>
            <button className="primary-action" disabled={appInstalled && !canPromptInstall} onClick={onInstallApp} type="button">
              <Plus size={17} />
              {appInstalled ? '설치 완료' : canPromptInstall ? '이 기기에 설치' : '설치 안내'}
            </button>
            <p className="admin-note">맥/윈도우/안드로이드 Chrome·Edge는 설치 버튼이 뜨고, iPhone Safari는 공유 버튼에서 “홈 화면에 추가”로 설치합니다.</p>
          </div>
          <div className="page-card settings-card">
            <h2>푸시알림</h2>
            <p>{pushStatus}</p>
            <button className="primary-action" disabled={pushLoading} onClick={onRegisterPush} type="button">
              <Bell size={17} />
              {pushLoading ? '진행중...' : pushEnabled ? '이 기기 알림 끄기' : '이 기기 알림 켜기'}
            </button>
            <div className="push-preference-list">
              {[
                { key: 'task' as const, label: '업무전달' },
                { key: 'report' as const, label: '보고·제안' },
                { key: 'projectMessage' as const, label: '채팅창 메시지' },
              ].map((item) => (
                <label className="toggle-row" key={item.key}>
                  <span>{item.label}</span>
                  <input
                    checked={pushPreferences[item.key]}
                    disabled={pushPreferencesLoading}
                    onChange={(event) => changePushPreference(item.key, event.target.checked)}
                    type="checkbox"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
        <form className="page-card settings-card google-calendar-settings" onSubmit={submitGoogleCalendarSettings}>
          <h2>Google Calendar</h2>
          <p>서비스 계정으로 회사 공용 캘린더에 스케줄을 내보냅니다. Google 로그인창은 뜨지 않습니다.</p>
          <label>
            Calendar ID
            <input
              inputMode="text"
              placeholder="xxxxx@group.calendar.google.com"
              value={googleForm.calendarId}
              onChange={(event) => setGoogleForm((current) => ({ ...current, calendarId: event.target.value }))}
            />
          </label>
          {googleStatus ? <p className="admin-note">{googleStatus}</p> : null}
          <button className="primary-action" disabled={googleLoading} type="submit">
            <CheckCircle2 size={17} />
            {googleLoading ? '진행중...' : 'Google 설정 저장'}
          </button>
        </form>
        <div className="page-card settings-card">
          <h2>관리</h2>
          <div className="settings-shortcuts">
            <button className="secondary-action" onClick={() => setProfileOpen(true)} type="button">내 정보 수정</button>
            <button className="secondary-action" onClick={() => setJobTypeOpen(true)} type="button">담당업무 관리</button>
            <button className="secondary-action" onClick={() => setTaskTypeOpen(true)} type="button">업무유형 추가/삭제</button>
          </div>
        </div>
        <div className="page-card settings-card settings-backend">
          <h2>백엔드</h2>
          <p>{backendStatus}</p>
        </div>
      </div>
      {profileOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setProfileOpen(false)}>
          <form className="modal-card form-stack" onClick={(event) => event.stopPropagation()} onSubmit={submitProfile}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">My Profile</p>
                <h2>내 정보 수정</h2>
              </div>
              <button className="icon-button" aria-label="닫기" onClick={() => setProfileOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>
            <label>
              이름
              <input value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} />
            </label>
            <label>
              전화번호
              <input
                inputMode="numeric"
                maxLength={13}
                value={profileForm.phone}
                onChange={(event) => setProfileForm({ ...profileForm, phone: formatMobilePhone(event.target.value) })}
              />
            </label>
            <AvatarFileField currentUrl={profileForm.avatarUrl} file={profileAvatarFile} onChange={setProfileAvatarFile} />
            <label>
              담당업무
              <select value={profileForm.jobType} onChange={(event) => setProfileForm({ ...profileForm, jobType: event.target.value })}>
                {jobTypes.map((jobType) => <option key={jobType}>{jobType}</option>)}
              </select>
            </label>
            <label>
              새 비밀번호
              <input
                autoComplete="new-password"
                type="password"
                value={profileForm.password}
                onChange={(event) => setProfileForm({ ...profileForm, password: event.target.value })}
              />
            </label>
            <label>
              새 비밀번호 확인
              <input
                autoComplete="new-password"
                type="password"
                value={profileForm.passwordConfirm}
                onChange={(event) => setProfileForm({ ...profileForm, passwordConfirm: event.target.value })}
              />
            </label>
            {profileStatus ? <p className="admin-note">{profileStatus}</p> : null}
            <button className="primary-action wide" disabled={profileLoading} type="submit">
              <CheckCircle2 size={17} />
              {profileLoading ? '진행중...' : '내 정보 저장'}
            </button>
          </form>
        </div>
      ) : null}
      {jobTypeOpen ? (
        <JobTypeModal
          employees={employees}
          jobTypes={jobTypes}
          onAddJobType={onAddJobType}
          onClose={() => setJobTypeOpen(false)}
          onDeleteJobType={onDeleteJobType}
        />
      ) : null}
      {taskTypeOpen ? (
        <SimpleTypeModal
          items={taskTypes}
          title="업무유형 관리"
          eyebrow="Task Type"
          addLabel="업무유형명"
          onAdd={onAddTaskType}
          onClose={() => setTaskTypeOpen(false)}
          onDelete={onDeleteTaskType}
        />
      ) : null}
    </section>
  );
}

function JobTypeModal({
  employees,
  jobTypes,
  onAddJobType,
  onDeleteJobType,
  onClose,
}: {
  employees: Employee[];
  jobTypes: string[];
  onAddJobType: JobTypeSubmitHandler;
  onDeleteJobType: JobTypeDeleteHandler;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [loadingName, setLoadingName] = useState('');

  const add = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || loadingName) return;
    setLoadingName('add');
    const message = await onAddJobType(name.trim());
    setLoadingName('');
    showActionPopup(message);
    if (!message.includes('실패')) setName('');
  };

  const remove = async (jobType: string) => {
    if (loadingName) return;
    if (!(await requestActionConfirm(`${jobType} 담당업무를 삭제할까요?`))) return;
    setLoadingName(jobType);
    const message = await onDeleteJobType(jobType);
    setLoadingName('');
    showActionPopup(message);
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <article className="modal-card form-stack" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">Job Type</p>
            <h2>담당업무 관리</h2>
          </div>
          <button className="icon-button" aria-label="닫기" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="job-type-list compact-list">
          {jobTypes.map((jobType) => {
            const assignedEmployees = employees.filter((employee) => employee.jobType === jobType);
            return (
              <article className="job-type-card" draggable key={jobType}>
                <div className="job-type-head">
                  <strong>{jobType}</strong>
                  <small>{assignedEmployees.length}명</small>
                </div>
                <div className="job-type-members">
                  {assignedEmployees.length ? assignedEmployees.map((employee) => <span className="member-chip" key={employee.id}>{employee.name}</span>) : <p>배정된 직원이 없습니다.</p>}
                </div>
                <button className="secondary-action danger-action" disabled={loadingName === jobType} onClick={() => remove(jobType)} type="button">
                  {loadingName === jobType ? '진행중...' : '삭제'}
                </button>
              </article>
            );
          })}
        </div>
        <form className="form-stack" onSubmit={add}>
          <label>
            담당업무명
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <button className="primary-action wide" disabled={Boolean(loadingName)} type="submit">
            <Plus size={17} />
            {loadingName === 'add' ? '진행중...' : '추가'}
          </button>
        </form>
      </article>
    </div>
  );
}

function SimpleTypeModal({
  items,
  title,
  eyebrow,
  addLabel,
  onAdd,
  onDelete,
  onClose,
}: {
  items: string[];
  title: string;
  eyebrow: string;
  addLabel: string;
  onAdd: (name: string) => Promise<string>;
  onDelete: (name: string) => Promise<string>;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [loadingName, setLoadingName] = useState('');

  const add = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || loadingName) return;
    setLoadingName('add');
    const message = await onAdd(name.trim());
    setLoadingName('');
    showActionPopup(message);
    if (!message.includes('실패')) setName('');
  };

  const remove = async (item: string) => {
    if (loadingName) return;
    if (!(await requestActionConfirm(`${item} 항목을 삭제할까요?`))) return;
    setLoadingName(item);
    const message = await onDelete(item);
    setLoadingName('');
    showActionPopup(message);
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <article className="modal-card form-stack" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" aria-label="닫기" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="type-chip-list">
          {items.map((item) => (
            <div className="type-row" key={item}>
              <span>{item}</span>
              <button className="secondary-action danger-action" disabled={loadingName === item} onClick={() => remove(item)} type="button">
                {loadingName === item ? '진행중...' : '삭제'}
              </button>
            </div>
          ))}
        </div>
        <form className="form-stack" onSubmit={add}>
          <label>
            {addLabel}
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <button className="primary-action wide" disabled={Boolean(loadingName)} type="submit">
            <Plus size={17} />
            {loadingName === 'add' ? '진행중...' : '추가'}
          </button>
        </form>
      </article>
    </div>
  );
}

function TaskForm({
  clients,
  employees,
  fixedProjectId,
  projects,
  taskTypes,
  onSubmit,
  onSuccess,
}: {
  clients: Client[];
  employees: Employee[];
  fixedProjectId?: string;
  projects: Project[];
  taskTypes: string[];
  onSubmit: TaskSubmitHandler;
  onSuccess?: () => void;
}) {
  const typeOptions = taskTypes.length ? taskTypes : fallbackTaskTypes;
  const [form, setForm] = useState({
    type: typeOptions[0] as TaskType,
    title: '',
    toIds: employees[1]?.id ? [employees[1].id] : [],
    projectId: fixedProjectId || projects[0]?.id || '',
    due: '',
    priority: '보통' as Priority,
    summary: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm((current) => {
      const validRecipientIds = current.toIds.filter((id) => employees.some((employee) => employee.id === id));
      if (validRecipientIds.length) return { ...current, toIds: validRecipientIds };
      return { ...current, toIds: employees[0]?.id ? [employees[0].id] : [] };
    });
  }, [employees]);

  useEffect(() => {
    setForm((current) => {
      if (fixedProjectId) return { ...current, projectId: fixedProjectId };
      if (current.projectId && projects.some((project) => project.id === current.projectId)) return current;
      return { ...current, projectId: projects[0]?.id || '' };
    });
  }, [fixedProjectId, projects]);

  useEffect(() => {
    setForm((current) => (typeOptions.includes(current.type) ? current : { ...current, type: typeOptions[0] || '업무 요청' }));
  }, [typeOptions.join('|')]);

  const toggleRecipient = (id: string) => {
    setForm((current) => ({
      ...current,
      toIds: current.toIds.includes(id)
        ? current.toIds.filter((item) => item !== id)
        : [...current.toIds, id],
    }));
  };

  const selectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const sizeError = getTaskFileSizeError(selectedFiles);
    if (sizeError) {
      setError(sizeError);
      setFiles([]);
      event.target.value = '';
      return;
    }
    setError('');
    setFiles(selectedFiles);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    const sizeError = getTaskFileSizeError(files);
    if (sizeError) {
      setError(sizeError);
      return;
    }
    const validRecipientIds = form.toIds.filter((id) => employees.some((employee) => employee.id === id));
    const validRecipients = validRecipientIds
      .map((id) => employees.find((employee) => employee.id === id)?.name)
      .filter((name): name is string => Boolean(name));

    if (!validRecipientIds.length) {
      setError('받는 담당자를 한 명 이상 선택해주세요.');
      return;
    }
    if (!form.type || !form.projectId || !form.due || !form.priority || !form.title.trim() || !form.summary.trim()) {
      setError('첨부파일을 제외한 모든 항목을 입력해주세요.');
      return;
    }

    setError('');
    setLoading(true);
    setStatus('전송중입니다.');
    const selectedProject = projects.find((project) => project.id === form.projectId);
    const selectedClient = selectedProject?.clientId ? clients.find((client) => client.id === selectedProject.clientId) : null;
    const message = await onSubmit({
      title: form.title,
      from: '인성이형',
      to: validRecipients[0] || '',
      toIds: validRecipientIds,
      toList: validRecipients,
      clientId: selectedClient?.id || undefined,
      client: selectedClient?.name || selectedProject?.client || '',
      projectId: selectedProject?.id || null,
      projectName: selectedProject?.name || '',
      due: form.due,
      priority: form.priority,
      type: form.type,
      summary: form.summary,
      files,
    });
    setLoading(false);
    setStatus(message);
    showActionPopup(message);
    if (!message.includes('실패')) {
      setForm({ ...form, title: '', summary: '' });
      setFiles([]);
      onSuccess?.();
    }
  };

  return (
    <form className="form-grid" onSubmit={submit}>
      <label>
        유형
        <select required value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as TaskType })}>
          {typeOptions.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label>
        받는 사람
        <div className="multi-picker">
          {employees.map((employee) => (
            <button
              className="select-chip"
              data-selected={form.toIds.includes(employee.id)}
              key={employee.id}
              onClick={() => toggleRecipient(employee.id)}
              type="button"
            >
              {employee.name}
            </button>
          ))}
        </div>
      </label>
      {!fixedProjectId ? (
        <label>
          프로젝트
          <select required value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}>
            <option value="">프로젝트 선택</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name} · {project.client}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label>
        마감기한
        <DateTimeConfirmField value={form.due} onChange={(due) => setForm({ ...form, due })} />
      </label>
      <label>
        우선순위
        <select required value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}>
          <option>높음</option>
          <option>보통</option>
          <option>낮음</option>
        </select>
      </label>
      <label className="span-2">
        제목
        <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
      </label>
      <label className="span-2">
        요청 내용
        <textarea required value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
      </label>
      <div className="attachment-row span-2">
        <Paperclip size={17} />
        <input
          multiple
          onChange={selectFiles}
          type="file"
        />
      </div>
      {error ? <p className="auth-error span-2">{error}</p> : null}
      {status ? <p className="admin-note span-2">{status}</p> : null}
      <button className="primary-action span-2" disabled={loading} type="submit">
        <CheckCircle2 size={17} />
        {loading ? '진행중...' : '업무 전송'}
      </button>
    </form>
  );
}

function ReportForm({
  employees,
  onCreateTask,
}: {
  employees: Employee[];
  onCreateTask: TaskSubmitHandler;
}) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [type, setType] = useState<'보고' | '제안'>('보고');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const adminEmployees = employees.filter((employee) => employee.role === '관리자');
  const representative =
    employees.find((employee) => employee.jobType === '대표') ||
    employees.find((employee) => employee.name === '대표') ||
    adminEmployees[0];
  const [proposalRecipientIds, setProposalRecipientIds] = useState<string[]>([]);

  useEffect(() => {
    setProposalRecipientIds((current) => current.filter((id) => employees.some((employee) => employee.id === id)));
  }, [employees]);

  const toggleProposalRecipient = (id: string) => {
    setProposalRecipientIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    if (type === '보고' && !representative) {
      setStatus('대표 계정이 없어 보고·제안을 보낼 수 없습니다.');
      return;
    }
    const selectedProposalRecipients = proposalRecipientIds
      .map((id) => employees.find((employee) => employee.id === id))
      .filter((employee): employee is Employee => Boolean(employee));
    if (type === '제안' && !selectedProposalRecipients.length) {
      setStatus('제안을 받을 사람을 한 명 이상 선택해주세요.');
      return;
    }
    setLoading(true);
    setStatus('전송중입니다.');
    const recipients =
      type === '보고'
        ? representative
          ? [representative]
          : []
        : selectedProposalRecipients;
    const message = await onCreateTask({
      title,
      summary,
      from: '인성이형',
      to: recipients[0]?.name || '',
      toIds: recipients.map((employee) => employee.id),
      toList: recipients.map((employee) => employee.name),
      client: '내부',
      due: '검토 대기',
      priority: '보통',
      type,
      status: '대기',
    });
    setLoading(false);
    setStatus(message);
    showActionPopup(message);
    if (!message.includes('실패')) {
      setTitle('');
      setSummary('');
      setProposalRecipientIds([]);
    }
  };

  return (
    <form className="form-stack" onSubmit={submit}>
      <div>
        <p className="eyebrow">New Report</p>
        <h2>대표에게 보고·제안</h2>
      </div>
      <label>
        유형
        <select value={type} onChange={(event) => setType(event.target.value as '보고' | '제안')}>
          <option>보고</option>
          <option>제안</option>
        </select>
      </label>
      <label>
        제목
        <input required value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        내용
        <textarea required value={summary} onChange={(event) => setSummary(event.target.value)} />
      </label>
      {type === '제안' ? (
        <label>
          받는 사람
          <div className="multi-picker compact">
            {employees.map((employee) => (
              <button
                className="select-chip"
                data-selected={proposalRecipientIds.includes(employee.id)}
                key={employee.id}
                onClick={() => toggleProposalRecipient(employee.id)}
                type="button"
              >
                {employee.name}
              </button>
            ))}
          </div>
        </label>
      ) : null}
      <p className="admin-note">
        {type === '보고'
          ? representative
            ? `${representative.name}에게만 전송됩니다.`
            : '대표 계정을 찾을 수 없습니다.'
          : proposalRecipientIds.length
            ? `${proposalRecipientIds.length}명에게 전송됩니다.`
            : '제안을 받을 사람을 선택해주세요.'}
      </p>
      {status ? <p className="admin-note">{status}</p> : null}
      <button className="primary-action wide" disabled={loading} type="submit">
        <CheckCircle2 size={17} />
        {loading ? '진행중...' : '보고·제안 전송'}
      </button>
    </form>
  );
}

function DateTimeConfirmField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [monthCursor, setMonthCursor] = useState(() => {
    const baseDate = parseDateTimeLocalValue(value) || new Date();
    return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  });
  const draftDate = parseDateTimeLocalValue(draft);
  const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const monthGridStart = addCalendarDays(monthStart, -monthStart.getDay());
  const monthDays = useMemo(() => Array.from({ length: 42 }, (_, index) => addCalendarDays(monthGridStart, index)), [monthGridStart.getTime()]);
  const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

  useEffect(() => {
    setDraft(value);
    const baseDate = parseDateTimeLocalValue(value);
    if (baseDate) setMonthCursor(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!fieldRef.current?.contains(event.target as Node)) {
        setDraft(value);
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen, value]);

  const openPicker = () => {
    const baseDate = parseDateTimeLocalValue(value) || new Date();
    const nextDraft = value || toDateTimeLocalValue(baseDate);
    setDraft(nextDraft);
    setMonthCursor(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
    setIsOpen(true);
  };

  const updateDraftDate = (day: Date) => {
    const timeDate = draftDate || new Date();
    const nextDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), timeDate.getHours(), timeDate.getMinutes());
    setDraft(toDateTimeLocalValue(nextDate));
  };

  const updateDraftTime = (type: 'hour' | 'minute', nextValue: string) => {
    const baseDate = draftDate || new Date();
    const nextDate = new Date(baseDate);
    if (type === 'hour') nextDate.setHours(Number(nextValue));
    if (type === 'minute') nextDate.setMinutes(Number(nextValue));
    setDraft(toDateTimeLocalValue(nextDate));
  };

  const confirmDate = () => {
    onChange(draft || toDateTimeLocalValue(new Date()));
    setIsOpen(false);
  };

  return (
    <div className="datetime-field" ref={fieldRef}>
      <input
        className="datetime-display-input"
        required
        readOnly
        type="text"
        value={value ? formatDueDate(value) : ''}
        placeholder="마감일 선택"
        onClick={openPicker}
        onFocus={openPicker}
      />
      {isOpen ? (
        <div
          className="datetime-popover"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              confirmDate();
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              setDraft(value);
              setIsOpen(false);
            }
          }}
        >
          <div className="datetime-popover-head">
            <button type="button" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}>
              <ChevronLeft size={16} />
            </button>
            <strong>{monthCursor.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}</strong>
            <button type="button" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}>
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="datetime-weekdays">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="datetime-days">
            {monthDays.map((day) => {
              const isSelected = draftDate ? startOfCalendarDay(day).getTime() === startOfCalendarDay(draftDate).getTime() : false;
              return (
                <button
                  data-outside-month={day.getMonth() !== monthCursor.getMonth()}
                  data-selected={isSelected}
                  key={day.toISOString()}
                  onClick={() => updateDraftDate(day)}
                  type="button"
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
          <div className="datetime-time-row">
            <select value={draftDate ? String(draftDate.getHours()).padStart(2, '0') : '00'} onChange={(event) => updateDraftTime('hour', event.target.value)}>
              {hours.map((hour) => (
                <option key={hour} value={hour}>{hour}시</option>
              ))}
            </select>
            <select value={draftDate ? String(draftDate.getMinutes()).padStart(2, '0') : '00'} onChange={(event) => updateDraftTime('minute', event.target.value)}>
              {minutes.map((minute) => (
                <option key={minute} value={minute}>{minute}분</option>
              ))}
            </select>
          </div>
          <div className="datetime-popover-actions">
            <button type="button" onClick={() => {
              setDraft(value);
              setIsOpen(false);
            }}>
              취소
            </button>
            <button className="primary-action" type="button" onClick={confirmDate}>
              확인
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TaskComposer({
  employees,
  taskTypes,
  onCreateTask,
}: {
  employees: Employee[];
  taskTypes: string[];
  onCreateTask: TaskSubmitHandler;
}) {
  const typeOptions = taskTypes.length ? taskTypes : fallbackTaskTypes;
  const [title, setTitle] = useState('A업체 미팅 내용 전달');
  const [summary, setSummary] = useState('미팅 내용, 요청사항, 다음 액션을 정리해서 전달합니다.');
  const [type, setType] = useState<TaskType>(typeOptions[0] || '영업 브리핑');
  const [due, setDue] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [toIds, setToIds] = useState<string[]>(employees[0]?.id ? [employees[0].id] : []);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToIds((current) => {
      const validRecipientIds = current.filter((id) => employees.some((employee) => employee.id === id));
      return validRecipientIds.length ? validRecipientIds : employees[0]?.id ? [employees[0].id] : [];
    });
  }, [employees]);

  useEffect(() => {
    if (!typeOptions.includes(type)) setType(typeOptions[0] || '업무 요청');
  }, [type, typeOptions.join('|')]);

  const toggleRecipient = (id: string) => {
    setToIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const selectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const sizeError = getTaskFileSizeError(selectedFiles);
    if (sizeError) {
      setError(sizeError);
      setFiles([]);
      event.target.value = '';
      return;
    }
    setError('');
    setFiles(selectedFiles);
  };

  return (
    <section className="compose-panel">
      <div className="section-head tight">
        <div>
          <p className="eyebrow">Quick Send</p>
          <h2>빠른 업무 전달</h2>
        </div>
        <ShieldCheck size={22} />
      </div>

      <div className="form-stack">
        <label>
          유형
          <select required value={type} onChange={(event) => setType(event.target.value as TaskType)}>
            {typeOptions.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label>
          제목
          <input required value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          받는 사람
          <div className="multi-picker compact">
            {employees.map((employee) => (
              <button
                className="select-chip"
                data-selected={toIds.includes(employee.id)}
                key={employee.id}
                onClick={() => toggleRecipient(employee.id)}
                type="button"
              >
                {employee.name}
              </button>
            ))}
          </div>
        </label>
        <label>
          요청 내용
          <textarea required value={summary} onChange={(event) => setSummary(event.target.value)} />
        </label>
        <label>
          마감기한
          <DateTimeConfirmField value={due} onChange={setDue} />
        </label>
        <div className="attachment-row">
          <Paperclip size={17} />
          <input multiple onChange={selectFiles} type="file" />
        </div>
        {error ? <p className="auth-error">{error}</p> : null}
        {status ? <p className="admin-note">{status}</p> : null}
        <button
          className="primary-action wide"
          onClick={async () => {
            if (loading) return;
            const sizeError = getTaskFileSizeError(files);
            if (sizeError) {
              setError(sizeError);
              return;
            }
            const validRecipientIds = toIds.filter((id) => employees.some((employee) => employee.id === id));
            const validRecipients = validRecipientIds
              .map((id) => employees.find((employee) => employee.id === id)?.name)
              .filter((name): name is string => Boolean(name));

            if (!validRecipientIds.length) {
              setError('받는 담당자를 한 명 이상 선택해주세요.');
              return;
            }
            if (!type || !title.trim() || !summary.trim() || !due) {
              setError('첨부파일을 제외한 모든 항목을 입력해주세요.');
              return;
            }
            setError('');
            setLoading(true);
            setStatus('전송중입니다.');
            const message = await onCreateTask({
              title,
              summary,
              type,
              to: validRecipients[0] || '',
              toIds: validRecipientIds,
              toList: validRecipients,
              from: '인성이형',
              client: '내부',
              due,
              priority: '보통',
              files,
            });
            setLoading(false);
            setStatus(message);
            showActionPopup(message);
            if (!message.includes('실패')) setFiles([]);
          }}
          disabled={loading}
          type="button"
        >
          <CheckCircle2 size={17} />
          {loading ? '진행중...' : '전달하기'}
        </button>
      </div>
    </section>
  );
}

function TaskCard({
  task,
  currentUser,
  direction,
  onOpenTask,
  onDeleteTask,
  onUpdateStatus,
}: {
  task: Task;
  currentUser: AppUser;
  direction?: 'sent' | 'received';
  onOpenTask?: (task: Task) => void;
  onDeleteTask: TaskDeleteHandler;
  onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<string>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<TaskStatus | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const statusActions: TaskStatus[] = ['진행중', '완료 요청', '보류', '완료'];
  const canDelete =
    currentUser.accountRole === 'admin' ||
    task.creatorId === currentUser.id ||
    (currentUser.isPrototype && task.from === currentUser.name);
  const canManage =
    canDelete ||
    getTaskRecipientIds(task).includes(currentUser.id) ||
    (currentUser.isPrototype && task.to.split(', ').includes(currentUser.name));

  const updateStatus = async (status: TaskStatus) => {
    if (loadingStatus) return;
    setLoadingStatus(status);
    const message = await onUpdateStatus(task.id, status);
    setLoadingStatus(null);
    showActionPopup(message);
    setMenuOpen(false);
  };

  const deleteCurrentTask = async () => {
    if (deleteLoading) return;
    if (!(await requestActionConfirm('이 업무를 삭제할까요? 받은 사람 화면에서도 삭제됩니다.'))) return;
    setDeleteLoading(true);
    const message = await onDeleteTask(task);
    setDeleteLoading(false);
    showActionPopup(message);
    setMenuOpen(false);
  };

  return (
    <article className="task-card" data-attention={needsTaskAttention(task, currentUser)} data-status-tone={getTaskStatusTone(task.status)}>
      <div className="task-main">
        <div className="task-title-row">
          <span className="task-type">{formatTaskTypeLabel(task.type)}</span>
          {direction ? (
            <span className="task-direction-badge" data-direction={direction}>
              <span className="material-symbols-outlined" aria-hidden="true">
                {direction === 'sent' ? 'north_east' : 'south_west'}
              </span>
              {direction === 'sent' ? '보냄' : '받음'}
            </span>
          ) : null}
          <span className="priority" data-priority={task.priority}>
            {task.priority}
          </span>
          <span className="read-badge" data-read={getTaskReadLabel(task)}>{getTaskReadLabel(task)}</span>
        </div>
        <button className="task-title-button" onClick={() => onOpenTask?.(task)} type="button">
          {task.title}
        </button>
        <p title={task.summary}>{task.summary ? truncateText(task.summary) : '내용이 없습니다.'}</p>
        <div className="task-meta">
          <span className="task-people-meta">
            <Avatar name={task.from} src={task.creatorAvatarUrl} size="xs" />
            {task.from} → {task.to}
          </span>
          <span>{task.client}</span>
          <span>프로젝트: {task.projectName || '미지정'}</span>
          <span>
            <CalendarClock size={14} />
            {task.due}
          </span>
        </div>
      </div>
      <div className="task-side">
        <span className="status" data-status={task.status}>
          {task.status}
        </span>
        {canManage ? <div className="task-menu">
          <button className="icon-button" aria-label="업무 메뉴" onClick={() => setMenuOpen((open) => !open)} type="button">
            <MoreHorizontal size={18} />
          </button>
          {menuOpen ? (
            <>
              <button className="menu-scrim" aria-label="업무 메뉴 닫기" onClick={() => setMenuOpen(false)} type="button" />
              <div className="task-menu-popover">
                {statusActions.map((status) => (
                  <button disabled={task.status === status || Boolean(loadingStatus)} key={status} onClick={() => updateStatus(status)} type="button">
                    {loadingStatus === status ? '진행중...' : status}
                  </button>
                ))}
                {canDelete ? (
                  <button className="danger-menu-item" disabled={deleteLoading || Boolean(loadingStatus)} onClick={deleteCurrentTask} type="button">
                    {deleteLoading ? '진행중...' : '삭제'}
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
        </div> : null}
      </div>
    </article>
  );
}

function TeamLoad({ employees }: { employees: Employee[] }) {
  return (
    <section className="team-panel">
      <div className="section-head tight">
        <div>
          <p className="eyebrow">Team</p>
          <h2>팀 구성원</h2>
        </div>
        <Users size={22} />
      </div>

      <div className="people-list">
        {employees.map((person) => (
          <div className="person-row" key={person.id}>
            <Avatar name={person.name} src={person.avatarUrl} size="sm" />
            <div>
              <strong>{person.name}</strong>
              <span>{person.jobType}</span>
            </div>
            <small>{person.load}건</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function Avatar({ name, src, size = 'md' }: { name: string; src?: string | null; size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  return (
    <span className="avatar" data-size={size} title={name}>
      {src ? <img src={src} alt="" loading="lazy" /> : <span>{getAvatarInitials(name)}</span>}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

createRoot(document.getElementById('root')!).render(<App />);
