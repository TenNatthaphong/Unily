import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import {
  Menu, X, Sun, Moon, Home, BookOpen, ClipboardList, Calendar, User, GraduationCap,
  LogOut, BarChart3, Users, Settings, FileText, ChevronRight, ChevronDown,
  Database, Shield, UserCheck, Layers, BookMarked
} from 'lucide-react';
import { useTheme } from './theme-provider';
import { useAuth } from './auth-context';
import { UniyLogo } from './uniy-logo';
import type { Role } from './mock-data';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const studentNav: NavItem[] = [
  { label: 'แดชบอร์ด', path: '/student', icon: <Home className="w-5 h-5" /> },
  { label: 'หลักสูตรและวิชาเรียน', path: '/student/courses', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'ลงทะเบียนเรียน', path: '/student/enrollment', icon: <ClipboardList className="w-5 h-5" /> },
  { label: 'ผลการเรียน', path: '/student/grades', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'ตารางเรียน', path: '/student/schedule', icon: <Calendar className="w-5 h-5" /> },
  { label: 'ข้อมูลส่วนตัว', path: '/student/profile', icon: <User className="w-5 h-5" /> },
];

const professorNav: NavItem[] = [
  { label: 'แดชบอร์ด', path: '/professor', icon: <Home className="w-5 h-5" /> },
  { label: 'วิชาที่สอน', path: '/professor/courses', icon: <BookOpen className="w-5 h-5" /> },
  { label: 'ให้เกรด', path: '/professor/grading', icon: <GraduationCap className="w-5 h-5" /> },
  { label: 'ตารางสอน', path: '/professor/schedule', icon: <Calendar className="w-5 h-5" /> },
  { label: 'ข้อมูลส่วนตัว', path: '/professor/profile', icon: <User className="w-5 h-5" /> },
];

const adminNav: NavItem[] = [
  { label: 'แดชบอร์ด', path: '/admin', icon: <Home className="w-5 h-5" /> },
  {
    label: 'ฐานข้อมูลผู้ใช้', path: '', icon: <Database className="w-5 h-5" />,
    children: [
      { label: 'นักศึกษา', path: '/admin/users?role=student', icon: <GraduationCap className="w-4 h-4" /> },
      { label: 'อาจารย์', path: '/admin/users?role=professor', icon: <UserCheck className="w-4 h-4" /> },
      { label: 'ผู้ดูแลระบบ', path: '/admin/users?role=admin', icon: <Shield className="w-4 h-4" /> },
      { label: 'ทั้งหมด', path: '/admin/users', icon: <Users className="w-4 h-4" /> },
    ]
  },
  { label: 'ปฏิทินกิจกรรม', path: '/admin/calendar', icon: <Calendar className="w-5 h-5" /> },
  {
    label: 'หลักสูตร', path: '', icon: <Layers className="w-5 h-5" />,
    children: [
      { label: 'ค้นหาหลักสูตร', path: '/admin/curricula', icon: <FileText className="w-4 h-4" /> },
    ]
  },
  { label: 'รายวิชาทั้งหมด', path: '/admin/courses', icon: <BookMarked className="w-5 h-5" /> },
  { label: 'ตั้งค่าเทอม', path: '/admin/semester', icon: <Settings className="w-5 h-5" /> },
];

function getNavItems(role: Role): NavItem[] {
  switch (role) {
    case 'student': return studentNav;
    case 'professor': return professorNav;
    case 'admin': return adminNav;
  }
}

function getRoleLabel(role: Role): string {
  switch (role) {
    case 'student': return 'นักศึกษา';
    case 'professor': return 'อาจารย์';
    case 'admin': return 'ผู้ดูแลระบบ';
  }
}

function NavItemComponent({ item, collapsed, role }: { item: NavItem; collapsed: boolean; role: Role }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`
            flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl transition-all duration-200 w-[calc(100%-16px)]
            text-foreground/70 hover:bg-accent hover:text-foreground
            ${collapsed ? 'justify-center' : ''}
          `}
        >
          {item.icon}
          {!collapsed && (
            <>
              <span className="text-[14px] flex-1 text-left">{item.label}</span>
              <ChevronDown className={`w-4 h-4 opacity-40 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </>
          )}
        </button>
        {!collapsed && expanded && (
          <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-border/50 pl-2">
            {item.children!.map(child => (
              <NavLink
                key={child.path}
                to={child.path}
                className={({ isActive }) => `
                  flex items-center gap-2.5 mx-2 px-3 py-2 rounded-xl transition-all duration-200
                  ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground/60 hover:bg-accent hover:text-foreground'
                  }
                `}
              >
                {child.icon}
                <span className="text-[13px]">{child.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      end={item.path === `/${role}`}
      className={({ isActive }) => `
        flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl transition-all duration-200
        ${isActive
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'text-foreground/70 hover:bg-accent hover:text-foreground'
        }
        ${collapsed ? 'justify-center' : ''}
      `}
    >
      {item.icon}
      {!collapsed && <span className="text-[14px]">{item.label}</span>}
      {!collapsed && !hasChildren && <ChevronRight className="w-4 h-4 ml-auto opacity-40" />}
    </NavLink>
  );
}

export function AppSidebar({ role }: { role: Role }) {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = getNavItems(role);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`
          flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out shrink-0
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border min-h-[72px]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-xl hover:bg-accent transition-colors"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <UniyLogo className="w-[50px] h-[38px]" color="var(--primary)" />
            </div>
          )}
        </div>

        {/* User Info */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[14px] truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-[12px] text-muted-foreground">{getRoleLabel(role)}</p>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-0.5">
          {navItems.map((item) => (
            <NavItemComponent key={item.label} item={item} collapsed={collapsed} role={role} />
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-border p-3 space-y-1">
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-accent transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            {!collapsed && <span className="text-[14px]">{theme === 'light' ? 'โหมดมืด' : 'โหมดสว่าง'}</span>}
          </button>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-destructive/10 text-destructive transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="text-[14px]">ออกจากระบบ</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto min-h-0">
        <Outlet />
      </main>
    </div>
  );
}
