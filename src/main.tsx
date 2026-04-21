import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Session } from '@supabase/supabase-js';
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sun,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { hasSupabaseConfig, supabase } from './supabaseClient';
import './styles.css';

type ThemeMode = 'system' | 'light' | 'dark';
type ActiveView =
  | 'dashboard'
  | 'inbox'
  | 'sent'
  | 'create'
  | 'reports'
  | 'clients'
  | 'employees'
  | 'jobTypes'
  | 'settings';
type TaskStatus = '대기' | '진행중' | '완료 요청' | '보류' | '완료';
type Priority = '높음' | '보통' | '낮음';
type TaskType = '영업 브리핑' | '디자인 요청' | '보고' | '제안' | '확인 요청' | '촬영 요청' | '시장 조사';

type AppUser = {
  name: string;
  email: string;
  role: string;
  isPrototype: boolean;
};

type Task = {
  id: number;
  title: string;
  from: string;
  to: string;
  client: string;
  due: string;
  status: TaskStatus;
  priority: Priority;
  type: TaskType;
  summary: string;
  watchers: string[];
};

type Client = {
  id: number;
  name: string;
  manager: string;
  phone: string;
  memo: string;
};

type Employee = {
  id: number;
  name: string;
  email: string;
  phone: string;
  jobType: string;
  role: '관리자' | '매니저' | '직원';
  load: number;
};

const primaryNavItems: Array<{ id: ActiveView; label: string; icon: React.ElementType; badge?: number }> = [
  { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
  { id: 'inbox', label: '받은 업무', icon: ClipboardList, badge: 7 },
  { id: 'sent', label: '보낸 업무', icon: MessageSquareText, badge: 3 },
  { id: 'create', label: '업무 생성', icon: Plus },
  { id: 'reports', label: '보고·제안', icon: FileText, badge: 2 },
  { id: 'clients', label: '업체', icon: Building2 },
];

const adminNavItems: Array<{ id: ActiveView; label: string; icon: React.ElementType }> = [
  { id: 'employees', label: '직원 관리', icon: UserCog },
  { id: 'jobTypes', label: '담당업무 관리', icon: BriefcaseBusiness },
  { id: 'settings', label: '설정', icon: Settings },
];

const seedTasks: Task[] = [
  {
    id: 1,
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
  },
  {
    id: 2,
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
  },
  {
    id: 3,
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
  },
  {
    id: 4,
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
  },
];

const seedClients: Client[] = [
  { id: 1, name: 'A식당', manager: '인성이형', phone: '010-0000-0000', memo: '일본 여행 계정 섭외 관심' },
  { id: 2, name: 'B뷰티샵', manager: '디자인팀장', phone: '010-1111-2222', memo: '상세페이지와 릴스 패키지 문의' },
  { id: 3, name: '온고', manager: '대표', phone: '010-3333-4444', memo: '일본 이커머스 진출 준비' },
];

const seedEmployees: Employee[] = [
  { id: 1, name: '인성이형', email: 'insung@plander.co.kr', phone: '010-0000-0000', jobType: '일본 마케팅', role: '관리자', load: 7 },
  { id: 2, name: '대표', email: 'ceo@plander.co.kr', phone: '010-1111-1111', jobType: '경영·영업', role: '관리자', load: 5 },
  { id: 3, name: '디자인팀장', email: 'design@plander.co.kr', phone: '010-2222-2222', jobType: 'UIUX·브랜딩', role: '매니저', load: 9 },
  { id: 4, name: '개발팀', email: 'dev@plander.co.kr', phone: '010-3333-3333', jobType: '웹·앱 개발', role: '직원', load: 4 },
];

const seedJobTypes = ['일본 마케팅', '국내 마케팅', '디자인', '개발', '영업', '운영', '대표', '회계·정산'];

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
    name: session.user.user_metadata?.name || session.user.email.split('@')[0],
    email: session.user.email,
    role: session.user.user_metadata?.job_type || 'Plander',
    isPrototype: false,
  };
}

function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authReady, setAuthReady] = useState(!hasSupabaseConfig);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const [clients, setClients] = useState<Client[]>(seedClients);
  const [employees, setEmployees] = useState<Employee[]>(seedEmployees);
  const [jobTypes, setJobTypes] = useState(seedJobTypes);

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

  const dashboardStats = useMemo(
    () => [
      { label: '받은 업무', value: tasks.filter((task) => task.to === '인성이형').length, hint: '내 담당 기준', tone: 'silver' },
      { label: '진행중', value: tasks.filter((task) => task.status === '진행중').length, hint: '담당자 확인중', tone: 'blue' },
      { label: '완료 요청', value: tasks.filter((task) => task.status === '완료 요청').length, hint: '검토 필요', tone: 'amber' },
      { label: '마감 임박', value: 3, hint: '48시간 이내', tone: 'red' },
    ],
    [tasks],
  );

  const handlePrototypeLogin = () => {
    setCurrentUser({
      name: '인성이형',
      email: 'prototype@plander.co.kr',
      role: '일본 마케팅',
      isPrototype: true,
    });
  };

  const handleLogout = async () => {
    if (currentUser?.isPrototype) {
      setCurrentUser(null);
      return;
    }

    await supabase?.auth.signOut();
    setCurrentUser(null);
  };

  const createTask = (task: Omit<Task, 'id' | 'status' | 'watchers'> & { status?: TaskStatus; watchers?: string[] }) => {
    const nextTask: Task = {
      id: Date.now(),
      status: task.status || '대기',
      watchers: task.watchers || [],
      ...task,
    };

    setTasks((current) => [nextTask, ...current]);
    setActiveView('inbox');
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

  return (
    <div className="app">
      <Sidebar
        activeView={activeView}
        currentUser={currentUser}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        onNavigate={(view) => {
          setActiveView(view);
          setSidebarOpen(false);
        }}
      />
      <div className="mobile-overlay" data-open={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <main className="workspace">
        <Topbar
          currentUser={currentUser}
          themeMode={themeMode}
          onThemeChange={setThemeMode}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {activeView === 'dashboard' ? (
          <Dashboard stats={dashboardStats} tasks={tasks} employees={employees} onCreateTask={createTask} />
        ) : null}
        {activeView === 'inbox' ? <TaskListPage title="받은 업무" tasks={tasks.filter((task) => task.to === '인성이형' || task.to === currentUser.name)} /> : null}
        {activeView === 'sent' ? <TaskListPage title="보낸 업무" tasks={tasks.filter((task) => task.from === '인성이형' || task.from === currentUser.name)} /> : null}
        {activeView === 'create' ? <TaskCreatePage clients={clients} employees={employees} onCreateTask={createTask} /> : null}
        {activeView === 'reports' ? <ReportsPage tasks={tasks} onCreateTask={createTask} /> : null}
        {activeView === 'clients' ? <ClientsPage clients={clients} onAddClient={(client) => setClients((current) => [{ id: Date.now(), ...client }, ...current])} /> : null}
        {activeView === 'employees' ? (
          <EmployeesPage
            employees={employees}
            jobTypes={jobTypes}
            onAddEmployee={(employee) => setEmployees((current) => [{ id: Date.now(), load: 0, ...employee }, ...current])}
          />
        ) : null}
        {activeView === 'jobTypes' ? <JobTypesPage jobTypes={jobTypes} onAddJobType={(name) => setJobTypes((current) => [name, ...current])} /> : null}
        {activeView === 'settings' ? <SettingsPage themeMode={themeMode} onThemeChange={setThemeMode} /> : null}
      </main>
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
            {loading ? '로그인중' : '로그인'}
          </button>
        </form>

        <button className="ghost-action" onClick={onPrototypeLogin} type="button">
          계정 생성 전 프로토타입 보기
        </button>
      </section>
    </main>
  );
}

function Sidebar({
  activeView,
  currentUser,
  open,
  onClose,
  onLogout,
  onNavigate,
}: {
  activeView: ActiveView;
  currentUser: AppUser;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  onNavigate: (view: ActiveView) => void;
}) {
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
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <button className="nav-button" data-active={activeView === item.id} key={item.id} onClick={() => onNavigate(item.id)}>
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge ? <small>{item.badge}</small> : null}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom-layer">
        <div className="sidebar-section">
          <p>관리</p>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button className="nav-button compact" data-active={activeView === item.id} key={item.id} onClick={() => onNavigate(item.id)}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="profile-card">
          <CircleUserRound size={34} />
          <div>
            <strong>{currentUser.name}</strong>
            <span>{currentUser.role}</span>
          </div>
          <button className="logout-button" aria-label="로그아웃" onClick={onLogout} title="로그아웃">
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function Topbar({
  currentUser,
  themeMode,
  onThemeChange,
  onMenuClick,
}: {
  currentUser: AppUser;
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onMenuClick: () => void;
}) {
  return (
    <header className="topbar">
      <button className="icon-button menu-button" aria-label="메뉴 열기" onClick={onMenuClick}>
        <Menu size={21} />
      </button>

      <label className="search-box">
        <Search size={18} />
        <input placeholder="업무, 업체, 담당자 검색" />
      </label>

      <div className="top-actions">
        <ThemeSwitcher value={themeMode} onChange={onThemeChange} />
        <button className="icon-button" aria-label="알림">
          <Bell size={19} />
        </button>
        <button className="account-button">
          <CircleUserRound size={20} />
          <span>{currentUser.name}</span>
          <ChevronDown size={16} />
        </button>
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

function Dashboard({
  stats,
  tasks,
  employees,
  onCreateTask,
}: {
  stats: Array<{ label: string; value: number; hint: string; tone: string }>;
  tasks: Task[];
  employees: Employee[];
  onCreateTask: (task: Omit<Task, 'id' | 'status' | 'watchers'> & { status?: TaskStatus; watchers?: string[] }) => void;
}) {
  return (
    <>
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Plander Works</p>
          <h1>업무 요청, 보고, 전달을 한 화면에서 관리</h1>
          <p className="hero-copy">
            직원이 대표에게 보고하고, 팀끼리 요청을 넘기고, 업무 상태와 첨부 내역을 한 흐름에 쌓는 내부 업무 허브.
          </p>
        </div>
        <button className="primary-action">
          <Plus size={18} />
          업무 생성
        </button>
      </section>

      <section className="stats-grid" aria-label="업무 요약">
        {stats.map((item) => (
          <article className="stat-card" data-tone={item.tone} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.hint}</small>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <div className="task-board">
          <div className="section-head">
            <div>
              <p className="eyebrow">Inbox</p>
              <h2>받은 업무</h2>
            </div>
            <div className="filters">
              <button>전체</button>
              <button>진행중</button>
              <button>완료 요청</button>
            </div>
          </div>

          <div className="task-list">
            {tasks.slice(0, 4).map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>

        <aside className="side-panel">
          <TaskComposer onCreateTask={onCreateTask} />
          <TeamLoad employees={employees} />
        </aside>
      </section>
    </>
  );
}

function TaskListPage({ title, tasks }: { title: string; tasks: Task[] }) {
  const [status, setStatus] = useState<'전체' | TaskStatus>('전체');
  const filteredTasks = status === '전체' ? tasks : tasks.filter((task) => task.status === status);

  return (
    <section className="page-shell">
      <div className="page-head">
        <div>
          <p className="eyebrow">Tasks</p>
          <h1>{title}</h1>
        </div>
        <div className="filters">
          {(['전체', '대기', '진행중', '완료 요청', '보류', '완료'] as Array<'전체' | TaskStatus>).map((item) => (
            <button data-active={status === item} key={item} onClick={() => setStatus(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="task-board page-card">
        <div className="task-list">
          {filteredTasks.length ? filteredTasks.map((task) => <TaskCard key={task.id} task={task} />) : <EmptyState text="조건에 맞는 업무가 없습니다." />}
        </div>
      </div>
    </section>
  );
}

function TaskCreatePage({
  clients,
  employees,
  onCreateTask,
}: {
  clients: Client[];
  employees: Employee[];
  onCreateTask: (task: Omit<Task, 'id' | 'status' | 'watchers'> & { status?: TaskStatus; watchers?: string[] }) => void;
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
        <TaskForm clients={clients} employees={employees} onSubmit={onCreateTask} />
      </div>
    </section>
  );
}

function ReportsPage({
  tasks,
  onCreateTask,
}: {
  tasks: Task[];
  onCreateTask: (task: Omit<Task, 'id' | 'status' | 'watchers'> & { status?: TaskStatus; watchers?: string[] }) => void;
}) {
  const reportTasks = tasks.filter((task) => task.type === '보고' || task.type === '제안' || task.type === '영업 브리핑');

  return (
    <section className="page-shell">
      <div className="page-head">
        <div>
          <p className="eyebrow">Reports</p>
          <h1>보고·제안</h1>
        </div>
      </div>
      <div className="split-layout">
        <div className="page-card">
          <div className="section-head tight">
            <div>
              <p className="eyebrow">History</p>
              <h2>최근 보고</h2>
            </div>
          </div>
          <div className="task-list">
            {reportTasks.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        </div>
        <div className="page-card">
          <ReportForm onCreateTask={onCreateTask} />
        </div>
      </div>
    </section>
  );
}

function ClientsPage({
  clients,
  onAddClient,
}: {
  clients: Client[];
  onAddClient: (client: Omit<Client, 'id'>) => void;
}) {
  const [form, setForm] = useState({ name: '', manager: '인성이형', phone: '', memo: '' });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    onAddClient(form);
    setForm({ name: '', manager: '인성이형', phone: '', memo: '' });
  };

  return (
    <section className="page-shell">
      <div className="page-head">
        <div>
          <p className="eyebrow">Clients</p>
          <h1>업체</h1>
        </div>
      </div>

      <div className="split-layout">
        <div className="page-card">
          <div className="client-grid">
            {clients.map((client) => (
              <article className="client-card" key={client.id}>
                <strong>{client.name}</strong>
                <span>담당: {client.manager}</span>
                <span>{client.phone}</span>
                <p>{client.memo}</p>
              </article>
            ))}
          </div>
        </div>
        <form className="page-card form-stack" onSubmit={submit}>
          <div>
            <p className="eyebrow">New Client</p>
            <h2>업체 추가</h2>
          </div>
          <label>
            업체명
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            담당자
            <input value={form.manager} onChange={(event) => setForm({ ...form, manager: event.target.value })} />
          </label>
          <label>
            전화번호
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>
          <label>
            메모
            <textarea value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} />
          </label>
          <button className="primary-action wide" type="submit">
            <Plus size={17} />
            업체 추가
          </button>
        </form>
      </div>
    </section>
  );
}

function EmployeesPage({
  employees,
  jobTypes,
  onAddEmployee,
}: {
  employees: Employee[];
  jobTypes: string[];
  onAddEmployee: (employee: Omit<Employee, 'id' | 'load'>) => void;
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    jobType: jobTypes[0] || '',
    role: '직원' as Employee['role'],
  });
  const [error, setError] = useState('');

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호 확인이 맞지 않습니다.');
      return;
    }

    onAddEmployee({
      name: form.name || form.email.split('@')[0],
      email: form.email,
      phone: form.phone,
      jobType: form.jobType,
      role: form.role,
    });
    setForm({ name: '', email: '', password: '', passwordConfirm: '', phone: '', jobType: jobTypes[0] || '', role: '직원' });
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
              <div className="table-row" key={employee.id}>
                <div>
                  <strong>{employee.name}</strong>
                  <span>{employee.email}</span>
                </div>
                <span>{employee.jobType}</span>
                <span>{employee.role}</span>
                <small>{employee.load}건</small>
              </div>
            ))}
          </div>
        </div>

        <form className="page-card form-stack" onSubmit={submit}>
          <div>
            <p className="eyebrow">Create User</p>
            <h2>계정 생성 폼</h2>
          </div>
          <p className="admin-note">현재는 프론트 MVP 폼입니다. 실제 Supabase 계정 생성은 service role key가 필요한 서버 전용 기능으로 붙입니다.</p>
          <label>
            이름
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
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
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </label>
          {error ? <p className="auth-error">{error}</p> : null}
          <button className="primary-action wide" type="submit">
            <Plus size={17} />
            계정 추가
          </button>
        </form>
      </div>
    </section>
  );
}

function JobTypesPage({ jobTypes, onAddJobType }: { jobTypes: string[]; onAddJobType: (name: string) => void }) {
  const [name, setName] = useState('');

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    onAddJobType(name.trim());
    setName('');
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
        <div className="page-card tag-cloud">
          {jobTypes.map((jobType) => <span key={jobType}>{jobType}</span>)}
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
          <button className="primary-action wide" type="submit">
            <Plus size={17} />
            추가
          </button>
        </form>
      </div>
    </section>
  );
}

function SettingsPage({ themeMode, onThemeChange }: { themeMode: ThemeMode; onThemeChange: (mode: ThemeMode) => void }) {
  return (
    <section className="page-shell">
      <div className="page-head">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>설정</h1>
        </div>
      </div>

      <div className="split-layout">
        <div className="page-card settings-card">
          <h2>테마</h2>
          <p>사이드바는 Plander 블랙을 유지하고, 업무 영역은 라이트/다크/시스템 설정을 따릅니다.</p>
          <ThemeSwitcher value={themeMode} onChange={onThemeChange} />
        </div>
        <div className="page-card settings-card">
          <h2>첨부파일</h2>
          <p>파일 본문은 DB가 아니라 Supabase Storage에 저장하고, DB에는 경로와 메타데이터만 저장하는 구조로 갑니다.</p>
        </div>
      </div>
    </section>
  );
}

function TaskForm({
  clients,
  employees,
  onSubmit,
}: {
  clients: Client[];
  employees: Employee[];
  onSubmit: (task: Omit<Task, 'id' | 'status' | 'watchers'> & { status?: TaskStatus; watchers?: string[] }) => void;
}) {
  const [form, setForm] = useState({
    type: '영업 브리핑' as TaskType,
    title: '',
    to: employees[1]?.name || '대표',
    client: clients[0]?.name || '',
    due: '',
    priority: '보통' as Priority,
    summary: '',
  });

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      title: form.title,
      from: '인성이형',
      to: form.to,
      client: form.client,
      due: form.due || '미정',
      priority: form.priority,
      type: form.type,
      summary: form.summary,
    });
    setForm({ ...form, title: '', summary: '' });
  };

  return (
    <form className="form-grid" onSubmit={submit}>
      <label>
        유형
        <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as TaskType })}>
          <option>영업 브리핑</option>
          <option>디자인 요청</option>
          <option>보고</option>
          <option>제안</option>
          <option>확인 요청</option>
          <option>촬영 요청</option>
          <option>시장 조사</option>
        </select>
      </label>
      <label>
        받는 사람
        <select value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })}>
          {employees.map((employee) => <option key={employee.id}>{employee.name}</option>)}
        </select>
      </label>
      <label>
        관련 업체
        <select value={form.client} onChange={(event) => setForm({ ...form, client: event.target.value })}>
          {clients.map((client) => <option key={client.id}>{client.name}</option>)}
        </select>
      </label>
      <label>
        마감일
        <input value={form.due} onChange={(event) => setForm({ ...form, due: event.target.value })} placeholder="4월 30일" />
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
        <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
      </label>
      <label className="span-2">
        요청 내용
        <textarea required value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
      </label>
      <div className="attachment-row span-2">
        <Paperclip size={17} />
        <span>Supabase Storage 첨부 예정</span>
      </div>
      <button className="primary-action span-2" type="submit">
        <CheckCircle2 size={17} />
        업무 전송
      </button>
    </form>
  );
}

function ReportForm({
  onCreateTask,
}: {
  onCreateTask: (task: Omit<Task, 'id' | 'status' | 'watchers'> & { status?: TaskStatus; watchers?: string[] }) => void;
}) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onCreateTask({
      title,
      summary,
      from: '인성이형',
      to: '대표',
      client: '내부',
      due: '검토 대기',
      priority: '보통',
      type: '보고',
      status: '대기',
    });
    setTitle('');
    setSummary('');
  };

  return (
    <form className="form-stack" onSubmit={submit}>
      <div>
        <p className="eyebrow">New Report</p>
        <h2>대표에게 보고</h2>
      </div>
      <label>
        제목
        <input required value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        보고 내용
        <textarea required value={summary} onChange={(event) => setSummary(event.target.value)} />
      </label>
      <button className="primary-action wide" type="submit">
        <CheckCircle2 size={17} />
        보고 전송
      </button>
    </form>
  );
}

function TaskComposer({
  onCreateTask,
}: {
  onCreateTask: (task: Omit<Task, 'id' | 'status' | 'watchers'> & { status?: TaskStatus; watchers?: string[] }) => void;
}) {
  const [title, setTitle] = useState('A업체 미팅 내용 전달');
  const [summary, setSummary] = useState('미팅 내용, 요청사항, 다음 액션을 정리해서 전달합니다.');
  const [type, setType] = useState<TaskType>('영업 브리핑');
  const [to, setTo] = useState('대표');

  return (
    <section className="compose-panel">
      <div className="section-head tight">
        <div>
          <p className="eyebrow">Quick Send</p>
          <h2>업무 전달</h2>
        </div>
        <ShieldCheck size={22} />
      </div>

      <div className="form-stack">
        <label>
          유형
          <select value={type} onChange={(event) => setType(event.target.value as TaskType)}>
            <option>영업 브리핑</option>
            <option>디자인 요청</option>
            <option>보고</option>
            <option>제안</option>
            <option>확인 요청</option>
          </select>
        </label>
        <label>
          제목
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          받는 사람
          <select value={to} onChange={(event) => setTo(event.target.value)}>
            <option>대표</option>
            <option>디자인팀장</option>
            <option>개발팀</option>
            <option>일본 마케팅</option>
          </select>
        </label>
        <label>
          요청 내용
          <textarea value={summary} onChange={(event) => setSummary(event.target.value)} />
        </label>
        <div className="attachment-row">
          <Paperclip size={17} />
          <span>파일 첨부 준비됨</span>
        </div>
        <button
          className="primary-action wide"
          onClick={() => onCreateTask({ title, summary, type, to, from: '인성이형', client: 'A업체', due: '미정', priority: '보통' })}
          type="button"
        >
          <CheckCircle2 size={17} />
          전달하기
        </button>
      </div>
    </section>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <article className="task-card">
      <div className="task-main">
        <div className="task-title-row">
          <span className="task-type">{task.type}</span>
          <span className="priority" data-priority={task.priority}>
            {task.priority}
          </span>
        </div>
        <h3>{task.title}</h3>
        <p>{task.summary}</p>
        <div className="task-meta">
          <span>{task.from} → {task.to}</span>
          <span>{task.client}</span>
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
        <button className="icon-button" aria-label="업무 메뉴">
          <MoreHorizontal size={18} />
        </button>
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
          <h2>담당자 현황</h2>
        </div>
        <Users size={22} />
      </div>

      <div className="people-list">
        {employees.map((person) => (
          <div className="person-row" key={person.id}>
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

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}

createRoot(document.getElementById('root')!).render(<App />);
