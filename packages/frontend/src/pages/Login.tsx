import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import { useTranslation } from '../i18n/useTranslation';
import { authApi } from '../api/auth.api';
import { userApi } from '../api/user.api';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const authRes = await authApi.login(email, password);
      const { accessToken, refreshToken } = authRes.data;

      // Temporarily set tokens to fetch profile
      useAuthStore.getState().setTokens(accessToken, refreshToken);
      const profileRes = await userApi.getProfile();
      const user = profileRes.data;

      login(accessToken, refreshToken, user);
      navigate('/dashboard');
    } catch {
      setError(t('login.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-bg-orb login-bg-orb-3" />
      </div>

      <div className="login-container animate-fade-in">
        <div className="login-card">
          {/* Logo */}
          <div className="login-logo">
            <span className="login-logo-text">Unily</span>
            <span className="login-logo-sub">University Registration System</span>
          </div>

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder={t('login.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder={t('login.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="login-error animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-high-impact login-submit"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="spin" />
                  {t('login.logging_in')}
                </>
              ) : (
                t('login.submit')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
