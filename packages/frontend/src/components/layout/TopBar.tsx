import { useState } from 'react';
import { Menu, Moon, Sun, Bell, Globe, User, LogOut } from 'lucide-react';
import { useThemeStore } from '../../stores/theme.store';
import { useLocaleStore } from '../../stores/locale.store';
import { useAuthStore } from '../../stores/auth.store';
import { useTranslation } from '../../i18n/useTranslation';
import { useNavigate } from 'react-router-dom';
import './TopBar.css';

interface TopBarProps {
  onMenuToggle: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const { theme, toggle: toggleTheme } = useThemeStore();
  const { locale, toggle: toggleLocale } = useLocaleStore();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="btn-icon topbar-hamburger" onClick={onMenuToggle} aria-label="Menu">
          <Menu size={22} />
        </button>
        <div className="topbar-logo" onClick={() => navigate('/dashboard')}>
          <span className="logo-text">Unily</span>
        </div>
      </div>

      <div className="topbar-right">
        <button className="btn-icon topbar-action" onClick={toggleLocale} title={t('common.language')}>
          <Globe size={18} />
          <span className="locale-label">{locale === 'th' ? 'TH' : 'EN'}</span>
        </button>

        <button className="btn-icon topbar-action" onClick={toggleTheme} title={theme === 'dark' ? t('common.light_mode') : t('common.dark_mode')}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="btn-icon topbar-action" title="Notifications">
          <Bell size={18} />
        </button>

        <div className="topbar-profile-wrapper">
          <button className="topbar-profile-btn" onClick={() => setShowProfile(!showProfile)}>
            <div className="topbar-avatar">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
          </button>

          {showProfile && (
            <div className="topbar-profile-menu animate-fade-in">
              <div className="profile-menu-header">
                <span className="profile-name">{user?.firstName} {user?.lastName}</span>
                <span className="profile-role badge badge-info">{user?.role}</span>
              </div>
              <div className="profile-menu-divider" />
              <button className="profile-menu-item" onClick={() => { navigate('/settings/profile'); setShowProfile(false); }}>
                <User size={16} /> {t('nav.profile')}
              </button>
              <button className="profile-menu-item danger" onClick={handleLogout}>
                <LogOut size={16} /> {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
