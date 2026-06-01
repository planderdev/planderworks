import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Session } from '@supabase/supabase-js';
import {
  Bell,
  BellOff,
  BriefcaseBusiness,
  Check,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Download,
  ClipboardList,
  FileText,
  FolderKanban,
  GripVertical,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareText,
  Monitor,
  Moon,
  MoreHorizontal,
  NotebookPen,
  Paperclip,
  Pencil,
  Pin,
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

import type {
  BeforeInstallPromptEvent,
  ThemeMode,
  ColorTheme,
  ActiveView,
  TaskStatus,
  TaskListFilter,
  Priority,
  TaskType,
  AppUser,
  Task,
  TaskFile,
  TaskComment,
  Client,
  Project,
  ProjectMessage,
  PushPreferences,
  MeetingMinute,
  MeetingMinuteDraft,
  ApiScope,
  ApiKeyRecord,
  ApiKeyCreateResult,
  Employee,
  NewEmployee,
  EmployeeUpdate,
  OwnProfileUpdate,
  TaskDraft,
  TaskUpdateDraft,
  OperationCategory,
  OperationFrequency,
  OperationFilter,
  OperationStatus,
  OperationItem,
  OperationDraft,
  GoogleCalendarSettings,
  WorkSchedule,
  WorkScheduleDraft,
  CalendarEventItem,
  CalendarSegment,
  GoogleCalendarSyncResult,
  TaskSubmitHandler,
  TaskUpdateHandler,
  TaskDeleteHandler,
  TaskCommentSubmitHandler,
  TaskCommentDeleteHandler,
  MessageHandler,
  ClientSubmitHandler,
  ClientUpdateHandler,
  ClientDeleteHandler,
  ProjectDraft,
  ProjectSubmitHandler,
  ProjectUpdateHandler,
  ProjectStatusHandler,
  ProjectPermanentDeleteHandler,
  WorkScheduleSubmitHandler,
  WorkScheduleUpdateHandler,
  WorkScheduleDeleteHandler,
  JobTypeSubmitHandler,
  JobTypeDeleteHandler,
  TaskTypeSubmitHandler,
  TaskTypeDeleteHandler,
  EmployeeSubmitHandler,
  EmployeeUpdateHandler,
  GoogleCalendarSettingsHandler,
  PushPreferencesUpdateHandler,
  ApiKeyCreateHandler,
  ApiKeyRevokeHandler,
  ApiKeyDeleteHandler,
  MeetingMinuteSubmitHandler,
  MeetingMinuteUpdateHandler,
  MeetingMinuteDeleteHandler,
  MeetingMinuteCategorySubmitHandler,
  MeetingMinuteCategoryDeleteHandler,
  MeetingMinuteExportFormat,
  Notice,
  NoticeComment,
  NoticeDraft,
  NoticeSubmitHandler,
  NoticeUpdateHandler,
  NoticeDeleteHandler,
  NoticeTogglePinHandler,
  NoticeCommentSubmitHandler,
  NoticeCommentDeleteHandler,
  NoticeCategorySubmitHandler,
  NoticeCategoryDeleteHandler,
  JournalKind,
  JournalKindDef,
  JournalStatus,
  JournalStatusPhase,
  JournalStatusDef,
  WorkJournalEntry,
  WorkJournalEntryDraft,
  WeeklyContract,
} from './types';

const appViews: ActiveView[] = ['dashboard', 'calendar', 'allTasks', 'inbox', 'sent', 'project', 'create', 'meetingMinutes', 'notices', 'reports', 'journal', 'clients', 'employees', 'operations', 'settings'];
const fallbackTaskTypes: TaskType[] = ['영업 브리핑', '디자인 요청', '보고', '제안', '확인 요청', '촬영 요청', '시장 조사'];
const fallbackMeetingMinuteCategories = ['프로젝트회의', '내부회의', '신규브리핑'];
const fallbackNoticeCategories = ['없음', '일반', '이벤트', '긴급'];
const NOTICES_LAST_SEEN_KEY = 'plander-notices-last-seen';
const NOTICE_POPUP_DISMISS_PREFIX = 'plander-notice-popup-dismissed-';
const MAX_TASK_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TASK_FILE_SIZE_LABEL = '10MB';
const MAX_AVATAR_FILE_SIZE = 1024 * 1024;
const MAX_AVATAR_FILE_SIZE_LABEL = '1MB';
const AVATAR_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const LOGIN_PREFS_STORAGE_KEY = 'plander-login-preferences';
const SKIP_AUTO_LOGIN_SESSION_KEY = 'plander-skip-auto-login';

const colorThemeOptions: Array<{ value: ColorTheme; label: string; description: string; swatches: string[] }> = [
  { value: 'default', label: '플랜더 기본', description: '블랙/모노화이트 기본 모드', swatches: ['#050506', '#f7f7f4', '#cfd3da'] },
  { value: 'metal-silver', label: '메탈 실버', description: '은색 카드와 차콜 라인', swatches: ['#eef0f3', '#b9c0ca', '#32363d'] },
  { value: 'british-green', label: '브리티쉬 그린', description: '딥 그린과 크림/골드 포인트', swatches: ['#013220', '#004225', '#d8bd78'] },
  { value: 'navy', label: '네이비', description: '딥 네이비와 스틸 블루', swatches: ['#071426', '#102a48', '#4b8ef7'] },
  { value: 'orange', label: '오렌지', description: '그레이 바탕과 코퍼 포인트', swatches: ['#171717', '#303030', '#d76f2d'] },
  { value: 'pastel-pink', label: '파스텔 핑크', description: '연분홍 배경과 로즈 포인트', swatches: ['#ffe8ef', '#fff7f9', '#b94668'] },
];
const defaultPushPreferences: PushPreferences = {
  task: true,
  report: true,
  projectMessage: true,
  notice: true,
};
const apiScopeOptions: Array<{ value: ApiScope; label: string; description: string }> = [
  {
    value: 'personal_schedule',
    label: '개인 스케줄 등록',
    description: '외부 스케줄러에서 PlanderWorks 캘린더 개인 스케줄을 생성/갱신합니다.',
  },
  {
    value: 'meeting_minutes',
    label: '회의록 등록',
    description: '녹음기/요약 앱에서 PlanderWorks 회의록 게시판으로 회의 요약을 등록합니다.',
  },
];

function showActionPopup(message: string) {
  window.dispatchEvent(new CustomEvent('plander-action-complete', { detail: message }));
}

function meetingMinutePlainText(minute: MeetingMinute) {
  return [
    `# ${minute.title}`,
    '',
    `카테고리: ${minute.category}`,
    `프로젝트: ${minute.projectName || '프로젝트 미지정'}`,
    `작성자: ${minute.author}`,
    `일시: ${minute.heldAt ? formatDueDate(minute.heldAt) : minute.createdAt ? formatDueDate(minute.createdAt) : '일시 미정'}`,
    `참석자: ${minute.attendees || '미기재'}`,
    '',
    minute.summary ? `## 요약\n${minute.summary}` : '',
    `## 회의 내용\n${minute.content || '내용 없음'}`,
    minute.decisions ? `## 결정사항\n${minute.decisions}` : '',
    minute.actionItems ? `## 액션아이템\n${minute.actionItems}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function meetingMinuteHtml(minute: MeetingMinute) {
  const text = meetingMinutePlainText(minute);
  const body = escapeHtml(text).replace(/\n/g, '<br>');
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(minute.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #111; line-height: 1.65; padding: 32px; }
    h1 { font-size: 24px; margin: 0 0 16px; }
    .content { font-size: 14px; white-space: normal; }
  </style>
</head>
<body>
  <h1>${escapeHtml(minute.title)}</h1>
  <div class="content">${body}</div>
</body>
</html>`;
}

function downloadBlobFile(filename: string, mimeType: string, content: BlobPart | BlobPart[]) {
  const parts = Array.isArray(content) ? content : [content];
  const blobUrl = URL.createObjectURL(new Blob(parts, { type: mimeType }));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

function downloadTextFile(filename: string, mimeType: string, content: string) {
  downloadBlobFile(filename, mimeType, content);
}

function toPdfUtf16Hex(text: string) {
  return Array.from(text.replace(/[\uD800-\uDFFF]/g, ''))
    .map((char) => char.charCodeAt(0).toString(16).padStart(4, '0'))
    .join('');
}

function wrapPdfLine(line: string, maxChars = 42) {
  const chars = Array.from(line || ' ');
  const wrapped: string[] = [];
  for (let index = 0; index < chars.length; index += maxChars) {
    wrapped.push(chars.slice(index, index + maxChars).join(''));
  }
  return wrapped.length ? wrapped : [' '];
}

function createMeetingMinutePdf(minute: MeetingMinute) {
  const title = minute.title || '회의록';
  const lines = meetingMinutePlainText(minute)
    .split('\n')
    .flatMap((line) => wrapPdfLine(line));
  const linesPerPage = 34;
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }
  if (!pages.length) pages.push(['내용 없음']);

  const objects: string[] = [];
  const addObject = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  const catalogId = addObject('');
  const pagesId = addObject('');
  const fontId = addObject('');
  const cidFontId = addObject('');
  const fontDescriptorId = addObject('');
  const pageIds: number[] = [];
  const contentIds: number[] = [];

  pages.forEach((pageLines, pageIndex) => {
    const content = [
      'BT',
      '/F1 17 Tf',
      `1 0 0 1 50 790 Tm <${toPdfUtf16Hex(title)}> Tj`,
      '/F1 11 Tf',
      ...pageLines.map((line, lineIndex) => `1 0 0 1 50 ${750 - lineIndex * 20} Tm <${toPdfUtf16Hex(line)}> Tj`),
      '/F1 9 Tf',
      `1 0 0 1 520 28 Tm <${toPdfUtf16Hex(`${pageIndex + 1} / ${pages.length}`)}> Tj`,
      'ET',
    ].join('\n');
    contentIds.push(addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
    pageIds.push(addObject(''));
  });

  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  objects[fontId - 1] = `<< /Type /Font /Subtype /Type0 /BaseFont /HYGoThic-Medium /Encoding /UniKS-UCS2-H /DescendantFonts [${cidFontId} 0 R] >>`;
  objects[cidFontId - 1] = `<< /Type /Font /Subtype /CIDFontType0 /BaseFont /HYGoThic-Medium /CIDSystemInfo << /Registry (Adobe) /Ordering (Korea1) /Supplement 2 >> /FontDescriptor ${fontDescriptorId} 0 R /DW 1000 >>`;
  objects[fontDescriptorId - 1] = '<< /Type /FontDescriptor /FontName /HYGoThic-Medium /Flags 4 /FontBBox [-1000 -1000 1000 1000] /ItalicAngle 0 /Ascent 880 /Descent -120 /CapHeight 880 /StemV 80 >>';
  pageIds.forEach((pageId, index) => {
    objects[pageId - 1] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

function exportMeetingMinute(minute: MeetingMinute, format: MeetingMinuteExportFormat) {
  const safeTitle = (minute.title || '회의록').replace(/[\\/:*?"<>|]/g, '').trim() || '회의록';
  if (format === 'xls') {
    const rows = meetingMinutePlainText(minute)
      .split('\n')
      .map((line, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(line) || '&nbsp;'}</td></tr>`)
      .join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><table><tr><th colspan="2">${escapeHtml(minute.title)}</th></tr><tr><th>줄</th><th>내용</th></tr>${rows}</table></body></html>`;
    downloadTextFile(`${safeTitle}.xls`, 'application/vnd.ms-excel;charset=utf-8', html);
    return;
  }

  if (format === 'hwp') {
    downloadTextFile(`${safeTitle}.hwp`, 'application/x-hwp;charset=utf-8', meetingMinuteHtml(minute));
    return;
  }

  downloadTextFile(`${safeTitle}.pdf`, 'application/pdf;charset=utf-8', createMeetingMinutePdf(minute));
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

let serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration> | null = null;

function registerPlanderServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return Promise.reject(new Error('Service worker is not supported.'));
  }

  if (!serviceWorkerRegistrationPromise) {
    serviceWorkerRegistrationPromise = navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        void registration.update();
        return registration;
      });
  }

  return serviceWorkerRegistrationPromise;
}

function resolveActionConfirm(id: number, confirmed: boolean) {
  confirmResolvers.get(id)?.(confirmed);
  confirmResolvers.delete(id);
}

const primaryNavItems: Array<{ id: ActiveView; label: string; icon: React.ElementType; bold?: boolean }> = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'notices', label: '공지/전달사항', icon: Megaphone },
  { id: 'inbox', label: '받은업무', icon: Inbox },
  { id: 'clients', label: '업체관리', icon: Building2 },
  { id: 'reports', label: '보고·제안', icon: FileText },
  { id: 'meetingMinutes', label: '회의록', icon: ClipboardList },
  { id: 'allTasks', label: '전체 업무보기', icon: BriefcaseBusiness },
  { id: 'operations', label: '구독/정산관리', icon: ShieldCheck },
  { id: 'calendar', label: '캘린더', icon: CalendarClock },
  { id: 'journal', label: '주간업무일지', icon: NotebookPen, bold: true },
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
    dueAt: '2026-04-25T09:00:00.000Z',
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
    dueAt: '2026-04-28T09:00:00.000Z',
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
    dueAt: '2026-05-02T09:00:00.000Z',
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
    dueAt: '2026-04-30T09:00:00.000Z',
    status: '보류',
    priority: '낮음',
    type: '촬영 요청',
    summary: '비 오는 날 대체 촬영 컷 구성과 인플루언서 이동 동선 확인',
    watchers: ['운영팀'],
    files: [],
    comments: [],
  },
  {
    id: '5',
    title: '인플루언서 8인 최종 리스트 확정',
    from: '인성이형',
    to: '대표',
    client: 'A식당',
    due: '5월 6일',
    dueAt: '2026-05-06T09:00:00.000Z',
    status: '진행중',
    priority: '높음',
    type: '확인 요청',
    projectId: 'proj-1',
    projectName: 'A식당 일본 진출 캠페인',
    summary: '후보 계정별 팔로워·인게이지먼트 정리 후 대표 승인용 리스트 확정',
    watchers: ['대표'],
    files: [],
    comments: [],
  },
  {
    id: '6',
    title: '현지 촬영 일정·이동 동선 정리',
    from: '대표',
    to: '운영팀',
    client: 'A식당',
    due: '5월 9일',
    dueAt: '2026-05-09T09:00:00.000Z',
    status: '대기',
    priority: '보통',
    type: '촬영 요청',
    projectId: 'proj-1',
    projectName: 'A식당 일본 진출 캠페인',
    summary: '도쿄/오사카 2개 도시 촬영 동선과 숙소·교통 예약 일정 정리',
    watchers: ['운영팀', '인성이형'],
    files: [],
    comments: [],
  },
  {
    id: '7',
    title: '캠페인 예산안 1차 작성',
    from: '인성이형',
    to: '대표',
    client: 'A식당',
    due: '5월 12일',
    dueAt: '2026-05-12T09:00:00.000Z',
    status: '보류',
    priority: '보통',
    type: '시장 조사',
    projectId: 'proj-1',
    projectName: 'A식당 일본 진출 캠페인',
    summary: '인플루언서 섭외비·촬영비·광고비 항목별 예산 초안',
    watchers: ['대표'],
    files: [],
    comments: [],
  },
  {
    id: '8',
    title: '상세페이지 톤앤매너 시안 A/B',
    from: '인성이형',
    to: '디자인팀장',
    client: 'B뷰티샵',
    due: '5월 7일',
    dueAt: '2026-05-07T09:00:00.000Z',
    status: '진행중',
    priority: '높음',
    type: '디자인 요청',
    projectId: 'proj-2',
    projectName: 'B뷰티샵 상세페이지 리뉴얼',
    summary: '일본 현지 고객 대상 두 가지 톤 시안 제작 후 내부 리뷰',
    watchers: ['인성이형'],
    files: [],
    comments: [],
  },
  {
    id: '9',
    title: '시술 메뉴 일본어 번역 검수',
    from: '디자인팀장',
    to: '인성이형',
    client: 'B뷰티샵',
    due: '5월 10일',
    dueAt: '2026-05-10T09:00:00.000Z',
    status: '대기',
    priority: '보통',
    type: '확인 요청',
    projectId: 'proj-2',
    projectName: 'B뷰티샵 상세페이지 리뉴얼',
    summary: '번역본 용어 통일 및 시술 설명 자연스러움 검수',
    watchers: ['디자인팀장'],
    files: [],
    comments: [],
  },
  {
    id: '10',
    title: '촬영용 제품 컷 리스트업',
    from: '인성이형',
    to: '디자인팀장',
    client: 'B뷰티샵',
    due: '4월 29일',
    dueAt: '2026-04-29T09:00:00.000Z',
    status: '완료',
    priority: '낮음',
    type: '촬영 요청',
    projectId: 'proj-2',
    projectName: 'B뷰티샵 상세페이지 리뉴얼',
    summary: '대표 제품 12종 컷 구성과 소품 리스트 정리',
    watchers: ['디자인팀장'],
    files: [],
    comments: [],
  },
  {
    id: '11',
    title: '라쿠텐·아마존재팬 입점 조건 비교',
    from: '대표',
    to: '인성이형',
    client: '온고',
    due: '5월 8일',
    dueAt: '2026-05-08T09:00:00.000Z',
    status: '진행중',
    priority: '높음',
    type: '시장 조사',
    projectId: 'proj-3',
    projectName: '온고 조청 일본 이커머스 입점',
    summary: '수수료·정산주기·물류 옵션 비교표 작성',
    watchers: ['대표', '개발팀'],
    files: [],
    comments: [],
  },
  {
    id: '12',
    title: '상품 상세 일본어 카피 초안',
    from: '인성이형',
    to: '디자인팀장',
    client: '온고',
    due: '5월 13일',
    dueAt: '2026-05-13T09:00:00.000Z',
    status: '대기',
    priority: '보통',
    type: '디자인 요청',
    projectId: 'proj-3',
    projectName: '온고 조청 일본 이커머스 입점',
    summary: '브랜드 스토리 기반 상세 카피와 핵심 키워드 정리',
    watchers: ['인성이형'],
    files: [],
    comments: [],
  },
  {
    id: '13',
    title: '예상 물류비·관세 시뮬레이션',
    from: '대표',
    to: '개발팀',
    client: '온고',
    due: '5월 15일',
    dueAt: '2026-05-15T09:00:00.000Z',
    status: '보류',
    priority: '보통',
    type: '확인 요청',
    projectId: 'proj-3',
    projectName: '온고 조청 일본 이커머스 입점',
    summary: '판매가 시나리오별 물류비·관세 반영 마진 계산',
    watchers: ['대표'],
    files: [],
    comments: [],
  },
  {
    id: '14',
    title: '4월 일본 마케팅 성과 보고',
    from: '인성이형',
    to: '대표',
    client: 'A식당',
    due: '5월 3일',
    dueAt: '2026-05-03T09:00:00.000Z',
    status: '완료 요청',
    priority: '높음',
    type: '보고',
    summary: '4월 인플루언서 캠페인 노출·유입·예약 전환 성과 정리',
    watchers: ['대표'],
    files: [],
    comments: [],
  },
  {
    id: '15',
    title: '5월 인플루언서 협업 제안',
    from: '인성이형',
    to: '대표',
    client: '온고',
    due: '5월 5일',
    dueAt: '2026-05-05T09:00:00.000Z',
    status: '진행중',
    priority: '보통',
    type: '제안',
    summary: '온고 조청 신규 라인 일본 인플루언서 협업 3안 제안',
    watchers: ['대표'],
    files: [],
    comments: [],
  },
  {
    id: '16',
    title: 'B뷰티샵 추가 패키지 제안',
    from: '디자인팀장',
    to: '인성이형',
    client: 'B뷰티샵',
    due: '5월 11일',
    dueAt: '2026-05-11T09:00:00.000Z',
    status: '대기',
    priority: '보통',
    type: '제안',
    summary: '상세페이지 외 릴스 3편 + 배너 패키지 추가 제안',
    watchers: ['인성이형'],
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

const seedProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'A식당 일본 진출 캠페인',
    clientId: '1',
    client: 'A식당',
    status: 'active',
    createdBy: '1',
    memberIds: ['1', '2'],
    memberNames: ['인성이형', '대표'],
    createdAt: '2026-04-10T00:00:00.000Z',
    updatedAt: '2026-04-22T00:00:00.000Z',
  },
  {
    id: 'proj-2',
    name: 'B뷰티샵 상세페이지 리뉴얼',
    clientId: '2',
    client: 'B뷰티샵',
    status: 'active',
    createdBy: '1',
    memberIds: ['1', '3'],
    memberNames: ['인성이형', '디자인팀장'],
    createdAt: '2026-04-14T00:00:00.000Z',
    updatedAt: '2026-04-24T00:00:00.000Z',
  },
  {
    id: 'proj-3',
    name: '온고 조청 일본 이커머스 입점',
    clientId: '3',
    client: '온고',
    status: 'active',
    createdBy: '2',
    memberIds: ['2', '4'],
    memberNames: ['대표', '개발팀'],
    createdAt: '2026-04-18T00:00:00.000Z',
    updatedAt: '2026-04-25T00:00:00.000Z',
  },
];

const seedMeetingMinutes: MeetingMinute[] = [
  {
    id: 'mm-1',
    category: '프로젝트회의',
    title: 'A식당 일본 캠페인 킥오프',
    content: '4월 일본 인플루언서 캠페인의 목표와 일정, 역할 분담을 공유했습니다.',
    summary: '인플루언서 8인 후보 확정 및 4월 4주차 촬영 일정 합의',
    decisions: '- 후보 8인 중 6인 우선 컨택\n- 촬영은 4월 4주차로 확정',
    actionItems: '- 인성이형: 컨택 시트 정리\n- 대표: 캠페인 예산 승인',
    attendees: '인성이형, 대표, 운영팀',
    projectId: 'proj-1',
    projectName: 'A식당 일본 진출 캠페인',
    heldAt: '2026-04-12',
    author: '인성이형',
    createdAt: '2026-04-12T01:00:00.000Z',
  },
  {
    id: 'mm-2',
    category: '내부회의',
    title: '5월 콘텐츠 운영 점검',
    content: '진행 중인 3개 프로젝트의 콘텐츠 일정과 리소스 배분을 점검했습니다.',
    summary: '디자인 리소스 집중 배분과 보고 주기 정리',
    decisions: '- 디자인팀장 주 3일 B뷰티샵 우선\n- 주간 보고는 매주 금요일',
    actionItems: '- 디자인팀장: 우선순위표 작성\n- 인성이형: 보고 양식 통일',
    attendees: '인성이형, 대표, 디자인팀장',
    heldAt: '2026-05-02',
    author: '대표',
    createdAt: '2026-05-02T02:00:00.000Z',
  },
  {
    id: 'mm-3',
    category: '신규브리핑',
    title: '온고 조청 일본 진출 브리핑',
    content: '온고 조청 브랜드의 일본 이커머스 입점 전략을 논의했습니다.',
    summary: '라쿠텐 우선 입점 검토 및 물류비 시뮬레이션 필요',
    decisions: '- 1차 채널은 라쿠텐\n- 입점 조건 비교 후 재논의',
    actionItems: '- 인성이형: 입점 조건 비교표\n- 개발팀: 물류비 시뮬레이션',
    attendees: '대표, 인성이형, 개발팀',
    projectId: 'proj-3',
    projectName: '온고 조청 일본 이커머스 입점',
    heldAt: '2026-04-20',
    author: '대표',
    createdAt: '2026-04-20T03:00:00.000Z',
  },
];

const seedNotices: Notice[] = [
  {
    id: 'notice-1',
    category: '긴급',
    title: '6월 5일 전사 시스템 점검 안내',
    content: '6월 5일(목) 22:00 ~ 6월 6일(금) 02:00 까지 인프라 점검이 진행됩니다. 해당 시간에는 일부 기능 사용이 제한될 수 있으니 미리 참고 부탁드립니다.',
    important: true,
    pinned: true,
    allowComments: true,
    popup: true,
    popupUntil: '2026-06-06',
    author: '대표',
    createdAt: '2026-05-25T01:00:00.000Z',
    comments: [],
  },
  {
    id: 'notice-2',
    category: '이벤트',
    title: '신규 입사자 환영회 안내',
    content: '5월 30일(금) 19시 회사 라운지에서 환영회를 진행합니다. 모두 참석 부탁드립니다.',
    important: false,
    pinned: false,
    allowComments: true,
    popup: false,
    popupUntil: null,
    author: '운영팀',
    createdAt: '2026-05-22T05:00:00.000Z',
    comments: [],
  },
  {
    id: 'notice-3',
    category: '일반',
    title: '여름철 복장 가이드',
    content: '6월부터 8월까지 비즈니스 캐주얼이 허용됩니다. 단정한 차림을 유지해주세요.',
    important: false,
    pinned: false,
    allowComments: false,
    popup: false,
    popupUntil: null,
    author: '대표',
    createdAt: '2026-05-20T07:00:00.000Z',
    comments: [],
  },
];

const seedWorkSchedules: WorkSchedule[] = [
  { id: 'sch-1', title: '도쿄 인플루언서 촬영 출장', startAt: '2026-05-14T00:00:00.000Z', endAt: '2026-05-16T00:00:00.000Z', allDay: true, memo: 'A식당 캠페인 현지 촬영', createdBy: '1', creatorName: '인성이형' },
  { id: 'sch-2', title: '월간 전략 회의', startAt: '2026-05-08T01:00:00.000Z', endAt: '2026-05-08T02:00:00.000Z', allDay: false, memo: '5월 운영 점검', createdBy: '2', creatorName: '대표' },
  { id: 'sch-3', title: '디자인 워크샵', startAt: '2026-05-20T05:00:00.000Z', endAt: '2026-05-20T08:00:00.000Z', allDay: false, memo: 'B뷰티샵 비주얼 컨셉', createdBy: '3', creatorName: '디자인팀장' },
];

// 5/25(월) ~ 5/31(일) 기준, 인성이형(id: 1) 본인 일지로 시드
const seedWorkJournalEntries: WorkJournalEntry[] = [
  { id: 'jrn-1',  userId: 'prototype', weekStart: '2026-05-25', date: '2026-05-25', kind: '미팅', title: '송회장님 미팅',                         status: '미팅완료',          detail: '',                       source: 'manual', edited: false, hidden: false },
  { id: 'jrn-2',  userId: 'prototype', weekStart: '2026-05-25', date: '2026-05-25', kind: '미팅', title: '뉴욕 미팅 14시 인스타그램 설정',         status: '미팅완료',            detail: '',                       source: 'manual', edited: false, hidden: false },
  { id: 'jrn-3',  userId: 'prototype', weekStart: '2026-05-25', date: '2026-05-25', kind: '미팅', title: '구대표님 미팅 15시',                    status: '미팅완료',            detail: '',                       source: 'manual', edited: false, hidden: false },
  { id: 'jrn-4',  userId: 'prototype', weekStart: '2026-05-25', date: '2026-05-25', kind: '확인', title: '이팀장님 뷰티 마케팅 제안서 생성',        status: '인성팀장과진행',     detail: '',                       source: 'manual', edited: false, hidden: false },
  { id: 'jrn-5',  userId: 'prototype', weekStart: '2026-05-25', date: '2026-05-25', kind: '작업', title: '탐라곳간 마케팅 제안서 생성',             status: '작업완료',        detail: '',                       source: 'manual', edited: false, hidden: false },
  { id: 'jrn-6',  userId: 'prototype', weekStart: '2026-05-25', date: '2026-05-25', kind: '미팅', title: '탐라곳간 18시 미팅',                    status: '미팅완료',        detail: '제안서 생성 및 결제',     source: 'manual', edited: false, hidden: false },
  { id: 'jrn-7',  userId: 'prototype', weekStart: '2026-05-25', date: '2026-05-25', kind: '미팅', title: '신화 20시 미팅',                       status: '미팅완료',            detail: '',                       source: 'manual', edited: false, hidden: false },
  { id: 'jrn-8',  userId: 'prototype', weekStart: '2026-05-25', date: '2026-05-25', kind: '작업', title: '미쓰족발 영수증',                      status: '마케팅실행중',       detail: '사진 필요',               source: 'manual', edited: false, hidden: false },
  { id: 'jrn-9',  userId: 'prototype', weekStart: '2026-05-25', date: '2026-05-25', kind: '작업', title: '하윤이네 본점·이도점 사진 정리',          status: '마케팅실행중',       detail: '',                       source: 'manual', edited: false, hidden: false },
  { id: 'jrn-10', userId: 'prototype', weekStart: '2026-05-25', date: '2026-05-25', kind: '작업', title: '플랜더 홈페이지 리뉴얼 기획·생성',       status: '인성팀장과진행',         detail: '',                       source: 'manual', edited: false, hidden: false },
  { id: 'jrn-11', userId: 'prototype', weekStart: '2026-05-25', date: '2026-05-26', kind: '작업', title: 'SGL 4월 정산 자료 정리',                status: '작업진행중',             detail: '',                       source: 'manual', edited: false, hidden: false },
  { id: 'jrn-12', userId: 'prototype', weekStart: '2026-05-25', date: '2026-05-26', kind: '미팅', title: '제트시티 서류작업 — 플랜더·퀸메이커',     status: '미팅중',        detail: '',                       source: 'manual', edited: false, hidden: false },
  { id: 'jrn-13', userId: 'prototype', weekStart: '2026-05-25', date: '2026-05-26', kind: '작성', title: '지원사업 신청서 초안',                  status: '작성중',        detail: '',                       source: 'manual', edited: false, hidden: false },
  { id: 'jrn-14', userId: 'prototype', weekStart: '2026-05-25', date: '2026-05-27', kind: '견적', title: '루비 개발 견적안',                     status: '견적예정',       detail: '이동욱 작업분 포함',      source: 'manual', edited: false, hidden: false },
  { id: 'jrn-15', userId: 'prototype', weekStart: '2026-05-25', date: '2026-05-27', kind: '요청', title: '리메이드 제주 예약리뷰 작업',            status: '요청확인',   detail: '',                       source: 'manual', edited: false, hidden: false },
  { id: 'jrn-16', userId: 'prototype', weekStart: '2026-05-25', date: '2026-05-28', kind: '출근', title: '카페 출근',                            status: '필수',               detail: '',                       source: 'manual', edited: false, hidden: false },
  { id: 'jrn-17', userId: 'prototype', weekStart: '2026-05-25', date: '2026-05-28', kind: '문서', title: '법무부 출입국 서류 안내',                status: '내일작업',               detail: '',                       source: 'manual', edited: false, hidden: false },
];

// 이번주 진행중 계약·할일 시드 (시트 5/25 주차 기준)
const seedWeeklyContracts: WeeklyContract[] = [
  { id: 'wc-1',  userId: 'prototype', weekStart: '2026-05-25', sequence: 1,  company: '카온',                                                  dueDate: '작업진행중',     notes: '' },
  { id: 'wc-2',  userId: 'prototype', weekStart: '2026-05-25', sequence: 2,  company: '픽제주',                                                dueDate: '작업진행중',     notes: '' },
  { id: 'wc-3',  userId: 'prototype', weekStart: '2026-05-25', sequence: 3,  company: 'SGL',                                                  dueDate: '마케팅실행중',   notes: '' },
  { id: 'wc-4',  userId: 'prototype', weekStart: '2026-05-25', sequence: 4,  company: '제트시티 - 서류작업 (플랜더, 퀸메이커)',                    dueDate: '완료',           notes: '개발자와 진행' },
  { id: 'wc-5',  userId: 'prototype', weekStart: '2026-05-25', sequence: 5,  company: '제트시티 - 마케팅 실행 미팅',                              dueDate: '마케팅실행중',   notes: '신이사와 진행' },
  { id: 'wc-6',  userId: 'prototype', weekStart: '2026-05-25', sequence: 6,  company: '지원사업 정리',                                          dueDate: '매니저와진행',   notes: '' },
  { id: 'wc-7',  userId: 'prototype', weekStart: '2026-05-25', sequence: 7,  company: '리메이드 제주 - 예약리뷰 작업',                            dueDate: '마케팅실행중',   notes: '최실장과 진행' },
  { id: 'wc-8',  userId: 'prototype', weekStart: '2026-05-25', sequence: 8,  company: '스톰배팅센터 리뷰작업',                                    dueDate: '마케팅실행중',   notes: '인성팀장과 진행' },
  { id: 'wc-9',  userId: 'prototype', weekStart: '2026-05-25', sequence: 9,  company: '미쓰족발/감자탕/솥뚜껑삼겹살 — 중국·일본 마케팅 체험단',         dueDate: '마케팅실행중',   notes: '이슬팀장과 진행' },
  { id: 'wc-10', userId: 'prototype', weekStart: '2026-05-25', sequence: 10, company: '플랜더 명함 수정 제작',                                   dueDate: '인성팀장과진행', notes: '' },
  { id: 'wc-11', userId: 'prototype', weekStart: '2026-05-25', sequence: 11, company: '루비 개발',                                              dueDate: '이동욱작업',     notes: '' },
];

// ISO 주(월~일) 시작일 계산. input: YYYY-MM-DD → output: 그 날짜가 속한 월요일 YYYY-MM-DD
function getJournalWeekStart(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  const day = d.getDay(); // 0=일 ~ 6=토
  const offset = day === 0 ? -6 : 1 - day; // 월요일까지 거슬러
  d.setDate(d.getDate() + offset);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// 주 시작 기준 N일 후
function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// 시드 종류 팔레트 — DB 마이그레이션 안 됐을 때 fallback
const seedJournalKindPalette: JournalKindDef[] = [
  { id: 'k-1', name: '작업' },
  { id: 'k-2', name: '미팅' },
  { id: 'k-3', name: '작성' },
  { id: 'k-4', name: '요청' },
  { id: 'k-5', name: '견적' },
  { id: 'k-6', name: '출근' },
  { id: 'k-7', name: '문서' },
  { id: 'k-8', name: '확인' },
  { id: 'k-9', name: '기타' },
];

// 색상 phase 메타 (UI 표시용 라벨 + 색상은 CSS data-phase 로 적용)
const journalPhases: { value: JournalStatusPhase; label: string }[] = [
  { value: 'plan',     label: '예정 (회색)' },
  { value: 'progress', label: '진행중 (파랑)' },
  { value: 'done',     label: '완료 (초록)' },
  { value: 'coop',     label: '협업/대기 (노랑)' },
  { value: 'execute',  label: '실행중 (주황)' },
  { value: 'must',     label: '긴급/필수 (빨강)' },
  { value: 'next',     label: '다음 (보라)' },
  { value: 'change',   label: '변경 (옅은 보라)' },
  { value: 'continue', label: '이어서 (청록)' },
  { value: 'stop',     label: '중지 (짙은 회색)' },
];

// 시드 팔레트 — 시트 우측상단 + 실데이터 기반
const seedJournalStatusPalette: JournalStatusDef[] = [
  // 작업
  { id: 'st-1',  name: '작업예정',     phase: 'plan' },
  { id: 'st-2',  name: '작업진행중',   phase: 'progress' },
  { id: 'st-3',  name: '작업완료',     phase: 'done' },
  // 미팅
  { id: 'st-4',  name: '미팅예정',     phase: 'plan' },
  { id: 'st-5',  name: '미팅중',       phase: 'progress' },
  { id: 'st-6',  name: '미팅완료',     phase: 'done' },
  // 작성
  { id: 'st-7',  name: '작성예정',     phase: 'plan' },
  { id: 'st-8',  name: '작성중',       phase: 'progress' },
  { id: 'st-9',  name: '제출완료',     phase: 'done' },
  // 요청
  { id: 'st-10', name: '요청예정',     phase: 'plan' },
  { id: 'st-11', name: '요청확인',     phase: 'progress' },
  { id: 'st-12', name: '수행완료',     phase: 'done' },
  // 견적
  { id: 'st-13', name: '견적예정',     phase: 'plan' },
  { id: 'st-14', name: '견적중',       phase: 'progress' },
  { id: 'st-15', name: '견적완료',     phase: 'done' },
  // 기타
  { id: 'st-16', name: '마케팅실행중',  phase: 'execute' },
  { id: 'st-17', name: '필수',          phase: 'must' },
  { id: 'st-18', name: '내일작업',      phase: 'next' },
  { id: 'st-19', name: '일정변경',      phase: 'change' },
  { id: 'st-20', name: '이어서',        phase: 'continue' },
  { id: 'st-21', name: '중지',          phase: 'stop' },
  // ~와/과 진행
  { id: 'st-22', name: '매니저와진행',     phase: 'coop' },
  { id: 'st-23', name: '신이사와진행',     phase: 'coop' },
  { id: 'st-24', name: '최실장과진행',     phase: 'coop' },
  { id: 'st-25', name: '인성팀장과진행',   phase: 'coop' },
  { id: 'st-26', name: '이슬팀장과진행',   phase: 'coop' },
  { id: 'st-27', name: '개발자와진행',     phase: 'coop' },
  { id: 'st-28', name: '이동욱작업',       phase: 'coop' },
];

// 상태 이름 → phase 룩업 (팔레트 기반, fallback='plan')
function lookupStatusPhase(palette: JournalStatusDef[], status: string): JournalStatusPhase {
  const def = palette.find((d) => d.name === status);
  return def?.phase || 'plan';
}

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

async function sha256Hex(value: string) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function generateApiSecret() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const encoded = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `pw_live_${encoded}`;
}

function getApiScopeLabel(scope: ApiScope | string) {
  return apiScopeOptions.find((item) => item.value === scope)?.label || scope;
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
  return 'dark';
}

function normalizeThemeMode(value: unknown): ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'dark';
}

function getInitialColorTheme(): ColorTheme {
  return normalizeColorTheme(localStorage.getItem('plander-color-theme'));
}

function normalizeColorTheme(value: unknown): ColorTheme {
  return 'default';
}

function getColorThemeBaseMode(colorTheme: ColorTheme): 'light' | 'dark' | null {
  if (colorTheme === 'metal-silver' || colorTheme === 'pastel-pink') return 'light';
  if (colorTheme === 'british-green' || colorTheme === 'navy' || colorTheme === 'orange') return 'dark';
  return null;
}

function applyTheme(mode: ThemeMode, colorTheme: ColorTheme) {
  const resolved = mode === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : mode;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.colorTheme = 'default';
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
const urlPattern = /((?:https?:\/\/|www\.)[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]+|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[A-Za-z0-9\-._~:/?#[\]@!$&'()*+,;=%]*)?)/gi;
const trailingUrlPunctuationPattern = /[.,!?;:，。！？；：、)\]}〉》」』]+$/g;
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

    const trimmedUrl = match.replace(trailingUrlPunctuationPattern, '');
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

const isDateWithinRange = (value: string | null | undefined, start: Date, end: Date) => {
  const parsed = parseTaskDate(value);
  if (!parsed) return false;
  return parsed.getTime() >= start.getTime() && parsed.getTime() <= addCalendarDays(end, 1).getTime();
};

const getTaskCalendarRange = (task: Task) => {
  const dueDate = parseTaskDate(task.dueAt);
  if (!dueDate) return null;

  // 계획 시작일(startAt) 우선 → 없으면 실제 시작(startedAt) → 둘 다 없으면 마감일 당일
  const plannedStart = parseTaskDate(task.startAt);
  const actualStart = parseTaskDate(task.startedAt);
  const candidateStart = plannedStart || actualStart;
  const rangeStart = candidateStart && candidateStart.getTime() <= dueDate.getTime() ? candidateStart : dueDate;
  const rangeEnd = dueDate.getTime() >= rangeStart.getTime() ? dueDate : rangeStart;

  return {
    start: rangeStart,
    end: rangeEnd,
    days: Math.max(1, diffCalendarDays(rangeStart, rangeEnd) + 1),
  };
};

const dateOnlyValuePattern = /^\d{4}-\d{2}-\d{2}$/;

function formatDueDate(value: string | null | undefined) {
  if (!value) return '미정';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '미정';

  if (dateOnlyValuePattern.test(value) || (parsed.getHours() === 0 && parsed.getMinutes() === 0 && parsed.getSeconds() === 0)) {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'numeric',
      day: 'numeric',
    }).format(parsed);
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
}

function parseDueDate(value: string) {
  const nextValue = value.trim();
  if (!nextValue) return null;
  const parsed = dateOnlyValuePattern.test(nextValue) ? parseDateOnlyLocalValue(nextValue) : new Date(nextValue);
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : null;
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
  const parsed = dateOnlyValuePattern.test(value) ? parseDateOnlyLocalValue(value) : new Date(value);
  return Number.isNaN(parsed?.getTime()) ? null : parsed;
}

function parseDateOnlyLocalValue(value: string, endOfDay = false) {
  if (!value) return null;
  const parsed = new Date(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateOnlyLocalValue(value: string | null | undefined) {
  const parsed = parseTaskDate(value);
  return parsed ? formatDateInputValue(parsed) : '';
}

function formatScheduleDate(value: string | null | undefined, allDay: boolean) {
  if (!value) return '미정';
  const parsed = parseTaskDate(value);
  if (!parsed) return '미정';
  if (allDay) return parsed.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  return formatDueDate(value);
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

function isTaskParticipantById(task: Task, userId: string) {
  return task.creatorId === userId || getTaskRecipientIds(task).includes(userId);
}

function getTaskActivityDate(task: Task) {
  return task.updatedAt || task.startedAt || task.dueAt || task.createdAt || null;
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

function useOverlayScrollLock() {
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return undefined;

    let locked = false;
    let scrollY = 0;
    let frame = 0;

    const hasOpenOverlay = () =>
      Boolean(document.querySelector('.modal-backdrop, .mobile-overlay[data-open="true"], .sidebar[data-open="true"]'));

    const lock = () => {
      if (locked) return;
      locked = true;
      scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      document.documentElement.classList.add('scroll-locked');
      document.body.classList.add('scroll-locked');
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    };

    const unlock = () => {
      if (!locked) return;
      locked = false;
      const fixedTop = document.body.style.top;
      document.documentElement.classList.remove('scroll-locked');
      document.body.classList.remove('scroll-locked');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, fixedTop ? Math.abs(parseInt(fixedTop, 10)) : scrollY);
    };

    const syncLock = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (hasOpenOverlay()) {
          lock();
          return;
        }
        unlock();
      });
    };

    const observer = new MutationObserver(syncLock);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class', 'data-open', 'style'],
      childList: true,
      subtree: true,
    });
    window.addEventListener('resize', syncLock);
    syncLock();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', syncLock);
      unlock();
    };
  }, []);
}

function App() {
  useOverlayScrollLock();

  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);
  const [colorTheme, setColorTheme] = useState<ColorTheme>(getInitialColorTheme);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authReady, setAuthReady] = useState(!hasSupabaseConfig);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [viewHistory, setViewHistory] = useState<ActiveView[]>([]);
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [clients, setClients] = useState<Client[]>(seedClients);
  const [projects, setProjects] = useState<Project[]>(seedProjects);
  const [projectMessages, setProjectMessages] = useState<ProjectMessage[]>([]);
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>(seedWorkSchedules);
  const [journalEntries, setJournalEntries] = useState<WorkJournalEntry[]>(seedWorkJournalEntries);
  const [journalStatusPalette, setJournalStatusPalette] = useState<JournalStatusDef[]>(seedJournalStatusPalette);
  const [journalKindPalette, setJournalKindPalette] = useState<JournalKindDef[]>(seedJournalKindPalette);
  const [weeklyContracts, setWeeklyContracts] = useState<WeeklyContract[]>(seedWeeklyContracts);
  const [meetingMinutes, setMeetingMinutes] = useState<MeetingMinute[]>(seedMeetingMinutes);
  const [notices, setNotices] = useState<Notice[]>(seedNotices);
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees);
  const [operations, setOperations] = useState<OperationItem[]>(getInitialOperations);
  const [googleCalendarSettings, setGoogleCalendarSettings] = useState<GoogleCalendarSettings>(getInitialGoogleCalendarSettings);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [jobTypes, setJobTypes] = useState(seedJobTypes);
  const [taskTypes, setTaskTypes] = useState(fallbackTaskTypes);
  const [meetingMinuteCategories, setMeetingMinuteCategories] = useState(fallbackMeetingMinuteCategories);
  const [noticeCategories, setNoticeCategories] = useState<string[]>(fallbackNoticeCategories);
  // 실제 DB 로드(또는 프로토타입 모드)가 끝나기 전엔 NoticePopup이 seed로 깜빡 뜨는 걸 막기 위한 플래그.
  const [noticesReady, setNoticesReady] = useState(false);
  const [noticesLastSeen, setNoticesLastSeen] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(NOTICES_LAST_SEEN_KEY);
    } catch {
      return null;
    }
  });
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
  const [swipeDragging, setSwipeDragging] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  // focusTaskId is a one-shot signal: the destination page captures it on navigation, then it is cleared
  // so it does not re-expand/re-scroll that task on later visits to the page or a project.
  useEffect(() => {
    if (!focusTaskId) return;
    const handle = requestAnimationFrame(() => setFocusTaskId(null));
    return () => cancelAnimationFrame(handle);
  }, [focusTaskId]);
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

    let reloadingForServiceWorker = false;
    const hadServiceWorkerController = Boolean(navigator.serviceWorker.controller);

    const activateWaitingWorker = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    };

    const handleControllerChange = () => {
      if (!hadServiceWorkerController) return;
      if (reloadingForServiceWorker) return;
      reloadingForServiceWorker = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    registerPlanderServiceWorker().then((registration) => {
      activateWaitingWorker(registration);

      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            installingWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    }).catch(() => {
      setInstallStatus('서비스 워커 등록에 실패했습니다. 브라우저 새로고침 후 다시 시도해주세요.');
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) return;

    const buildVersionStorageKey = 'plander-build-version';
    let cancelled = false;

    const checkBuildVersion = async () => {
      try {
        const response = await fetch(`/build-meta.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (!response.ok) return;

        const meta = await response.json() as { version?: string };
        const version = meta.version;
        if (!version || cancelled) return;

        const savedVersion = localStorage.getItem(buildVersionStorageKey);
        if (!savedVersion) {
          localStorage.setItem(buildVersionStorageKey, version);
          window.location.reload();
          return;
        }

        if (savedVersion !== version) {
          localStorage.setItem(buildVersionStorageKey, version);
          window.location.reload();
        }
      } catch {
        // 업데이트 확인 실패는 앱 사용을 막지 않습니다.
      }
    };

    void checkBuildVersion();

    const handleVisibilityChange = () => {
      if (!document.hidden) void checkBuildVersion();
    };

    window.addEventListener('focus', checkBuildVersion);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', checkBuildVersion);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const syncInstalledMode = () => {
      setAppInstalled(displayMode.matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true);
    };
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

    syncInstalledMode();
    displayMode.addEventListener('change', syncInstalledMode);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      displayMode.removeEventListener('change', syncInstalledMode);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    applyTheme(themeMode, colorTheme);
    localStorage.setItem('plander-theme', themeMode);
    localStorage.setItem('plander-color-theme', 'default');
  }, [colorTheme, themeMode]);

  useEffect(() => {
    if (themeMode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system', colorTheme);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [colorTheme, themeMode]);

  useEffect(() => {
    if (!supabase || !currentUser || currentUser.isPrototype) return;
    let cancelled = false;

    const loadThemePreferences = async () => {
      const { data, error } = await supabase!
        .from('profiles')
        .select('theme_mode, color_theme')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (cancelled || error || !data) return;

      setThemeMode(normalizeThemeMode((data as any).theme_mode));
      setColorTheme('default');
    };

    void loadThemePreferences();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.isPrototype]);

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
    const hashView = window.location.hash.replace('#', '');
    setActiveView(isActiveView(hashView) ? hashView : 'dashboard');
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
      meetingMinuteCategoriesResult,
      meetingMinutesResult,
      pushPreferencesResult,
      apiKeysResult,
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
        .select('id, name, status, client_id, created_by, created_at, updated_at, client:clients(name)')
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
        .select('id, title, start_at, end_at, all_day, memo, created_by, creator:profiles!calendar_schedules_created_by_fkey(name)')
        .order('start_at', { ascending: true }),
      supabase
        .from('meeting_minute_categories')
        .select('name')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      supabase
        .from('meeting_minutes')
        .select(`
          id,
          category,
          title,
          content,
          summary,
          decisions,
          action_items,
          attendees,
          project_id,
          held_at,
          source_app,
          external_id,
          created_by,
          created_at,
          updated_at,
          creator:profiles!meeting_minutes_created_by_fkey(name, avatar_url),
          project:projects(name)
        `)
        .order('created_at', { ascending: false }),
      supabase
        .from('push_preferences')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle(),
      supabase
        .from('api_keys')
        .select('id, name, scope, key_prefix, active, last_used_at, created_at')
        .order('created_at', { ascending: false }),
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
          start_at,
          started_at,
          read_at,
          creator_read_at,
          show_on_calendar,
          created_at,
          updated_at,
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
      meetingMinuteCategoriesResult.error ||
      meetingMinutesResult.error ||
      pushPreferencesResult.error ||
      apiKeysResult.error ||
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
        startAt: task.start_at,
        startedAt: task.started_at,
        readAt: task.read_at,
        creatorReadAt: task.creator_read_at,
        showOnCalendar: task.show_on_calendar ?? true,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
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

    const nextMeetingMinuteCategories = ((meetingMinuteCategoriesResult.data || []) as any[]).map((category) => category.name).filter(Boolean);
    const nextMeetingMinutes: MeetingMinute[] = ((meetingMinutesResult.data || []) as any[]).map((minute) => ({
      id: minute.id,
      category: minute.category || '내부회의',
      title: minute.title || '제목 없음',
      content: minute.content || '',
      summary: minute.summary || '',
      decisions: minute.decisions || '',
      actionItems: minute.action_items || '',
      attendees: minute.attendees || '',
      projectId: minute.project_id,
      projectName: minute.project?.name || '',
      heldAt: minute.held_at,
      sourceApp: minute.source_app || null,
      externalId: minute.external_id || null,
      createdBy: minute.created_by,
      author: minute.creator?.name || '알 수 없음',
      authorAvatarUrl: minute.creator?.avatar_url || null,
      createdAt: minute.created_at,
      updatedAt: minute.updated_at,
    }));

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
      createdAt: project.created_at || null,
      updatedAt: project.updated_at || null,
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
      allDay: schedule.all_day ?? false,
      memo: schedule.memo || '',
      createdBy: schedule.created_by,
      creatorName: schedule.creator?.name || '알 수 없음',
    }));
    // push_preferences는 SELECT * 결과를 tolerant하게 매핑 — notice_enabled 컬럼이 아직 없어도 default true로 안전.
    const pushPrefRow = pushPreferencesResult.data as any;
    const nextPushPreferences = pushPrefRow
      ? {
          task: pushPrefRow.task_enabled === undefined ? defaultPushPreferences.task : Boolean(pushPrefRow.task_enabled),
          report: pushPrefRow.report_enabled === undefined ? defaultPushPreferences.report : Boolean(pushPrefRow.report_enabled),
          projectMessage: pushPrefRow.project_message_enabled === undefined ? defaultPushPreferences.projectMessage : Boolean(pushPrefRow.project_message_enabled),
          notice: pushPrefRow.notice_enabled === undefined ? defaultPushPreferences.notice : Boolean(pushPrefRow.notice_enabled),
        }
      : defaultPushPreferences;
    const nextApiKeys: ApiKeyRecord[] = ((apiKeysResult.data || []) as any[]).map((apiKey) => ({
      id: apiKey.id,
      name: apiKey.name,
      scope: apiKey.scope,
      keyPrefix: apiKey.key_prefix,
      active: apiKey.active,
      lastUsedAt: apiKey.last_used_at,
      createdAt: apiKey.created_at,
    }));

    const nextJobTypes = (jobTypesResult.data || []).map((jobType) => jobType.name);
    const nextTaskTypes = (taskTypesResult.data || []).map((taskType) => taskType.name);

    setTasks(nextTasks);
    setEmployees(nextEmployees.length ? nextEmployees : seedEmployees);
    setClients(nextClients);
    setProjects(nextProjects);
    setProjectMessages(nextProjectMessages);
    setWorkSchedules(nextWorkSchedules);
    setMeetingMinutes(nextMeetingMinutes);
    setPushPreferences(nextPushPreferences);
    setApiKeys(nextApiKeys);
    setJobTypes(nextJobTypes.length ? nextJobTypes : seedJobTypes);
    setTaskTypes(nextTaskTypes.length ? nextTaskTypes : fallbackTaskTypes);
    setMeetingMinuteCategories(nextMeetingMinuteCategories.length ? nextMeetingMinuteCategories : fallbackMeetingMinuteCategories);
    setBackendStatus('Supabase 연결됨');

    // ─── 공지/전달사항 (tolerant) ───────────────────────────────────────
    // 테이블이 아직 마이그레이션 안 됐을 수 있으니 모든 에러를 흡수.
    // 실패 시 seed/이전 state 유지 — loadBackendData 전체 흐름은 영향 없음.
    // 실제 사용자 로드 시작 시점에 seedNotices를 즉시 비워서 팝업 깜빡 방지.
    setNotices([]);
    try {
      const [noticeCategoriesResult, noticesResult, noticeCommentsResult] = await Promise.all([
        supabase!
          .from('notice_categories')
          .select('name')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase!
          .from('notices')
          .select(`
            id, category, title, content, important, pinned, allow_comments,
            popup, popup_until, created_by, created_at, updated_at,
            creator:profiles!notices_created_by_fkey(name, avatar_url)
          `)
          .order('pinned', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase!
          .from('notice_comments')
          .select('id, notice_id, parent_comment_id, user_id, content, created_at, user:profiles!notice_comments_user_id_fkey(name, avatar_url)')
          .order('created_at', { ascending: true }),
      ]);
      if (noticeCategoriesResult.error || noticesResult.error || noticeCommentsResult.error) {
        // 마이그레이션 전: 조용히 무시. console에 한 줄만.
        console.warn('[notices] tolerant load skipped:', noticeCategoriesResult.error?.message || noticesResult.error?.message || noticeCommentsResult.error?.message);
      } else {
        const commentsByNotice = ((noticeCommentsResult.data || []) as any[]).reduce<Record<string, NoticeComment[]>>((groups, comment) => {
          const next: NoticeComment = {
            id: comment.id,
            noticeId: comment.notice_id,
            parentId: comment.parent_comment_id,
            userId: comment.user_id,
            author: comment.user?.name || '알 수 없음',
            avatarUrl: comment.user?.avatar_url || null,
            content: comment.content,
            createdAt: comment.created_at,
          };
          return { ...groups, [comment.notice_id]: [...(groups[comment.notice_id] || []), next] };
        }, {});
        const nextNotices: Notice[] = ((noticesResult.data || []) as any[]).map((row) => ({
          id: row.id,
          category: row.category || '없음',
          title: row.title || '제목 없음',
          content: row.content || '',
          important: Boolean(row.important),
          pinned: Boolean(row.pinned),
          allowComments: row.allow_comments !== false,
          popup: Boolean(row.popup),
          popupUntil: row.popup_until || null,
          createdBy: row.created_by,
          author: row.creator?.name || '알 수 없음',
          authorAvatarUrl: row.creator?.avatar_url || null,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          comments: commentsByNotice[row.id] || [],
        }));
        const nextNoticeCategories = ((noticeCategoriesResult.data || []) as any[]).map((c) => c.name).filter(Boolean);
        setNotices(nextNotices);
        setNoticeCategories(nextNoticeCategories.length ? nextNoticeCategories : fallbackNoticeCategories);
      }
    } catch (error) {
      console.warn('[notices] tolerant load exception:', (error as Error).message);
    }
    setNoticesReady(true);

    // ─── 주간업무일지 (tolerant) ───────────────────────────────────────
    // notices와 동일하게 try/catch + seed 비우기 + ready 플래그.
    setJournalEntries([]);
    setWeeklyContracts([]);
    try {
      const [journalEntriesResult, journalStatusResult, journalKindResult, weeklyContractsResult] = await Promise.all([
        supabase!
          .from('work_journal_entries')
          .select('id, user_id, week_start, date, kind, title, detail, status, project_id, client_id, source, source_ref, edited, hidden, created_at, updated_at')
          .order('week_start', { ascending: false })
          .order('date', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase!
          .from('journal_status_defs')
          .select('id, name, phase, sort_order')
          .order('sort_order', { ascending: true }),
        supabase!
          .from('journal_kind_defs')
          .select('id, name, sort_order')
          .order('sort_order', { ascending: true }),
        supabase!
          .from('weekly_contracts')
          .select('id, user_id, week_start, sequence, company, due_date, notes')
          .order('week_start', { ascending: false })
          .order('sequence', { ascending: true }),
      ]);
      // kind는 별도 try — kind 마이그 안 됐어도 entry/status는 살려야 함
      if (journalEntriesResult.error || journalStatusResult.error || weeklyContractsResult.error) {
        console.warn('[journal] tolerant load skipped:', journalEntriesResult.error?.message || journalStatusResult.error?.message || weeklyContractsResult.error?.message);
      } else {
        const nextEntries: WorkJournalEntry[] = ((journalEntriesResult.data || []) as any[]).map((row) => ({
          id: row.id,
          userId: row.user_id,
          weekStart: row.week_start,
          date: row.date,
          kind: row.kind,
          title: row.title || '',
          detail: row.detail || '',
          status: row.status || '',
          projectId: row.project_id,
          clientId: row.client_id,
          source: row.source,
          sourceRef: row.source_ref || undefined,
          edited: Boolean(row.edited),
          hidden: Boolean(row.hidden),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
        const nextStatusPalette: JournalStatusDef[] = ((journalStatusResult.data || []) as any[]).map((row) => ({
          id: row.id,
          name: row.name,
          phase: row.phase,
        }));
        const nextWeeklyContracts: WeeklyContract[] = ((weeklyContractsResult.data || []) as any[]).map((row) => ({
          id: row.id,
          userId: row.user_id,
          weekStart: row.week_start,
          sequence: row.sequence,
          company: row.company || '',
          dueDate: row.due_date || '',
          notes: row.notes || '',
        }));
        setJournalEntries(nextEntries);
        setJournalStatusPalette(nextStatusPalette.length ? nextStatusPalette : seedJournalStatusPalette);
        setWeeklyContracts(nextWeeklyContracts);
      }
      // kind 팔레트 — 마이그 안 됐어도 seed로 fallback
      if (journalKindResult.error) {
        console.warn('[journal/kind] tolerant load skipped:', journalKindResult.error.message);
      } else {
        const nextKindPalette: JournalKindDef[] = ((journalKindResult.data || []) as any[]).map((row) => ({
          id: row.id,
          name: row.name,
        }));
        setJournalKindPalette(nextKindPalette.length ? nextKindPalette : seedJournalKindPalette);
      }
    } catch (error) {
      console.warn('[journal] tolerant load exception:', (error as Error).message);
    }
  };

  useEffect(() => {
    // 프로토타입 모드는 loadBackendData가 즉시 early-return하므로
    // 여기서 ready를 켜준다 (seedNotices가 그대로 노출).
    if (currentUser?.isPrototype) {
      setNoticesReady(true);
    } else {
      // 실제 로그인 사용자 변경 시 새 로드가 끝날 때까지 팝업 숨김.
      setNoticesReady(false);
    }
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_minutes' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_minute_categories' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notice_categories' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notice_comments' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'work_journal_entries' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journal_status_defs' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journal_kind_defs' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weekly_contracts' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'push_preferences' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'api_keys' }, queueRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_comments' }, queueRefresh)
      .subscribe();

    return () => {
      if (realtimeRefreshTimer.current) {
        window.clearTimeout(realtimeRefreshTimer.current);
        realtimeRefreshTimer.current = null;
      }
      void supabase!.removeChannel(channel);
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

    if (!appHistoryReady.current) {
      window.history.replaceState({ plander: true, view: activeView, guard: true }, '', getAppHistoryUrl(activeView));
      window.history.pushState({ plander: true, view: activeView }, '', getAppHistoryUrl(activeView));
      appHistoryReady.current = true;
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as { plander?: boolean; view?: unknown; filter?: TaskListFilter; guard?: boolean } | null;

      // 로그인 상태에서만 이 핸들러가 등록됨. 뒤로가기가 앱을 벗어나려 하면
      // (가드 엔트리 OR plander 아닌 외부 히스토리) 현재 뷰를 다시 푸시해서 가둠.
      // → 로그아웃 전까지 로그인/확인중 화면으로 절대 못 감.
      if (!state?.plander || state.guard) {
        window.history.pushState({ plander: true, view: activeView }, '', getAppHistoryUrl(activeView));
        return;
      }

      // 앱 내부 뷰 간 뒤로가기는 정상 동작
      if (!isActiveView(state.view)) return;
      setActiveView(state.view);
      setSidebarOpen(false);
      setSelectedTaskId(null);
      if (state.filter) setTaskListFilters((current) => ({ ...current, [state.view as ActiveView]: state.filter }));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeView, currentUser]);

  // 공지 페이지 진입 시 새글 배지 초기화 (localStorage 마지막 본 시점 갱신)
  useEffect(() => {
    if (activeView === 'notices') {
      markNoticesSeen();
    }
    // markNoticesSeen은 매 렌더마다 새로 만들어지지만 setState만 호출하므로 deps에 안 넣어도 안전.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  useEffect(() => {
    if (!currentUser || currentUser.isPrototype || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushEnabled(false);
      return;
    }

    let mounted = true;

    registerPlanderServiceWorker()
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
  const projectUnreadCounts = useMemo(() => {
    if (!currentUser) return {};

    return projectMessages.reduce<Record<string, number>>((counts, message) => {
      if (message.userId === currentUser.id || message.readByIds.includes(currentUser.id)) return counts;
      return {
        ...counts,
        [message.projectId]: (counts[message.projectId] || 0) + 1,
      };
    }, {});
  }, [currentUser, projectMessages]);

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
    meetingMinutes: meetingMinutes.length,
    notices: notices.length,
  };
  const unreadNoticeCount = useMemo(() => {
    if (!noticesLastSeen) return notices.length; // 처음 방문이면 전체를 새 글로
    const cutoff = new Date(noticesLastSeen).getTime();
    if (!Number.isFinite(cutoff)) return notices.length;
    return notices.filter((n) => {
      if (!n.createdAt) return false;
      const t = new Date(n.createdAt).getTime();
      return Number.isFinite(t) && t > cutoff;
    }).length;
  }, [notices, noticesLastSeen]);
  const navUnreadBadges: Partial<Record<ActiveView, number>> = {
    inbox: inboxTasks.filter((task) => needsTaskAttention(task, currentUser)).length,
    sent: sentTasks.filter((task) => needsTaskAttention(task, currentUser)).length,
    reports: reportTasks.filter((task) => needsTaskAttention(task, currentUser)).length,
    notices: unreadNoticeCount,
  };

  const dashboardStats = useMemo(
    () => [
      { label: '받은 업무', value: inboxTasks.length, hint: '내 담당 기준', tone: 'silver', target: 'inbox' as ActiveView },
      { label: '진행중', value: inboxTasks.filter((task) => task.status === '진행중').length, hint: '담당자 확인중', tone: 'blue', target: 'inbox' as ActiveView, filter: '진행중' as TaskListFilter },
      { label: '완료 요청', value: inboxTasks.filter((task) => task.status === '완료 요청').length, hint: '검토 필요', tone: 'amber', target: 'inbox' as ActiveView, filter: '완료 요청' as TaskListFilter },
      { label: '마감 임박', value: dueSoonTasks.length, hint: '마감일 입력 기준', tone: 'red', target: 'inbox' as ActiveView, filter: '마감 임박' as TaskListFilter },
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

  const openDashboardTask = (task: Task, target?: ActiveView) => {
    if (task.projectId) {
      setFocusTaskId(task.id);
      setSelectedProjectId(task.projectId);
      setViewHistory((history) => [...history, activeView].slice(-12));
      setForwardHistory([]);
      setActiveView('project');
      if (appHistoryReady.current) {
        window.history.pushState(
          { plander: true, view: 'project', taskId: task.id, projectId: task.projectId },
          '',
          `${window.location.pathname}?projectId=${encodeURIComponent(task.projectId)}&taskId=${encodeURIComponent(task.id)}#project`,
        );
      }
      return;
    }
    if (target) {
      setFocusTaskId(task.id);
      navigateTo(target);
      return;
    }
    setSelectedTaskId(task.id);
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
    // 본문/댓글 등 텍스트 선택 가능 영역에서 시작한 터치는 스와이프 비활성
    // (글자 드래그 선택이 페이지 스와이프로 잘못 인식되는 문제 방지)
    const target = event.target as HTMLElement | null;
    if (target?.closest?.('.task-detail-body, .project-inspector-summary, .meeting-minute-detail, .notice-detail, .notice-popup-body, .project-message, .comment-item')) {
      swipeStart.current = null;
      return;
    }
    const touch = event.touches[0];
    swipeStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleWorkspaceTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    if (window.innerWidth > 760 || !swipeStart.current) return;
    const touch = event.touches[0];
    const deltaX = touch.clientX - swipeStart.current.x;
    const deltaY = Math.abs(touch.clientY - swipeStart.current.y);

    if (deltaY > 50) {
      setSwipeDragging(false);
      setSwipeOffset(0);
      return;
    }

    const canSwipeBack = deltaX > 0 && activeView !== 'dashboard' && viewHistory.length > 0;
    const canSwipeForward = deltaX < 0 && forwardHistory.length > 0;

    if (!canSwipeBack && !canSwipeForward) {
      setSwipeDragging(false);
      setSwipeOffset(0);
      return;
    }

    if (Math.abs(deltaX) < 8) return;
    event.preventDefault();
    setSwipeDragging(true);
    // 0.88 살짝 weight + 80vw 이후 0.25 저항(iOS 러버밴드) — 손가락 따라오되 묵직한 느낌
    const vw = window.innerWidth;
    const softCap = vw * 0.8;
    const damped = deltaX * 0.88;
    const abs = Math.abs(damped);
    const offset = abs <= softCap
      ? damped
      : Math.sign(damped) * (softCap + (abs - softCap) * 0.25);
    setSwipeOffset(offset);
  };

  const handleWorkspaceTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (window.innerWidth > 760 || !swipeStart.current) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - swipeStart.current.x;
    const deltaY = Math.abs(touch.clientY - swipeStart.current.y);
    const shouldGoBack = deltaX > 80 && deltaY < 60 && activeView !== 'dashboard' && viewHistory.length > 0;
    const shouldGoForward = deltaX < -80 && deltaY < 60 && forwardHistory.length > 0;

    swipeStart.current = null;
    setSwipeDragging(false);

    if (shouldGoBack || shouldGoForward) {
      setSwipeOffset((shouldGoBack ? 1 : -1) * window.innerWidth);
      window.setTimeout(() => {
        if (shouldGoBack) navigateBack();
        if (shouldGoForward) navigateForward();
        setSwipeOffset(0);
      }, 280);
      return;
    }

    setSwipeOffset(0);
  };

  const handleLogout = async () => {
    window.sessionStorage.setItem(SKIP_AUTO_LOGIN_SESSION_KEY, '1');
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
        start_at: task.startAt ? parseDueDate(task.startAt) : null,
        show_on_calendar: task.showOnCalendar ?? true,
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
      showOnCalendar: task.showOnCalendar ?? true,
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

    if (supabase && currentUser && !currentUser.isPrototype && !isUuid(client.id)) {
      return '프로젝트 생성 실패: 업체 정보가 서버에 저장되지 않았습니다. 업체를 먼저 저장한 뒤 다시 시도해주세요.';
    }

    if (!supabase || !currentUser || currentUser.isPrototype) {
      const nextProject: Project = {
        id: String(Date.now()),
        name,
        clientId: client.id,
        client: client.name,
        status: 'active',
        createdBy: currentUser?.id || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
      .select('id, name, status, client_id, created_by, created_at, updated_at, client:clients(name)')
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
      createdAt: data.created_at || null,
      updatedAt: data.updated_at || null,
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
    const nextStatus = project.status || existingProject?.status || 'active';

    if (!existingProject) return '수정할 프로젝트를 찾을 수 없습니다.';
    if (!name) return '프로젝트명을 입력해주세요.';
    if (!client) return '연결할 업체를 선택해주세요.';
    if (!memberIds.length) return '참여 직원을 선택해주세요.';

    if (supabase && currentUser && !currentUser.isPrototype && (!isUuid(projectId) || !isUuid(client.id))) {
      return '프로젝트 수정 실패: 서버에 저장된 프로젝트/업체 정보가 아닙니다. 새로고침 후 다시 시도해주세요.';
    }

    if (!supabase || !currentUser || currentUser.isPrototype) {
      const nextProject: Project = {
        ...existingProject,
        name,
        clientId: client.id,
        client: client.name,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
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
        status: nextStatus,
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

  const updateProjectStatus: ProjectStatusHandler = async (project, status) => {
    const nextUpdatedAt = new Date().toISOString();
    const successMessage =
      status === 'deleted'
        ? '프로젝트가 휴지통으로 이동되었습니다.'
        : status === 'active'
          ? '프로젝트가 진행중으로 복구되었습니다.'
          : status === 'completed'
            ? '프로젝트가 완료되었습니다.'
            : '프로젝트 상태가 변경되었습니다.';

    const applyLocalStatus = () => {
      setProjects((current) => current.map((item) => (item.id === project.id ? { ...item, status, updatedAt: nextUpdatedAt } : item)));

      if (status === 'deleted' && selectedProjectId === project.id) {
        const nextProject = projects.find((item) => item.id !== project.id && item.status !== 'completed' && item.status !== 'deleted');
        setSelectedProjectId(nextProject?.id || null);
        if (!nextProject) setActiveView('dashboard');
      }
    };

    if (supabase && currentUser && !currentUser.isPrototype && isUuid(project.id)) {
      const { error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', project.id);

      if (error) {
        const message = `프로젝트 상태 변경 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      applyLocalStatus();
      window.setTimeout(() => {
        void loadBackendData();
      }, 300);
      return successMessage;
    }

    applyLocalStatus();
    return successMessage;
  };

  const permanentlyDeleteProject: ProjectPermanentDeleteHandler = async (project) => {
    if (supabase && currentUser && !currentUser.isPrototype && isUuid(project.id)) {
      const { error } = await supabase.from('projects').delete().eq('id', project.id);

      if (error) {
        const message = `프로젝트 완전 삭제 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      setProjects((current) => current.filter((item) => item.id !== project.id));
      setSelectedProjectId((current) => (current === project.id ? null : current));
      window.setTimeout(() => {
        void loadBackendData();
      }, 300);
      return '프로젝트가 완전히 삭제되었습니다.';
    }

    setProjects((current) => current.filter((item) => item.id !== project.id));
    setSelectedProjectId((current) => (current === project.id ? null : current));
    return '프로젝트가 완전히 삭제되었습니다.';
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
    const startDate = schedule.allDay ? parseDateOnlyLocalValue(schedule.startAt) : parseDateTimeLocalValue(schedule.startAt);
    const endDate = schedule.allDay ? parseDateOnlyLocalValue(schedule.endAt, true) : parseDateTimeLocalValue(schedule.endAt);

    if (!title) return '스케줄 제목을 입력해주세요.';
    if (!startDate || !endDate) return '시작일과 종료일을 선택해주세요.';
    if (endDate.getTime() < startDate.getTime()) return '종료일은 시작일보다 늦게 선택해주세요.';

    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase.from('calendar_schedules').insert({
        title,
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        all_day: schedule.allDay,
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
      allDay: schedule.allDay,
      memo,
      createdBy: currentUser?.id || 'prototype',
      creatorName: currentUser?.name || '나',
    };
    setWorkSchedules((current) => [...current, nextSchedule].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()));
    return '스케줄이 추가되었습니다.';
  };

  const updateWorkSchedule: WorkScheduleUpdateHandler = async (scheduleId, schedule) => {
    const title = schedule.title.trim();
    const memo = schedule.memo.trim();
    const startDate = schedule.allDay ? parseDateOnlyLocalValue(schedule.startAt) : parseDateTimeLocalValue(schedule.startAt);
    const endDate = schedule.allDay ? parseDateOnlyLocalValue(schedule.endAt, true) : parseDateTimeLocalValue(schedule.endAt);

    if (!title) return '스케줄 제목을 입력해주세요.';
    if (!startDate || !endDate) return '시작일과 종료일을 선택해주세요.';
    if (endDate.getTime() < startDate.getTime()) return '종료일은 시작일보다 늦게 선택해주세요.';

    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase
        .from('calendar_schedules')
        .update({
          title,
          start_at: startDate.toISOString(),
          end_at: endDate.toISOString(),
          all_day: schedule.allDay,
          memo,
        })
        .eq('id', scheduleId);

      if (error) {
        const message = `스케줄 수정 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      setBackendStatus('스케줄이 수정되었습니다.');
      return '스케줄이 수정되었습니다.';
    }

    setWorkSchedules((current) =>
      current
        .map((item) =>
          item.id === scheduleId
            ? {
                ...item,
                title,
                startAt: startDate.toISOString(),
                endAt: endDate.toISOString(),
                allDay: schedule.allDay,
                memo,
              }
            : item,
        )
        .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    );
    return '스케줄이 수정되었습니다.';
  };

  const deleteWorkSchedule: WorkScheduleDeleteHandler = async (schedule) => {
    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase.from('calendar_schedules').delete().eq('id', schedule.id);

      if (error) {
        const message = `스케줄 삭제 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      setBackendStatus('스케줄이 삭제되었습니다.');
      return '스케줄이 삭제되었습니다.';
    }

    setWorkSchedules((current) => current.filter((item) => item.id !== schedule.id));
    return '스케줄이 삭제되었습니다.';
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

  const addMeetingMinuteCategory = async (name: string): Promise<string> => {
    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase.from('meeting_minute_categories').insert({
        name,
        sort_order: (meetingMinuteCategories.length + 1) * 10,
      });

      if (error) {
        const message = `회의록 카테고리 저장 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return '회의록 카테고리를 추가했습니다.';
    }

    setMeetingMinuteCategories((current) => [name, ...current]);
    return '회의록 카테고리를 추가했습니다.';
  };

  const deleteMeetingMinuteCategory = async (name: string): Promise<string> => {
    if (fallbackMeetingMinuteCategories.includes(name)) {
      return '기본 회의록 카테고리는 삭제할 수 없습니다.';
    }

    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase.from('meeting_minute_categories').update({ is_active: false }).eq('name', name);

      if (error) {
        const message = `회의록 카테고리 삭제 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return '회의록 카테고리를 삭제했습니다.';
    }

    setMeetingMinuteCategories((current) => current.filter((category) => category !== name));
    return '회의록 카테고리를 삭제했습니다.';
  };

  const addMeetingMinute: MeetingMinuteSubmitHandler = async (minute) => {
    if (!currentUser) return '로그인이 필요합니다.';
    const title = minute.title.trim();
    const content = minute.content.trim();
    const category = minute.category.trim();
    const heldAt = minute.heldAt ? parseDateTimeLocalValue(minute.heldAt) : null;

    if (!category) return '회의록 카테고리를 선택해주세요.';
    if (!title) return '회의록 제목을 입력해주세요.';
    if (!content) return '회의 내용을 입력해주세요.';

    if (supabase && !currentUser.isPrototype) {
      const { data, error } = await supabase
        .from('meeting_minutes')
        .insert({
          category,
          title,
          content,
          summary: minute.summary.trim(),
          decisions: minute.decisions.trim(),
          action_items: minute.actionItems.trim(),
          attendees: minute.attendees.trim(),
          project_id: minute.projectId || null,
          held_at: heldAt ? heldAt.toISOString() : null,
          source_app: 'planderworks',
          created_by: currentUser.id,
        })
        .select('id')
        .single();

      if (error || !data) {
        const message = `회의록 저장 실패: ${error?.message || '저장된 회의록을 확인할 수 없습니다.'}`;
        setBackendStatus(message);
        return message;
      }

      const { error: notificationError } = await supabase.functions.invoke('send-meeting-minute-notification', {
        body: { meetingMinuteId: data.id },
      });
      if (notificationError) {
        setBackendStatus(`회의록 알림 실패: ${notificationError.message}`);
      }

      await loadBackendData();
      return '회의록을 등록했습니다.';
    }

    setMeetingMinutes((current) => [
      {
        id: `minute-${Date.now()}`,
        category,
        title,
        content,
        summary: minute.summary.trim(),
        decisions: minute.decisions.trim(),
        actionItems: minute.actionItems.trim(),
        attendees: minute.attendees.trim(),
        projectId: minute.projectId || null,
        projectName: projects.find((project) => project.id === minute.projectId)?.name || '',
        heldAt: heldAt ? heldAt.toISOString() : null,
        sourceApp: 'planderworks',
        createdBy: currentUser.id,
        author: currentUser.name,
        authorAvatarUrl: currentUser.avatarUrl || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      ...current,
    ]);
    return '회의록을 등록했습니다.';
  };

  const updateMeetingMinute: MeetingMinuteUpdateHandler = async (minuteId, minute) => {
    if (!currentUser) return '로그인이 필요합니다.';
    const existingMinute = meetingMinutes.find((item) => item.id === minuteId);
    if (!existingMinute) return '수정할 회의록을 찾을 수 없습니다.';
    if (currentUser.accountRole !== 'admin' && existingMinute.createdBy !== currentUser.id) return '회의록 작성자와 관리자만 수정할 수 있습니다.';

    const title = minute.title.trim();
    const content = minute.content.trim();
    const category = minute.category.trim();
    const heldAt = minute.heldAt ? parseDateTimeLocalValue(minute.heldAt) : null;

    if (!category) return '회의록 카테고리를 선택해주세요.';
    if (!title) return '회의록 제목을 입력해주세요.';
    if (!content) return '회의 내용을 입력해주세요.';

    const updates = {
      category,
      title,
      content,
      summary: minute.summary.trim(),
      decisions: minute.decisions.trim(),
      action_items: minute.actionItems.trim(),
      attendees: minute.attendees.trim(),
      project_id: minute.projectId || null,
      held_at: heldAt ? heldAt.toISOString() : null,
    };

    if (supabase && !currentUser.isPrototype) {
      const { error } = await supabase
        .from('meeting_minutes')
        .update(updates)
        .eq('id', minuteId);

      if (error) {
        const message = `회의록 수정 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return '회의록을 수정했습니다.';
    }

    setMeetingMinutes((current) =>
      current.map((item) =>
        item.id === minuteId
          ? {
              ...item,
              category,
              title,
              content,
              summary: minute.summary.trim(),
              decisions: minute.decisions.trim(),
              actionItems: minute.actionItems.trim(),
              attendees: minute.attendees.trim(),
              projectId: minute.projectId || null,
              projectName: projects.find((project) => project.id === minute.projectId)?.name || '',
              heldAt: heldAt ? heldAt.toISOString() : null,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
    return '회의록을 수정했습니다.';
  };

  const deleteMeetingMinute: MeetingMinuteDeleteHandler = async (minute) => {
    if (!currentUser) return '로그인이 필요합니다.';
    if (currentUser.accountRole !== 'admin' && minute.createdBy !== currentUser.id) return '회의록 작성자와 관리자만 삭제할 수 있습니다.';
    if (!(await requestActionConfirm(`${minute.title} 회의록을 삭제할까요?`))) return '취소했습니다.';

    if (supabase && !currentUser.isPrototype) {
      const { error } = await supabase
        .from('meeting_minutes')
        .delete()
        .eq('id', minute.id);

      if (error) {
        const message = `회의록 삭제 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return '회의록을 삭제했습니다.';
    }

    setMeetingMinutes((current) => current.filter((item) => item.id !== minute.id));
    return '회의록을 삭제했습니다.';
  };

  // ─── 공지/전달사항 핸들러 ────────────────────────────────────────────
  const addNoticeCategory: NoticeCategorySubmitHandler = async (name) => {
    if (!currentUser) return '로그인이 필요합니다.';
    if (currentUser.accountRole !== 'admin') return '관리자만 카테고리를 추가할 수 있습니다.';
    const trimmed = name.trim();
    if (!trimmed) return '카테고리 이름을 입력해주세요.';
    if (noticeCategories.includes(trimmed)) return '이미 존재하는 카테고리입니다.';

    if (supabase && !currentUser.isPrototype) {
      const { error } = await supabase.from('notice_categories').insert({
        name: trimmed,
        sort_order: (noticeCategories.length + 1) * 10,
      });
      if (error) {
        if (error.message.includes('unique')) return '이미 존재하는 카테고리입니다.';
        const message = `카테고리 추가 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }
    }

    setNoticeCategories((current) => [...current, trimmed]);
    return '공지 카테고리를 추가했습니다.';
  };

  const deleteNoticeCategory: NoticeCategoryDeleteHandler = async (name) => {
    if (!currentUser) return '로그인이 필요합니다.';
    if (currentUser.accountRole !== 'admin') return '관리자만 카테고리를 삭제할 수 있습니다.';
    if (name === '없음') return '기본 카테고리 "없음"은 삭제할 수 없습니다.';

    if (supabase && !currentUser.isPrototype) {
      const { error } = await supabase.from('notice_categories').delete().eq('name', name);
      if (error) {
        const message = `카테고리 삭제 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }
    }

    setNoticeCategories((current) => current.filter((c) => c !== name));
    return '공지 카테고리를 삭제했습니다.';
  };

  const addNotice: NoticeSubmitHandler = async (draft) => {
    if (!currentUser) return '로그인이 필요합니다.';
    if (currentUser.accountRole !== 'admin') return '관리자만 공지를 작성할 수 있습니다.';

    const title = draft.title.trim();
    const content = draft.content.trim();
    if (!title) return '공지 제목을 입력해주세요.';
    if (!content) return '공지 내용을 입력해주세요.';

    const category = draft.category?.trim() || '없음';
    const popupUntil = draft.popup && draft.popupUntil ? draft.popupUntil : null;

    if (supabase && !currentUser.isPrototype) {
      const { data, error } = await supabase
        .from('notices')
        .insert({
          category,
          title,
          content,
          important: draft.important,
          pinned: draft.pinned,
          allow_comments: draft.allowComments,
          popup: draft.popup,
          popup_until: popupUntil,
          created_by: currentUser.id,
        })
        .select('id')
        .single();

      if (error || !data) {
        const message = `공지 저장 실패: ${error?.message || '저장된 공지를 확인할 수 없습니다.'}`;
        setBackendStatus(message);
        return message;
      }

      const { error: notificationError } = await supabase.functions.invoke('send-notice-notification', {
        body: { noticeId: data.id },
      });
      if (notificationError) {
        setBackendStatus(`공지 알림 실패: ${notificationError.message}`);
      }

      await loadBackendData();
      return '공지를 등록했습니다.';
    }

    const nowIso = new Date().toISOString();
    setNotices((current) => [
      {
        id: `notice-${Date.now()}`,
        category,
        title,
        content,
        important: draft.important,
        pinned: draft.pinned,
        allowComments: draft.allowComments,
        popup: draft.popup,
        popupUntil,
        author: currentUser.name,
        authorAvatarUrl: currentUser.avatarUrl || null,
        createdBy: currentUser.id,
        createdAt: nowIso,
        updatedAt: nowIso,
        comments: [],
      },
      ...current,
    ]);
    return '공지를 등록했습니다.';
  };

  const updateNotice: NoticeUpdateHandler = async (noticeId, draft) => {
    if (!currentUser) return '로그인이 필요합니다.';
    if (currentUser.accountRole !== 'admin') return '관리자만 공지를 수정할 수 있습니다.';
    const existing = notices.find((n) => n.id === noticeId);
    if (!existing) return '수정할 공지를 찾을 수 없습니다.';

    const title = draft.title.trim();
    const content = draft.content.trim();
    if (!title) return '공지 제목을 입력해주세요.';
    if (!content) return '공지 내용을 입력해주세요.';

    const category = draft.category?.trim() || '없음';
    const popupUntil = draft.popup && draft.popupUntil ? draft.popupUntil : null;

    if (supabase && !currentUser.isPrototype) {
      const { error } = await supabase
        .from('notices')
        .update({
          category,
          title,
          content,
          important: draft.important,
          pinned: draft.pinned,
          allow_comments: draft.allowComments,
          popup: draft.popup,
          popup_until: popupUntil,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noticeId);
      if (error) {
        const message = `공지 수정 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }
      await loadBackendData();
      return '공지를 수정했습니다.';
    }

    setNotices((current) =>
      current.map((n) =>
        n.id === noticeId
          ? {
              ...n,
              category,
              title,
              content,
              important: draft.important,
              pinned: draft.pinned,
              allowComments: draft.allowComments,
              popup: draft.popup,
              popupUntil,
              updatedAt: new Date().toISOString(),
            }
          : n,
      ),
    );
    return '공지를 수정했습니다.';
  };

  const deleteNotice: NoticeDeleteHandler = async (notice) => {
    if (!currentUser) return '로그인이 필요합니다.';
    if (currentUser.accountRole !== 'admin') return '관리자만 공지를 삭제할 수 있습니다.';
    if (!(await requestActionConfirm(`${notice.title} 공지를 삭제할까요?`))) return '취소했습니다.';

    if (supabase && !currentUser.isPrototype) {
      const { error } = await supabase.from('notices').delete().eq('id', notice.id);
      if (error) {
        const message = `공지 삭제 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }
      await loadBackendData();
      return '공지를 삭제했습니다.';
    }

    setNotices((current) => current.filter((n) => n.id !== notice.id));
    return '공지를 삭제했습니다.';
  };

  const togglePinNotice: NoticeTogglePinHandler = async (notice) => {
    if (!currentUser) return '로그인이 필요합니다.';
    if (currentUser.accountRole !== 'admin') return '관리자만 고정할 수 있습니다.';
    const nextPinned = !notice.pinned;

    if (supabase && !currentUser.isPrototype) {
      const { error } = await supabase
        .from('notices')
        .update({ pinned: nextPinned, updated_at: new Date().toISOString() })
        .eq('id', notice.id);
      if (error) {
        const message = `상단고정 변경 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }
      await loadBackendData();
      return nextPinned ? '공지를 상단고정했습니다.' : '상단고정을 해제했습니다.';
    }

    setNotices((current) => current.map((n) => (n.id === notice.id ? { ...n, pinned: nextPinned } : n)));
    return nextPinned ? '공지를 상단고정했습니다.' : '상단고정을 해제했습니다.';
  };

  const addNoticeComment: NoticeCommentSubmitHandler = async (notice, content, parentCommentId) => {
    if (!currentUser) return '로그인이 필요합니다.';
    if (!notice.allowComments) return '이 공지는 댓글이 허용되지 않습니다.';
    const trimmed = content.trim();
    if (!trimmed) return '댓글 내용을 입력해주세요.';

    if (supabase && !currentUser.isPrototype) {
      const { error } = await supabase.from('notice_comments').insert({
        notice_id: notice.id,
        parent_comment_id: parentCommentId || null,
        user_id: currentUser.id,
        content: trimmed,
      });
      if (error) {
        const message = `댓글 등록 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }
      await loadBackendData();
      return '댓글을 등록했습니다.';
    }

    const newComment: NoticeComment = {
      id: `nc-${Date.now()}`,
      noticeId: notice.id,
      parentId: parentCommentId || null,
      userId: currentUser.id,
      author: currentUser.name,
      avatarUrl: currentUser.avatarUrl || null,
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setNotices((current) =>
      current.map((n) => (n.id === notice.id ? { ...n, comments: [...n.comments, newComment] } : n)),
    );
    return '댓글을 등록했습니다.';
  };

  const deleteNoticeComment: NoticeCommentDeleteHandler = async (notice, comment) => {
    if (!currentUser) return '로그인이 필요합니다.';
    if (comment.userId !== currentUser.id && currentUser.accountRole !== 'admin') {
      return '본인이 작성한 댓글 또는 관리자만 삭제할 수 있습니다.';
    }
    if (!(await requestActionConfirm('이 댓글을 삭제할까요?'))) return '취소했습니다.';

    if (supabase && !currentUser.isPrototype) {
      const { error } = await supabase.from('notice_comments').delete().eq('id', comment.id);
      if (error) {
        const message = `댓글 삭제 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }
      await loadBackendData();
      return '댓글을 삭제했습니다.';
    }

    setNotices((current) =>
      current.map((n) =>
        n.id === notice.id ? { ...n, comments: n.comments.filter((c) => c.id !== comment.id) } : n,
      ),
    );
    return '댓글을 삭제했습니다.';
  };

  const markNoticesSeen = () => {
    const nowIso = new Date().toISOString();
    setNoticesLastSeen(nowIso);
    try {
      window.localStorage.setItem(NOTICES_LAST_SEEN_KEY, nowIso);
    } catch {
      /* localStorage 차단 환경은 무시 */
    }
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
          notice_enabled: preferences.notice,
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

  const createApiKey: ApiKeyCreateHandler = async (name, scope) => {
    const normalizedName = name.trim();
    if (!normalizedName) return { message: 'API 이름을 입력해주세요.' };
    if (currentUser?.accountRole !== 'admin') return { message: '관리자만 API 키를 생성할 수 있습니다.' };

    const secret = generateApiSecret();
    const keyHash = await sha256Hex(secret);
    const keyPrefix = `${secret.slice(0, 14)}...`;

    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase.from('api_keys').insert({
        name: normalizedName,
        scope,
        key_prefix: keyPrefix,
        key_hash: keyHash,
        created_by: currentUser.id,
      });

      if (error) {
        const message = `API 키 생성 실패: ${error.message}`;
        setBackendStatus(message);
        return { message };
      }

      await loadBackendData();
      return { message: 'API 키를 생성했습니다. 키는 이번에만 표시됩니다.', secret };
    }

    setApiKeys((current) => [
      {
        id: `api-${Date.now()}`,
        name: normalizedName,
        scope,
        keyPrefix,
        active: true,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ]);
    return { message: 'API 키를 생성했습니다. 키는 이번에만 표시됩니다.', secret };
  };

  const revokeApiKey: ApiKeyRevokeHandler = async (apiKey) => {
    if (currentUser?.accountRole !== 'admin') return '관리자만 API 키를 폐기할 수 있습니다.';
    if (!(await requestActionConfirm(`${apiKey.name} API 키를 폐기할까요?`))) return '취소했습니다.';

    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase
        .from('api_keys')
        .update({ active: false, revoked_at: new Date().toISOString() })
        .eq('id', apiKey.id);

      if (error) {
        const message = `API 키 폐기 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return 'API 키를 폐기했습니다.';
    }

    setApiKeys((current) => current.map((item) => (item.id === apiKey.id ? { ...item, active: false } : item)));
    return 'API 키를 폐기했습니다.';
  };

  const deleteApiKey: ApiKeyDeleteHandler = async (apiKey) => {
    if (currentUser?.accountRole !== 'admin') return '관리자만 API 키를 삭제할 수 있습니다.';
    if (apiKey.active) return '활성 API 키는 먼저 폐기한 뒤 삭제할 수 있습니다.';
    if (!(await requestActionConfirm(`${apiKey.name} API 키를 삭제할까요? 삭제된 키는 복구할 수 없습니다.`))) return '취소했습니다.';

    if (supabase && currentUser && !currentUser.isPrototype) {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', apiKey.id)
        .eq('active', false);

      if (error) {
        const message = `API 키 삭제 실패: ${error.message}`;
        setBackendStatus(message);
        return message;
      }

      await loadBackendData();
      return 'API 키를 삭제했습니다.';
    }

    setApiKeys((current) => current.filter((item) => item.id !== apiKey.id));
    return 'API 키를 삭제했습니다.';
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

    if (!title || !summary || !updates.type || !assignee || !project || !client || !updates.priority) {
      return '모든 항목을 입력해주세요.';
    }

    const nextDueAt = parseDueDate(updates.due);
    const nextStartAt = updates.startAt ? parseDueDate(updates.startAt) : null;

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
          start_at: nextStartAt,
          show_on_calendar: updates.showOnCalendar,
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
              startAt: nextStartAt,
              showOnCalendar: updates.showOnCalendar,
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
    try {
      if (!supabase || !currentUser || currentUser.isPrototype) {
        return '실제 로그인 후 푸시알림을 켤 수 있습니다.';
      }

      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        return '이 브라우저는 웹푸시를 지원하지 않습니다.';
      }

      const registration = await registerPlanderServiceWorker();
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

      const vapidPublicKey = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim();

      if (!vapidPublicKey || vapidPublicKey.length < 80) {
        return '푸시알림 키가 배포 환경에 설정되지 않았습니다.';
      }

      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        return '브라우저 알림 권한이 허용되지 않았습니다.';
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
        await subscription.unsubscribe().catch(() => undefined);
        return `푸시 구독 저장 실패: ${error.message}`;
      }

      setPushEnabled(true);
      return '이 기기에서 업무 푸시알림이 켜졌습니다.';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `푸시알림 설정 실패: ${message}`;
    }
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

  const persistThemePreferences = async (nextThemeMode: ThemeMode, nextColorTheme: ColorTheme) => {
    if (!currentUser || currentUser.isPrototype || !supabase) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        theme_mode: nextThemeMode,
        color_theme: nextColorTheme,
      })
      .eq('id', currentUser.id);

    if (error) {
      setBackendStatus(`테마 설정은 이 기기에 저장됨: ${error.message}`);
    }
  };

  const changeThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    setColorTheme('default');
    void persistThemePreferences(mode, 'default');
  };

  const changeColorTheme = (_nextColorTheme: ColorTheme) => {
    setColorTheme('default');
    void persistThemePreferences(themeMode, 'default');
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
        onThemeChange={changeThemeMode}
        onPrototypeLogin={handlePrototypeLogin}
      />
    );
  }

  const isAdmin = currentUser.accountRole === 'admin';
  const canControlThemeMode = true;

  // 인라인 편집 — 빈 제목 허용(드래프트 상태 가능). 토스트 없이 조용히 반영.
  // 낙관적 업데이트: 먼저 state에 추가, Supabase 응답으로 ID 교체.
  const addJournalEntry = async (draft: WorkJournalEntryDraft): Promise<string> => {
    const weekStart = getJournalWeekStart(draft.date);
    const tempId = `jrn-${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date().toISOString();
    const optimistic: WorkJournalEntry = {
      id: tempId,
      userId: currentUser.id,
      weekStart,
      date: draft.date,
      kind: draft.kind,
      title: draft.title.trim(),
      detail: draft.detail?.trim() || '',
      status: draft.status,
      projectId: draft.projectId ?? null,
      source: 'manual',
      edited: false,
      hidden: false,
      createdAt: now,
      updatedAt: now,
    };
    setJournalEntries((current) => [...current, optimistic]);

    if (supabase && !currentUser.isPrototype) {
      const { data, error } = await supabase
        .from('work_journal_entries')
        .insert({
          user_id: currentUser.id,
          week_start: weekStart,
          date: draft.date,
          kind: draft.kind,
          title: optimistic.title,
          detail: optimistic.detail,
          status: optimistic.status,
          project_id: optimistic.projectId,
          source: 'manual',
        })
        .select('id')
        .single();
      if (error || !data) {
        // 실패 시 optimistic entry 롤백
        setJournalEntries((current) => current.filter((e) => e.id !== tempId));
        setBackendStatus(`일지 추가 실패: ${error?.message || '알 수 없음'}`);
        return tempId;
      }
      // tempId → 실제 id로 교체
      const realId = data.id;
      setJournalEntries((current) => current.map((e) => (e.id === tempId ? { ...e, id: realId } : e)));
      return realId;
    }
    return tempId;
  };

  const patchJournalEntry = (entryId: string, patch: Partial<WorkJournalEntry>) => {
    const now = new Date().toISOString();
    // 낙관적: 먼저 state 갱신
    let nextWeekStart: string | undefined;
    setJournalEntries((current) =>
      current.map((entry) => {
        if (entry.id !== entryId) return entry;
        const next: WorkJournalEntry = { ...entry, ...patch, updatedAt: now };
        if (patch.date !== undefined) {
          next.weekStart = getJournalWeekStart(next.date);
          nextWeekStart = next.weekStart;
        }
        if (entry.source !== 'manual') {
          next.edited = true;
        }
        return next;
      }),
    );

    if (supabase && !currentUser.isPrototype) {
      // 컬럼명 매핑 — camelCase 패치 → snake_case
      const dbPatch: Record<string, unknown> = {};
      if (patch.date !== undefined) {
        dbPatch.date = patch.date;
        dbPatch.week_start = nextWeekStart || getJournalWeekStart(patch.date);
      }
      if (patch.kind !== undefined) dbPatch.kind = patch.kind;
      if (patch.title !== undefined) dbPatch.title = patch.title;
      if (patch.detail !== undefined) dbPatch.detail = patch.detail;
      if (patch.status !== undefined) dbPatch.status = patch.status;
      if (patch.projectId !== undefined) dbPatch.project_id = patch.projectId;
      if (patch.clientId !== undefined) dbPatch.client_id = patch.clientId;
      if (patch.hidden !== undefined) dbPatch.hidden = patch.hidden;
      if (Object.keys(dbPatch).length === 0) return;

      void supabase
        .from('work_journal_entries')
        .update(dbPatch)
        .eq('id', entryId)
        .then(({ error }) => {
          if (error) setBackendStatus(`일지 수정 실패: ${error.message}`);
        });
    }
  };

  const deleteJournalEntry = async (entry: WorkJournalEntry): Promise<string> => {
    setJournalEntries((current) => current.filter((item) => item.id !== entry.id));
    if (supabase && !currentUser.isPrototype) {
      const { error } = await supabase.from('work_journal_entries').delete().eq('id', entry.id);
      if (error) {
        setBackendStatus(`일지 삭제 실패: ${error.message}`);
        return `일지 삭제 실패: ${error.message}`;
      }
    }
    return '일지 항목을 삭제했습니다.';
  };

  const addJournalStatus = (name: string, phase: JournalStatusPhase): string => {
    const trimmed = name.trim();
    if (!trimmed) return '상태 이름을 입력해주세요.';
    if (journalStatusPalette.some((s) => s.name === trimmed)) return '이미 같은 이름의 상태가 있습니다.';
    const id = `st-${Math.random().toString(36).slice(2, 8)}`;
    setJournalStatusPalette((current) => [...current, { id, name: trimmed, phase }]);

    if (supabase && !currentUser.isPrototype) {
      const sortOrder = (journalStatusPalette.length + 1) * 10;
      void supabase
        .from('journal_status_defs')
        .insert({ id, name: trimmed, phase, sort_order: sortOrder })
        .then(({ error }) => {
          if (error) {
            // 롤백
            setJournalStatusPalette((current) => current.filter((s) => s.id !== id));
            setBackendStatus(`상태 추가 실패: ${error.message}`);
          }
        });
    }
    return '상태를 추가했습니다.';
  };

  const updateJournalStatus = (id: string, patch: Partial<Pick<JournalStatusDef, 'name' | 'phase'>>): string => {
    const trimmedName = patch.name?.trim();
    if (trimmedName !== undefined && !trimmedName) return '상태 이름을 입력해주세요.';
    if (trimmedName) {
      const conflict = journalStatusPalette.find((s) => s.name === trimmedName && s.id !== id);
      if (conflict) return '이미 같은 이름의 상태가 있습니다.';
    }
    const before = journalStatusPalette.find((s) => s.id === id);
    if (!before) return '상태를 찾을 수 없습니다.';
    const nextName = trimmedName ?? before.name;
    setJournalStatusPalette((current) =>
      current.map((s) => (s.id === id ? { ...s, ...(patch.name !== undefined ? { name: nextName } : {}), ...(patch.phase ? { phase: patch.phase } : {}) } : s)),
    );
    // 이름이 변경되면 기존 일지 항목도 같이 갱신 (state만 — DB는 status를 자유 텍스트로 저장하므로 일괄 update 필요)
    if (trimmedName && trimmedName !== before.name) {
      setJournalEntries((current) =>
        current.map((entry) => (entry.status === before.name ? { ...entry, status: trimmedName } : entry)),
      );
    }

    if (supabase && !currentUser.isPrototype) {
      const dbPatch: Record<string, unknown> = {};
      if (patch.name !== undefined) dbPatch.name = nextName;
      if (patch.phase) dbPatch.phase = patch.phase;
      if (Object.keys(dbPatch).length > 0) {
        void supabase
          .from('journal_status_defs')
          .update(dbPatch)
          .eq('id', id)
          .then(({ error }) => {
            if (error) setBackendStatus(`상태 수정 실패: ${error.message}`);
          });
      }
      // 이름이 변경되면 해당 status를 쓰는 모든 entries도 DB에서 일괄 update
      if (trimmedName && trimmedName !== before.name) {
        void supabase
          .from('work_journal_entries')
          .update({ status: trimmedName })
          .eq('status', before.name)
          .then(({ error }) => {
            if (error) setBackendStatus(`상태 이름 동기화 실패: ${error.message}`);
          });
      }
    }
    return '상태를 수정했습니다.';
  };

  const deleteJournalStatus = (id: string): string => {
    const target = journalStatusPalette.find((s) => s.id === id);
    if (!target) return '상태를 찾을 수 없습니다.';
    setJournalStatusPalette((current) => current.filter((s) => s.id !== id));

    if (supabase && !currentUser.isPrototype) {
      void supabase
        .from('journal_status_defs')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            // 롤백
            setJournalStatusPalette((current) => [...current, target]);
            setBackendStatus(`상태 삭제 실패: ${error.message}`);
          }
        });
    }
    return '상태를 삭제했습니다.';
  };

  // ─── 종류(kind) 팔레트 핸들러 — 관리자 권한 ───────────────────────
  const addJournalKind = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '종류 이름을 입력해주세요.';
    if (journalKindPalette.some((k) => k.name === trimmed)) return '이미 같은 이름의 종류가 있습니다.';
    const id = `k-${Math.random().toString(36).slice(2, 8)}`;
    setJournalKindPalette((current) => [...current, { id, name: trimmed }]);

    if (supabase && !currentUser.isPrototype) {
      const sortOrder = (journalKindPalette.length + 1) * 10;
      void supabase
        .from('journal_kind_defs')
        .insert({ id, name: trimmed, sort_order: sortOrder })
        .then(({ error }) => {
          if (error) {
            setJournalKindPalette((current) => current.filter((k) => k.id !== id));
            setBackendStatus(`종류 추가 실패: ${error.message}`);
          }
        });
    }
    return '종류를 추가했습니다.';
  };

  const updateJournalKind = (id: string, patch: { name?: string }): string => {
    const trimmedName = patch.name?.trim();
    if (trimmedName !== undefined && !trimmedName) return '종류 이름을 입력해주세요.';
    if (trimmedName) {
      const conflict = journalKindPalette.find((k) => k.name === trimmedName && k.id !== id);
      if (conflict) return '이미 같은 이름의 종류가 있습니다.';
    }
    const before = journalKindPalette.find((k) => k.id === id);
    if (!before) return '종류를 찾을 수 없습니다.';
    const nextName = trimmedName ?? before.name;
    setJournalKindPalette((current) =>
      current.map((k) => (k.id === id ? { ...k, name: nextName } : k)),
    );
    // 이름 변경 시 entries.kind 일괄 동기화
    if (trimmedName && trimmedName !== before.name) {
      setJournalEntries((current) =>
        current.map((entry) => (entry.kind === before.name ? { ...entry, kind: trimmedName } : entry)),
      );
    }

    if (supabase && !currentUser.isPrototype) {
      if (patch.name !== undefined) {
        void supabase
          .from('journal_kind_defs')
          .update({ name: nextName })
          .eq('id', id)
          .then(({ error }) => {
            if (error) setBackendStatus(`종류 수정 실패: ${error.message}`);
          });
      }
      if (trimmedName && trimmedName !== before.name) {
        void supabase
          .from('work_journal_entries')
          .update({ kind: trimmedName })
          .eq('kind', before.name)
          .then(({ error }) => {
            if (error) setBackendStatus(`종류 이름 동기화 실패: ${error.message}`);
          });
      }
    }
    return '종류를 수정했습니다.';
  };

  const deleteJournalKind = (id: string): string => {
    const target = journalKindPalette.find((k) => k.id === id);
    if (!target) return '종류를 찾을 수 없습니다.';
    setJournalKindPalette((current) => current.filter((k) => k.id !== id));

    if (supabase && !currentUser.isPrototype) {
      void supabase
        .from('journal_kind_defs')
        .delete()
        .eq('id', id)
        .then(({ error }) => {
          if (error) {
            setJournalKindPalette((current) => [...current, target]);
            setBackendStatus(`종류 삭제 실패: ${error.message}`);
          }
        });
    }
    return '종류를 삭제했습니다.';
  };

  // 이번주 진행중 계약·할일 (간단 테이블)
  const addWeeklyContract = async (weekStart: string): Promise<string> => {
    const userContracts = weeklyContracts.filter((c) => c.userId === currentUser.id && c.weekStart === weekStart);
    const nextSeq = userContracts.length ? Math.max(...userContracts.map((c) => c.sequence)) + 1 : 1;
    const tempId = `wc-${Math.random().toString(36).slice(2, 10)}`;
    const optimistic: WeeklyContract = {
      id: tempId,
      userId: currentUser.id,
      weekStart,
      sequence: nextSeq,
      company: '',
      dueDate: '',
      notes: '',
    };
    setWeeklyContracts((current) => [...current, optimistic]);

    if (supabase && !currentUser.isPrototype) {
      const { data, error } = await supabase
        .from('weekly_contracts')
        .insert({
          user_id: currentUser.id,
          week_start: weekStart,
          sequence: nextSeq,
          company: '',
          due_date: '',
          notes: '',
        })
        .select('id')
        .single();
      if (error || !data) {
        setWeeklyContracts((current) => current.filter((c) => c.id !== tempId));
        setBackendStatus(`계약 추가 실패: ${error?.message || '알 수 없음'}`);
        return tempId;
      }
      const realId = data.id;
      setWeeklyContracts((current) => current.map((c) => (c.id === tempId ? { ...c, id: realId } : c)));
      return realId;
    }
    return tempId;
  };

  const patchWeeklyContract = (id: string, patch: Partial<WeeklyContract>): void => {
    setWeeklyContracts((current) => current.map((c) => (c.id === id ? { ...c, ...patch } : c)));

    if (supabase && !currentUser.isPrototype) {
      const dbPatch: Record<string, unknown> = {};
      if (patch.company !== undefined) dbPatch.company = patch.company;
      if (patch.dueDate !== undefined) dbPatch.due_date = patch.dueDate;
      if (patch.notes !== undefined) dbPatch.notes = patch.notes;
      if (patch.sequence !== undefined) dbPatch.sequence = patch.sequence;
      if (Object.keys(dbPatch).length === 0) return;
      void supabase
        .from('weekly_contracts')
        .update(dbPatch)
        .eq('id', id)
        .then(({ error }) => {
          if (error) setBackendStatus(`계약 수정 실패: ${error.message}`);
        });
    }
  };

  const deleteWeeklyContract = (contract: WeeklyContract): string => {
    setWeeklyContracts((current) => current.filter((c) => c.id !== contract.id));
    if (supabase && !currentUser.isPrototype) {
      void supabase
        .from('weekly_contracts')
        .delete()
        .eq('id', contract.id)
        .then(({ error }) => {
          if (error) {
            // 롤백
            setWeeklyContracts((current) => [...current, contract]);
            setBackendStatus(`계약 삭제 실패: ${error.message}`);
          }
        });
    }
    return '항목을 삭제했습니다.';
  };

  const immersiveChromeProps = {
    currentUser,
    pushEnabled,
    pushLoading,
    pushStatus,
    themeMode,
    showThemeSwitcher: canControlThemeMode,
    onClosePage: () => navigateTo('dashboard'),
    onLogout: handleLogout,
    onMenuClick: () => setSidebarOpen(true),
    onNavigate: navigateTo,
    onOpenProfile: () => setProfileOpen(true),
    onRegisterPush: handleRegisterPush,
    onThemeChange: changeThemeMode,
  };
  const isImmersiveView = ['project', 'reports', 'allTasks', 'inbox', 'sent', 'clients', 'operations', 'calendar', 'meetingMinutes', 'notices', 'journal'].includes(activeView);

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
        onPermanentDeleteProject={permanentlyDeleteProject}
        onRestoreProject={(project) => updateProjectStatus(project, 'active')}
        badges={navBadges}
        projects={projects}
        projectUnreadCounts={projectUnreadCounts}
        showAdmin={isAdmin}
        showInstallButton={!appInstalled}
      />
      <div className="mobile-overlay" data-open={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      {projectCreateOpen ? (
        <ProjectCreateModal
          clients={clients}
          currentUser={currentUser}
          employees={employees}
          onClose={() => setProjectCreateOpen(false)}
          onAddClient={addClient}
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
          onAddClient={addClient}
          onCreateProject={createProject}
          onUpdateProject={updateProject}
          project={editingProject}
        />
      ) : null}

      {swipeOffset !== 0 ? (
        <SwipePreview
          direction={swipeOffset > 0 ? 'back' : 'forward'}
          offset={Math.abs(swipeOffset)}
          targetView={swipeOffset > 0 ? viewHistory[viewHistory.length - 1] : forwardHistory[0]}
        />
      ) : null}

      <main
        className="workspace"
        data-immersive={isImmersiveView}
        data-swiping={swipeDragging}
        onTouchStart={handleWorkspaceTouchStart}
        onTouchMove={handleWorkspaceTouchMove}
        onTouchEnd={handleWorkspaceTouchEnd}
        style={swipeOffset !== 0 ? { transform: `translateX(${swipeOffset}px)` } : undefined}
      >
        <Topbar
          currentUser={currentUser}
          pushEnabled={pushEnabled}
          pushLoading={pushLoading}
          pushStatus={pushStatus}
          showSearch={false}
          themeMode={themeMode}
          showThemeSwitcher={canControlThemeMode}
          onLogout={handleLogout}
          onNavigate={navigateTo}
          onOpenProfile={() => setProfileOpen(true)}
          onRegisterPush={handleRegisterPush}
          onThemeChange={changeThemeMode}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {activeView === 'dashboard' ? (
          <>
            <Dashboard
              stats={dashboardStats}
              tasks={inboxTasks}
              sentTasks={sentTasks}
              reportTasks={reportTasks}
              clients={clients}
              employees={employees}
              onNavigate={navigateTo}
              onOpenTask={openDashboardTask}
              currentUser={currentUser}
            />
            <NoticePopup notices={notices} ready={noticesReady} onOpenNotices={() => navigateTo('notices')} />
          </>
        ) : null}
        {activeView === 'inbox' ? (
          <TaskListPage {...immersiveChromeProps} title="받은 업무" initialStatus={taskListFilters.inbox || '전체'} initialFocusedTaskId={focusTaskId} tasks={inboxTasks} employees={employees} onAddComment={addTaskComment} onDeleteComment={deleteTaskComment} onDownloadFile={openTaskFile} onEditTask={(task) => setEditingTaskId(task.id)} onMarkTaskRead={markTaskRead} onOpenTask={(task) => setSelectedTaskId(task.id)} onDeleteTask={deleteTask} onUpdateTaskStatus={updateTaskStatus} />
        ) : null}
        {activeView === 'sent' ? (
          <TaskListPage {...immersiveChromeProps} title="보낸 업무" initialStatus={taskListFilters.sent || '전체'} initialFocusedTaskId={focusTaskId} tasks={sentTasks} employees={employees} onAddComment={addTaskComment} onDeleteComment={deleteTaskComment} onDownloadFile={openTaskFile} onEditTask={(task) => setEditingTaskId(task.id)} onMarkTaskRead={markTaskRead} onOpenTask={(task) => setSelectedTaskId(task.id)} onDeleteTask={deleteTask} onUpdateTaskStatus={updateTaskStatus} />
        ) : null}
        {activeView === 'create' ? <TaskCreatePage clients={clients} employees={employees} projects={projects} taskTypes={taskTypes} onCreateTask={createTask} /> : null}
        {activeView === 'reports' ? (
          <ReportsPage
            {...immersiveChromeProps}
            tasks={reportTasks}
            initialFocusedTaskId={focusTaskId}
            employees={employees}
            onAddComment={addTaskComment}
            onCreateTask={createTask}
            onDeleteComment={deleteTaskComment}
            onDeleteTask={deleteTask}
            onDownloadFile={openTaskFile}
            onEditTask={(task) => setEditingTaskId(task.id)}
            onMarkTaskRead={markTaskRead}
            onUpdateTaskStatus={updateTaskStatus}
          />
        ) : null}
        {activeView === 'meetingMinutes' ? (
          <MeetingMinutesPage
            {...immersiveChromeProps}
            categories={meetingMinuteCategories}
            employees={employees}
            minutes={meetingMinutes}
            projects={projects}
            onCreateMinute={addMeetingMinute}
            onDeleteMinute={deleteMeetingMinute}
            onUpdateMinute={updateMeetingMinute}
          />
        ) : null}
        {activeView === 'journal' ? (
          <JournalPage
            {...immersiveChromeProps}
            entries={journalEntries}
            employees={employees}
            projects={projects}
            statusPalette={journalStatusPalette}
            kindPalette={journalKindPalette}
            contracts={weeklyContracts}
            onAddJournalEntry={addJournalEntry}
            onPatchJournalEntry={patchJournalEntry}
            onDeleteJournalEntry={deleteJournalEntry}
            onAddJournalStatus={addJournalStatus}
            onUpdateJournalStatus={updateJournalStatus}
            onDeleteJournalStatus={deleteJournalStatus}
            onAddJournalKind={addJournalKind}
            onUpdateJournalKind={updateJournalKind}
            onDeleteJournalKind={deleteJournalKind}
            onAddWeeklyContract={addWeeklyContract}
            onPatchWeeklyContract={patchWeeklyContract}
            onDeleteWeeklyContract={deleteWeeklyContract}
          />
        ) : null}
        {activeView === 'notices' ? (
          <NoticesPage
            {...immersiveChromeProps}
            categories={noticeCategories}
            notices={notices}
            currentUserId={currentUser?.id || null}
            isAdmin={isAdmin}
            onCreateNotice={addNotice}
            onUpdateNotice={updateNotice}
            onDeleteNotice={deleteNotice}
            onTogglePin={togglePinNotice}
            onAddComment={addNoticeComment}
            onDeleteComment={deleteNoticeComment}
          />
        ) : null}
        {activeView === 'allTasks' ? (
          <TaskListPage
            {...immersiveChromeProps}
            title="전체 업무보기"
            initialStatus={taskListFilters.allTasks || '전체'}
            tasks={visibleTasks}
            employees={employees}
            onAddComment={addTaskComment}
            onDeleteComment={deleteTaskComment}
            onDownloadFile={openTaskFile}
            onEditTask={(task) => setEditingTaskId(task.id)}
            onMarkTaskRead={markTaskRead}
            onOpenTask={(task) => setSelectedTaskId(task.id)}
            onDeleteTask={deleteTask}
            onUpdateTaskStatus={updateTaskStatus}
          />
        ) : null}
        {activeView === 'project' ? (
          <ProjectPage
            clients={clients}
            currentUser={currentUser}
            employees={employees}
            initialFocusedTaskId={focusTaskId}
            messages={selectedProjectMessages}
            project={selectedProject}
            projects={projects}
            pushEnabled={pushEnabled}
            pushLoading={pushLoading}
            pushStatus={pushStatus}
            taskTypes={taskTypes}
            tasks={selectedProjectTasks}
            themeMode={themeMode}
            showThemeSwitcher={canControlThemeMode}
            onAddComment={addTaskComment}
            onAddMessage={addProjectMessage}
            onCreateProject={() => setProjectCreateOpen(true)}
            onCreateTask={createProjectTask}
            onDeleteTask={deleteTask}
            onDeleteComment={deleteTaskComment}
            onDownloadFile={openTaskFile}
            onEditProject={(projectId) => setEditingProjectId(projectId)}
            onEditTask={(task) => setEditingTaskId(task.id)}
            onLogout={handleLogout}
            onMarkTaskRead={markTaskRead}
            onMenuClick={() => setSidebarOpen(true)}
            onMarkMessagesRead={markProjectMessagesRead}
            onNavigate={navigateTo}
            onOpenProfile={() => setProfileOpen(true)}
            onOpenProject={openProject}
            onRegisterPush={handleRegisterPush}
            onThemeChange={changeThemeMode}
            onTrashProject={(project) => updateProjectStatus(project, 'deleted')}
            onUpdateTaskStatus={updateTaskStatus}
          />
        ) : null}
        {activeView === 'calendar' ? (
          <CalendarPage
            {...immersiveChromeProps}
            googleCalendarSettings={googleCalendarSettings}
            operations={isAdmin ? operations : []}
            schedules={workSchedules}
            onAddSchedule={addWorkSchedule}
            onDeleteSchedule={deleteWorkSchedule}
            onUpdateSchedule={updateWorkSchedule}
            onOpenOperations={() => navigateTo('operations')}
            onOpenTask={(task) => setSelectedTaskId(task.id)}
            tasks={tasks}
            employees={employees}
          />
        ) : null}
        {activeView === 'clients' ? <ClientsPage {...immersiveChromeProps} clients={clients} employees={employees} onAddClient={addClient} onDeleteClient={deleteClient} onUpdateClient={updateClient} /> : null}
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
            {...immersiveChromeProps}
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
            apiKeys={apiKeys}
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
            meetingMinuteCategories={meetingMinuteCategories}
            onAddMeetingMinuteCategory={addMeetingMinuteCategory}
            onDeleteMeetingMinuteCategory={deleteMeetingMinuteCategory}
            noticeCategories={noticeCategories}
            onAddNoticeCategory={addNoticeCategory}
            onDeleteNoticeCategory={deleteNoticeCategory}
            onCreateApiKey={createApiKey}
            onDeleteApiKey={deleteApiKey}
            onRevokeApiKey={revokeApiKey}
            onDeleteTaskType={deleteTaskType}
            onSaveGoogleCalendarSettings={saveGoogleCalendarSettings}
            onUpdatePushPreferences={updatePushPreferences}
            onUpdateOwnProfile={updateOwnProfile}
            colorTheme={colorTheme}
            onColorThemeChange={changeColorTheme}
            onThemeChange={changeThemeMode}
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
  const storedLoginPrefs = useMemo(() => {
    try {
      return JSON.parse(window.localStorage.getItem(LOGIN_PREFS_STORAGE_KEY) || '{}') as {
        email?: string;
        password?: string;
        rememberCredentials?: boolean;
        autoLogin?: boolean;
      };
    } catch {
      return {};
    }
  }, []);
  const [email, setEmail] = useState(storedLoginPrefs.email || '');
  const [password, setPassword] = useState(storedLoginPrefs.password || '');
  const [rememberCredentials, setRememberCredentials] = useState(Boolean(storedLoginPrefs.rememberCredentials));
  const [autoLogin, setAutoLogin] = useState(Boolean(storedLoginPrefs.autoLogin && storedLoginPrefs.email && storedLoginPrefs.password));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const autoLoginAttempted = useRef(false);

  const persistLoginPreferences = (nextEmail: string, nextPassword: string, remember: boolean, auto: boolean) => {
    if (!remember && !auto) {
      window.localStorage.removeItem(LOGIN_PREFS_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(LOGIN_PREFS_STORAGE_KEY, JSON.stringify({
      email: nextEmail,
      password: nextPassword,
      rememberCredentials: true,
      autoLogin: auto,
    }));
  };

  const submitLogin = async (isAutomatic = false) => {
    setError('');

    if (!supabase) {
      setError('Supabase 환경변수가 아직 설정되지 않았습니다.');
      return false;
    }

    setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (loginError) {
      setError('이메일 또는 비밀번호를 확인해주세요.');
      return false;
    }

    if (!isAutomatic) persistLoginPreferences(email, password, rememberCredentials || autoLogin, autoLogin);
    window.sessionStorage.removeItem(SKIP_AUTO_LOGIN_SESSION_KEY);
    return true;
  };

  useEffect(() => {
    if (autoLoginAttempted.current || !autoLogin || !email || !password) return;
    if (window.sessionStorage.getItem(SKIP_AUTO_LOGIN_SESSION_KEY) === '1') return;
    autoLoginAttempted.current = true;
    void submitLogin(true);
  }, [autoLogin, email, password]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitLogin(false);
  };

  const toggleRememberCredentials = (checked: boolean) => {
    setRememberCredentials(checked);
    if (!checked) {
      setAutoLogin(false);
      window.localStorage.removeItem(LOGIN_PREFS_STORAGE_KEY);
    }
  };

  return (
    <main className="auth-shell">
      <img className="auth-logo" src="/plander-admin-logo.svg" alt="Plander Works" />

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
          <div className="login-options">
            <label>
              <span>아이디/비밀번호 기억하기</span>
              <input
                checked={rememberCredentials}
                onChange={(event) => toggleRememberCredentials(event.target.checked)}
                type="checkbox"
              />
            </label>
            <label>
              <span>자동로그인</span>
              <input
                checked={autoLogin}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setAutoLogin(checked);
                  if (checked) setRememberCredentials(true);
                }}
                type="checkbox"
              />
            </label>
          </div>
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
  onAddClient,
  onCreateProject,
  onUpdateProject,
  project,
}: {
  clients: Client[];
  currentUser: AppUser;
  employees: Employee[];
  onClose: () => void;
  onAddClient: ClientSubmitHandler;
  onCreateProject: ProjectSubmitHandler;
  onUpdateProject?: ProjectUpdateHandler;
  project?: Project | null;
}) {
  const defaultManager = employees[0]?.name || '';
  const [form, setForm] = useState<ProjectDraft>({
    name: project?.name || '',
    clientId: project?.clientId || clients[0]?.id || '',
    memberIds: project?.memberIds?.length ? project.memberIds : [currentUser.id],
  });
  const [regions, setRegions] = useState(['서울', '경기', '제주', '부산', '대구', '평택']);
  const [newRegion, setNewRegion] = useState('');
  const [clientCreateOpen, setClientCreateOpen] = useState(false);
  const [clientForm, setClientForm] = useState<Omit<Client, 'id'>>({
    name: '',
    manager: defaultManager,
    phone: '',
    region: regions[0],
    memo: '',
  });
  const [clientLoading, setClientLoading] = useState(false);
  const [pendingClientName, setPendingClientName] = useState('');
  const [loading, setLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const isEdit = Boolean(project);
  const isCompleted = project?.status === 'completed';

  useEffect(() => {
    if (!form.clientId && clients[0]?.id) {
      setForm((current) => ({ ...current, clientId: clients[0].id }));
    }
    if (pendingClientName) {
      const nextClient = clients.find((client) => client.name === pendingClientName);
      if (nextClient) {
        setForm((current) => ({ ...current, clientId: nextClient.id }));
        setPendingClientName('');
      }
    }
  }, [clients, form.clientId, pendingClientName]);

  useEffect(() => {
    if (!employees.length) return;
    setClientForm((current) => (employees.some((employee) => employee.name === current.manager) ? current : { ...current, manager: employees[0].name }));
  }, [employees]);

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

  const addRegion = () => {
    const nextRegion = newRegion.trim();
    if (!nextRegion || regions.includes(nextRegion)) return;
    setRegions((current) => [...current, nextRegion]);
    setClientForm((current) => ({ ...current, region: nextRegion }));
    setNewRegion('');
  };

  const deleteRegion = (region: string) => {
    setRegions((current) => {
      const nextRegions = current.filter((item) => item !== region);
      const fallbackRegion = nextRegions[0] || '';
      setClientForm((formCurrent) => ({ ...formCurrent, region: formCurrent.region === region ? fallbackRegion : formCurrent.region }));
      return nextRegions;
    });
  };

  const submitClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (clientLoading) return;
    if (!clientForm.name.trim()) {
      showActionPopup('업체명을 입력해주세요.');
      return;
    }
    if (!clientForm.manager) {
      showActionPopup('담당자를 선택해주세요.');
      return;
    }

    setClientLoading(true);
    const nextClientName = clientForm.name.trim();
    const message = await onAddClient({ ...clientForm, name: nextClientName });
    setClientLoading(false);
    showActionPopup(message);
    if (!message.includes('실패')) {
      setPendingClientName(nextClientName);
      setClientForm({ name: '', manager: employees[0]?.name || '', phone: '', region: regions[0] || '', memo: '' });
      setClientCreateOpen(false);
    }
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

  const completeProject = async () => {
    if (!project || !onUpdateProject || loading || completeLoading) return;
    if (!(await requestActionConfirm('프로젝트를 완료 처리할까요? 완료된 프로젝트 메뉴로 이동됩니다.'))) return;

    setCompleteLoading(true);
    const message = await onUpdateProject(project.id, { ...form, status: 'completed' });
    setCompleteLoading(false);
    showActionPopup(message);
    if (!message.includes('실패') && !message.includes('선택') && !message.includes('입력')) onClose();
  };

  const reactivateProject = async () => {
    if (!project || !onUpdateProject || loading || completeLoading) return;
    if (!(await requestActionConfirm('프로젝트를 다시 진행중 프로젝트로 옮길까요?'))) return;

    setCompleteLoading(true);
    const message = await onUpdateProject(project.id, { ...form, status: 'active' });
    setCompleteLoading(false);
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
          <div className="inline-select-action">
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
            <button className="icon-button" aria-label="업체 추가" onClick={() => setClientCreateOpen(true)} type="button">
              <Plus size={18} />
            </button>
          </div>
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
        {isEdit ? (
          <button className="secondary-action wide" disabled={loading || completeLoading || !clients.length} onClick={isCompleted ? reactivateProject : completeProject} type="button">
            <CheckCircle2 size={17} />
            {completeLoading ? '진행중...' : isCompleted ? '프로젝트 다시 진행' : '프로젝트 완료'}
          </button>
        ) : null}
      </form>
      {clientCreateOpen ? (
        <div
          className="modal-backdrop nested-modal-backdrop"
          role="presentation"
          onClick={(event) => {
            event.stopPropagation();
            setClientCreateOpen(false);
          }}
        >
          <form className="modal-card form-stack" onClick={(event) => event.stopPropagation()} onSubmit={submitClient}>
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
              업체명 <span className="required-mark">*</span>
              <input autoFocus value={clientForm.name} onChange={(event) => setClientForm({ ...clientForm, name: event.target.value })} />
            </label>
            <label>
              담당자 <span className="required-mark">*</span>
              <select value={clientForm.manager} onChange={(event) => setClientForm({ ...clientForm, manager: event.target.value })}>
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
                value={clientForm.phone}
                onChange={(event) => setClientForm({ ...clientForm, phone: formatMobilePhone(event.target.value) })}
              />
            </label>
            <label>
              지역
              <RegionEditor
                regions={regions}
                selectedRegion={clientForm.region}
                newRegion={newRegion}
                onAdd={addRegion}
                onChangeNewRegion={setNewRegion}
                onDelete={deleteRegion}
                onSelect={(region) => setClientForm({ ...clientForm, region })}
              />
            </label>
            <label>
              메모
              <textarea value={clientForm.memo} onChange={(event) => setClientForm({ ...clientForm, memo: event.target.value })} />
            </label>
            <div className="modal-action-bar">
              <button className="primary-action wide" disabled={clientLoading} type="submit">
                <Plus size={17} />
                {clientLoading ? '진행중...' : '업체 추가'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
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
  onPermanentDeleteProject,
  onRestoreProject,
  projects,
  projectUnreadCounts,
  showAdmin,
  showInstallButton,
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
  onPermanentDeleteProject: ProjectPermanentDeleteHandler;
  onRestoreProject: ProjectStatusHandler;
  projects: Project[];
  projectUnreadCounts: Record<string, number>;
  showAdmin: boolean;
  showInstallButton: boolean;
  unreadBadges: Partial<Record<ActiveView, number>>;
}) {
  const [adminOpen, setAdminOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [completedProjectsOpen, setCompletedProjectsOpen] = useState(false);
  const [completedYearOpen, setCompletedYearOpen] = useState<Record<string, boolean>>({});
  const [trashOpen, setTrashOpen] = useState(false);
  const [trashLoadingId, setTrashLoadingId] = useState<string | null>(null);
  const activeProjects = projects.filter((project) => project.status !== 'completed' && project.status !== 'deleted');
  const completedProjects = projects.filter((project) => project.status === 'completed');
  const deletedProjects = projects.filter((project) => project.status === 'deleted');
  const activeProjectUnread = activeProjects.reduce((sum, project) => sum + (projectUnreadCounts[project.id] || 0), 0);
  const completedProjectUnread = completedProjects.reduce((sum, project) => sum + (projectUnreadCounts[project.id] || 0), 0);
  const completedProjectsByYear = Object.entries(
    completedProjects.reduce<Record<string, Project[]>>((groups, project) => {
      const yearSource = project.updatedAt || project.createdAt;
      const date = yearSource ? new Date(yearSource) : new Date();
      const year = Number.isNaN(date.getTime()) ? String(new Date().getFullYear()) : String(date.getFullYear());
      return {
        ...groups,
        [year]: [...(groups[year] || []), project],
      };
    }, {}),
  ).sort(([firstYear], [secondYear]) => Number(secondYear) - Number(firstYear));

  const renderProjectButton = (project: Project) => {
    const unreadCount = projectUnreadCounts[project.id] || 0;
    return (
      <button
        className="project-nav-button"
        data-active={activeProjectId === project.id}
        data-unread={unreadCount > 0}
        key={project.id}
        onClick={() => onOpenProject(project.id)}
        type="button"
      >
        <FolderKanban size={18} />
        <span>{project.name}</span>
        {unreadCount > 0 ? <strong className="project-unread-badge">{unreadCount}</strong> : null}
      </button>
    );
  };

  const restoreProject = async (project: Project) => {
    if (trashLoadingId) return;
    if (!(await requestActionConfirm('프로젝트를 진행중 프로젝트로 복구할까요?'))) return;
    setTrashLoadingId(project.id);
    const message = await onRestoreProject(project, 'active');
    setTrashLoadingId(null);
    showActionPopup(message);
  };

  const deleteProjectForever = async (project: Project) => {
    if (trashLoadingId) return;
    if (!(await requestActionConfirm('프로젝트를 완전히 삭제할까요? 이 작업은 되돌릴 수 없습니다.'))) return;
    setTrashLoadingId(project.id);
    const message = await onPermanentDeleteProject(project);
    setTrashLoadingId(null);
    showActionPopup(message);
  };

  return (
    <aside className="sidebar" data-open={open}>
      <div className="brand-row">
        <img className="brand-logo" src="/plander-admin-logo.svg" alt="Plander Works" />
        <button className="icon-button close-sidebar" aria-label="메뉴 닫기" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="주 메뉴">
        {primaryNavItems
          .filter((item) => (showAdmin ? true : item.id !== 'operations'))
          .map((item) => {
          const Icon = item.icon;
          const unreadBadge = unreadBadges[item.id] || 0;
          return (
            <button className="nav-button" data-active={activeView === item.id} data-featured={item.id === 'create'} data-bold={item.bold || false} key={item.id} onClick={() => onNavigate(item.id)}>
              <Icon size={18} />
              <span>{item.label}</span>
              <span className="nav-badges">
                {unreadBadge > 0 ? <small className="nav-unread-badge">{unreadBadge}</small> : null}
              </span>
            </button>
          );
        })}
        <div className="sidebar-projects">
          <div className="sidebar-project-head">
            <button className="sidebar-project-title" data-active={activeView === 'project'} onClick={() => setProjectsOpen((open) => !open)} type="button">
              <span>프로젝트</span>
              {activeProjectUnread > 0 ? <small className="nav-unread-badge">{activeProjectUnread}</small> : null}
              <ChevronDown size={15} data-open={projectsOpen} />
            </button>
            <button className="sidebar-project-add" aria-label="프로젝트 추가" onClick={onCreateProject} type="button">
              <Plus size={17} />
            </button>
          </div>
          {projectsOpen ? (
            <div className="project-nav-list">
              {activeProjects.length ? (
                activeProjects.map(renderProjectButton)
              ) : (
                <p className="project-nav-empty">등록된 프로젝트가 없습니다.</p>
              )}
            </div>
          ) : null}
        </div>
        <div className="sidebar-projects sidebar-projects-secondary">
          <div className="sidebar-project-head single">
            <button className="sidebar-project-title" data-active={activeView === 'project'} onClick={() => setCompletedProjectsOpen((open) => !open)} type="button">
              <span>완료된 프로젝트</span>
              {completedProjectUnread > 0 ? <small className="nav-unread-badge">{completedProjectUnread}</small> : null}
              <ChevronDown size={15} data-open={completedProjectsOpen} />
            </button>
          </div>
          {completedProjectsOpen ? (
            <div className="project-nav-list completed-project-year-list">
              {completedProjects.length ? (
                completedProjectsByYear.map(([year, yearProjects]) => {
                  const yearOpen = Boolean(completedYearOpen[year]);
                  const yearUnreadCount = yearProjects.reduce((sum, project) => sum + (projectUnreadCounts[project.id] || 0), 0);
                  return (
                    <div className="completed-project-year" key={year}>
                      <button className="completed-project-year-button" onClick={() => setCompletedYearOpen((current) => ({ ...current, [year]: !yearOpen }))} type="button">
                        <span>{year}년</span>
                        {yearUnreadCount > 0 ? <small className="nav-unread-badge">{yearUnreadCount}</small> : null}
                        <ChevronDown size={14} data-open={yearOpen} />
                      </button>
                      {yearOpen ? (
                        <div className="project-nav-list completed-project-list">
                          {yearProjects.map(renderProjectButton)}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <p className="project-nav-empty">완료된 프로젝트가 없습니다.</p>
              )}
            </div>
          ) : null}
        </div>
        <div className="sidebar-projects sidebar-projects-secondary">
          <div className="sidebar-project-head single">
            <button className="sidebar-project-title" onClick={() => setTrashOpen((open) => !open)} type="button">
              <span>프로젝트 휴지통</span>
              {deletedProjects.length > 0 ? <small className="nav-unread-badge">{deletedProjects.length}</small> : null}
              <ChevronDown size={15} data-open={trashOpen} />
            </button>
          </div>
          {trashOpen ? (
            <div className="project-nav-list project-trash-list">
              {deletedProjects.length ? (
                deletedProjects.map((project) => (
                  <div className="project-trash-row" key={project.id}>
                    <FolderKanban size={17} />
                    <span>{project.name}</span>
                    <button aria-label={`${project.name} 복구`} disabled={trashLoadingId === project.id} onClick={() => restoreProject(project)} type="button">
                      복구
                    </button>
                    <button aria-label={`${project.name} 완전 삭제`} disabled={trashLoadingId === project.id} onClick={() => deleteProjectForever(project)} type="button">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="project-nav-empty">휴지통이 비어 있습니다.</p>
              )}
            </div>
          ) : null}
        </div>
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

        {showInstallButton ? (
          <button className="sidebar-install-button" onClick={onInstallApp} type="button">
            <Download size={17} />
            <span>앱 다운로드</span>
          </button>
        ) : null}

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
  showThemeSwitcher,
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
  pushPreferences?: PushPreferences;
  pushStatus: string;
  showSearch: boolean;
  showThemeSwitcher: boolean;
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
        {showThemeSwitcher ? <ThemeSwitcher value={themeMode} onChange={onThemeChange} /> : null}
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
    { value: 'system', icon: Monitor, label: '시스템' },
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

function ColorThemePicker({ value, onChange }: { value: ColorTheme; onChange: (theme: ColorTheme) => void }) {
  return (
    <div className="color-theme-picker" aria-label="컬러 테마">
      {colorThemeOptions.map((option) => (
        <button
          className="color-theme-option"
          data-active={value === option.value}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          <span className="color-theme-swatches" aria-hidden="true">
            {option.swatches.map((swatch) => (
              <i key={swatch} style={{ backgroundColor: swatch }} />
            ))}
          </span>
          <strong>{option.label}</strong>
          <small>{option.description}</small>
        </button>
      ))}
    </div>
  );
}

function ImmersiveTopControls({
  currentUser,
  pushEnabled,
  pushLoading,
  pushStatus,
  searchLabel,
  searchPlaceholder,
  showThemeSwitcher,
  themeMode,
  onLogout,
  onMenuClick,
  onNavigate,
  onOpenProfile,
  onRegisterPush,
  onThemeChange,
}: {
  currentUser: AppUser;
  pushEnabled: boolean;
  pushLoading: boolean;
  pushStatus: string;
  searchLabel: string;
  searchPlaceholder: string;
  showThemeSwitcher: boolean;
  themeMode: ThemeMode;
  onLogout: () => void;
  onMenuClick: () => void;
  onNavigate: (view: ActiveView) => void;
  onOpenProfile: () => void;
  onRegisterPush: () => void;
  onThemeChange: (mode: ThemeMode) => void;
}) {
  const PushIcon = pushEnabled ? Bell : BellOff;
  const [accountOpen, setAccountOpen] = useState(false);

  const openProfile = () => {
    onOpenProfile();
    setAccountOpen(false);
  };

  const goSettings = () => {
    onNavigate('settings');
    setAccountOpen(false);
  };

  const logout = () => {
    onLogout();
    setAccountOpen(false);
  };

  return (
    <div className="project-mode-tools">
      <button className="icon-button menu-button immersive-menu-button" aria-label="메뉴 열기" onClick={onMenuClick} type="button">
        <Menu size={21} />
      </button>
      <label className="project-search-pill">
        <Search size={17} />
        <input aria-label={searchLabel} placeholder={searchPlaceholder} readOnly />
        <span>⌘ K</span>
      </label>
      <div className="top-actions immersive-top-actions">
        {showThemeSwitcher ? <ThemeSwitcher value={themeMode} onChange={onThemeChange} /> : null}
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
    </div>
  );
}

type ImmersiveChromeProps = {
  currentUser: AppUser;
  pushEnabled: boolean;
  pushLoading: boolean;
  pushStatus: string;
  showThemeSwitcher: boolean;
  themeMode: ThemeMode;
  onClosePage: () => void;
  onLogout: () => void;
  onMenuClick: () => void;
  onNavigate: (view: ActiveView) => void;
  onOpenProfile: () => void;
  onRegisterPush: () => void;
  onThemeChange: (mode: ThemeMode) => void;
};

function ImmersivePageFrame({
  action,
  children,
  className = '',
  folderIcon: FolderIcon,
  folderLabel,
  heading,
  searchLabel,
  searchPlaceholder,
  subheading,
  onClosePage,
  ...chrome
}: ImmersiveChromeProps & {
  onClosePage?: () => void;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  folderIcon: React.ElementType;
  folderLabel: string;
  heading: string;
  searchLabel: string;
  searchPlaceholder: string;
  subheading?: React.ReactNode;
}) {
  return (
    <>
      <ImmersiveTopControls
        {...chrome}
        searchLabel={searchLabel}
        searchPlaceholder={searchPlaceholder}
      />

      <section className={`page-shell project-mode-shell ${className}`.trim()}>
        <DraggableFolderTabs label={folderLabel}>
          <button aria-selected="true" data-active="true" onClick={onClosePage} role="tab" type="button">
            <FolderIcon size={19} />
            <span>{folderLabel}</span>
            <X size={15} />
          </button>
        </DraggableFolderTabs>

        <div className="project-mode-canvas">
          <div className="page-head project-page-head project-mode-head">
            <div>
              <div className="project-title-row">
                <h1 className="project-current-name">{heading}</h1>
              </div>
              {subheading ? <p>{subheading}</p> : null}
            </div>
            {action}
          </div>

          {children}
        </div>
      </section>
    </>
  );
}

function DraggableFolderTabs({ children, label }: { children: React.ReactNode; label: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const dragState = useRef<{ dragging: boolean; pointerId: number | null; startX: number; scrollLeft: number; moved: boolean }>({
    dragging: false,
    pointerId: null,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  const updateScrollHint = () => {
    const node = scrollRef.current;
    if (!node) return;
    const maxScroll = Math.max(1, node.scrollWidth - node.clientWidth);
    const thumbWidth = Math.min(100, Math.max(14, (node.clientWidth / Math.max(node.scrollWidth, 1)) * 100));
    const left = (node.scrollLeft / maxScroll) * (100 - thumbWidth);
    node.style.setProperty('--folder-scroll-width', `${thumbWidth}%`);
    node.style.setProperty('--folder-scroll-left', `${left}%`);
  };

  const showScrollHint = () => {
    updateScrollHint();
    setScrolling(true);
    if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(() => setScrolling(false), 520);
  };

  useEffect(() => {
    updateScrollHint();
    return () => {
      if (scrollTimerRef.current) window.clearTimeout(scrollTimerRef.current);
    };
  }, [children]);

  const endDrag = () => {
    const node = scrollRef.current;
    const wasDragging = dragState.current.dragging;
    if (node && dragState.current.pointerId !== null && wasDragging) {
      try {
        node.releasePointerCapture(dragState.current.pointerId);
      } catch {
        // Pointer capture can already be released by the browser.
      }
    }
    dragState.current.dragging = false;
    dragState.current.pointerId = null;
    if (wasDragging) {
      setDragging(false);
      showScrollHint();
    }
  };

  return (
    <div
      className="project-folder-tabs"
      data-dragging={dragging}
      data-scrolling={scrolling}
      ref={scrollRef}
      role="tablist"
      aria-label={label}
      onScroll={showScrollHint}
      onClickCapture={(event) => {
        if (!dragState.current.moved) return;
        event.preventDefault();
        event.stopPropagation();
        dragState.current.moved = false;
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        const node = scrollRef.current;
        if (!node) return;
        dragState.current = {
          dragging: false,
          pointerId: event.pointerId,
          startX: event.clientX,
          scrollLeft: node.scrollLeft,
          moved: false,
        };
      }}
      onPointerMove={(event) => {
        const node = scrollRef.current;
        const state = dragState.current;
        if (!node || state.pointerId === null) return;
        const deltaX = event.clientX - state.startX;
        if (!state.dragging) {
          if (Math.abs(deltaX) <= 4) return;
          state.dragging = true;
          state.moved = true;
          setDragging(true);
          try {
            node.setPointerCapture(state.pointerId);
          } catch {
            // Pointer capture may be unavailable for synthetic pointers.
          }
          showScrollHint();
        }
        event.preventDefault();
        event.stopPropagation();
        node.scrollLeft = state.scrollLeft - deltaX;
        updateScrollHint();
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => {
        if (dragState.current.dragging) endDrag();
      }}
    >
      {children}
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

  const popupTitle = message.includes('입력') || message.includes('선택')
    ? '확인 필요'
    : message.includes('실패') || message.includes('오류')
      ? '오류'
      : '완료';

  return (
    <div className="modal-backdrop action-popup-backdrop" role="presentation" onClick={onClose}>
      <div className="action-popup" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <CheckCircle2 size={26} />
        <h2>{popupTitle}</h2>
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
          {task.startAt ? <span>계획 시작일: {formatDueDate(task.startAt)}</span> : null}
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
    startAt: task.startAt || '',
    priority: task.priority,
    showOnCalendar: task.showOnCalendar ?? true,
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
      startAt: task.startAt || '',
      priority: task.priority,
      showOnCalendar: task.showOnCalendar ?? true,
    });
    setStatus('');
  }, [clients, employees, projects, task]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    if (!form.title.trim() || !form.summary.trim() || !form.type || !form.assigneeId || !form.projectId || !form.priority) {
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
            계획 시작일
            <DateTimeConfirmField allowClear placeholder="시작일 선택" value={form.startAt || ''} onChange={(startAt) => setForm({ ...form, startAt })} />
          </label>
          <label>
            마감기한
            <DateTimeConfirmField allowClear value={form.due} onChange={(due) => setForm({ ...form, due })} />
          </label>
          <label>
            우선순위
            <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}>
              <option>높음</option>
              <option>보통</option>
              <option>낮음</option>
            </select>
          </label>
          <label className="calendar-visibility-row">
            <input
              checked={form.showOnCalendar}
              onChange={(event) => setForm({ ...form, showOnCalendar: event.target.checked })}
              type="checkbox"
            />
            <span>
              캘린더에 표시
              <small>끄면 이 업무는 캘린더에 나오지 않습니다.</small>
            </span>
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
  onOpenTask: (task: Task, target?: ActiveView) => void;
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
  onOpenTask: (task: Task, target?: ActiveView) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  void onNavigate;
  return (
    <section className="dashboard-flow-section" data-tone={tone} data-collapsed={collapsed}>
      <button className="dashboard-flow-head" onClick={() => setCollapsed((value) => !value)} type="button" aria-expanded={!collapsed}>
        <span>
          <small>{eyebrow}</small>
          <strong>{title}</strong>
        </span>
        <ChevronDown size={16} />
      </button>
      <div className="dashboard-flow-collapse">
        <div className="dashboard-flow-list">
          {tasks.slice(0, 5).map((task) => (
            <button
              className="dashboard-flow-row"
              data-attention={needsTaskAttention(task, currentUser)}
              data-status-tone={getTaskStatusTone(task.status)}
              key={task.id}
              onClick={() => onOpenTask(task, target)}
              type="button"
            >
              <span>{task.title}</span>
              <small>{task.due}</small>
            </button>
          ))}
          {!tasks.length ? <p className="mini-empty">표시할 항목이 없습니다.</p> : null}
        </div>
      </div>
    </section>
  );
}

function DashboardClientSection({ clients, onNavigate }: { clients: Client[]; onNavigate: () => void }) {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <section className="dashboard-flow-section" data-collapsed={collapsed}>
      <button className="dashboard-flow-head" onClick={() => setCollapsed((value) => !value)} type="button" aria-expanded={!collapsed}>
        <span>
          <small>Clients</small>
          <strong>업체</strong>
        </span>
        <ChevronDown size={16} />
      </button>
      <div className="dashboard-flow-collapse">
        <div className="dashboard-flow-list">
          {clients.slice(0, 5).map((client) => (
            <button className="dashboard-flow-row" key={client.id} onClick={onNavigate} type="button">
              <span>{client.name}</span>
              <small>{client.manager}</small>
            </button>
          ))}
          {!clients.length ? <p className="mini-empty">등록된 업체가 없습니다.</p> : null}
        </div>
      </div>
    </section>
  );
}

function TaskListPage({
  currentUser,
  pushEnabled,
  pushLoading,
  pushStatus,
  showThemeSwitcher,
  themeMode,
  title,
  initialStatus,
  initialFocusedTaskId,
  tasks,
  employees = [],
  onClosePage,
  onLogout,
  onMenuClick,
  onNavigate,
  onOpenProfile,
  onRegisterPush,
  onThemeChange,
  onAddComment,
  onDeleteComment,
  onDownloadFile,
  onEditTask,
  onMarkTaskRead,
  onOpenTask,
  onDeleteTask,
  onUpdateTaskStatus,
}: ImmersiveChromeProps & {
  title: string;
  initialStatus: TaskListFilter;
  initialFocusedTaskId?: string | null;
  tasks: Task[];
  employees?: Employee[];
  onAddComment?: TaskCommentSubmitHandler;
  onDeleteComment?: TaskCommentDeleteHandler;
  onDownloadFile?: (file: TaskFile) => void;
  onEditTask?: (task: Task) => void;
  onMarkTaskRead?: (task: Task) => void;
  onOpenTask: (task: Task) => void;
  onDeleteTask: TaskDeleteHandler;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => Promise<string>;
}) {
  const [status, setStatus] = useState<TaskListFilter>(initialStatus);
  const [employeeId, setEmployeeId] = useState('전체');
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(initialFocusedTaskId ?? null);
  const statusFilteredTasks = status === '전체'
    ? tasks
    : status === '마감 임박'
      ? tasks.filter((task) => task.due !== '미정' && task.due !== '검토 대기' && task.status !== '완료')
      : tasks.filter((task) => task.status === status);
  const filteredTasks =
    !employees.length || employeeId === '전체'
      ? statusFilteredTasks
      : statusFilteredTasks.filter((task) => task.creatorId === employeeId || getTaskRecipientIds(task).includes(employeeId));
  const useInlineDetail = Boolean(onAddComment && onDeleteComment && onDownloadFile && onEditTask);
  const toggleFocusedTask = (task: Task) => {
    setFocusedTaskId((current) => (current === task.id ? null : task.id));
  };

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (!employees.length) setEmployeeId('전체');
  }, [employees.length]);

  return (
    <ImmersivePageFrame
      className="all-tasks-mode-shell"
      currentUser={currentUser}
      folderIcon={FileText}
      folderLabel={title}
      heading={title}
      pushEnabled={pushEnabled}
      pushLoading={pushLoading}
      pushStatus={pushStatus}
      searchLabel={`${title} 검색`}
      searchPlaceholder="업무, 프로젝트, 담당자 검색"
      showThemeSwitcher={showThemeSwitcher}
      subheading={`조건에 맞는 업무 ${filteredTasks.length}건 · 전체 ${tasks.length}건`}
      themeMode={themeMode}
      onClosePage={onClosePage}
      onLogout={onLogout}
      onMenuClick={onMenuClick}
      onNavigate={onNavigate}
      onOpenProfile={onOpenProfile}
      onRegisterPush={onRegisterPush}
      onThemeChange={onThemeChange}
    >
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
          {(['전체', '마감 임박', '대기', '진행중', '완료 요청', '보류', '완료'] as TaskListFilter[]).map((item) => (
            <button data-active={status === item} key={item} onClick={() => setStatus(item)}>
              {item}
            </button>
          ))}
        </div>

      <div className={`task-board list-surface ${useInlineDetail ? 'project-task-board all-tasks-task-board' : ''}`}>
        {useInlineDetail ? (
          <>
            <div className="project-board-toolbar">
              <div>
                <h2>업무 목록</h2>
                <span>{filteredTasks.length}</span>
              </div>
            </div>
            <div className="project-task-columns" aria-hidden="true">
              <span>업무명</span>
              <span>상태</span>
              <span>담당자</span>
              <span>마감</span>
              <span>읽음</span>
            </div>
          </>
        ) : null}
        <div className={useInlineDetail ? 'project-task-list' : 'task-list'}>
          {filteredTasks.length ? (
            filteredTasks.map((task) =>
              useInlineDetail && onAddComment && onDeleteComment && onDownloadFile && onEditTask ? (
                <ProjectTaskRow
                  currentUser={currentUser}
                  employees={employees}
                  key={task.id}
                  onAddComment={onAddComment}
                  onDeleteComment={onDeleteComment}
                  onDeleteTask={onDeleteTask}
                  onDownloadFile={onDownloadFile}
                  onEditTask={onEditTask}
                  onMarkRead={onMarkTaskRead}
                  onSelect={toggleFocusedTask}
                  onUpdateStatus={onUpdateTaskStatus}
                  selected={focusedTaskId === task.id}
                  task={task}
                />
              ) : (
                <TaskCard key={task.id} task={task} currentUser={currentUser} onOpenTask={onOpenTask} onDeleteTask={onDeleteTask} onUpdateStatus={onUpdateTaskStatus} />
              ),
            )
          ) : (
            <EmptyState text="조건에 맞는 업무가 없습니다." />
          )}
        </div>
      </div>
    </ImmersivePageFrame>
  );
}

function ProjectPage({
  clients,
  currentUser,
  employees,
  initialFocusedTaskId,
  messages,
  project,
  projects,
  pushEnabled,
  pushLoading,
  pushStatus,
  showThemeSwitcher,
  taskTypes,
  tasks,
  themeMode,
  onAddComment,
  onAddMessage,
  onCreateProject,
  onCreateTask,
  onDeleteTask,
  onDeleteComment,
  onDownloadFile,
  onEditProject,
  onEditTask,
  onLogout,
  onMarkTaskRead,
  onMenuClick,
  onMarkMessagesRead,
  onNavigate,
  onOpenProfile,
  onOpenProject,
  onRegisterPush,
  onThemeChange,
  onTrashProject,
  onUpdateTaskStatus,
}: {
  clients: Client[];
  currentUser: AppUser;
  employees: Employee[];
  initialFocusedTaskId?: string | null;
  messages: ProjectMessage[];
  project: Project | null;
  projects: Project[];
  pushEnabled: boolean;
  pushLoading: boolean;
  pushStatus: string;
  showThemeSwitcher: boolean;
  taskTypes: string[];
  tasks: Task[];
  themeMode: ThemeMode;
  onAddComment: TaskCommentSubmitHandler;
  onAddMessage: (projectId: string, content: string) => Promise<string>;
  onCreateProject: () => void;
  onCreateTask: TaskSubmitHandler;
  onDeleteTask: TaskDeleteHandler;
  onDeleteComment: TaskCommentDeleteHandler;
  onDownloadFile: (file: TaskFile) => void;
  onEditProject: (projectId: string) => void;
  onEditTask: (task: Task) => void;
  onLogout: () => void;
  onMarkTaskRead: (task: Task) => void;
  onMenuClick: () => void;
  onMarkMessagesRead: (messageIds: string[]) => Promise<void>;
  onNavigate: (view: ActiveView) => void;
  onOpenProfile: () => void;
  onOpenProject: (projectId: string) => void;
  onRegisterPush: () => void;
  onThemeChange: (mode: ThemeMode) => void;
  onTrashProject: ProjectStatusHandler;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => Promise<string>;
}) {
  const activeTasks = tasks.filter((task) => task.status !== '완료');
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(initialFocusedTaskId ?? null);
  const [message, setMessage] = useState('');
  const [messageStatus, setMessageStatus] = useState('');
  const [messageLoading, setMessageLoading] = useState(false);
  const [taskCreateOpen, setTaskCreateOpen] = useState(false);
  const [projectTaskStatus, setProjectTaskStatus] = useState<'전체' | TaskStatus>('전체');
  const [projectTaskAssigneeId, setProjectTaskAssigneeId] = useState('전체');
  const [projectTaskSort, setProjectTaskSort] = useState<'최신순' | '마감 임박순'>('최신순');
  const messageListRef = useRef<HTMLDivElement>(null);
  const messageRows = Math.min(5, Math.max(1, message.split('\n').length));
  const latestMessageId = messages[messages.length - 1]?.id;
  const canEditProject = Boolean(project && (currentUser.accountRole === 'admin' || project.createdBy === currentUser.id || currentUser.isPrototype));
  const projectEmployees = project?.memberIds.length
    ? employees.filter((employee) => project.memberIds.includes(employee.id))
    : employees;
  const activeProjects = projects.filter((item) => item.status !== 'completed' && item.status !== 'deleted');
  const visibleProjects = activeProjects;
  const filteredProjectTasks = useMemo(() => {
    const statusFiltered = projectTaskStatus === '전체' ? tasks : tasks.filter((task) => task.status === projectTaskStatus);
    const assigneeFiltered = projectTaskAssigneeId === '전체'
      ? statusFiltered
      : statusFiltered.filter((task) => getTaskRecipientIds(task).includes(projectTaskAssigneeId) || task.assigneeId === projectTaskAssigneeId);

    if (projectTaskSort === '마감 임박순') {
      return [...assigneeFiltered].sort((first, second) => {
        const firstTime = first.dueAt ? new Date(first.dueAt).getTime() : Number.POSITIVE_INFINITY;
        const secondTime = second.dueAt ? new Date(second.dueAt).getTime() : Number.POSITIVE_INFINITY;
        return firstTime - secondTime;
      });
    }

    return assigneeFiltered;
  }, [projectTaskAssigneeId, projectTaskSort, projectTaskStatus, tasks]);

  const focusResetRef = useRef(false);
  useEffect(() => {
    setProjectTaskStatus('전체');
    setProjectTaskAssigneeId('전체');
    setProjectTaskSort('최신순');
    // keep the dashboard-provided focus on first mount; clear focus only when switching projects in-view
    if (focusResetRef.current) setFocusedTaskId(null);
    focusResetRef.current = true;
  }, [project?.id]);

  useEffect(() => {
    if (projectTaskAssigneeId !== '전체' && !projectEmployees.some((employee) => employee.id === projectTaskAssigneeId)) {
      setProjectTaskAssigneeId('전체');
    }
  }, [projectEmployees, projectTaskAssigneeId]);

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

  const toggleFocusedTask = (task: Task) => {
    setFocusedTaskId((current) => (current === task.id ? null : task.id));
  };

  const trashProject = async (targetProject: Project) => {
    if (!(await requestActionConfirm('프로젝트를 삭제할까요? 삭제된 프로젝트는 프로젝트 휴지통에서 관리할 수 있습니다.'))) return;
    const message = await onTrashProject(targetProject, 'deleted');
    showActionPopup(message);
  };

  return (
    <>
      <ImmersiveTopControls
        currentUser={currentUser}
        pushEnabled={pushEnabled}
        pushLoading={pushLoading}
        pushStatus={pushStatus}
        searchLabel="프로젝트 검색"
        searchPlaceholder="업무, 프로젝트, 담당자 검색"
        showThemeSwitcher={showThemeSwitcher}
        themeMode={themeMode}
        onLogout={onLogout}
        onMenuClick={onMenuClick}
        onNavigate={onNavigate}
        onOpenProfile={onOpenProfile}
        onRegisterPush={onRegisterPush}
        onThemeChange={onThemeChange}
      />

      <section className="page-shell project-mode-shell">
      <DraggableFolderTabs label="프로젝트 선택">
        {visibleProjects.map((item) => (
          <button
            aria-selected={project?.id === item.id}
            data-active={project?.id === item.id}
            key={item.id}
            onClick={() => onOpenProject(item.id)}
            role="tab"
            type="button"
          >
            <FolderKanban size={19} />
            <span>{item.name}</span>
            <X
              className="project-folder-close"
              size={15}
              onClick={(event) => {
                event.stopPropagation();
                void trashProject(item);
              }}
            />
          </button>
        ))}
        <button className="project-folder-add" aria-label="프로젝트 추가" onClick={onCreateProject} type="button">
          <Plus size={18} />
        </button>
      </DraggableFolderTabs>

      <div className="project-mode-canvas">
        <div className="page-head project-page-head project-mode-head">
          <div>
            <div className="project-title-row">
              <h1 className="project-current-name">{project?.name || '프로젝트'}</h1>
              {project && canEditProject ? (
                <button className="icon-button project-edit-button" aria-label="프로젝트 수정" onClick={() => onEditProject(project.id)} type="button">
                  <Pencil size={16} />
                </button>
              ) : null}
            </div>
            {project ? (
              <>
                <p>
                  {project.client} · 진행 업무 {activeTasks.length}건 · 전체 업무 {tasks.length}건
                </p>
                <div className="project-member-strip" aria-label="프로젝트 참여인원">
                  <span>참여인원</span>
                  <div className="project-member-avatars">
                    {projectEmployees.slice(0, 6).map((employee) => (
                      <span className="project-member-pill" key={employee.id}>
                        <Avatar name={employee.name} src={employee.avatarUrl} size="xs" />
                        <small>{employee.name}</small>
                      </span>
                    ))}
                    {projectEmployees.length > 6 ? <strong>+{projectEmployees.length - 6}</strong> : null}
                  </div>
                </div>
              </>
            ) : (
              <p>프로젝트를 선택해주세요.</p>
            )}
          </div>
          {project ? (
            <button className="primary-action" onClick={() => setTaskCreateOpen(true)} type="button">
              <Plus size={17} />
              업무 생성
            </button>
          ) : null}
        </div>

        <div className="project-filter-strip" aria-label="프로젝트 필터">
          <label>
            <span>전체 상태</span>
            <select value={projectTaskStatus} onChange={(event) => setProjectTaskStatus(event.target.value as '전체' | TaskStatus)}>
              <option>전체</option>
              <option>대기</option>
              <option>진행중</option>
              <option>완료 요청</option>
              <option>보류</option>
              <option>완료</option>
            </select>
          </label>
          <label>
            <span>담당자</span>
            <select value={projectTaskAssigneeId} onChange={(event) => setProjectTaskAssigneeId(event.target.value)}>
              <option value="전체">전체 담당자</option>
              {projectEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>{employee.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>정렬</span>
            <select value={projectTaskSort} onChange={(event) => setProjectTaskSort(event.target.value as '최신순' | '마감 임박순')}>
              <option>최신순</option>
              <option>마감 임박순</option>
            </select>
          </label>
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
          <div className="task-board list-surface project-task-board">
            <div className="project-board-toolbar">
              <div>
                <h2>업무 목록</h2>
                <span>{filteredProjectTasks.length}</span>
              </div>
            </div>
            <div className="project-task-columns" aria-hidden="true">
              <span>업무명</span>
              <span>상태</span>
              <span>담당자</span>
              <span>마감</span>
              <span>읽음</span>
            </div>
            <div className="project-task-list">
              {project ? (
                filteredProjectTasks.length ? (
                  filteredProjectTasks.map((task) => (
                    <ProjectTaskRow
                      currentUser={currentUser}
                      employees={employees}
                      key={task.id}
                      onAddComment={onAddComment}
                      onDeleteComment={onDeleteComment}
                      onDeleteTask={onDeleteTask}
                      onDownloadFile={onDownloadFile}
                      onEditTask={onEditTask}
                      onMarkRead={onMarkTaskRead}
                      onSelect={toggleFocusedTask}
                      onUpdateStatus={onUpdateTaskStatus}
                      selected={focusedTaskId === task.id}
                      task={task}
                    />
                  ))
                ) : (
                  <EmptyState text="조건에 맞는 업무가 없습니다." />
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
      </div>
      </section>
    </>
  );
}

function ProjectTaskRow({
  currentUser,
  employees,
  onAddComment,
  onDeleteComment,
  onDeleteTask,
  onDownloadFile,
  onEditTask,
  onMarkRead,
  onSelect,
  onUpdateStatus,
  selected,
  task,
}: {
  currentUser: AppUser;
  employees: Employee[];
  onAddComment: TaskCommentSubmitHandler;
  onDeleteComment: TaskCommentDeleteHandler;
  onDeleteTask: TaskDeleteHandler;
  onDownloadFile: (file: TaskFile) => void;
  onEditTask: (task: Task) => void;
  onMarkRead?: (task: Task) => void;
  onSelect: (task: Task) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<string>;
  selected: boolean;
  task: Task;
}) {
  const recipientNames = (task.watchers.length ? task.watchers : task.to.split(', ')).map((name) => name.trim()).filter(Boolean);
  const totalRecipients = Math.max(1, getTaskRecipientIds(task).length || recipientNames.length);
  const readCount = task.readAt ? totalRecipients : 0;
  const rowRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (selected && rowRef.current) {
      const node = rowRef.current;
      requestAnimationFrame(() => node.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    }
    // run once on mount: auto-scroll only to the task focused via dashboard navigation, not manual clicks
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <article className="project-task-item" data-open={selected} ref={rowRef}>
      <button
        className="project-task-row"
        data-attention={needsTaskAttention(task, currentUser)}
        data-selected={selected}
        data-status-tone={getTaskStatusTone(task.status)}
        onClick={() => {
          if (!selected) onMarkRead?.(task);
          onSelect(task);
        }}
        type="button"
      >
        <span className="project-task-row-title">
          <strong>{task.title}</strong>
          <small>{task.projectName || task.client}</small>
        </span>
        <span className="status" data-status={task.status}>
          {task.status}
        </span>
        <span className="project-task-assignees">
          {recipientNames.slice(0, 3).map((name) => (
            <Avatar key={name} name={name} src={employees.find((employee) => employee.name === name)?.avatarUrl} size="xs" />
          ))}
          <small>{recipientNames[0] || task.to || '미지정'}{recipientNames.length > 1 ? ` 외 ${recipientNames.length - 1}명` : ''}</small>
        </span>
        <span className="project-task-due">{task.dueAt ? formatDueDate(task.dueAt) : task.due}</span>
        <span className="project-task-read">{readCount}/{totalRecipients}</span>
      </button>
      <div className="project-task-expanded" aria-hidden={!selected} data-open={selected}>
        <div className="project-task-expanded-inner">
          <ProjectTaskInspector
            currentUser={currentUser}
            onAddComment={onAddComment}
            onDeleteComment={onDeleteComment}
            onDeleteTask={onDeleteTask}
            onDownloadFile={onDownloadFile}
            onEditTask={onEditTask}
            onUpdateStatus={onUpdateStatus}
            task={task}
          />
        </div>
      </div>
    </article>
  );
}

function ProjectTaskInspector({
  currentUser,
  onAddComment,
  onDeleteComment,
  onDeleteTask,
  onDownloadFile,
  onEditTask,
  onUpdateStatus,
  task,
}: {
  currentUser: AppUser;
  onAddComment: TaskCommentSubmitHandler;
  onDeleteComment: TaskCommentDeleteHandler;
  onDeleteTask: TaskDeleteHandler;
  onDownloadFile: (file: TaskFile) => void;
  onEditTask: (task: Task) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<string>;
  task: Task | null;
}) {
  const [comment, setComment] = useState('');
  const [commentStatus, setCommentStatus] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<TaskStatus | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);
  const statusActions: TaskStatus[] = ['진행중', '완료 요청', '보류', '완료'];

  if (!task) {
    return (
      <div className="project-inspector-card">
        <p className="eyebrow">업무 상세</p>
        <EmptyState text="선택된 업무가 없습니다." />
      </div>
    );
  }

  const recipientNames = (task.watchers.length ? task.watchers : task.to.split(', ')).map((name) => name.trim()).filter(Boolean);
  const totalRecipients = Math.max(1, getTaskRecipientIds(task).length || recipientNames.length);
  const readCount = task.readAt ? totalRecipients : 0;
  const rootComments = task.comments.filter((item) => !item.parentId);
  const getReplies = (commentId: string) => task.comments.filter((item) => item.parentId === commentId);
  const canEdit =
    currentUser.accountRole === 'admin' ||
    task.creatorId === currentUser.id ||
    (currentUser.isPrototype && task.from === currentUser.name);
  const canManage =
    canEdit ||
    getTaskRecipientIds(task).includes(currentUser.id) ||
    (currentUser.isPrototype && task.to.split(', ').includes(currentUser.name));

  const removeTask = async () => {
    if (deletingTask) return;
    if (!(await requestActionConfirm(`'${task.title}' 업무를 삭제할까요? 삭제하면 복구할 수 없습니다.`))) return;
    setDeletingTask(true);
    const message = await onDeleteTask(task);
    setDeletingTask(false);
    showActionPopup(message);
  };

  const updateStatus = async (status: TaskStatus) => {
    if (loadingStatus) return;
    setLoadingStatus(status);
    const message = await onUpdateStatus(task.id, status);
    setLoadingStatus(null);
    setMenuOpen(false);
    showActionPopup(message);
  };

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

  const renderProjectComment = (item: TaskComment, isReply = false) => (
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
    <div className="project-inspector-card" data-status-tone={getTaskStatusTone(task.status)}>
      <div className="project-inspector-head">
        <div>
          <p className="eyebrow">업무 상세</p>
          <div className="project-inspector-badges">
            <span className="status" data-status={task.status}>{task.status}</span>
            <span>{formatTaskTypeLabel(task.type)}</span>
          </div>
          <h2>{task.title}</h2>
          <p>{task.from} → 담당자 {recipientNames.length || 1}명</p>
        </div>
        <div className="project-inspector-actions">
          {canEdit ? (
            <button className="secondary-action" onClick={() => onEditTask(task)} type="button">
              <Pencil size={15} />
              수정
            </button>
          ) : null}
          {canEdit ? (
            <button className="secondary-action danger-action" disabled={deletingTask} onClick={removeTask} type="button">
              <Trash2 size={15} />
              {deletingTask ? '삭제중...' : '삭제'}
            </button>
          ) : null}
          {canManage ? (
            <div className="task-menu project-inspector-menu">
              <button className="icon-button" aria-label="상태 변경" onClick={() => setMenuOpen((open) => !open)} type="button">
                <MoreHorizontal size={18} />
              </button>
              {menuOpen ? (
                <>
                  <button className="menu-scrim" aria-label="상태 변경 메뉴 닫기" onClick={() => setMenuOpen(false)} type="button" />
                  <div className="task-menu-popover">
                    {statusActions.map((status) => (
                      <button disabled={task.status === status || Boolean(loadingStatus)} key={status} onClick={() => updateStatus(status)} type="button">
                        {loadingStatus === status ? '진행중...' : status}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="project-inspector-people">
        <span>
          보낸 사람
          <Avatar name={task.from} src={task.creatorAvatarUrl} size="sm" />
          <strong>{task.from}</strong>
        </span>
        <span>
          받는 사람
          <strong>{recipientNames.join(', ') || task.to}</strong>
          <em>읽음 {readCount}/{totalRecipients}</em>
        </span>
      </div>

      <div className="project-inspector-meta">
        {task.startAt ? (
          <span>
            <CalendarClock size={17} />
            계획 시작일<br />
            <strong>{formatDueDate(task.startAt)}</strong>
          </span>
        ) : null}
        <span>
          <CalendarClock size={17} />
          마감기한<br />
          <strong>{task.dueAt ? formatDueDate(task.dueAt) : task.due}</strong>
        </span>
        <span>
          <ShieldCheck size={17} />
          우선순위<br />
          <strong>{task.priority}</strong>
        </span>
        <span>
          <Paperclip size={17} />
          첨부파일<br />
          <strong>{task.files.length}개</strong>
        </span>
      </div>

      <div className="project-inspector-summary">
        <p>{task.summary ? renderLinkedText(task.summary) : '내용이 없습니다.'}</p>
      </div>

      <div className="project-inspector-files">
        <div>
          <strong>첨부 파일 ({task.files.length})</strong>
          <Download size={16} />
        </div>
        {task.files.length ? (
          <div className="project-file-grid">
            {task.files.map((file) => (
              <button key={file.id} onClick={() => onDownloadFile(file)} type="button">
                <FileText size={17} />
                <strong>{file.name}</strong>
                <small>{file.size ? `${Math.ceil(file.size / 1024)}KB` : '파일'}</small>
              </button>
            ))}
          </div>
        ) : (
          <p className="mini-empty">첨부파일이 없습니다.</p>
        )}
      </div>

      <div className="project-inspector-comments">
        <strong>댓글 <span>{task.comments.length}</span></strong>
        <div className="comment-list">
          {rootComments.length ? (
            rootComments.map((item) => (
              <div className="comment-thread" key={item.id}>
                {renderProjectComment(item)}
                {getReplies(item.id).length ? (
                  <div className="reply-list">
                    {getReplies(item.id).map((reply) => renderProjectComment(reply, true))}
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
        {needsTaskAttention(task, currentUser) ? <small className="project-attention-note">확인이 필요한 업무입니다.</small> : null}
      </div>
    </div>
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
  initialFocusedTaskId,
  employees,
  currentUser,
  pushEnabled,
  pushLoading,
  pushStatus,
  showThemeSwitcher,
  themeMode,
  onClosePage,
  onLogout,
  onMenuClick,
  onNavigate,
  onOpenProfile,
  onRegisterPush,
  onThemeChange,
  onAddComment,
  onCreateTask,
  onDeleteComment,
  onDeleteTask,
  onDownloadFile,
  onEditTask,
  onUpdateTaskStatus,
  onMarkTaskRead,
}: ImmersiveChromeProps & {
  tasks: Task[];
  initialFocusedTaskId?: string | null;
  employees: Employee[];
  onAddComment: TaskCommentSubmitHandler;
  onCreateTask: TaskSubmitHandler;
  onDeleteComment: TaskCommentDeleteHandler;
  onDeleteTask: TaskDeleteHandler;
  onDownloadFile: (file: TaskFile) => void;
  onEditTask: (task: Task) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => Promise<string>;
  onMarkTaskRead: (task: Task) => void;
}) {
  const reportTasks = tasks.filter((task) => task.type === '보고' || task.type === '제안');
  const [composeOpen, setComposeOpen] = useState(false);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(initialFocusedTaskId ?? null);
  const toggleFocusedTask = (task: Task) => {
    setFocusedTaskId((current) => (current === task.id ? null : task.id));
  };

  return (
    <ImmersivePageFrame
      action={(
        <button className="primary-action" onClick={() => setComposeOpen(true)} type="button">
            <Plus size={17} />
            대표에게 보고
        </button>
      )}
      className="reports-mode-shell"
      currentUser={currentUser}
      folderIcon={FileText}
      folderLabel="보고·제안"
      heading="보고·제안"
      pushEnabled={pushEnabled}
      pushLoading={pushLoading}
      pushStatus={pushStatus}
      searchLabel="보고 제안 검색"
      searchPlaceholder="보고, 제안, 담당자 검색"
      showThemeSwitcher={showThemeSwitcher}
      subheading={`대표에게 전달한 보고와 직원 간 제안을 한 곳에서 확인합니다. · 전체 ${reportTasks.length}건`}
      themeMode={themeMode}
      onClosePage={onClosePage}
      onLogout={onLogout}
      onMenuClick={onMenuClick}
      onNavigate={onNavigate}
      onOpenProfile={onOpenProfile}
      onRegisterPush={onRegisterPush}
      onThemeChange={onThemeChange}
    >
      <div className="task-board list-surface project-task-board reports-task-board">
        <div className="project-board-toolbar">
          <div>
            <h2>보고·제안 목록</h2>
            <span>{reportTasks.length}</span>
          </div>
        </div>
        <div className="project-task-columns" aria-hidden="true">
          <span>제목</span>
          <span>상태</span>
          <span>대상</span>
          <span>마감</span>
          <span>읽음</span>
        </div>
        <div className="project-task-list report-task-list">
          {reportTasks.length ? (
            reportTasks.map((task) => (
              <ProjectTaskRow
                currentUser={currentUser}
                employees={employees}
                  key={task.id}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
                onDeleteTask={onDeleteTask}
                onDownloadFile={onDownloadFile}
                onEditTask={onEditTask}
                onMarkRead={onMarkTaskRead}
                onSelect={toggleFocusedTask}
                onUpdateStatus={onUpdateTaskStatus}
                selected={focusedTaskId === task.id}
                  task={task}
                />
            ))
          ) : (
            <EmptyState text="표시할 보고·제안이 없습니다." />
          )}
        </div>
      </div>
      {composeOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setComposeOpen(false)}>
          <article className="modal-card report-compose-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">New Report</p>
                <h2>대표에게 보고</h2>
              </div>
              <button className="icon-button" aria-label="닫기" onClick={() => setComposeOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>
            <ReportForm employees={employees} onCreateTask={onCreateTask} onSuccess={() => setComposeOpen(false)} />
          </article>
        </div>
      ) : null}
    </ImmersivePageFrame>
  );
}

function MeetingMinutesPage({
  categories,
  currentUser,
  employees,
  minutes,
  projects,
  pushEnabled,
  pushLoading,
  pushStatus,
  showThemeSwitcher,
  themeMode,
  onCreateMinute,
  onDeleteMinute,
  onUpdateMinute,
  onClosePage,
  onLogout,
  onMenuClick,
  onNavigate,
  onOpenProfile,
  onRegisterPush,
  onThemeChange,
}: ImmersiveChromeProps & {
  categories: string[];
  employees: Employee[];
  minutes: MeetingMinute[];
  projects: Project[];
  onCreateMinute: MeetingMinuteSubmitHandler;
  onDeleteMinute: MeetingMinuteDeleteHandler;
  onUpdateMinute: MeetingMinuteUpdateHandler;
}) {
  const [composeOpen, setComposeOpen] = useState(false);
  const [editingMinuteId, setEditingMinuteId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('전체');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exportMenuId, setExportMenuId] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const visibleMinutes = minutes.filter((minute) => categoryFilter === '전체' || minute.category === categoryFilter);
  const editingMinute = minutes.find((minute) => minute.id === editingMinuteId) || null;

  const deleteMinute = async (minute: MeetingMinute) => {
    if (deleteLoadingId) return;
    setDeleteLoadingId(minute.id);
    const message = await onDeleteMinute(minute);
    setDeleteLoadingId(null);
    showActionPopup(message);
    if (!message.includes('실패') && !message.includes('취소')) {
      setExpandedId((current) => (current === minute.id ? null : current));
    }
  };

  return (
    <ImmersivePageFrame
      action={(
        <button className="primary-action" onClick={() => setComposeOpen(true)} type="button">
          <Plus size={17} />
          회의록 작성
        </button>
      )}
      className="meeting-mode-shell"
      currentUser={currentUser}
      folderIcon={ClipboardList}
      folderLabel="회의록"
      heading="회의록"
      pushEnabled={pushEnabled}
      pushLoading={pushLoading}
      pushStatus={pushStatus}
      searchLabel="회의록 검색"
      searchPlaceholder="회의록, 프로젝트, 참석자 검색"
      showThemeSwitcher={showThemeSwitcher}
      subheading={`회의 요약과 결정사항을 게시판처럼 보관합니다. · 전체 ${minutes.length}건`}
      themeMode={themeMode}
      onClosePage={onClosePage}
      onLogout={onLogout}
      onMenuClick={onMenuClick}
      onNavigate={onNavigate}
      onOpenProfile={onOpenProfile}
      onRegisterPush={onRegisterPush}
      onThemeChange={onThemeChange}
    >
      <div className="meeting-filter-row">
        {['전체', ...categories].map((category) => (
          <button className="filter-chip" data-active={categoryFilter === category} key={category} onClick={() => setCategoryFilter(category)} type="button">
            {category}
          </button>
        ))}
      </div>
      <div className="task-board list-surface project-task-board meeting-board">
        <div className="project-board-toolbar">
          <div>
            <h2>회의록 목록</h2>
            <span>{visibleMinutes.length}</span>
          </div>
        </div>
        <div className="meeting-minute-list">
          {visibleMinutes.length ? (
            visibleMinutes.map((minute) => {
              const expanded = expandedId === minute.id;
              const canManageMinute = currentUser.accountRole === 'admin' || minute.createdBy === currentUser.id;
              return (
                <article className="meeting-minute-card" data-expanded={expanded} key={minute.id}>
                  <button className="meeting-minute-summary" onClick={() => setExpandedId((current) => (current === minute.id ? null : minute.id))} type="button">
                    <span className="meeting-minute-category">{minute.category}</span>
                    <div>
                      <strong>{minute.title}</strong>
                      <small>
                        {minute.projectName || '프로젝트 미지정'} · {minute.heldAt ? formatDueDate(minute.heldAt) : minute.createdAt ? formatDueDate(minute.createdAt) : '일시 미정'}
                      </small>
                    </div>
                    <span className="meeting-minute-author">
                      <Avatar name={minute.author} src={minute.authorAvatarUrl} size="xs" />
                      {minute.author}
                    </span>
                  </button>
                  {expanded ? (
                    <div className="meeting-minute-detail">
                      <div className="meeting-minute-detail-actions">
                        <div className="meeting-minute-export-menu">
                          <button
                            aria-label="회의록 다운로드"
                            className="secondary-action icon-only-action"
                            onClick={() => setExportMenuId((current) => (current === minute.id ? null : minute.id))}
                            title="회의록 다운로드"
                            type="button"
                          >
                            <Download size={16} />
                          </button>
                          {exportMenuId === minute.id ? (
                            <div className="meeting-minute-export-popover">
                              <button onClick={() => { exportMeetingMinute(minute, 'pdf'); setExportMenuId(null); }} type="button">PDF</button>
                              <button onClick={() => { exportMeetingMinute(minute, 'xls'); setExportMenuId(null); }} type="button">Excel</button>
                              <button onClick={() => { exportMeetingMinute(minute, 'hwp'); setExportMenuId(null); }} type="button">HWP</button>
                            </div>
                          ) : null}
                        </div>
                        {canManageMinute ? (
                          <>
                            <button aria-label="회의록 수정" className="secondary-action icon-only-action" onClick={() => setEditingMinuteId(minute.id)} title="수정" type="button">
                              <Pencil size={16} />
                            </button>
                            <button
                              aria-label="회의록 삭제"
                              className="secondary-action danger-action icon-only-action"
                              disabled={deleteLoadingId === minute.id}
                              onClick={() => deleteMinute(minute)}
                              title="삭제"
                              type="button"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : null}
                      </div>
                      <dl className="meeting-minute-meta">
                        <div>
                          <dt>참석자</dt>
                          <dd>{minute.attendees || '미기재'}</dd>
                        </div>
                      </dl>
                      {minute.summary ? (
                        <section>
                          <h3>요약</h3>
                          <p>{renderLinkedText(minute.summary)}</p>
                        </section>
                      ) : null}
                      <section>
                        <h3>회의 내용</h3>
                        <p>{renderLinkedText(minute.content)}</p>
                      </section>
                      {minute.decisions ? (
                        <section>
                          <h3>결정사항</h3>
                          <p>{renderLinkedText(minute.decisions)}</p>
                        </section>
                      ) : null}
                      {minute.actionItems ? (
                        <section>
                          <h3>액션아이템</h3>
                          <p>{renderLinkedText(minute.actionItems)}</p>
                        </section>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })
          ) : (
            <EmptyState text="등록된 회의록이 없습니다." />
          )}
        </div>
      </div>
      {composeOpen ? (
        <div className="modal-backdrop meeting-modal-backdrop" role="presentation" onClick={(event) => {
          if (event.target === event.currentTarget) setComposeOpen(false);
        }}>
          <article
            className="modal-card meeting-compose-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
            onWheel={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">Meeting Minutes</p>
                <h2>회의록 작성</h2>
              </div>
              <button className="icon-button" aria-label="닫기" onClick={() => setComposeOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>
            <MeetingMinuteForm categories={categories} employees={employees} projects={projects} onSubmitMinute={onCreateMinute} onSuccess={() => setComposeOpen(false)} />
          </article>
        </div>
      ) : null}
      {editingMinute ? (
        <div className="modal-backdrop meeting-modal-backdrop" role="presentation" onClick={(event) => {
          if (event.target === event.currentTarget) setEditingMinuteId(null);
        }}>
          <article
            className="modal-card meeting-compose-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
            onWheel={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">Edit Meeting</p>
                <h2>회의록 수정</h2>
              </div>
              <button className="icon-button" aria-label="닫기" onClick={() => setEditingMinuteId(null)} type="button">
                <X size={18} />
              </button>
            </div>
            <MeetingMinuteForm
              categories={categories}
              employees={employees}
              minute={editingMinute}
              projects={projects}
              submitLabel="회의록 수정"
              onSubmitMinute={(draft) => onUpdateMinute(editingMinute.id, draft)}
              onSuccess={() => setEditingMinuteId(null)}
            />
          </article>
        </div>
      ) : null}
    </ImmersivePageFrame>
  );
}

function MeetingMinuteForm({
  categories,
  employees,
  minute,
  projects,
  submitLabel = '회의록 등록',
  onSubmitMinute,
  onSuccess,
}: {
  categories: string[];
  employees: Employee[];
  minute?: MeetingMinute;
  projects: Project[];
  submitLabel?: string;
  onSubmitMinute: MeetingMinuteSubmitHandler;
  onSuccess: () => void;
}) {
  const defaultCategory = categories[0] || fallbackMeetingMinuteCategories[0];
  const attendeeNameParts = (value: string) => value.split(',').map((name) => name.trim()).filter(Boolean);
  const getAttendeeIdsFromNames = (value: string) => {
    const names = attendeeNameParts(value);
    return employees.filter((employee) => names.includes(employee.name)).map((employee) => employee.id);
  };
  const getExternalAttendeesFromNames = (value: string) => {
    const employeeNames = new Set(employees.map((employee) => employee.name));
    return attendeeNameParts(value).filter((name) => !employeeNames.has(name)).join(', ');
  };
  const buildAttendees = (employeeIds: string[], externalAttendees: string) => [
    ...employees.filter((employee) => employeeIds.includes(employee.id)).map((employee) => employee.name),
    ...attendeeNameParts(externalAttendees),
  ].join(', ');
  const [form, setForm] = useState<MeetingMinuteDraft>({
    category: minute?.category || defaultCategory,
    title: minute?.title || '',
    content: minute?.content || '',
    summary: minute?.summary || '',
    decisions: minute?.decisions || '',
    actionItems: minute?.actionItems || '',
    attendees: minute?.attendees || '',
    projectId: minute?.projectId || '',
    heldAt: minute?.heldAt ? toDateTimeLocalValue(parseTaskDate(minute.heldAt) || new Date()) : toDateTimeLocalValue(new Date()),
  });
  const [attendeeIds, setAttendeeIds] = useState<string[]>(() => getAttendeeIdsFromNames(minute?.attendees || ''));
  const [externalAttendees, setExternalAttendees] = useState(() => getExternalAttendeesFromNames(minute?.attendees || ''));
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const isNewBriefing = form.category === '신규브리핑';

  useEffect(() => {
    setForm({
      category: minute?.category || defaultCategory,
      title: minute?.title || '',
      content: minute?.content || '',
      summary: minute?.summary || '',
      decisions: minute?.decisions || '',
      actionItems: minute?.actionItems || '',
      attendees: minute?.attendees || '',
      projectId: minute?.projectId || '',
      heldAt: minute?.heldAt ? toDateTimeLocalValue(parseTaskDate(minute.heldAt) || new Date()) : toDateTimeLocalValue(new Date()),
    });
    setAttendeeIds(getAttendeeIdsFromNames(minute?.attendees || ''));
    setExternalAttendees(getExternalAttendeesFromNames(minute?.attendees || ''));
    setStatus('');
  }, [defaultCategory, employees, minute?.id]);

  const changeCategory = (category: string) => {
    setForm((current) => ({
      ...current,
      category,
    }));
  };

  const toggleAttendee = (employeeId: string) => {
    setAttendeeIds((current) => {
      const nextIds = current.includes(employeeId) ? current.filter((id) => id !== employeeId) : [...current, employeeId];
      setForm((formValue) => ({ ...formValue, attendees: buildAttendees(nextIds, externalAttendees) }));
      return nextIds;
    });
  };

  const changeExternalAttendees = (value: string) => {
    setExternalAttendees(value);
    setForm((formValue) => ({ ...formValue, attendees: buildAttendees(attendeeIds, value) }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    const title = form.title.trim();
    const content = form.content.trim();
    if (!title) {
      const message = '회의록 제목을 입력해주세요.';
      setStatus(message);
      showActionPopup(message);
      return;
    }
    if (!content) {
      const message = '회의 내용을 입력해주세요.';
      setStatus(message);
      showActionPopup(message);
      return;
    }
    setLoading(true);
    const message = await onSubmitMinute({ ...form, attendees: buildAttendees(attendeeIds, externalAttendees) });
    setLoading(false);
    setStatus(message);
    showActionPopup(message);
    if (!message.includes('실패') && !message.includes('입력') && !message.includes('선택')) {
      onSuccess();
    }
  };

  return (
    <form className="form-stack meeting-minute-form" onSubmit={submit}>
      <div className="form-grid two">
        <label>
          카테고리
          <select value={form.category} onChange={(event) => changeCategory(event.target.value)}>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <label>
          프로젝트
          <select value={form.projectId || ''} onChange={(event) => setForm({ ...form, projectId: event.target.value })}>
            <option value="">프로젝트 미지정</option>
            {projects.filter((project) => project.status !== 'deleted').map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </label>
      </div>
      <label>
        회의일시
        <DateTimeConfirmField allowClear value={form.heldAt || ''} onChange={(heldAt) => setForm({ ...form, heldAt })} />
      </label>
      <label>
        제목 <span className="required-mark">*</span>
        <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="회의록 제목" />
      </label>
      <label>
        회의 내용 <span className="required-mark">*</span>
        <textarea className="modal-scroll-field" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={7} />
      </label>
      <label>
        {isNewBriefing ? '참가자' : '참석자'}
        <div className="multi-picker compact meeting-attendee-picker modal-scroll-field">
          {employees.map((employee) => (
            <button
              className="select-chip"
              data-selected={attendeeIds.includes(employee.id)}
              key={employee.id}
              onClick={() => toggleAttendee(employee.id)}
              type="button"
            >
              {employee.name}
            </button>
          ))}
        </div>
      </label>
      <label>
        외부 참가자
        <input
          value={externalAttendees}
          onChange={(event) => changeExternalAttendees(event.target.value)}
          placeholder="직원이 아닌 참가자 이름을 입력하세요"
        />
      </label>
      {!isNewBriefing ? (
        <>
          <label>
            요약
            <textarea className="modal-scroll-field" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} rows={3} />
          </label>
          <label>
            결정사항
            <textarea className="modal-scroll-field" value={form.decisions} onChange={(event) => setForm({ ...form, decisions: event.target.value })} rows={3} />
          </label>
          <label>
            액션아이템
            <textarea className="modal-scroll-field" value={form.actionItems} onChange={(event) => setForm({ ...form, actionItems: event.target.value })} rows={3} />
          </label>
        </>
      ) : null}
      {status ? <p className="admin-note">{status}</p> : null}
      <div className="modal-action-bar">
        <button className="primary-action wide" disabled={loading} type="submit">
          <CheckCircle2 size={17} />
          {loading ? '진행중...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function NoticesPage({
  categories,
  notices,
  currentUserId,
  isAdmin,
  currentUser,
  pushEnabled,
  pushLoading,
  pushStatus,
  showThemeSwitcher,
  themeMode,
  onCreateNotice,
  onUpdateNotice,
  onDeleteNotice,
  onTogglePin,
  onAddComment,
  onDeleteComment,
  onClosePage,
  onLogout,
  onMenuClick,
  onNavigate,
  onOpenProfile,
  onRegisterPush,
  onThemeChange,
}: ImmersiveChromeProps & {
  categories: string[];
  notices: Notice[];
  currentUserId: string | null;
  isAdmin: boolean;
  onCreateNotice: NoticeSubmitHandler;
  onUpdateNotice: NoticeUpdateHandler;
  onDeleteNotice: NoticeDeleteHandler;
  onTogglePin: NoticeTogglePinHandler;
  onAddComment: NoticeCommentSubmitHandler;
  onDeleteComment: NoticeCommentDeleteHandler;
}) {
  const [composeOpen, setComposeOpen] = useState(false);
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('전체');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [pinLoadingId, setPinLoadingId] = useState<string | null>(null);

  // 정렬: pinned desc → created_at desc. (이미 서버에서 정렬되긴 하지만 프로토타입/낙관적 업데이트 대비)
  const sortedNotices = useMemo(
    () =>
      [...notices].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      }),
    [notices],
  );
  const visibleNotices = sortedNotices.filter((n) => categoryFilter === '전체' || n.category === categoryFilter);
  const editingNotice = notices.find((n) => n.id === editingNoticeId) || null;

  const removeNotice = async (notice: Notice) => {
    if (deleteLoadingId) return;
    setDeleteLoadingId(notice.id);
    const message = await onDeleteNotice(notice);
    setDeleteLoadingId(null);
    showActionPopup(message);
    if (!message.includes('실패') && !message.includes('취소')) {
      setExpandedId((current) => (current === notice.id ? null : current));
    }
  };

  const togglePin = async (notice: Notice) => {
    if (pinLoadingId) return;
    setPinLoadingId(notice.id);
    const message = await onTogglePin(notice);
    setPinLoadingId(null);
    showActionPopup(message);
  };

  return (
    <ImmersivePageFrame
      action={isAdmin ? (
        <button className="primary-action" onClick={() => setComposeOpen(true)} type="button">
          <Plus size={17} />
          공지 작성
        </button>
      ) : null}
      className="meeting-mode-shell notice-mode-shell"
      currentUser={currentUser}
      folderIcon={Megaphone}
      folderLabel="공지/전달사항"
      heading="공지/전달사항"
      pushEnabled={pushEnabled}
      pushLoading={pushLoading}
      pushStatus={pushStatus}
      searchLabel="공지 검색"
      searchPlaceholder="공지 제목, 카테고리, 작성자 검색"
      showThemeSwitcher={showThemeSwitcher}
      subheading={`관리자가 등록한 공지와 전달사항입니다. · 전체 ${notices.length}건`}
      themeMode={themeMode}
      onClosePage={onClosePage}
      onLogout={onLogout}
      onMenuClick={onMenuClick}
      onNavigate={onNavigate}
      onOpenProfile={onOpenProfile}
      onRegisterPush={onRegisterPush}
      onThemeChange={onThemeChange}
    >
      <div className="meeting-filter-row">
        {['전체', ...categories].map((category) => (
          <button className="filter-chip" data-active={categoryFilter === category} key={category} onClick={() => setCategoryFilter(category)} type="button">
            {category}
          </button>
        ))}
      </div>
      <div className="task-board list-surface project-task-board meeting-board notice-board">
        <div className="project-board-toolbar">
          <div>
            <h2>공지 목록</h2>
            <span>{visibleNotices.length}</span>
          </div>
        </div>
        <div className="meeting-minute-list notice-list">
          {visibleNotices.length ? (
            visibleNotices.map((notice) => {
              const expanded = expandedId === notice.id;
              return (
                <article className="meeting-minute-card notice-card" data-expanded={expanded} data-pinned={notice.pinned} data-important={notice.important} key={notice.id}>
                  <button className="meeting-minute-summary notice-summary" onClick={() => setExpandedId((current) => (current === notice.id ? null : notice.id))} type="button">
                    <span className="meeting-minute-category notice-category">{notice.category}</span>
                    <div>
                      <strong>
                        {notice.pinned ? <Pin size={13} className="notice-pinned-marker" aria-label="상단고정" /> : null}
                        {notice.important ? <span className="notice-important-badge">중요</span> : null}
                        {notice.title}
                      </strong>
                      <small>
                        {notice.createdAt ? formatDueDate(notice.createdAt) : '일시 미정'}
                        {notice.allowComments ? ' · 댓글 가능' : ' · 댓글 비공개'}
                        {notice.popup ? ` · 팝업 ${notice.popupUntil ? `~${notice.popupUntil}` : '무기한'}` : ''}
                      </small>
                    </div>
                    <span className="meeting-minute-author notice-author">
                      <Avatar name={notice.author} src={notice.authorAvatarUrl} size="xs" />
                      {notice.author}
                    </span>
                  </button>
                  {expanded ? (
                    <div className="meeting-minute-detail notice-detail">
                      {isAdmin ? (
                        <div className="meeting-minute-detail-actions notice-actions">
                          <button
                            aria-label={notice.pinned ? '상단고정 해제' : '상단고정'}
                            className="secondary-action icon-only-action"
                            disabled={pinLoadingId === notice.id}
                            onClick={() => togglePin(notice)}
                            title={notice.pinned ? '상단고정 해제' : '상단고정'}
                            type="button"
                          >
                            <Pin size={16} />
                          </button>
                          <button aria-label="공지 수정" className="secondary-action icon-only-action" onClick={() => setEditingNoticeId(notice.id)} title="수정" type="button">
                            <Pencil size={16} />
                          </button>
                          <button
                            aria-label="공지 삭제"
                            className="secondary-action danger-action icon-only-action"
                            disabled={deleteLoadingId === notice.id}
                            onClick={() => removeNotice(notice)}
                            title="삭제"
                            type="button"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : null}
                      <section>
                        <p>{renderLinkedText(notice.content)}</p>
                      </section>
                      {notice.allowComments ? (
                        <NoticeCommentBlock
                          notice={notice}
                          currentUserId={currentUserId}
                          isAdmin={isAdmin}
                          onAddComment={onAddComment}
                          onDeleteComment={onDeleteComment}
                        />
                      ) : (
                        <p className="mini-empty notice-comments-disabled">이 공지는 댓글이 허용되지 않습니다.</p>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })
          ) : (
            <EmptyState text="등록된 공지가 없습니다." />
          )}
        </div>
      </div>
      {composeOpen ? (
        <div className="modal-backdrop meeting-modal-backdrop" role="presentation" onClick={(event) => {
          if (event.target === event.currentTarget) setComposeOpen(false);
        }}>
          <article
            className="modal-card meeting-compose-modal notice-compose-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
            onWheel={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">Notice</p>
                <h2>공지 작성</h2>
              </div>
              <button className="icon-button" aria-label="닫기" onClick={() => setComposeOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>
            <NoticeForm
              categories={categories}
              onSubmitNotice={onCreateNotice}
              onSuccess={() => setComposeOpen(false)}
            />
          </article>
        </div>
      ) : null}
      {editingNotice ? (
        <div className="modal-backdrop meeting-modal-backdrop" role="presentation" onClick={(event) => {
          if (event.target === event.currentTarget) setEditingNoticeId(null);
        }}>
          <article
            className="modal-card meeting-compose-modal notice-compose-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
            onWheel={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <p className="eyebrow">Edit Notice</p>
                <h2>공지 수정</h2>
              </div>
              <button className="icon-button" aria-label="닫기" onClick={() => setEditingNoticeId(null)} type="button">
                <X size={18} />
              </button>
            </div>
            <NoticeForm
              categories={categories}
              notice={editingNotice}
              submitLabel="공지 수정"
              onSubmitNotice={(draft) => onUpdateNotice(editingNotice.id, draft)}
              onSuccess={() => setEditingNoticeId(null)}
            />
          </article>
        </div>
      ) : null}
    </ImmersivePageFrame>
  );
}

function NoticeCommentBlock({
  notice,
  currentUserId,
  isAdmin,
  onAddComment,
  onDeleteComment,
}: {
  notice: Notice;
  currentUserId: string | null;
  isAdmin: boolean;
  onAddComment: NoticeCommentSubmitHandler;
  onDeleteComment: NoticeCommentDeleteHandler;
}) {
  const [comment, setComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentStatus, setCommentStatus] = useState('');
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  const rootComments = notice.comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) => notice.comments.filter((c) => c.parentId === parentId);

  const submitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!comment.trim()) return;
    setCommentLoading(true);
    const message = await onAddComment(notice, comment);
    setCommentLoading(false);
    setCommentStatus(message);
    if (!message.includes('실패')) {
      setComment('');
      showActionPopup(message);
    }
  };

  const submitReply = async (event: React.FormEvent, parentId: string) => {
    event.preventDefault();
    if (!replyText.trim()) return;
    setReplyLoading(true);
    const message = await onAddComment(notice, replyText, parentId);
    setReplyLoading(false);
    if (!message.includes('실패')) {
      setReplyText('');
      setReplyTargetId(null);
      showActionPopup(message);
    } else {
      setCommentStatus(message);
    }
  };

  const removeComment = async (item: NoticeComment) => {
    if (deleteLoadingId) return;
    setDeleteLoadingId(item.id);
    const message = await onDeleteComment(notice, item);
    setDeleteLoadingId(null);
    setCommentStatus(message);
    if (!message.includes('실패') && !message.includes('취소')) showActionPopup(message);
  };

  const renderComment = (item: NoticeComment, isReply = false) => (
    <article className="comment-item" data-own={item.userId === currentUserId} data-reply={isReply} key={item.id}>
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
          {item.userId === currentUserId || isAdmin ? (
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
    <div className="project-inspector-comments notice-comments">
      <strong>댓글 <span>{notice.comments.length}</span></strong>
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
  );
}

function NoticePopup({ notices, ready, onOpenNotices }: { notices: Notice[]; ready: boolean; onOpenNotices: () => void }) {
  // popup=true + (popup_until null or >= today) + not dismissed (localStorage, 24h) 중에서
  // important 우선 → 최신순으로 1개만.
  const candidate = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const now = Date.now();
    const eligible = notices
      .filter((n) => n.popup)
      .filter((n) => !n.popupUntil || n.popupUntil >= todayIso)
      .filter((n) => {
        try {
          const stored = window.localStorage.getItem(NOTICE_POPUP_DISMISS_PREFIX + n.id);
          if (!stored) return true;
          const dismissedAt = Number(stored);
          if (!Number.isFinite(dismissedAt)) return true;
          return now - dismissedAt > 24 * 60 * 60 * 1000;
        } catch {
          return true;
        }
      });
    if (!eligible.length) return null;
    // important 우선 → createdAt desc
    return [...eligible].sort((a, b) => {
      if (a.important !== b.important) return a.important ? -1 : 1;
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    })[0];
  }, [notices]);

  const [hideThisSession, setHideThisSession] = useState<Record<string, boolean>>({});
  const [dontShowToday, setDontShowToday] = useState(false);

  // 후보가 바뀌면 "오늘 안보기" 체크박스도 초기화.
  useEffect(() => {
    setDontShowToday(false);
  }, [candidate?.id]);

  if (!ready || !candidate || hideThisSession[candidate.id]) return null;

  const closePopup = () => {
    if (dontShowToday) {
      try {
        window.localStorage.setItem(NOTICE_POPUP_DISMISS_PREFIX + candidate.id, String(Date.now()));
      } catch {
        /* ignore */
      }
    }
    setHideThisSession((current) => ({ ...current, [candidate.id]: true }));
  };

  const handleOpen = () => {
    closePopup();
    onOpenNotices();
  };

  return (
    <div className="modal-backdrop notice-popup-backdrop" role="presentation" onClick={(event) => {
      if (event.target === event.currentTarget) closePopup();
    }}>
      <article className="modal-card notice-popup-card" role="dialog" aria-modal="true" data-important={candidate.important}>
        <div className="modal-head notice-popup-head">
          <div>
            <p className="eyebrow">
              {candidate.important ? '중요 공지' : '공지'} · {candidate.category}
            </p>
            <h2>{candidate.title}</h2>
            <small>{candidate.author} · {candidate.createdAt ? formatDueDate(candidate.createdAt) : ''}</small>
          </div>
          <button className="icon-button" aria-label="닫기" onClick={closePopup} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="notice-popup-body">
          <p>{renderLinkedText(candidate.content)}</p>
        </div>
        <div className="notice-popup-foot">
          <label className="notice-popup-hide-today">
            <input type="checkbox" checked={dontShowToday} onChange={(event) => setDontShowToday(event.target.checked)} />
            <span>하루동안 안보이게</span>
          </label>
          <div className="notice-popup-actions">
            <button className="secondary-action" onClick={closePopup} type="button">닫기</button>
            <button className="primary-action" onClick={handleOpen} type="button">공지로 이동</button>
          </div>
        </div>
      </article>
    </div>
  );
}

function NoticeForm({
  categories,
  notice,
  submitLabel = '공지 등록',
  onSubmitNotice,
  onSuccess,
}: {
  categories: string[];
  notice?: Notice;
  submitLabel?: string;
  onSubmitNotice: NoticeSubmitHandler;
  onSuccess: () => void;
}) {
  const defaultCategory = notice?.category || (categories.includes('없음') ? '없음' : categories[0] || '없음');
  const [category, setCategory] = useState(defaultCategory);
  const [title, setTitle] = useState(notice?.title || '');
  const [content, setContent] = useState(notice?.content || '');
  const [important, setImportant] = useState(notice?.important || false);
  const [pinned, setPinned] = useState(notice?.pinned || false);
  const [allowComments, setAllowComments] = useState(notice ? notice.allowComments : true);
  const [popup, setPopup] = useState(notice?.popup || false);
  const [popupUntil, setPopupUntil] = useState<string>(notice?.popupUntil || '');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) {
      setStatus('제목과 내용을 입력해주세요.');
      return;
    }
    setSubmitting(true);
    const message = await onSubmitNotice({
      category,
      title: title.trim(),
      content: content.trim(),
      important,
      pinned,
      allowComments,
      popup,
      popupUntil: popup && popupUntil ? popupUntil : null,
    });
    setSubmitting(false);
    setStatus(message);
    if (!message.includes('실패')) {
      showActionPopup(message);
      onSuccess();
    }
  };

  return (
    <form className="form-stack meeting-minute-form notice-form" onSubmit={handleSubmit}>
      <div className="form-grid two">
        <label>
          카테고리
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          제목 <span className="required-mark">*</span>
          <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="공지 제목" maxLength={200} required />
        </label>
      </div>
      <div className="notice-flags-row">
        <label className="notice-flag">
          <input type="checkbox" checked={important} onChange={(event) => setImportant(event.target.checked)} />
          <span>중요</span>
          <small>중요 공지는 푸시알림을 전원 강제 발송합니다.</small>
        </label>
        <label className="notice-flag">
          <input type="checkbox" checked={pinned} onChange={(event) => setPinned(event.target.checked)} />
          <span>상단 고정</span>
          <small>목록 상단에 고정합니다.</small>
        </label>
        <label className="notice-flag">
          <input type="checkbox" checked={allowComments} onChange={(event) => setAllowComments(event.target.checked)} />
          <span>댓글 허용</span>
          <small>전원이 댓글을 달 수 있게 합니다.</small>
        </label>
        <label className="notice-flag">
          <input type="checkbox" checked={popup} onChange={(event) => setPopup(event.target.checked)} />
          <span>메인 접속 팝업</span>
          <small>대시보드 진입 시 팝업으로 띄웁니다.</small>
        </label>
      </div>
      {popup ? (
        <label className="notice-popup-until-field">
          팝업 종료 날짜
          <DateTimeConfirmField dateOnly allowClear placeholder="종료일 선택" value={popupUntil || ''} onChange={(value) => setPopupUntil(value)} />
          <small>비워두면 무기한 표시됩니다.</small>
        </label>
      ) : null}
      <label className="notice-content-field">
        내용 <span className="required-mark">*</span>
        <textarea className="modal-scroll-field" value={content} onChange={(event) => setContent(event.target.value)} rows={10} placeholder="공지 내용을 입력하세요." required />
      </label>
      {status ? <p className="admin-note">{status}</p> : null}
      <div className="form-actions">
        <button className="primary-action" disabled={submitting} type="submit">
          {submitting ? '진행중...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

type JournalSubmitHandler = (draft: WorkJournalEntryDraft) => Promise<string>;
type JournalPatchHandler = (entryId: string, patch: Partial<WorkJournalEntry>) => void;
type JournalDeleteHandler = (entry: WorkJournalEntry) => Promise<string>;

type JournalEditTarget = { entryId: string; field: 'kind' | 'title' | 'detail' | 'status' | 'project' } | null;

function JournalTextEditor({ initial, placeholder, onSave, onCancel }: {
  initial: string;
  placeholder?: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const commit = () => onSave(draft.trim());
  return (
    <div className="journal-edit-wrap">
      <input
        autoFocus
        className="journal-edit-input"
        placeholder={placeholder}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit();
          if (event.key === 'Escape') onCancel();
        }}
      />
      <button aria-label="저장" className="journal-save-btn" onClick={commit} type="button"><Check size={14} /></button>
    </div>
  );
}

function JournalKindEditor({ initial, palette, onSave, onCancel }: {
  initial: JournalKind;
  palette: JournalKindDef[];
  onSave: (value: JournalKind) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chipsRef = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onCancel();
    };
    const keyHandler = (event: KeyboardEvent) => { if (event.key === 'Escape') onCancel(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onCancel]);
  // 초기 포커스: 현재 선택된 chip 또는 첫번째 (open 시 1회)
  useEffect(() => {
    const idx = palette.findIndex((d) => d.name === initial);
    const focusIdx = idx >= 0 ? idx : 0;
    chipsRef.current[focusIdx]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onKeyNav = (event: React.KeyboardEvent) => {
    const chips = chipsRef.current.filter((c): c is HTMLButtonElement => Boolean(c));
    if (!chips.length) return;
    const currentIdx = chips.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      chips[currentIdx <= 0 ? chips.length - 1 : currentIdx - 1]?.focus();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      chips[currentIdx >= chips.length - 1 ? 0 : currentIdx + 1]?.focus();
    }
  };
  return (
    <div className="journal-status-picker journal-kind-picker" ref={ref} onKeyDown={onKeyNav}>
      <div className="journal-status-picker-flow">
        {palette.map((def, i) => (
          <button
            ref={(el) => { chipsRef.current[i] = el; }}
            className="journal-kind-chip journal-status-picker-chip"
            data-selected={def.name === initial}
            key={def.id}
            onClick={() => onSave(def.name)}
            type="button"
          >{def.name}</button>
        ))}
      </div>
    </div>
  );
}

function JournalStatusEditor({ initial, palette, onSave, onCancel }: {
  initial: JournalStatus;
  palette: JournalStatusDef[];
  onSave: (value: JournalStatus) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chipsRef = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onCancel();
    };
    const keyHandler = (event: KeyboardEvent) => { if (event.key === 'Escape') onCancel(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onCancel]);
  // 초기 포커스: 현재 선택된 chip 또는 첫번째
  useEffect(() => {
    const idx = palette.findIndex((d) => d.name === initial);
    const focusIdx = idx >= 0 ? idx : 0;
    chipsRef.current[focusIdx]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onKeyNav = (event: React.KeyboardEvent) => {
    const chips = chipsRef.current.filter((c): c is HTMLButtonElement => Boolean(c));
    if (!chips.length) return;
    const currentIdx = chips.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      chips[currentIdx <= 0 ? chips.length - 1 : currentIdx - 1]?.focus();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      chips[currentIdx >= chips.length - 1 ? 0 : currentIdx + 1]?.focus();
    }
  };
  return (
    <div className="journal-status-picker" ref={ref} onKeyDown={onKeyNav}>
      <div className="journal-status-picker-flow">
        {palette.map((def, i) => (
          <button
            ref={(el) => { chipsRef.current[i] = el; }}
            className="journal-status-badge journal-status-picker-chip"
            data-phase={def.phase}
            data-selected={def.name === initial}
            key={def.id}
            onClick={() => onSave(def.name)}
            type="button"
          >{def.name}</button>
        ))}
      </div>
    </div>
  );
}

function JournalProjectEditor({ initial, projects, onSave, onCancel }: {
  initial: string | null | undefined;
  projects: Project[];
  onSave: (value: string | null) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<string>(initial || '');
  return (
    <div className="journal-edit-wrap">
      <select
        autoFocus
        className="journal-edit-select journal-project-edit-select"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => { if (event.key === 'Escape') onCancel(); if (event.key === 'Enter') onSave(draft || null); }}
      >
        <option value="">— 매칭 안 함 —</option>
        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select>
      <button aria-label="저장" className="journal-save-btn" onClick={() => onSave(draft || null)} type="button"><Check size={14} /></button>
    </div>
  );
}

function JournalEntryRow({
  entry,
  projects,
  statusPalette,
  kindPalette,
  editing,
  readOnly,
  dragging = false,
  onDragHandle,
  onStartEdit,
  onEndEdit,
  onPatch,
  onDelete,
}: {
  entry: WorkJournalEntry;
  projects: Project[];
  statusPalette: JournalStatusDef[];
  kindPalette: JournalKindDef[];
  editing: JournalEditTarget;
  readOnly: boolean;
  dragging?: boolean;
  onDragHandle?: (entry: WorkJournalEntry, event: React.PointerEvent) => void;
  onStartEdit: (target: NonNullable<JournalEditTarget>) => void;
  onEndEdit: () => void;
  onPatch: JournalPatchHandler;
  onDelete: (entry: WorkJournalEntry) => void;
}) {
  const isEditing = (field: NonNullable<JournalEditTarget>['field']) =>
    !readOnly && editing !== null && editing.entryId === entry.id && editing.field === field;
  const matchedProject = entry.projectId ? projects.find((p) => p.id === entry.projectId) : null;
  const statusPhase = lookupStatusPhase(statusPalette, entry.status);
  // 엔터로 저장하면 다음 필드로 자동 이동하는 순서
  const FIELD_ORDER: NonNullable<JournalEditTarget>['field'][] = ['kind', 'title', 'detail', 'project', 'status'];
  const saveField = (patch: Partial<WorkJournalEntry>, currentField?: NonNullable<JournalEditTarget>['field']) => {
    onPatch(entry.id, patch);
    if (currentField) {
      const idx = FIELD_ORDER.indexOf(currentField);
      const next = FIELD_ORDER[idx + 1];
      if (next) {
        onStartEdit({ entryId: entry.id, field: next });
        return;
      }
    }
    onEndEdit();
  };
  const handleStartEdit = (target: NonNullable<JournalEditTarget>) => {
    if (readOnly) return;
    onStartEdit(target);
  };

  return (
    <li className="journal-entry-row journal-row-readable" data-dragging={dragging}>
      {/* 드래그 핸들 — 끌어서 다른 날로 이동 (마우스 즉시 / 터치 롱프레스) */}
      {readOnly ? null : (
        <button
          className="journal-drag-handle"
          type="button"
          aria-label="끌어서 이동"
          onPointerDown={(event) => onDragHandle?.(entry, event)}
          onClick={(event) => event.preventDefault()}
        ><GripVertical size={15} /></button>
      )}
      {/* 종류 — status 패턴 동일: 버튼은 항상 렌더, 편집 시 picker를 위에 띄움 */}
      <div className="journal-kind-cell">
        {isEditing('kind') ? (
          <JournalKindEditor
            initial={entry.kind}
            palette={kindPalette}
            onSave={(value) => saveField({ kind: value }, 'kind')}
            onCancel={onEndEdit}
          />
        ) : null}
        <button
          className="journal-view journal-view-kind"
          onClick={() => handleStartEdit({ entryId: entry.id, field: 'kind' })}
          type="button"
          aria-label="종류 수정"
        >{entry.kind}</button>
      </div>

      <div className="journal-entry-body">
        {/* 제목 */}
        {isEditing('title') ? (
          <JournalTextEditor
            initial={entry.title}
            placeholder="제목을 입력하세요"
            onSave={(value) => saveField({ title: value }, 'title')}
            onCancel={onEndEdit}
          />
        ) : (
          <button
            className="journal-view journal-view-title"
            onClick={() => handleStartEdit({ entryId: entry.id, field: 'title' })}
            type="button"
          >
            {entry.title || <em className="journal-placeholder">제목을 입력하세요</em>}
          </button>
        )}

        <div className="journal-entry-meta-row">
          {/* 기타사항 */}
          {isEditing('detail') ? (
            <JournalTextEditor
              initial={entry.detail || ''}
              placeholder="기타사항"
              onSave={(value) => saveField({ detail: value }, 'detail')}
              onCancel={onEndEdit}
            />
          ) : (
            <button
              className="journal-view journal-view-detail"
              onClick={() => handleStartEdit({ entryId: entry.id, field: 'detail' })}
              type="button"
            >
              {entry.detail || <em className="journal-placeholder">+ 기타사항</em>}
            </button>
          )}

          {/* 프로젝트 매칭 */}
          {isEditing('project') ? (
            <JournalProjectEditor
              initial={entry.projectId}
              projects={projects}
              onSave={(value) => saveField({ projectId: value }, 'project')}
              onCancel={onEndEdit}
            />
          ) : matchedProject ? (
            <button
              className="journal-view journal-view-project"
              onClick={() => handleStartEdit({ entryId: entry.id, field: 'project' })}
              type="button"
              aria-label="프로젝트 매칭 변경"
            >📁 {matchedProject.name}</button>
          ) : (
            <button
              className="journal-view journal-view-project-empty"
              onClick={() => handleStartEdit({ entryId: entry.id, field: 'project' })}
              type="button"
            >+ 매칭</button>
          )}
        </div>
      </div>

      {/* 상태 */}
      <div className="journal-status-cell">
        {isEditing('status') ? (
          <JournalStatusEditor
            initial={entry.status}
            palette={statusPalette}
            onSave={(value) => saveField({ status: value }, 'status')}
            onCancel={onEndEdit}
          />
        ) : null}
        <button
          className="journal-view journal-status-badge"
          data-phase={statusPhase}
          onClick={() => handleStartEdit({ entryId: entry.id, field: 'status' })}
          type="button"
          aria-label="상태 수정"
        >{entry.status}</button>
      </div>

      {readOnly ? <span /> : (
        <button
          aria-label="삭제"
          className="icon-only-action danger-action journal-delete-btn"
          onClick={() => onDelete(entry)}
          type="button"
        ><Trash2 size={14} /></button>
      )}
    </li>
  );
}

function WeeklyContractsTable({
  contracts,
  weekStart,
  readOnly,
  onAdd,
  onPatch,
  onDelete,
}: {
  contracts: WeeklyContract[];
  weekStart: string;
  readOnly: boolean;
  onAdd: (weekStart: string) => Promise<string>;
  onPatch: (id: string, patch: Partial<WeeklyContract>) => void;
  onDelete: (contract: WeeklyContract) => string;
}) {
  const [editing, setEditing] = useState<{ id: string; field: 'company' | 'dueDate' | 'notes' } | null>(null);
  const visible = contracts.filter((c) => c.weekStart === weekStart).sort((a, b) => a.sequence - b.sequence);

  const cell = (contract: WeeklyContract, field: 'company' | 'dueDate' | 'notes', placeholder: string) => {
    const value = contract[field];
    const isEditing = !readOnly && editing?.id === contract.id && editing.field === field;
    if (isEditing) {
      return (
        <JournalTextEditor
          initial={value}
          placeholder={placeholder}
          onSave={(next) => {
            onPatch(contract.id, { [field]: next });
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      );
    }
    return (
      <button
        className="journal-view journal-contract-cell"
        onClick={() => { if (!readOnly) setEditing({ id: contract.id, field }); }}
        type="button"
      >
        {value || <em className="journal-placeholder">{placeholder}</em>}
      </button>
    );
  };

  return (
    <section className="journal-contracts-section">
      <header className="journal-contracts-head">
        <h2>이번주 진행중 계약·할일</h2>
        <span>{visible.length}건</span>
      </header>
      <div className="journal-contracts-table">
        <div className="journal-contracts-row journal-contracts-row-head">
          <span>순번</span>
          <span>상호/업무</span>
          <span>진행상황</span>
          <span>기타사항</span>
          <span />
        </div>
        {visible.map((contract, idx) => (
          <div className="journal-contracts-row" key={contract.id}>
            <span className="journal-contract-seq">{idx + 1}</span>
            {cell(contract, 'company', '상호 / 업무명')}
            {cell(contract, 'dueDate', '진행 상황')}
            {cell(contract, 'notes', '메모')}
            {readOnly ? <span /> : (
              <button
                aria-label="삭제"
                className="icon-only-action danger-action journal-delete-btn"
                onClick={() => onDelete(contract)}
                type="button"
              ><Trash2 size={14} /></button>
            )}
          </div>
        ))}
        {readOnly ? null : (
          <button
            className="journal-add-inline journal-contracts-add"
            onClick={() => onAdd(weekStart)}
            type="button"
          ><Plus size={14} /> 행 추가</button>
        )}
      </div>
    </section>
  );
}

function JournalPage({
  currentUser,
  entries,
  employees,
  projects,
  statusPalette,
  kindPalette,
  contracts,
  pushEnabled,
  pushLoading,
  pushStatus,
  showThemeSwitcher,
  themeMode,
  onClosePage,
  onLogout,
  onMenuClick,
  onNavigate,
  onOpenProfile,
  onRegisterPush,
  onThemeChange,
  onAddJournalEntry,
  onPatchJournalEntry,
  onDeleteJournalEntry,
  onAddJournalStatus,
  onUpdateJournalStatus,
  onDeleteJournalStatus,
  onAddJournalKind,
  onUpdateJournalKind,
  onDeleteJournalKind,
  onAddWeeklyContract,
  onPatchWeeklyContract,
  onDeleteWeeklyContract,
}: ImmersiveChromeProps & {
  entries: WorkJournalEntry[];
  employees: Employee[];
  projects: Project[];
  statusPalette: JournalStatusDef[];
  kindPalette: JournalKindDef[];
  contracts: WeeklyContract[];
  onAddJournalEntry: JournalSubmitHandler;
  onPatchJournalEntry: JournalPatchHandler;
  onDeleteJournalEntry: JournalDeleteHandler;
  onAddJournalStatus: (name: string, phase: JournalStatusPhase) => string;
  onUpdateJournalStatus: (id: string, patch: Partial<Pick<JournalStatusDef, 'name' | 'phase'>>) => string;
  onDeleteJournalStatus: (id: string) => string;
  onAddJournalKind: (name: string) => string;
  onUpdateJournalKind: (id: string, patch: { name?: string }) => string;
  onDeleteJournalKind: (id: string) => string;
  onAddWeeklyContract: (weekStart: string) => Promise<string>;
  onPatchWeeklyContract: (id: string, patch: Partial<WeeklyContract>) => void;
  onDeleteWeeklyContract: (contract: WeeklyContract) => string;
}) {
  const todayIso = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // 시드 데이터가 5월 25일 주이므로 그 주를 기본 표시
  const seedWeekStart = '2026-05-25';
  const [weekStart, setWeekStart] = useState<string>(seedWeekStart);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteEditing, setPaletteEditing] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusPhase, setNewStatusPhase] = useState<JournalStatusPhase>('plan');
  const [newKindName, setNewKindName] = useState('');
  const [editing, setEditing] = useState<JournalEditTarget>(null);
  const [viewingUserId, setViewingUserId] = useState<string>(currentUser.id);

  const viewingEmployee = employees.find((emp) => emp.id === viewingUserId);
  const viewingOwn = viewingUserId === currentUser.id;
  const viewingName = viewingOwn ? '내 일지' : viewingEmployee?.name || '직원';
  const readOnly = !viewingOwn;

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = weekDays[6];

  const myEntries = entries.filter((entry) => entry.userId === viewingUserId && !entry.hidden);
  const weekEntries = myEntries.filter((entry) => entry.weekStart === weekStart);

  const entriesByDate: Record<string, WorkJournalEntry[]> = {};
  weekDays.forEach((d) => { entriesByDate[d] = []; });
  weekEntries.forEach((entry) => {
    if (entriesByDate[entry.date]) entriesByDate[entry.date].push(entry);
  });

  const formatDayHeader = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    const wd = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    const isToday = iso === todayIso;
    return `${d.getMonth() + 1}/${d.getDate()} (${wd})${isToday ? ' · 오늘' : ''}`;
  };

  const weekLabel = `${weekStart.slice(0, 4)}년 ${parseInt(weekStart.slice(5, 7), 10)}월 · ${weekStart.slice(5, 7)}/${weekStart.slice(8, 10)}(월) ~ ${weekEnd.slice(5, 7)}/${weekEnd.slice(8, 10)}(일)`;

  const goPrev = () => setWeekStart(addDays(weekStart, -7));
  const goNext = () => setWeekStart(addDays(weekStart, 7));
  const goToday = () => setWeekStart(getJournalWeekStart(todayIso));

  const addRow = async (day: string) => {
    const newId = await onAddJournalEntry({
      date: day,
      kind: '작업',
      title: '',
      detail: '',
      status: '작업진행중',
      projectId: null,
    });
    setEditing({ entryId: newId, field: 'title' });
  };

  const handleDelete = (entry: WorkJournalEntry) => {
    onDeleteJournalEntry(entry);
  };

  // ─── 드래그 이동 (마우스=즉시, 터치=롱프레스+햅틱) ───────────────────
  const [dragEntry, setDragEntry] = useState<WorkJournalEntry | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const dragRef = useRef<{
    entry: WorkJournalEntry | null;
    armed: boolean;
    longPress: number | null;
    startX: number;
    startY: number;
    overDate: string | null;
    weekFlipAt: number;
  }>({ entry: null, armed: false, longPress: null, startX: 0, startY: 0, overDate: null, weekFlipAt: 0 });

  const beginDrag = (entry: WorkJournalEntry, event: React.PointerEvent) => {
    if (readOnly) return;
    const meta = dragRef.current;
    meta.entry = entry;
    meta.armed = false;
    meta.startX = event.clientX;
    meta.startY = event.clientY;
    meta.overDate = entry.date;
    if (event.pointerType === 'touch') {
      // 터치: 롱프레스(280ms) 후 햅틱 + 드래그 시작
      meta.longPress = window.setTimeout(() => {
        meta.armed = true;
        try { navigator.vibrate?.(25); } catch { /* 진동 미지원 무시 */ }
        setDragEntry(entry);
        setDragPos({ x: meta.startX, y: meta.startY });
        setDragOverDate(entry.date);
      }, 280);
    } else {
      // 마우스: 즉시 드래그
      meta.armed = true;
      setDragEntry(entry);
      setDragPos({ x: event.clientX, y: event.clientY });
      setDragOverDate(entry.date);
    }
  };

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const meta = dragRef.current;
      if (!meta.entry) return;
      if (!meta.armed) {
        // 롱프레스 전 이동이 크면 스크롤로 간주 → 취소
        if (Math.abs(event.clientX - meta.startX) > 10 || Math.abs(event.clientY - meta.startY) > 10) {
          if (meta.longPress) { window.clearTimeout(meta.longPress); meta.longPress = null; }
          meta.entry = null;
        }
        return;
      }
      event.preventDefault();
      setDragPos({ x: event.clientX, y: event.clientY });
      const el = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
      // 주 네비 위 hover → 주 전환 (cross-week, 700ms throttle)
      const nav = el?.closest('[data-weeknav]') as HTMLElement | null;
      if (nav) {
        const now = Date.now();
        if (now - meta.weekFlipAt > 700) {
          meta.weekFlipAt = now;
          if (nav.dataset.weeknav === 'prev') goPrev(); else goNext();
        }
        meta.overDate = null;
        setDragOverDate(null);
        return;
      }
      const group = el?.closest('.journal-day-group') as HTMLElement | null;
      const date = group?.dataset.date || null;
      meta.overDate = date;
      setDragOverDate(date);
    };
    const finish = () => {
      const meta = dragRef.current;
      if (meta.longPress) { window.clearTimeout(meta.longPress); meta.longPress = null; }
      if (meta.armed && meta.entry && meta.overDate && meta.overDate !== meta.entry.date) {
        onPatchJournalEntry(meta.entry.id, { date: meta.overDate });
        try { navigator.vibrate?.(15); } catch { /* 무시 */ }
      }
      meta.entry = null;
      meta.armed = false;
      meta.overDate = null;
      setDragEntry(null);
      setDragOverDate(null);
    };
    document.addEventListener('pointermove', move, { passive: false });
    document.addEventListener('pointerup', finish);
    document.addEventListener('pointercancel', finish);
    return () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', finish);
      document.removeEventListener('pointercancel', finish);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onPatchJournalEntry, weekStart]);

  return (
    <ImmersivePageFrame
      className="journal-mode-shell"
      currentUser={currentUser}
      folderIcon={NotebookPen}
      folderLabel="주간업무일지"
      heading="주간업무일지"
      pushEnabled={pushEnabled}
      pushLoading={pushLoading}
      pushStatus={pushStatus}
      searchLabel="일지 검색"
      searchPlaceholder="제목·라벨·기타사항 검색"
      showThemeSwitcher={showThemeSwitcher}
      subheading="한 주간의 활동을 라벨로 기록하고, 같은 라벨이 누적되면 프로젝트로 승격하세요."
      themeMode={themeMode}
      onClosePage={onClosePage}
      onLogout={onLogout}
      onMenuClick={onMenuClick}
      onNavigate={onNavigate}
      onOpenProfile={onOpenProfile}
      onRegisterPush={onRegisterPush}
      onThemeChange={onThemeChange}
    >
      <div className="journal-week-nav">
        <button className="secondary-action icon-only-action" data-weeknav="prev" data-drag-active={Boolean(dragEntry)} onClick={goPrev} type="button" aria-label="이전 주"><ChevronLeft size={18} /></button>
        <div className="journal-week-label">
          <strong>{weekLabel}</strong>
          <span>{weekEntries.length}건 기록</span>
        </div>
        <button className="secondary-action icon-only-action" data-weeknav="next" data-drag-active={Boolean(dragEntry)} onClick={goNext} type="button" aria-label="다음 주"><ChevronRight size={18} /></button>
        <button className="secondary-action" onClick={goToday} type="button">오늘</button>
      </div>

      <div className="journal-palette-wrap">
        <div className="journal-palette-bar">
          <button className="journal-palette-toggle" onClick={() => setPaletteOpen((v) => !v)} type="button">
            <ChevronDown size={16} style={{ transform: paletteOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 150ms' }} />
            팔레트 {paletteOpen ? '닫기' : '보기'} (종류 {kindPalette.length} · 상태 {statusPalette.length})
          </button>
          {paletteOpen && !readOnly ? (
            <button
              className="journal-palette-edit-toggle"
              onClick={() => setPaletteEditing((v) => !v)}
              type="button"
            >{paletteEditing ? '완료' : '편집'}</button>
          ) : null}
          <div className="journal-viewer-picker">
            {readOnly ? <span className="journal-viewer-readonly">읽기 전용</span> : null}
            <select
              aria-label="일지 작성자 선택"
              className="journal-viewer-select"
              data-readonly={readOnly}
              value={viewingUserId}
              onChange={(event) => { setViewingUserId(event.target.value); setEditing(null); setPaletteEditing(false); }}
            >
              <option value={currentUser.id}>내 일지</option>
              {employees.filter((emp) => emp.id !== currentUser.id).map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name} 일지</option>
              ))}
            </select>
          </div>
        </div>
        {paletteOpen ? (
          <div className="journal-palette">
            {/* 종류 (kind) 팔레트 — 상태 팔레트 위 */}
            <div className="journal-palette-section">
              <h4 className="journal-palette-section-title">종류</h4>
              {paletteEditing ? (
                <div className="journal-palette-edit-list">
                  {kindPalette.map((def) => (
                    <div className="journal-palette-edit-row" key={def.id}>
                      <span className="journal-kind-chip">{def.name}</span>
                      <input
                        className="journal-palette-edit-name"
                        defaultValue={def.name}
                        placeholder="종류 이름"
                        onBlur={(event) => {
                          const next = event.target.value.trim();
                          if (next && next !== def.name) onUpdateJournalKind(def.id, { name: next });
                        }}
                        onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
                      />
                      <button
                        aria-label="삭제"
                        className="icon-only-action danger-action"
                        onClick={() => onDeleteJournalKind(def.id)}
                        type="button"
                      ><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <div className="journal-palette-edit-row journal-palette-edit-row-new">
                    {newKindName ? (
                      <span className="journal-kind-chip">{newKindName}</span>
                    ) : (
                      <span className="journal-kind-chip journal-kind-chip-empty">새 종류</span>
                    )}
                    <input
                      className="journal-palette-edit-name"
                      value={newKindName}
                      placeholder="새 종류 이름"
                      onChange={(event) => setNewKindName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && newKindName.trim()) {
                          onAddJournalKind(newKindName);
                          setNewKindName('');
                        }
                      }}
                    />
                    <button
                      aria-label="추가"
                      className="icon-only-action primary-action"
                      disabled={!newKindName.trim()}
                      onClick={() => {
                        if (!newKindName.trim()) return;
                        onAddJournalKind(newKindName);
                        setNewKindName('');
                      }}
                      type="button"
                    ><Plus size={14} /></button>
                  </div>
                </div>
              ) : (
                <div className="journal-palette-flow">
                  {kindPalette.map((def) => (
                    <span className="journal-kind-chip" key={def.id}>{def.name}</span>
                  ))}
                </div>
              )}
            </div>

            {/* 상태 (status) 팔레트 */}
            <div className="journal-palette-section">
              <h4 className="journal-palette-section-title">상태</h4>
              {paletteEditing ? (
                <div className="journal-palette-edit-list">
                  {statusPalette.map((def) => (
                  <div className="journal-palette-edit-row" key={def.id}>
                    <span className="journal-status-badge" data-phase={def.phase}>{def.name}</span>
                    <input
                      className="journal-palette-edit-name"
                      defaultValue={def.name}
                      placeholder="상태 이름"
                      onBlur={(event) => {
                        const next = event.target.value.trim();
                        if (next && next !== def.name) onUpdateJournalStatus(def.id, { name: next });
                      }}
                      onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }}
                    />
                    <select
                      className="journal-palette-edit-phase"
                      value={def.phase}
                      onChange={(event) => onUpdateJournalStatus(def.id, { phase: event.target.value as JournalStatusPhase })}
                    >
                      {journalPhases.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <button
                      aria-label="삭제"
                      className="icon-only-action danger-action"
                      onClick={() => onDeleteJournalStatus(def.id)}
                      type="button"
                    ><Trash2 size={14} /></button>
                  </div>
                ))}
                <div className="journal-palette-edit-row journal-palette-edit-row-new">
                  {newStatusName ? (
                    <span className="journal-status-badge" data-phase={newStatusPhase}>{newStatusName}</span>
                  ) : (
                    <span className="journal-status-badge journal-status-badge-empty" data-phase={newStatusPhase}>새 상태</span>
                  )}
                  <input
                    className="journal-palette-edit-name"
                    value={newStatusName}
                    placeholder="새 상태 이름"
                    onChange={(event) => setNewStatusName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && newStatusName.trim()) {
                        onAddJournalStatus(newStatusName, newStatusPhase);
                        setNewStatusName('');
                      }
                    }}
                  />
                  <select
                    className="journal-palette-edit-phase"
                    value={newStatusPhase}
                    onChange={(event) => setNewStatusPhase(event.target.value as JournalStatusPhase)}
                  >
                    {journalPhases.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                  <button
                    aria-label="추가"
                    className="icon-only-action primary-action"
                    disabled={!newStatusName.trim()}
                    onClick={() => {
                      if (!newStatusName.trim()) return;
                      onAddJournalStatus(newStatusName, newStatusPhase);
                      setNewStatusName('');
                    }}
                    type="button"
                  ><Plus size={14} /></button>
                </div>
              </div>
            ) : (
              <div className="journal-palette-flow">
                {statusPalette.map((def) => (
                  <span className="journal-status-badge" data-phase={def.phase} key={def.id}>{def.name}</span>
                ))}
              </div>
            )}
            </div>
          </div>
        ) : null}
      </div>

      <WeeklyContractsTable
        contracts={contracts.filter((c) => c.userId === viewingUserId)}
        weekStart={weekStart}
        readOnly={readOnly}
        onAdd={onAddWeeklyContract}
        onPatch={onPatchWeeklyContract}
        onDelete={onDeleteWeeklyContract}
      />

      <div className="journal-day-list">
        {weekDays.map((day) => {
          const dayEntries = entriesByDate[day] || [];
          const isDropTarget = Boolean(dragEntry) && dragOverDate === day && dragEntry?.date !== day;
          return (
            <section
              className="journal-day-group"
              data-empty={dayEntries.length === 0}
              data-date={day}
              data-drop-target={isDropTarget}
              key={day}
            >
              <header className="journal-day-head">
                <strong>{formatDayHeader(day)}</strong>
                <span>{dayEntries.length ? `${dayEntries.length}건` : '비어있음'}</span>
              </header>
              {dayEntries.length ? (
                <ul className="journal-entry-list">
                  {dayEntries.map((entry) => (
                    <JournalEntryRow
                      key={entry.id}
                      entry={entry}
                      projects={projects}
                      statusPalette={statusPalette}
                      kindPalette={kindPalette}
                      editing={editing}
                      readOnly={readOnly}
                      dragging={dragEntry?.id === entry.id}
                      onDragHandle={beginDrag}
                      onStartEdit={(target) => setEditing(target)}
                      onEndEdit={() => setEditing(null)}
                      onPatch={onPatchJournalEntry}
                      onDelete={handleDelete}
                    />
                  ))}
                </ul>
              ) : null}
              {readOnly ? null : (
                <button className="journal-add-inline" onClick={() => addRow(day)} type="button">
                  <Plus size={14} /> 새 항목
                </button>
              )}
            </section>
          );
        })}
      </div>
      {dragEntry ? (
        <div className="journal-drag-ghost" style={{ left: dragPos.x + 14, top: dragPos.y + 14 }}>
          <span className="journal-kind-chip">{dragEntry.kind}</span>
          <span className="journal-drag-ghost-title">{dragEntry.title || '(제목 없음)'}</span>
        </div>
      ) : null}
    </ImmersivePageFrame>
  );
}

function CalendarPage({
  currentUser,
  pushEnabled,
  pushLoading,
  pushStatus,
  showThemeSwitcher,
  themeMode,
  googleCalendarSettings,
  tasks,
  employees,
  operations,
  schedules,
  onClosePage,
  onLogout,
  onMenuClick,
  onNavigate,
  onOpenProfile,
  onRegisterPush,
  onThemeChange,
  onAddSchedule,
  onDeleteSchedule,
  onUpdateSchedule,
  onOpenTask,
  onOpenOperations,
}: ImmersiveChromeProps & {
  googleCalendarSettings: GoogleCalendarSettings;
  tasks: Task[];
  employees: Employee[];
  operations: OperationItem[];
  schedules: WorkSchedule[];
  onAddSchedule: WorkScheduleSubmitHandler;
  onDeleteSchedule: WorkScheduleDeleteHandler;
  onUpdateSchedule: WorkScheduleUpdateHandler;
  onOpenTask: (task: Task) => void;
  onOpenOperations: () => void;
}) {
  const [mode, setMode] = useState<'일' | '주' | '월'>('월');
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [scheduleCreateOpen, setScheduleCreateOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null);
  const [googleSyncLoading, setGoogleSyncLoading] = useState(false);
  const [googleSyncStatus, setGoogleSyncStatus] = useState('');
  // 담당자 필터: '전체' | '__others__'(나 제외/팀) | employee.id
  const [calendarPerson, setCalendarPerson] = useState<string>('전체');
  // 캘린더는 팀 전체 일정 보드 — 내 업무가 아니어도 캘린더 표시 대상이면 모두 노출.
  // 담당자(받는 사람) 기준 매칭 — 보낸 사람/생성자는 제외
  const calendarAssigneeNames = (task: Task) => (task.to || '').split(',').map((s) => s.trim()).filter(Boolean);
  const taskAssignedTo = (task: Task, emp: Employee) =>
    getTaskRecipientIds(task).includes(emp.id) || calendarAssigneeNames(task).includes(emp.name);
  const taskAssignedToCurrentUser = (task: Task) =>
    getTaskRecipientIds(task).includes(currentUser.id) || calendarAssigneeNames(task).includes(currentUser.name);
  const calendarSelectedEmployee = employees.find((emp) => emp.id === calendarPerson);
  const calendarTasks = tasks.filter((task) => {
    if (!(task.showOnCalendar ?? true)) return false;
    if (calendarPerson === '전체') return true;
    if (calendarPerson === '__others__') return !taskAssignedToCurrentUser(task);
    return calendarSelectedEmployee ? taskAssignedTo(task, calendarSelectedEmployee) : true;
  });
  // 개인 스케줄도 담당자(작성자) 기준으로 동일하게 필터링
  const scheduleOwnedByCurrentUser = (schedule: WorkSchedule) =>
    schedule.createdBy === currentUser.id || schedule.creatorName === currentUser.name;
  const calendarSchedules = schedules.filter((schedule) => {
    if (calendarPerson === '전체') return true;
    if (calendarPerson === '__others__') return !scheduleOwnedByCurrentUser(schedule);
    return calendarSelectedEmployee
      ? schedule.createdBy === calendarSelectedEmployee.id || schedule.creatorName === calendarSelectedEmployee.name
      : true;
  });
  const taskCalendarEvents = calendarTasks
    .map((task) => {
      const range = getTaskCalendarRange(task);
      const kind = task.status === '완료'
        ? '완료'
        : task.creatorId === currentUser.id || (currentUser.isPrototype && task.from === currentUser.name)
          ? '보낸 업무'
          : '받은 업무';
      return range
        ? {
            id: `task-${task.id}`,
            title: `${task.to || '담당자 미지정'} - ${task.title}`,
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
  const scheduleCalendarEvents = calendarSchedules
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
        allDay: schedule.allDay,
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
  const eventIntersectsDay = (event: { start: Date; end: Date }, day: Date) => {
    const dayStart = startOfCalendarDay(day);
    const dayEnd = addCalendarDays(dayStart, 1);
    return event.start.getTime() < dayEnd.getTime() && event.end.getTime() >= dayStart.getTime();
  };
  const eventsForDay = (day: Date) => calendarEvents.filter((event) => eventIntersectsDay(event, day));
  const eventSegmentsForWeek = (week: Date[]) => {
    const segments = calendarEvents
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
      .filter((item): item is CalendarSegment => Boolean(item));

    const occupiedRowsByColumn = Array.from({ length: 7 }, () => new Set<number>());

    return segments.map((segment) => {
      const startColumnIndex = segment.columnStart - 1;
      const endColumnIndex = Math.min(6, startColumnIndex + segment.span - 1);
      let row = 1;

      while (
        Array.from({ length: endColumnIndex - startColumnIndex + 1 }, (_, index) => startColumnIndex + index)
          .some((columnIndex) => occupiedRowsByColumn[columnIndex].has(row))
      ) {
        row += 1;
      }

      for (let columnIndex = startColumnIndex; columnIndex <= endColumnIndex; columnIndex += 1) {
        occupiedRowsByColumn[columnIndex].add(row);
      }

      return { ...segment, row };
    });
  };
  const eventTimeLabel = (event: CalendarEventItem) => {
    if (event.allDay || event.days > 1) {
      return `${event.start.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}~${event.end.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`;
    }
    return `${event.start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}~${event.end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
  };
  const monthEventMetaLabel = (event: CalendarSegment) => {
    if (event.allDay) return event.days > 1 ? `${event.firstDay}~${event.lastDay}일차` : '';
    if (event.days > 1) return `${event.firstDay}~${event.lastDay}일차`;
    return event.end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };
  const eventTimeRangeLines = (event: CalendarEventItem) => ({
    start: event.start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    end: event.end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
  });
  const eventsForDateStack = (day: Date) => eventsForDay(day).filter((event) => event.allDay || event.days > 1);
  const timedEventsForDay = (day: Date) => eventsForDay(day).filter((event) => !event.allDay && event.days <= 1);
  const layoutTimedEvents = (day: Date) => {
    const dayStart = startOfCalendarDay(day).getTime();
    const dayEnd = addCalendarDays(startOfCalendarDay(day), 1).getTime();
    const events = timedEventsForDay(day)
      .map((event) => {
        const startMinutes = Math.max(0, Math.floor((Math.max(event.start.getTime(), dayStart) - dayStart) / 60000));
        const endMinutes = Math.min(1440, Math.ceil((Math.min(getCalendarEndDate(event).getTime(), dayEnd) - dayStart) / 60000));
        return { ...event, startMinutes, endMinutes: Math.max(startMinutes + 30, endMinutes), lane: 0, laneCount: 1 };
      })
      .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);
    const active: Array<{ lane: number; endMinutes: number }> = [];
    let laneCount = 1;

    events.forEach((event) => {
      for (let index = active.length - 1; index >= 0; index -= 1) {
        if (active[index].endMinutes <= event.startMinutes) active.splice(index, 1);
      }
      const used = new Set(active.map((item) => item.lane));
      let lane = 0;
      while (used.has(lane)) lane += 1;
      event.lane = lane;
      active.push({ lane, endMinutes: event.endMinutes });
      laneCount = Math.max(laneCount, active.length, lane + 1);
    });

    return events.map((event) => ({ ...event, laneCount }));
  };
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
    <ImmersivePageFrame
      action={(
        <div className="calendar-head-actions">
        <div className="calendar-controls">
          <select
            className="task-person-filter calendar-person-filter"
            value={calendarPerson}
            onChange={(event) => setCalendarPerson(event.target.value)}
            aria-label="담당자 필터"
          >
            <option value="전체">전체 담당자</option>
            <option value="__others__">나 제외 (팀)</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>{employee.name}</option>
            ))}
          </select>
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
        <div className="calendar-legend" aria-label="색상 범례">
          <span><i style={{ background: '#4b8ef7' }} />받은 업무</span>
          <span><i style={{ background: '#9aa1ad' }} />보낸 업무</span>
          <span><i style={{ background: '#36a878' }} />완료</span>
          <span><i style={{ background: '#d69731' }} />구독/정산</span>
          <span><i className="legend-none" />개인 스케줄</span>
        </div>
        </div>
      )}
      className="calendar-mode-shell"
      currentUser={currentUser}
      folderIcon={CalendarClock}
      folderLabel="캘린더"
      heading="캘린더"
      pushEnabled={pushEnabled}
      pushLoading={pushLoading}
      pushStatus={pushStatus}
      searchLabel="캘린더 검색"
      searchPlaceholder="업무, 스케줄, 정산 항목 검색"
      showThemeSwitcher={showThemeSwitcher}
      subheading={currentDateLabel}
      themeMode={themeMode}
      onClosePage={onClosePage}
      onLogout={onLogout}
      onMenuClick={onMenuClick}
      onNavigate={onNavigate}
      onOpenProfile={onOpenProfile}
      onRegisterPush={onRegisterPush}
      onThemeChange={onThemeChange}
    >
      {googleSyncStatus ? <p className="calendar-sync-status">{googleSyncStatus}</p> : null}
      {scheduleCreateOpen ? (
        <ScheduleCreateModal
          onAddSchedule={onAddSchedule}
          onClose={() => setScheduleCreateOpen(false)}
        />
      ) : null}
      {selectedSchedule ? (
        <ScheduleDetailModal
          canEdit={selectedSchedule.createdBy === currentUser.id || currentUser.accountRole === 'admin' || currentUser.isPrototype}
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
          onDelete={async () => {
            if (!(await requestActionConfirm('스케줄을 삭제하시겠습니까?'))) return;
            const message = await onDeleteSchedule(selectedSchedule);
            showActionPopup(message);
            if (!message.includes('실패')) setSelectedSchedule(null);
          }}
          onEdit={() => {
            setEditingSchedule(selectedSchedule);
            setSelectedSchedule(null);
          }}
        />
      ) : null}
      {editingSchedule ? (
        <ScheduleCreateModal
          schedule={editingSchedule}
          onAddSchedule={onAddSchedule}
          onClose={() => setEditingSchedule(null)}
          onUpdateSchedule={onUpdateSchedule}
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
                  {eventSegmentsForWeek(week).map((event) => (
                    <button
                      className="calendar-range-pill"
                      data-kind={event.kind}
                      key={`${event.id}-${week[0].toISOString()}`}
                      onClick={event.onClick}
                      style={{ gridColumn: `${event.columnStart} / span ${event.span}`, gridRow: `${event.row}` }}
                      type="button"
                    >
                      <span>{event.title}</span>
                      {monthEventMetaLabel(event) ? <small>{monthEventMetaLabel(event)}</small> : null}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : mode === '주' ? (
          <div className="calendar-stack-board calendar-stack-board-week">
            {Array.from({ length: 7 }, (_, index) => addCalendarDays(startOfWeek, index)).map((day) => (
              <div className="calendar-day-column" key={day.toISOString()}>
                <strong>{day.toLocaleDateString('ko-KR', { weekday: 'short', day: 'numeric' })}</strong>
                <div className="calendar-day-stack">
                  {eventsForDateStack(day).map((event) => (
                    <button className="calendar-task-pill" data-kind={event.kind} key={event.id} onClick={event.onClick} type="button">
                      <span>{event.title}</span>
                      <small>{eventTimeLabel(event)}</small>
                    </button>
                  ))}
                </div>
                <div className="calendar-time-layer">
                  {layoutTimedEvents(day).map((event) => (
                    <button
                      className="calendar-time-block"
                      data-kind={event.kind}
                      key={event.id}
                      onClick={event.onClick}
                      style={{
                        top: `${(event.startMinutes / 1440) * 100}%`,
                        height: `${((event.endMinutes - event.startMinutes) / 1440) * 100}%`,
                        left: `calc(${(event.lane / event.laneCount) * 100}% + 3px)`,
                        width: `calc(${100 / event.laneCount}% - 6px)`,
                      }}
                      type="button"
                    >
                      <span>{event.title}</span>
                      <small className="calendar-time-range">
                        <span>{eventTimeRangeLines(event).start}</span>
                        <span>{eventTimeRangeLines(event).end}</span>
                      </small>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="calendar-stack-board calendar-stack-board-day">
            <div className="calendar-day-column">
              <strong>{anchorDate.toLocaleDateString('ko-KR', { weekday: 'long', month: 'numeric', day: 'numeric' })}</strong>
              <div className="calendar-day-stack">
                {eventsForDateStack(anchorDate).map((event) => (
                  <button className="calendar-task-pill" data-kind={event.kind} key={event.id} onClick={event.onClick} type="button">
                    <span>{event.title}</span>
                    <small>{eventTimeLabel(event)}</small>
                  </button>
                ))}
              </div>
              <div className="calendar-time-layer">
                {layoutTimedEvents(anchorDate).map((event) => (
                  <button
                    className="calendar-time-block"
                    data-kind={event.kind}
                    key={event.id}
                    onClick={event.onClick}
                    style={{
                      top: `${(event.startMinutes / 1440) * 100}%`,
                      height: `${((event.endMinutes - event.startMinutes) / 1440) * 100}%`,
                      left: `calc(${(event.lane / event.laneCount) * 100}% + 3px)`,
                      width: `calc(${100 / event.laneCount}% - 6px)`,
                    }}
                    type="button"
                  >
                    <span>{event.title}</span>
                    <small className="calendar-time-range">
                      <span>{eventTimeRangeLines(event).start}</span>
                      <span>{eventTimeRangeLines(event).end}</span>
                    </small>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ImmersivePageFrame>
  );
}

function ScheduleCreateModal({
  schedule,
  onAddSchedule,
  onClose,
  onUpdateSchedule,
}: {
  schedule?: WorkSchedule | null;
  onAddSchedule: WorkScheduleSubmitHandler;
  onClose: () => void;
  onUpdateSchedule?: WorkScheduleUpdateHandler;
}) {
  const defaultStart = toDateTimeLocalValue(new Date());
  const defaultEndDate = new Date();
  defaultEndDate.setHours(defaultEndDate.getHours() + 1);
  const isEdit = Boolean(schedule);
  const [form, setForm] = useState({
    title: schedule?.title || '',
    startAt: schedule?.allDay ? toDateOnlyLocalValue(schedule.startAt) : schedule?.startAt ? toDateTimeLocalValue(parseTaskDate(schedule.startAt) || new Date()) : defaultStart,
    endAt: schedule?.allDay ? toDateOnlyLocalValue(schedule.endAt) : schedule?.endAt ? toDateTimeLocalValue(parseTaskDate(schedule.endAt) || defaultEndDate) : toDateTimeLocalValue(defaultEndDate),
    allDay: schedule?.allDay || false,
    memo: schedule?.memo || '',
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const normalizeScheduleDates = (next: typeof form) => {
    const startDate = next.allDay ? parseDateOnlyLocalValue(next.startAt) : parseDateTimeLocalValue(next.startAt);
    const endDate = next.allDay ? parseDateOnlyLocalValue(next.endAt, true) : parseDateTimeLocalValue(next.endAt);
    if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
      return { ...next, endAt: next.startAt };
    }
    return next;
  };
  const updateForm = (updates: Partial<typeof form>) => {
    setForm((current) => normalizeScheduleDates({ ...current, ...updates }));
  };

  useEffect(() => {
    setForm({
      title: schedule?.title || '',
      startAt: schedule?.allDay ? toDateOnlyLocalValue(schedule.startAt) : schedule?.startAt ? toDateTimeLocalValue(parseTaskDate(schedule.startAt) || new Date()) : defaultStart,
      endAt: schedule?.allDay ? toDateOnlyLocalValue(schedule.endAt) : schedule?.endAt ? toDateTimeLocalValue(parseTaskDate(schedule.endAt) || defaultEndDate) : toDateTimeLocalValue(defaultEndDate),
      allDay: schedule?.allDay || false,
      memo: schedule?.memo || '',
    });
  }, [schedule?.id]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    if (!form.title.trim() || !form.startAt || !form.endAt) {
      setStatus('제목, 시작일, 종료일을 입력해주세요.');
      return;
    }
    if (!(await requestActionConfirm(isEdit ? '스케줄을 수정하시겠습니까?' : '스케줄을 추가하시겠습니까?'))) return;

    setLoading(true);
    setStatus('저장중입니다.');
    const message = isEdit && schedule && onUpdateSchedule ? await onUpdateSchedule(schedule.id, form) : await onAddSchedule(form);
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
            <h2>{isEdit ? '스케줄 수정' : '스케줄 추가'}</h2>
          </div>
          <button className="icon-button" aria-label="닫기" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <label>
          제목
          <input autoFocus required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label className="calendar-visibility-row">
          <input
            checked={form.allDay}
            onChange={(event) => {
              const allDay = event.target.checked;
              updateForm({
                allDay,
                startAt: allDay ? (form.startAt ? formatDateInputValue(parseDateTimeLocalValue(form.startAt) || new Date()) : formatDateInputValue(new Date())) : toDateTimeLocalValue(parseDateOnlyLocalValue(form.startAt) || new Date()),
                endAt: allDay ? (form.endAt ? formatDateInputValue(parseDateTimeLocalValue(form.endAt) || new Date()) : formatDateInputValue(defaultEndDate)) : toDateTimeLocalValue(parseDateOnlyLocalValue(form.endAt) || defaultEndDate),
              });
            }}
            type="checkbox"
          />
          <span>
            시간 없이 날짜만
            <small>켜면 캘린더에서 날짜 일정으로 표시됩니다.</small>
          </span>
        </label>
        <label>
          시작일
          {form.allDay ? (
            <DateTimeConfirmField required dateOnly placeholder="시작일 선택" value={form.startAt} onChange={(startAt) => updateForm({ startAt })} />
          ) : (
            <DateTimeConfirmField required value={form.startAt} onChange={(startAt) => updateForm({ startAt })} />
          )}
        </label>
        <label>
          종료일
          {form.allDay ? (
            <DateTimeConfirmField required dateOnly placeholder="종료일 선택" value={form.endAt} onChange={(endAt) => updateForm({ endAt })} />
          ) : (
            <DateTimeConfirmField required value={form.endAt} onChange={(endAt) => updateForm({ endAt })} />
          )}
        </label>
        <label>
          메모
          <textarea value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} />
        </label>
        {status ? <p className="admin-note">{status}</p> : null}
        <button className="primary-action wide" disabled={loading} type="submit">
          <Plus size={17} />
          {loading ? '진행중...' : isEdit ? '스케줄 저장' : '스케줄 추가'}
        </button>
      </form>
    </div>
  );
}

function ScheduleDetailModal({
  canEdit,
  schedule,
  onClose,
  onDelete,
  onEdit,
}: {
  canEdit: boolean;
  schedule: WorkSchedule;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <article className="modal-card schedule-detail-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p className="eyebrow">Schedule</p>
            <h2>{schedule.creatorName} - {schedule.title}</h2>
          </div>
          <div className="modal-head-actions">
            {canEdit ? (
              <>
                <button className="icon-button" aria-label="스케줄 수정" onClick={onEdit} type="button">
                  <Pencil size={17} />
                </button>
                <button className="icon-button danger-icon" aria-label="스케줄 삭제" onClick={onDelete} type="button">
                  <Trash2 size={17} />
                </button>
              </>
            ) : null}
            <button className="icon-button" aria-label="닫기" onClick={onClose} type="button">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="task-detail-meta schedule-detail-meta">
          <span>작성자: {schedule.creatorName}</span>
          <span>방식: {schedule.allDay ? '날짜만' : '시간 포함'}</span>
          <span>시작: {formatScheduleDate(schedule.startAt, schedule.allDay)}</span>
          <span>종료: {formatScheduleDate(schedule.endAt, schedule.allDay)}</span>
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
  currentUser,
  pushEnabled,
  pushLoading,
  pushStatus,
  showThemeSwitcher,
  themeMode,
  clients,
  employees,
  onClosePage,
  onLogout,
  onMenuClick,
  onNavigate,
  onOpenProfile,
  onRegisterPush,
  onThemeChange,
  onAddClient,
  onDeleteClient,
  onUpdateClient,
}: ImmersiveChromeProps & {
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
    if (loading) return;
    if (!form.name.trim()) {
      showActionPopup('업체명을 입력해주세요.');
      return;
    }
    if (!form.manager) {
      showActionPopup('담당자를 선택해주세요.');
      return;
    }
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
    if (!editForm.name.trim()) {
      showActionPopup('업체명을 입력해주세요.');
      return;
    }
    if (!editForm.manager) {
      showActionPopup('담당자를 선택해주세요.');
      return;
    }
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
    <ImmersivePageFrame
      action={(
        <button className="primary-action" onClick={() => setClientCreateOpen(true)} type="button">
          <Plus size={17} />
          업체 추가
        </button>
      )}
      className="clients-mode-shell"
      currentUser={currentUser}
      folderIcon={Building2}
      folderLabel="업체관리"
      heading="업체관리"
      pushEnabled={pushEnabled}
      pushLoading={pushLoading}
      pushStatus={pushStatus}
      searchLabel="업체 검색"
      searchPlaceholder="업체, 담당자, 지역 검색"
      showThemeSwitcher={showThemeSwitcher}
      subheading={`등록 업체 ${clients.length}곳`}
      themeMode={themeMode}
      onClosePage={onClosePage}
      onLogout={onLogout}
      onMenuClick={onMenuClick}
      onNavigate={onNavigate}
      onOpenProfile={onOpenProfile}
      onRegisterPush={onRegisterPush}
      onThemeChange={onThemeChange}
    >

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
                <button className="icon-button" aria-label="수정" onClick={() => openEdit(client)} type="button">
                  <Pencil size={15} />
                </button>
                <button className="icon-button danger-action" aria-label="삭제" disabled={actionLoading === client.id} onClick={() => removeClient(client)} type="button">
                  <Trash2 size={15} />
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
              업체명 <span className="required-mark">*</span>
              <input autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label>
              담당자 <span className="required-mark">*</span>
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
            <div className="modal-action-bar">
              <button className="primary-action wide" disabled={loading} type="submit">
                <Plus size={17} />
                {loading ? '진행중...' : '업체 추가'}
              </button>
            </div>
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
              업체명 <span className="required-mark">*</span>
              <input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} />
            </label>
            <label>
              담당자 <span className="required-mark">*</span>
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
            <div className="modal-action-bar">
              <button className="primary-action wide" disabled={actionLoading === 'save'} type="submit">
                <CheckCircle2 size={17} />
                {actionLoading === 'save' ? '진행중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </ImmersivePageFrame>
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
  onRemove,
}: {
  currentUrl?: string | null;
  file: File | null;
  label?: string;
  onChange: (file: File | null) => void;
  onRemove?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const canRemove = Boolean(file || currentUrl);

  useEffect(() => {
    if (!file && inputRef.current) inputRef.current.value = '';
  }, [file]);

  return (
    <div className="avatar-upload-field">
      <span>{label}</span>
      <input
        accept={AVATAR_FILE_TYPES.join(',')}
        ref={inputRef}
        type="file"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
      <div className="avatar-upload-meta">
        <small>
          {file
            ? file.name
            : currentUrl
              ? `기존 사진 유지 · JPG/PNG/WebP, ${MAX_AVATAR_FILE_SIZE_LABEL} 이하`
              : `선택된 사진 없음 · JPG/PNG/WebP, ${MAX_AVATAR_FILE_SIZE_LABEL} 이하`}
        </small>
        {onRemove && canRemove ? (
          <button className="secondary-action avatar-remove-button" onClick={onRemove} type="button">
            <Trash2 size={14} />
            {file ? '선택 취소' : '사진 삭제'}
          </button>
        ) : null}
      </div>
    </div>
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
  const [createOpen, setCreateOpen] = useState(false);

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
      setCreateOpen(false);
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
      <div className="page-head employees-page-head">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>직원 관리</h1>
        </div>
        <button className="primary-action employees-create-button" onClick={() => setCreateOpen(true)} type="button">
          <Plus size={17} />
          계정 생성
        </button>
      </div>

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

      {createOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setCreateOpen(false)}>
          <form className="modal-card form-stack" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
            <div className="modal-head">
              <div>
                <p className="eyebrow">Create User</p>
                <h2>계정 생성</h2>
              </div>
              <button className="icon-button" aria-label="닫기" onClick={() => setCreateOpen(false)} type="button">
                <X size={18} />
              </button>
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
      ) : null}

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
        <AvatarFileField
          currentUrl={profileForm.avatarUrl}
          file={profileAvatarFile}
          onChange={setProfileAvatarFile}
          onRemove={() => {
            setProfileAvatarFile(null);
            setProfileForm((current) => ({ ...current, avatarUrl: '' }));
          }}
        />
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
  currentUser,
  pushEnabled,
  pushLoading,
  pushStatus,
  showThemeSwitcher,
  themeMode,
  items,
  employees,
  onClosePage,
  onLogout,
  onMenuClick,
  onNavigate,
  onOpenProfile,
  onRegisterPush,
  onThemeChange,
  onAddOperation,
  onUpdateOperation,
  onDeleteOperation,
  onCompleteOperation,
}: ImmersiveChromeProps & {
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
    <ImmersivePageFrame
      action={(
        <button className="primary-action" onClick={openCreate} type="button">
          <Plus size={17} />
          항목 추가
        </button>
      )}
      className="operations-mode-shell"
      currentUser={currentUser}
      folderIcon={ShieldCheck}
      folderLabel="구독/정산관리"
      heading="구독/정산관리"
      pushEnabled={pushEnabled}
      pushLoading={pushLoading}
      pushStatus={pushStatus}
      searchLabel="구독 정산 검색"
      searchPlaceholder="항목, 서비스, 담당자 검색"
      showThemeSwitcher={showThemeSwitcher}
      subheading={`미완료 ${summary.pending}건 · 이번달 예정액 ${new Intl.NumberFormat('ko-KR').format(summary.monthAmount)}원`}
      themeMode={themeMode}
      onClosePage={onClosePage}
      onLogout={onLogout}
      onMenuClick={onMenuClick}
      onNavigate={onNavigate}
      onOpenProfile={onOpenProfile}
      onRegisterPush={onRegisterPush}
      onThemeChange={onThemeChange}
    >

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
              <DateTimeConfirmField dateOnly placeholder="기준일 선택" value={form.dueDate} onChange={(dueDate) => setForm({ ...form, dueDate })} />
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
    </ImmersivePageFrame>
  );
}

function SettingsPage({
  backendStatus,
  currentUser,
  employees,
  apiKeys,
  googleCalendarSettings,
  jobTypes,
  meetingMinuteCategories,
  noticeCategories,
  taskTypes,
  pushEnabled,
  pushLoading,
  pushPreferences,
  pushStatus,
  installStatus,
  appInstalled,
  canPromptInstall,
  themeMode,
  colorTheme,
  onRegisterPush,
  onInstallApp,
  onAddJobType,
  onAddMeetingMinuteCategory,
  onAddNoticeCategory,
  onDeleteJobType,
  onDeleteMeetingMinuteCategory,
  onDeleteNoticeCategory,
  onAddTaskType,
  onCreateApiKey,
  onDeleteApiKey,
  onRevokeApiKey,
  onDeleteTaskType,
  onSaveGoogleCalendarSettings,
  onUpdatePushPreferences,
  onUpdateOwnProfile,
  onColorThemeChange,
  onThemeChange,
}: {
  backendStatus: string;
  currentUser: AppUser;
  employees: Employee[];
  apiKeys: ApiKeyRecord[];
  googleCalendarSettings: GoogleCalendarSettings;
  jobTypes: string[];
  meetingMinuteCategories: string[];
  noticeCategories: string[];
  taskTypes: string[];
  pushEnabled: boolean;
  pushLoading: boolean;
  pushPreferences: PushPreferences;
  pushStatus: string;
  installStatus: string;
  appInstalled: boolean;
  canPromptInstall: boolean;
  themeMode: ThemeMode;
  colorTheme: ColorTheme;
  onRegisterPush: () => void;
  onInstallApp: () => void;
  onAddJobType: JobTypeSubmitHandler;
  onAddMeetingMinuteCategory: MeetingMinuteCategorySubmitHandler;
  onAddNoticeCategory: NoticeCategorySubmitHandler;
  onDeleteJobType: JobTypeDeleteHandler;
  onDeleteMeetingMinuteCategory: MeetingMinuteCategoryDeleteHandler;
  onDeleteNoticeCategory: NoticeCategoryDeleteHandler;
  onAddTaskType: TaskTypeSubmitHandler;
  onCreateApiKey: ApiKeyCreateHandler;
  onDeleteApiKey: ApiKeyDeleteHandler;
  onRevokeApiKey: ApiKeyRevokeHandler;
  onDeleteTaskType: TaskTypeDeleteHandler;
  onSaveGoogleCalendarSettings: GoogleCalendarSettingsHandler;
  onUpdatePushPreferences: PushPreferencesUpdateHandler;
  onUpdateOwnProfile: (updates: OwnProfileUpdate) => Promise<string>;
  onColorThemeChange: (theme: ColorTheme) => void;
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
  const [meetingMinuteCategoryOpen, setMeetingMinuteCategoryOpen] = useState(false);
  const [noticeCategoryOpen, setNoticeCategoryOpen] = useState(false);
  const [googleForm, setGoogleForm] = useState<GoogleCalendarSettings>(googleCalendarSettings);
  const [googleStatus, setGoogleStatus] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pushPreferencesLoading, setPushPreferencesLoading] = useState(false);
  const [apiName, setApiName] = useState('개인 스케줄러');
  const [apiScope, setApiScope] = useState<ApiScope>('personal_schedule');
  const [apiStatus, setApiStatus] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [apiLoading, setApiLoading] = useState(false);

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
  const submitApiKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (apiLoading) return;
    setApiLoading(true);
    const result = await onCreateApiKey(apiName, apiScope);
    setApiLoading(false);
    setApiStatus(result.message);
    setApiSecret(result.secret || '');
    showActionPopup(result.message);
    if (result.secret) setApiName('');
  };
  const revokeKey = async (apiKey: ApiKeyRecord) => {
    if (apiLoading) return;
    setApiLoading(true);
    const message = await onRevokeApiKey(apiKey);
    setApiLoading(false);
    setApiStatus(message);
    showActionPopup(message);
  };
  const deleteKey = async (apiKey: ApiKeyRecord) => {
    if (apiLoading) return;
    setApiLoading(true);
    const message = await onDeleteApiKey(apiKey);
    setApiLoading(false);
    setApiStatus(message);
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
          <div className="page-card settings-card s-theme">
            <h2>테마</h2>
            <p>라이트 / 다크 / 시스템 세 가지 화면 모드를 사용합니다.</p>
            <ThemeSwitcher value={themeMode} onChange={onThemeChange} />
          </div>
          <div className="page-card settings-card s-install">
            <h2>앱 설치</h2>
            <p>{installStatus}</p>
            <button className="primary-action" disabled={appInstalled && !canPromptInstall} onClick={onInstallApp} type="button">
              <Plus size={17} />
              {appInstalled ? '설치 완료' : canPromptInstall ? '이 기기에 설치' : '설치 안내'}
            </button>
            <p className="admin-note">맥/윈도우/안드로이드 Chrome·Edge는 설치 버튼이 뜨고, iPhone Safari는 공유 버튼에서 “홈 화면에 추가”로 설치합니다.</p>
          </div>
          <div className="page-card settings-card s-push">
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
                { key: 'notice' as const, label: '공지 (중요는 항상 발송)' },
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
        {currentUser.accountRole === 'admin' ? (
          <form className="page-card settings-card api-settings-card" onSubmit={submitApiKey}>
            <h2>API 키 관리</h2>
            <p>외부 앱이 PlanderWorks로 데이터를 보낼 때 사용할 기능별 API 키를 생성합니다. 생성된 키는 한 번만 표시됩니다.</p>
            <div className="api-create-grid">
              <label>
                API 이름
                <input value={apiName} onChange={(event) => setApiName(event.target.value)} placeholder="개인 스케줄러" />
              </label>
              <label>
                기능
                <select value={apiScope} onChange={(event) => setApiScope(event.target.value as ApiScope)}>
                  {apiScopeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <p className="admin-note">{apiScopeOptions.find((option) => option.value === apiScope)?.description}</p>
            <button className="primary-action" disabled={apiLoading} type="submit">
              <Plus size={17} />
              {apiLoading ? '진행중...' : 'API 키 생성'}
            </button>
            {apiSecret ? (
              <div className="api-secret-box">
                <strong>생성된 API 키</strong>
                <code>{apiSecret}</code>
                <small>이 값은 다시 볼 수 없으니 개인 스케줄러 설정에 바로 넣어줘.</small>
              </div>
            ) : null}
            {apiStatus ? <p className="admin-note">{apiStatus}</p> : null}
            <div className="api-key-list">
              {apiKeys.length ? (
                apiKeys.map((apiKey) => (
                  <div className="api-key-row" data-active={apiKey.active} key={apiKey.id}>
                    <div>
                      <strong>{apiKey.name}</strong>
                      <span>{getApiScopeLabel(apiKey.scope)} · {apiKey.keyPrefix}</span>
                      <small>
                        생성 {apiKey.createdAt ? formatDueDate(apiKey.createdAt) : '미정'} · 마지막 사용 {apiKey.lastUsedAt ? formatDueDate(apiKey.lastUsedAt) : '없음'}
                      </small>
                    </div>
                    <div className="api-key-actions">
                      {apiKey.active ? (
                        <button className="secondary-action" disabled={apiLoading} onClick={() => revokeKey(apiKey)} type="button">
                          폐기
                        </button>
                      ) : (
                        <>
                          <span className="api-key-revoked">폐기됨</span>
                          <button className="secondary-action danger-action" disabled={apiLoading} onClick={() => deleteKey(apiKey)} type="button">
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="admin-note">아직 생성된 API 키가 없습니다.</p>
              )}
            </div>
          </form>
        ) : null}
        <div className="page-card settings-card s-admin">
          <h2>관리</h2>
          <div className="settings-shortcuts">
            <button className="secondary-action" onClick={() => setProfileOpen(true)} type="button">내 정보 수정</button>
            <button className="secondary-action" onClick={() => setJobTypeOpen(true)} type="button">담당업무 관리</button>
            <button className="secondary-action" onClick={() => setTaskTypeOpen(true)} type="button">업무유형 추가/삭제</button>
            <button className="secondary-action" onClick={() => setMeetingMinuteCategoryOpen(true)} type="button">회의록 카테고리 관리</button>
            <button className="secondary-action" onClick={() => setNoticeCategoryOpen(true)} type="button">공지 카테고리 관리</button>
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
            <AvatarFileField
              currentUrl={profileForm.avatarUrl}
              file={profileAvatarFile}
              onChange={setProfileAvatarFile}
              onRemove={() => {
                setProfileAvatarFile(null);
                setProfileForm((current) => ({ ...current, avatarUrl: '' }));
              }}
            />
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
      {meetingMinuteCategoryOpen ? (
        <SimpleTypeModal
          items={meetingMinuteCategories}
          title="회의록 카테고리 관리"
          eyebrow="Meeting Category"
          addLabel="카테고리명"
          onAdd={onAddMeetingMinuteCategory}
          onClose={() => setMeetingMinuteCategoryOpen(false)}
          onDelete={onDeleteMeetingMinuteCategory}
        />
      ) : null}
      {noticeCategoryOpen ? (
        <SimpleTypeModal
          items={noticeCategories}
          title="공지 카테고리 관리"
          eyebrow="Notice Category"
          addLabel="카테고리명"
          onAdd={onAddNoticeCategory}
          onClose={() => setNoticeCategoryOpen(false)}
          onDelete={onDeleteNoticeCategory}
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
    start: '',
    due: '',
    priority: '보통' as Priority,
    summary: '',
    showOnCalendar: true,
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
    if (!form.type || !form.projectId || !form.priority || !form.title.trim() || !form.summary.trim()) {
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
      startAt: form.start,
      priority: form.priority,
      type: form.type,
      summary: form.summary,
      showOnCalendar: form.showOnCalendar,
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
        계획 시작일
        <DateTimeConfirmField allowClear placeholder="시작일 선택" value={form.start} onChange={(start) => setForm({ ...form, start })} />
      </label>
      <label>
        마감기한
        <DateTimeConfirmField allowClear value={form.due} onChange={(due) => setForm({ ...form, due })} />
      </label>
      <label>
        우선순위
        <select required value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as Priority })}>
          <option>높음</option>
          <option>보통</option>
          <option>낮음</option>
        </select>
      </label>
      <label className="calendar-visibility-row">
        <input
          checked={form.showOnCalendar}
          onChange={(event) => setForm({ ...form, showOnCalendar: event.target.checked })}
          type="checkbox"
        />
        <span>
          캘린더에 표시
          <small>끄면 이 업무는 캘린더에 나오지 않습니다.</small>
        </span>
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
  onSuccess,
}: {
  employees: Employee[];
  onCreateTask: TaskSubmitHandler;
  onSuccess?: () => void;
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
      onSuccess?.();
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
  allowClear = false,
  dateOnly = false,
  placeholder = '마감일 선택',
  required = false,
  value,
  onChange,
}: {
  allowClear?: boolean;
  dateOnly?: boolean;
  placeholder?: string;
  required?: boolean;
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
  const draftHasTime = Boolean(draft && !dateOnlyValuePattern.test(draft));
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
    // dateOnly 모드는 항상 YYYY-MM-DD 드래프트로 시작
    const nextDraft = value || (dateOnly ? formatDateInputValue(baseDate) : toDateTimeLocalValue(baseDate));
    setDraft(nextDraft);
    setMonthCursor(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
    setIsOpen(true);
  };

  const updateDraftDate = (day: Date) => {
    if (dateOnly || (draft && dateOnlyValuePattern.test(draft))) {
      setDraft(formatDateInputValue(day));
      return;
    }
    const timeDate = draftDate || new Date();
    const nextDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), timeDate.getHours(), timeDate.getMinutes());
    setDraft(toDateTimeLocalValue(nextDate));
  };

  const updateDraftTime = (type: 'hour' | 'minute', nextValue: string) => {
    const baseDate = draftDate || new Date();
    if (type === 'hour' && nextValue === 'none') {
      setDraft(formatDateInputValue(baseDate));
      return;
    }
    const nextDate = new Date(baseDate);
    if (type === 'hour') nextDate.setHours(Number(nextValue));
    if (type === 'minute') nextDate.setMinutes(Number(nextValue));
    setDraft(toDateTimeLocalValue(nextDate));
  };

  const confirmDate = () => {
    const nextValue = draft || toDateTimeLocalValue(new Date());
    setIsOpen(false);
    onChange(nextValue);
    window.setTimeout(() => setIsOpen(false), 0);
  };
  const clearDate = () => {
    onChange('');
    setDraft('');
    setIsOpen(false);
  };

  return (
    <div className="datetime-field" ref={fieldRef}>
      <button
        aria-label={placeholder}
        className="datetime-display-input"
        data-empty={!value}
        onClick={openPicker}
        type="button"
      >
        {value ? formatDueDate(value) : placeholder}
      </button>
      {required && !value ? <input aria-hidden="true" className="datetime-required-input" required tabIndex={-1} value="" onChange={() => {}} /> : null}
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
          {dateOnly ? null : (
            <div className="datetime-time-row">
              <select value={draftHasTime && draftDate ? String(draftDate.getHours()).padStart(2, '0') : 'none'} onChange={(event) => updateDraftTime('hour', event.target.value)}>
                <option value="none">시간 선택 안함</option>
                {hours.map((hour) => (
                  <option key={hour} value={hour}>{hour}시</option>
                ))}
              </select>
              <select disabled={!draftHasTime} value={draftHasTime && draftDate ? String(draftDate.getMinutes()).padStart(2, '0') : '00'} onChange={(event) => updateDraftTime('minute', event.target.value)}>
                {minutes.map((minute) => (
                  <option key={minute} value={minute}>{minute}분</option>
                ))}
              </select>
            </div>
          )}
          <div className="datetime-popover-actions">
            {allowClear ? (
              <button type="button" onClick={clearDate}>
                비우기
              </button>
            ) : null}
            <button type="button" onClick={() => {
              setDraft(value);
              setIsOpen(false);
            }}>
              취소
            </button>
            <button className="primary-action" type="button" onMouseDown={(event) => event.preventDefault()} onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              confirmDate();
            }}>
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
  const [start, setStart] = useState('');
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
          계획 시작일
          <DateTimeConfirmField allowClear placeholder="시작일 선택" value={start} onChange={setStart} />
        </label>
        <label>
          마감기한
          <DateTimeConfirmField allowClear value={due} onChange={setDue} />
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
            if (!type || !title.trim() || !summary.trim()) {
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
              startAt: start,
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

// 스와이프 중 destination 뷰의 icon+label을 측면에서 슬라이드인으로 미리보기
function SwipePreview({ direction, offset, targetView }: {
  direction: 'back' | 'forward';
  offset: number;
  targetView: ActiveView | undefined;
}) {
  if (!targetView) return null;
  const nav =
    primaryNavItems.find((item) => item.id === targetView) ||
    adminNavItems.find((item) => item.id === targetView) ||
    { id: targetView, label: targetView, icon: LayoutDashboard };
  const Icon = nav.icon;
  return (
    <div className="swipe-preview" data-direction={direction} style={{ width: `${offset}px` }}>
      <div className="swipe-preview-card">
        <Icon size={32} />
        <strong>{nav.label}</strong>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
