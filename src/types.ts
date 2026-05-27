export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorTheme = 'default' | 'metal-silver' | 'british-green' | 'navy' | 'orange' | 'pastel-pink';
export type ActiveView =
  | 'dashboard'
  | 'calendar'
  | 'allTasks'
  | 'inbox'
  | 'sent'
  | 'project'
  | 'create'
  | 'meetingMinutes'
  | 'notices'
  | 'reports'
  | 'journal'
  | 'clients'
  | 'employees'
  | 'operations'
  | 'settings';
export type TaskStatus = '대기' | '진행중' | '완료 요청' | '보류' | '완료';
export type TaskListFilter = '전체' | '마감 임박' | TaskStatus;
export type Priority = '높음' | '보통' | '낮음';
export type TaskType = string;

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  accountRole: 'admin' | 'staff';
  isPrototype: boolean;
  avatarUrl?: string | null;
};

export type Task = {
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
  showOnCalendar?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
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

export type TaskFile = {
  id: string;
  name: string;
  path: string;
  size?: number | null;
  mimeType?: string | null;
};

export type TaskComment = {
  id: string;
  taskId: string;
  parentId?: string | null;
  userId?: string;
  author: string;
  avatarUrl?: string | null;
  content: string;
  createdAt: string;
};

export type Client = {
  id: string;
  name: string;
  manager: string;
  phone: string;
  region: string;
  memo: string;
};

export type Project = {
  id: string;
  name: string;
  clientId?: string | null;
  client: string;
  status: string;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  memberIds: string[];
  memberNames: string[];
};

export type ProjectMessage = {
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

export type PushPreferences = {
  task: boolean;
  report: boolean;
  projectMessage: boolean;
  notice: boolean;
};

export type MeetingMinute = {
  id: string;
  category: string;
  title: string;
  content: string;
  summary: string;
  decisions: string;
  actionItems: string;
  attendees: string;
  projectId?: string | null;
  projectName?: string;
  heldAt?: string | null;
  sourceApp?: string | null;
  externalId?: string | null;
  createdBy?: string | null;
  author: string;
  authorAvatarUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};
export type MeetingMinuteDraft = Pick<MeetingMinute, 'category' | 'title' | 'content' | 'summary' | 'decisions' | 'actionItems' | 'attendees'> & {
  projectId?: string;
  heldAt?: string;
};

export type ApiScope = 'personal_schedule' | 'meeting_minutes';
export type ApiKeyRecord = {
  id: string;
  name: string;
  scope: ApiScope;
  keyPrefix: string;
  active: boolean;
  lastUsedAt?: string | null;
  createdAt?: string | null;
};
export type ApiKeyCreateResult = {
  message: string;
  secret?: string;
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobType: string;
  role: '관리자' | '사용자';
  load: number;
  avatarUrl?: string | null;
};

export type NewEmployee = Omit<Employee, 'id' | 'load'> & {
  password?: string;
};

export type EmployeeUpdate = Pick<Employee, 'name' | 'phone' | 'jobType' | 'role' | 'avatarUrl'> & {
  password?: string;
};

export type OwnProfileUpdate = Pick<Employee, 'name' | 'phone' | 'jobType' | 'avatarUrl'> & {
  password?: string;
};

export type TaskDraft = Omit<Task, 'id' | 'status' | 'watchers' | 'files' | 'comments' | 'dueAt' | 'startedAt' | 'readAt' | 'creatorReadAt'> & {
  status?: TaskStatus;
  watchers?: string[];
  toIds?: string[];
  toList?: string[];
  clientId?: string;
  projectId?: string | null;
  files?: File[];
  showOnCalendar?: boolean;
};

export type TaskUpdateDraft = {
  title: string;
  summary: string;
  type: TaskType;
  assigneeId: string;
  clientId: string;
  projectId?: string | null;
  due: string;
  priority: Priority;
  showOnCalendar: boolean;
};

export type OperationCategory = '서버' | '도메인' | 'SaaS' | '정산' | '세금' | '라이선스' | '기타';
export type OperationFrequency = '1회' | '매월' | '분기' | '반기' | '매년';
export type OperationFilter = '전체' | '오늘' | '7일 이내' | '이번달' | '미완료';
export type OperationStatus = '예정' | '임박' | '오늘' | '완료' | '보류';
export type OperationItem = {
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
export type OperationDraft = Omit<OperationItem, 'id' | 'lastCompletedAt'> & {
  lastCompletedAt?: string | null;
};
export type GoogleCalendarSettings = {
  calendarId: string;
};
export type WorkSchedule = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  memo: string;
  createdBy: string;
  creatorName: string;
};
export type WorkScheduleDraft = {
  title: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  memo: string;
};
export type CalendarEventItem = {
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
export type CalendarSegment = CalendarEventItem & {
  columnStart: number;
  span: number;
  firstDay: number;
  lastDay: number;
};
export type GoogleCalendarSyncResult = {
  created: number;
  updated: number;
  failed: number;
};

export type TaskSubmitHandler = (task: TaskDraft) => Promise<string>;
export type TaskUpdateHandler = (task: Task, updates: TaskUpdateDraft) => Promise<string>;
export type TaskDeleteHandler = (task: Task) => Promise<string>;
export type TaskCommentSubmitHandler = (task: Task, content: string, parentCommentId?: string | null) => Promise<string>;
export type TaskCommentDeleteHandler = (task: Task, comment: TaskComment) => Promise<string>;
export type MessageHandler = (message: string) => void;
export type ClientSubmitHandler = (client: Omit<Client, 'id'>) => Promise<string>;
export type ClientUpdateHandler = (clientId: string, client: Omit<Client, 'id'>) => Promise<string>;
export type ClientDeleteHandler = (client: Client) => Promise<string>;
export type ProjectDraft = { name: string; clientId: string; memberIds: string[]; status?: string };
export type ProjectSubmitHandler = (project: ProjectDraft) => Promise<string>;
export type ProjectUpdateHandler = (projectId: string, project: ProjectDraft) => Promise<string>;
export type ProjectStatusHandler = (project: Project, status: string) => Promise<string>;
export type ProjectPermanentDeleteHandler = (project: Project) => Promise<string>;
export type WorkScheduleSubmitHandler = (schedule: WorkScheduleDraft) => Promise<string>;
export type WorkScheduleUpdateHandler = (scheduleId: string, schedule: WorkScheduleDraft) => Promise<string>;
export type WorkScheduleDeleteHandler = (schedule: WorkSchedule) => Promise<string>;
export type JobTypeSubmitHandler = (name: string) => Promise<string>;
export type JobTypeDeleteHandler = (name: string) => Promise<string>;
export type TaskTypeSubmitHandler = (name: string) => Promise<string>;
export type TaskTypeDeleteHandler = (name: string) => Promise<string>;
export type EmployeeSubmitHandler = (employee: NewEmployee) => Promise<string>;
export type EmployeeUpdateHandler = (employeeId: string, updates: EmployeeUpdate) => Promise<string>;
export type GoogleCalendarSettingsHandler = (settings: GoogleCalendarSettings) => Promise<string>;
export type PushPreferencesUpdateHandler = (preferences: PushPreferences) => Promise<string>;
export type ApiKeyCreateHandler = (name: string, scope: ApiScope) => Promise<ApiKeyCreateResult>;
export type ApiKeyRevokeHandler = (apiKey: ApiKeyRecord) => Promise<string>;
export type ApiKeyDeleteHandler = (apiKey: ApiKeyRecord) => Promise<string>;
export type MeetingMinuteSubmitHandler = (minute: MeetingMinuteDraft) => Promise<string>;
export type MeetingMinuteUpdateHandler = (minuteId: string, minute: MeetingMinuteDraft) => Promise<string>;
export type MeetingMinuteDeleteHandler = (minute: MeetingMinute) => Promise<string>;
export type MeetingMinuteCategorySubmitHandler = (name: string) => Promise<string>;
export type MeetingMinuteCategoryDeleteHandler = (name: string) => Promise<string>;
export type MeetingMinuteExportFormat = 'pdf' | 'xls' | 'hwp';

export type JournalKind = '작업' | '미팅' | '작성' | '요청' | '견적' | '출근' | '문서' | '확인' | '기타';

// 자유 문자열 — 팔레트(JournalStatusDef[])에 등록된 이름이거나 임의 값일 수 있음
export type JournalStatus = string;

// 색상 phase — 추가/이름변경은 허용되지만 phase 집합은 고정(컬러 토큰 매핑용)
export type JournalStatusPhase =
  | 'plan' | 'progress' | 'done' | 'coop' | 'execute'
  | 'must' | 'next' | 'change' | 'continue' | 'stop';

export type JournalStatusDef = {
  id: string;
  name: string;
  phase: JournalStatusPhase;
};

export type JournalSource = 'manual' | 'task' | 'meeting' | 'schedule' | 'comment';

export type WorkJournalEntry = {
  id: string;
  userId: string;
  weekStart: string;          // YYYY-MM-DD (Monday)
  date: string;               // YYYY-MM-DD
  kind: JournalKind;
  title: string;
  detail?: string;
  status: JournalStatus;
  projectId?: string | null;  // 프로젝트 직접 매칭
  clientId?: string | null;
  source: JournalSource;
  sourceRef?: string;
  edited: boolean;
  hidden: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type WorkJournalEntryDraft = {
  date: string;
  kind: JournalKind;
  title: string;
  detail?: string;
  status: JournalStatus;
  projectId?: string | null;
};

// 이번주 진행중 계약·할일 (간단 테이블)
export type WeeklyContract = {
  id: string;
  userId: string;
  weekStart: string;       // YYYY-MM-DD (Monday)
  sequence: number;        // 자동부여 (정렬용)
  company: string;         // 상호
  dueDate: string;         // 자유 텍스트 (날짜 / 상태 / 메모)
  notes: string;           // 기타사항
};

// 공지/전달사항
export type NoticeComment = {
  id: string;
  noticeId: string;
  parentId?: string | null;
  userId?: string | null;
  author: string;
  avatarUrl?: string | null;
  content: string;
  createdAt: string;
};
export type Notice = {
  id: string;
  category: string;
  title: string;
  content: string;
  important: boolean;
  pinned: boolean;
  allowComments: boolean;
  popup: boolean;
  popupUntil?: string | null;
  createdBy?: string | null;
  author: string;
  authorAvatarUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  comments: NoticeComment[];
};
export type NoticeDraft = Pick<Notice,
  'category' | 'title' | 'content' | 'important' | 'pinned' | 'allowComments' | 'popup'
> & {
  popupUntil?: string | null;
};
export type NoticeSubmitHandler = (notice: NoticeDraft) => Promise<string>;
export type NoticeUpdateHandler = (noticeId: string, notice: NoticeDraft) => Promise<string>;
export type NoticeDeleteHandler = (notice: Notice) => Promise<string>;
export type NoticeTogglePinHandler = (notice: Notice) => Promise<string>;
export type NoticeCommentSubmitHandler = (notice: Notice, content: string, parentCommentId?: string | null) => Promise<string>;
export type NoticeCommentDeleteHandler = (notice: Notice, comment: NoticeComment) => Promise<string>;
export type NoticeCategorySubmitHandler = (name: string) => Promise<string>;
export type NoticeCategoryDeleteHandler = (name: string) => Promise<string>;
