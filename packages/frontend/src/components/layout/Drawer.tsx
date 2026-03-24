import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { useTranslation } from '../../i18n/useTranslation';
import type { Role } from '../../types';
import './Drawer.css';

interface MenuItem {
  icon: string;
  labelKey: string;
  route?: string;
  children?: { labelKey: string; route: string }[];
}

const MENU_CONFIG: Record<Role, MenuItem[]> = {
  STUDENT: [
    { icon: 'LayoutDashboard', labelKey: 'nav.dashboard', route: '/dashboard' },
    { icon: 'PenSquare', labelKey: 'nav.enrollment', route: '/student/enrollment' },
    { icon: 'Calendar', labelKey: 'nav.schedule', route: '/student/schedule' },
    { icon: 'BookOpen', labelKey: 'nav.curriculum', route: '/student/curriculum/plan' },
    { icon: 'BarChart3', labelKey: 'nav.records', children: [
      { labelKey: 'nav.records', route: '/student/records' },
      { labelKey: 'nav.transcript', route: '/student/transcript' },
      { labelKey: 'nav.graduation_check', route: '/student/graduation' },
    ]},
  ],
  PROFESSOR: [
    { icon: 'LayoutDashboard', labelKey: 'nav.dashboard', route: '/dashboard' },
    { icon: 'Calendar', labelKey: 'nav.teaching_schedule', route: '/professor/schedule' },
    { icon: 'PenSquare', labelKey: 'nav.sections', route: '/professor/sections' },
  ],
  ADMIN: [
    { icon: 'LayoutDashboard', labelKey: 'nav.dashboard', route: '/dashboard' },
    { icon: 'Building2', labelKey: 'nav.organization', children: [
      { labelKey: 'nav.faculties', route: '/admin/org/faculties' },
    ]},
    { icon: 'BookOpen', labelKey: 'nav.curriculum', children: [
      { labelKey: 'nav.curriculum', route: '/admin/curriculums' },
    ]},
    { icon: 'Book', labelKey: 'nav.courses', route: '/admin/courses' },
    { icon: 'PenSquare', labelKey: 'nav.sections', route: '/admin/sections' },
    { icon: 'Users', labelKey: 'nav.users', route: '/admin/users' },
    { icon: 'FileText', labelKey: 'nav.audit_log', route: '/admin/audit-log' },
    { icon: 'Settings', labelKey: 'nav.settings', route: '/dashboard' },
  ],
};

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Drawer({ isOpen, onClose }: DrawerProps) {
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const role = user?.role || 'STUDENT';
  const menuItems = MENU_CONFIG[role];

  // Close drawer on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  const toggleExpand = (key: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleNavigate = (route: string) => {
    navigate(route);
    onClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose();
  };

  const getIcon = (iconName: string) => {
    const LucideIcon = (Icons as any)[iconName];
    return LucideIcon ? <LucideIcon size={20} /> : null;
  };

  const isActive = (route: string) => location.pathname === route;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`drawer-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className={`drawer ${isOpen ? 'open' : ''}`}>
        {/* User Info */}
        <div className="drawer-user">
          <div className="drawer-avatar">
            {user?.firstName?.charAt(0) || 'U'}
          </div>
          <div className="drawer-user-info">
            <span className="drawer-user-name">{user?.firstName} {user?.lastName}</span>
            <span className="badge badge-info">{role}</span>
          </div>
        </div>

        <div className="drawer-divider" />

        {/* Menu Items */}
        <nav className="drawer-nav">
          {menuItems.map((item, idx) => {
            const key = `menu-${idx}`;
            const isExpanded = expandedItems.has(key);

            if (item.children) {
              return (
                <div key={key} className="drawer-group">
                  <button
                    className="drawer-item drawer-item-parent"
                    onClick={() => toggleExpand(key)}
                  >
                    <span className="drawer-item-icon">{getIcon(item.icon)}</span>
                    <span className="drawer-item-label">{t(item.labelKey)}</span>
                    <span className="drawer-item-chevron">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                  </button>
                  <div className={`drawer-children ${isExpanded ? 'expanded' : ''}`}>
                    {item.children.map((child) => (
                      <button
                        key={child.route}
                        className={`drawer-item drawer-item-child ${isActive(child.route) ? 'active' : ''}`}
                        onClick={() => handleNavigate(child.route)}
                      >
                        <span className="drawer-item-label">{t(child.labelKey)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <button
                key={key}
                className={`drawer-item ${isActive(item.route!) ? 'active' : ''}`}
                onClick={() => handleNavigate(item.route!)}
              >
                <span className="drawer-item-icon">{getIcon(item.icon)}</span>
                <span className="drawer-item-label">{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        <div className="drawer-divider" />

        {/* Logout */}
        <button className="drawer-item drawer-logout" onClick={handleLogout}>
          <span className="drawer-item-icon"><Icons.LogOut size={20} /></span>
          <span className="drawer-item-label">{t('nav.logout')}</span>
        </button>
      </aside>
    </>
  );
}
