import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAuthStore } from '../../stores/auth.store';
import { adminApi } from '../../api/admin.api';
import { configApi } from '../../api/config.api';
import type { SemesterConfig, Event, AuditLog } from '../../types';
import {
  Settings, Calendar,
  Trash2, Plus, Loader2,
  CalendarDays, MapPin, ChevronRight, ScrollText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Dashboard.css';

const ACTION_TH: Record<string, string> = { CREATE: 'สร้าง', UPDATE: 'แก้ไข', DELETE: 'ลบ' };

const CATEGORY_COLOR: Record<string, string> = {
  GENERAL: 'var(--text-muted)',
  ACADEMIC: 'var(--primary)',
  EXAM: 'var(--danger)',
  HOLIDAY: 'var(--success)',
  ACTIVITY: 'var(--warning)',
};
const CATEGORY_TH: Record<string, string> = {
  GENERAL: 'ทั่วไป', ACADEMIC: 'วิชาการ', EXAM: 'สอบ', HOLIDAY: 'วันหยุด', ACTIVITY: 'กิจกรรม',
};

interface CalendarItem {
  label: string;
  date: string;
  type: 'semester' | 'event';
  color: string;
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const [config, setConfig] = useState<SemesterConfig | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [confRes, evRes, logRes] = await Promise.all([
          configApi.getCurrentSemester(),
          configApi.getEvents(),
          adminApi.getAuditLogs({ limit: 5, page: 1 }),
        ]);
        setConfig(confRes.data);
        setEvents(evRes.data);
        setAuditLogs(logRes.data.data ?? []);
      } catch (err) {
        toast.error('โหลดข้อมูลไม่สำเร็จ');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-state">
        <Loader2 className="spin" size={40} />
      </div>
    );
  }

  const featuredEvent = events.find(e => e.imgUrl) || events[0];

  // Build calendar items
  const calItems: CalendarItem[] = [];
  if (config) {
    calItems.push({ label: 'เปิดลงทะเบียน', date: config.regStart, type: 'semester', color: 'var(--primary)' });
    calItems.push({ label: 'ปิดลงทะเบียน', date: config.regEnd, type: 'semester', color: 'var(--danger)' });
    calItems.push({ label: 'เพิกถอนได้ถึง', date: config.withdrawEnd, type: 'semester', color: 'var(--warning)' });
  }
  events.slice(0, 4).forEach(ev => {
    calItems.push({ label: ev.title, date: ev.startDate, type: 'event', color: CATEGORY_COLOR[ev.category] || 'var(--text-muted)' });
  });
  calItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="admin-dashboard">
      {/* ── Compact greeting ── */}
      <div className="dash-greeting">
        <div className="dash-greeting-left">
          <span className="dash-hello">{t('common.hello')}, <strong>{user?.firstName ?? 'Admin'}</strong></span>
          <span className="badge badge-danger">ADMIN</span>
        </div>
        <div className="dash-greeting-stats">
          <div className="dash-mini-stat">
            <span className="label">เทอม</span>
            <span className="val">{config ? `${config.semester}/${config.academicYear}` : '—'}</span>
          </div>
          <div className="dash-mini-stat">
            <span className="label">สถานะ</span>
            <span className="val" style={{ color: config?.isCurrent ? 'var(--success)' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800 }}>
              {config?.isCurrent ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Event Banner 70/30 ── */}
      <div className="dash-event-panel">
        {/* 70% – Featured banner */}
        <div
          className="dash-banner"
          style={featuredEvent?.imgUrl ? { backgroundImage: `url(${featuredEvent.imgUrl})` } : undefined}
        >
          {!featuredEvent?.imgUrl && <div className="dash-banner-gradient" />}
          <div className="dash-banner-overlay" />
          {featuredEvent ? (
            <div className="dash-banner-content">
              <span className="dash-banner-cat" style={{ background: CATEGORY_COLOR[featuredEvent.category] }}>
                {CATEGORY_TH[featuredEvent.category] || featuredEvent.category}
              </span>
              <h2 className="dash-banner-title">{featuredEvent.title}</h2>
              {featuredEvent.description && <p className="dash-banner-desc">{featuredEvent.description}</p>}
              <div className="dash-banner-meta">
                <CalendarDays size={14} />
                <span>{new Date(featuredEvent.startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {featuredEvent.location && <><MapPin size={14} /><span>{featuredEvent.location}</span></>}
              </div>
            </div>
          ) : (
            <div className="dash-banner-content">
              <h2 className="dash-banner-title">ยินดีต้อนรับสู่ระบบ Unily</h2>
            </div>
          )}
        </div>

        {/* 30% – Mini calendar */}
        <div className="dash-calendar card">
          <div className="dash-cal-header">
            <CalendarDays size={16} />
            <span>ปฏิทินกิจกรรม</span>
            <span className="badge">{config?.semester}/{config?.academicYear}</span>
          </div>
          <div className="dash-cal-list">
            {calItems.map((item, i) => (
              <div key={i} className="dash-cal-item">
                <div className="dash-cal-dot" style={{ background: item.color }} />
                <div className="dash-cal-info">
                  <span className="dash-cal-label">{item.label}</span>
                  <span className="dash-cal-date">
                    {new Date(item.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                {item.type === 'event' && <ChevronRight size={12} className="dash-cal-arrow" />}
              </div>
            ))}
            {calItems.length === 0 && <div className="no-data-msg-compact">ไม่มีกิจกรรม</div>}
          </div>
        </div>
      </div>

      {/* ── Recent Activity ── */}
      <div className="section-header">
        <div className="section-title">
          <ScrollText size={18} />
          <h4>กิจกรรมล่าสุด</h4>
        </div>
        <a href="/admin/audit-log" className="view-all-link">ดูทั้งหมด</a>
      </div>
      <div className="card admin-audit-card">
        <table className="admin-audit-table">
          <thead><tr><th>แอดมิน</th><th>กิจกรรม</th><th>เป้าหมาย</th><th>เวลา</th></tr></thead>
          <tbody>
            {auditLogs.map(log => (
              <tr key={log.id}>
                <td>{log.adminName}</td>
                <td><span className={`action-badge action-${log.action.toLowerCase()}`}>{ACTION_TH[log.action] ?? log.action}</span></td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>{log.target}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(log.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</td>
              </tr>
            ))}
            {auditLogs.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>ไม่มีกิจกรรม</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
