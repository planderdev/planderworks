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
type TaskStatus = '대기' | '진행중' | '완료 요청' | '보류' | '완료';
type Priority = '높음' | '보통' | '낮음';
type AppUser = {
  name: string;
  email: string;
  role: string;
  isPrototype: boolean;
};

const navItems = [
  { label: '대시보드', icon: LayoutDashboard, active: true, badge: null },
  { label: '받은 업무', icon: ClipboardList, active: false, badge: 7 },
  { label: '보낸 업무', icon: MessageSquareText, active: false, badge: 3 },
  { label: '업무 생성', icon: Plus, active: false, badge: null },
  { label: '보고·제안', icon: FileText, active: false, badge: 2 },
  { label: '업체', icon: Building2, active: false, badge: null },
];

const adminItems = [
  { label: '직원 관리', icon: UserCog },
  { label: '담당업무 관리', icon: BriefcaseBusiness },
  { label: '설정', icon: Settings },
];

const tasks: Array<{
  title: string;
  from: string;
  to: string;
  client: string;
  due: string;
  status: TaskStatus;
  priority: Priority;
  type: string;
  summary: string;
}> = [
  {
    title: 'A식당 일본 나노 인플루언서 섭외 브리핑',
    from: '인성이형',
    to: '대표',
    client: 'A식당',
    due: '4월 25일',
    status: '진행중',
    priority: '높음',
    type: '영업 브리핑',
    summary: '일본인 한국여행 계정 8명 후보와 촬영 가능 일정 정리 필요',
  },
  {
    title: 'B뷰티샵 상세페이지 톤앤매너 요청',
    from: '인성이형',
    to: '디자인팀',
    client: 'B뷰티샵',
    due: '4월 28일',
    status: '대기',
    priority: '보통',
    type: '디자인 요청',
    summary: '일본 현지 고객용 상세페이지 레퍼런스와 시술 메뉴 번역본 전달',
  },
  {
    title: '온고 조청 브랜드 일본 판매 채널 조사',
    from: '대표',
    to: '일본 마케팅',
    client: '온고',
    due: '5월 2일',
    status: '완료 요청',
    priority: '높음',
    type: '시장 조사',
    summary: '라쿠텐, 아마존 재팬, 큐텐 입점 조건 비교 및 예상 비용 보고',
  },
  {
    title: '제주 숙소 릴스 촬영 일정 확인',
    from: '운영팀',
    to: '인성이형',
    client: '제주 숙소',
    due: '4월 30일',
    status: '보류',
    priority: '낮음',
    type: '촬영 요청',
    summary: '비 오는 날 대체 촬영 컷 구성과 인플루언서 이동 동선 확인',
  },
];

const people = [
  { name: '인성이형', role: '일본 마케팅', load: 7 },
  { name: '대표', role: '경영·영업', load: 5 },
  { name: '디자인팀장', role: 'UIUX·브랜딩', load: 9 },
  { name: '개발팀', role: '웹·앱 개발', load: 4 },
];

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

  const statusCounts = useMemo(
    () => [
      { label: '받은 업무', value: 18, hint: '이번 주 +6', tone: 'silver' },
      { label: '진행중', value: 9, hint: '담당자 확인중', tone: 'blue' },
      { label: '완료 요청', value: 4, hint: '검토 필요', tone: 'amber' },
      { label: '마감 임박', value: 3, hint: '48시간 이내', tone: 'red' },
    ],
    [],
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
      <Sidebar currentUser={currentUser} open={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
      <div className="mobile-overlay" data-open={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <main className="workspace">
        <Topbar
          currentUser={currentUser}
          themeMode={themeMode}
          onThemeChange={setThemeMode}
          onMenuClick={() => setSidebarOpen(true)}
        />

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
          {statusCounts.map((item) => (
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
              {tasks.map((task) => (
                <TaskCard key={task.title} task={task} />
              ))}
            </div>
          </div>

          <aside className="side-panel">
            <TaskComposer />
            <TeamLoad />
          </aside>
        </section>
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
        <div className="brand-mark">P</div>
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
  currentUser,
  open,
  onClose,
  onLogout,
}: {
  currentUser: AppUser;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className="sidebar" data-open={open}>
      <div className="brand-row">
        <div className="brand-mark">P</div>
        <div>
          <strong>Plander</strong>
          <span>Works</span>
        </div>
        <button className="icon-button close-sidebar" aria-label="메뉴 닫기" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="주 메뉴">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button className="nav-button" data-active={item.active} key={item.label}>
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge ? <small>{item.badge}</small> : null}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-section">
        <p>관리</p>
        {adminItems.map((item) => {
          const Icon = item.icon;
          return (
            <button className="nav-button compact" key={item.label}>
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

function TaskCard({ task }: { task: (typeof tasks)[number] }) {
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

function TaskComposer() {
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
          <select defaultValue="영업 브리핑">
            <option>영업 브리핑</option>
            <option>디자인 요청</option>
            <option>보고</option>
            <option>제안</option>
            <option>확인 요청</option>
          </select>
        </label>
        <label>
          제목
          <input defaultValue="A업체 미팅 내용 전달" />
        </label>
        <label>
          받는 사람
          <select defaultValue="대표">
            <option>대표</option>
            <option>디자인팀장</option>
            <option>개발팀</option>
            <option>일본 마케팅</option>
          </select>
        </label>
        <label>
          요청 내용
          <textarea defaultValue="미팅 내용, 요청사항, 다음 액션을 정리해서 전달합니다." />
        </label>
        <div className="attachment-row">
          <Paperclip size={17} />
          <span>파일 첨부 준비됨</span>
        </div>
        <button className="primary-action wide">
          <CheckCircle2 size={17} />
          전달하기
        </button>
      </div>
    </section>
  );
}

function TeamLoad() {
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
        {people.map((person) => (
          <div className="person-row" key={person.name}>
            <div>
              <strong>{person.name}</strong>
              <span>{person.role}</span>
            </div>
            <small>{person.load}건</small>
          </div>
        ))}
      </div>
    </section>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
