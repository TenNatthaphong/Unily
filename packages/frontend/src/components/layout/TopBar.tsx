import { useState } from 'react';
import { Menu, Moon, Sun, Bell, User, LogOut } from 'lucide-react';
import { useThemeStore } from '../../stores/theme.store';
import { useLocaleStore } from '../../stores/locale.store';
import { useAuthStore } from '../../stores/auth.store';
import { useNavigate } from 'react-router-dom';
import './TopBar.css';

interface TopBarProps {
  onMenuToggle: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const { theme, toggle: toggleTheme } = useThemeStore();
  const { locale, toggle: toggleLocale } = useLocaleStore();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowProfile(false);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-hamburger" onClick={onMenuToggle} aria-label="Menu">
          <Menu size={20} />
        </button>
        <div className="topbar-logo" onClick={() => navigate('/dashboard')}>
          <div className="logo-icon">U</div>
          <span className="logo-text">Unily</span>
        </div>
      </div>

      <div className="topbar-right">
        <button className="locale-pill" onClick={toggleLocale}>
          {locale === 'th' ? '🇹🇭 TH' : '🇬🇧 EN'}
        </button>

        <button className="topbar-action" onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <button className="topbar-action" title="Notifications">
          <Bell size={17} />
        </button>

        <div className="topbar-profile-wrapper">
          <button className="topbar-profile-btn" onClick={() => setShowProfile(v => !v)}>
            <div className="topbar-avatar">{user?.firstName?.charAt(0) || 'U'}</div>
            <span className="topbar-profile-name">{user?.firstName}</span>
          </button>

          {showProfile && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setShowProfile(false)} />
              <div className="topbar-profile-menu animate-fade-in">
                <div className="profile-menu-header">
                  <span className="profile-name">{user?.firstName} {user?.lastName}</span>
                  <span className="profile-role">{user?.role}</span>
                </div>
                <div className="profile-menu-divider" />
                <button className="profile-menu-item" onClick={() => { navigate('/settings/profile'); setShowProfile(false); }}>
                  <User size={15} /> โปรไฟล์
                </button>
                <button className="profile-menu-item danger" onClick={handleLogout}>
                  <LogOut size={15} /> ออกจากระบบ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
