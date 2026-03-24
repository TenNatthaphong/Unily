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
    <div className="login-root">
      {/* ── Left: Branded Panel ── */}
      <div className="login-brand">
        {/* Floating geometric shapes */}
        <div className="brand-shapes">
          <div className="brand-shape" />
          <div className="brand-shape" />
          <div className="brand-shape" />
          <div className="brand-shape" />
          <div className="brand-shape" />
        </div>

        <div className="brand-content">
          <div className="brand-logo-mark">U</div>

          <h1 className="brand-title">
            Unily<br />
            <span>University</span>
          </h1>
          <p className="brand-tagline">Registration System</p>

          <div className="brand-features">
            <div className="brand-feature">
              <span className="brand-feature-dot" />
              ลงทะเบียนวิชาเรียนออนไลน์
            </div>
            <div className="brand-feature">
              <span className="brand-feature-dot" />
              ตรวจสอบผลการเรียน & ทรานสคริปต์
            </div>
            <div className="brand-feature">
              <span className="brand-feature-dot" />
              วางแผนการศึกษาครบหลักสูตร
            </div>
            <div className="brand-feature">
              <span className="brand-feature-dot" />
              จัดการตารางเรียน-สอน
            </div>
          </div>
        </div>

        <div className="brand-bottom">
          <span className="brand-bottom-text">© 2026 UNILY UNIVERSITY</span>
          <span className="brand-bottom-text">v2.0</span>
        </div>
      </div>

      {/* ── Right: Form Panel ── */}
      <div className="login-form-panel">
        <div className="login-form-inner">
          <h2 className="login-form-title">{t('login.title') || 'ยินดีต้อนรับ'}</h2>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="login-field">
              <label className="login-field-label" htmlFor="login-email">
                {t('login.email') || 'อีเมล'}
              </label>
              <div className="login-field-wrap">
                <Mail size={16} className="login-field-icon" />
                <input
                  id="login-email"
                  type="email"
                  className="login-field-input"
                  placeholder="example@university.ac.th"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <label className="login-field-label" htmlFor="login-password">
                {t('login.password') || 'รหัสผ่าน'}
              </label>
              <div className="login-field-wrap">
                <Lock size={16} className="login-field-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-field-input"
                  placeholder="••••••••"
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
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  {t('login.logging_in') || 'กำลังเข้าสู่ระบบ…'}
                </>
              ) : (
                t('login.submit') || 'เข้าสู่ระบบ'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
