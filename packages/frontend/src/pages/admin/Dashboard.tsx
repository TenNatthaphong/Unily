import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAuthStore } from '../../stores/auth.store';
import { adminApi } from '../../api/admin.api';
import { configApi } from '../../api/config.api';
import type { SemesterConfig, Event } from '../../types';
import {
  ShieldAlert, Settings, FileUp, Calendar,
  Trash2, Plus, Clock, Loader2, AlertTriangle,
  Database, UserPlus, BookOpen, Layers, CalendarDays, MapPin, ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Dashboard.css';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isClosingSem, setIsClosingSem] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [confRes, evRes] = await Promise.all([
          configApi.getCurrentSemester(),
          configApi.getEvents()
        ]);
        setConfig(confRes.data);
        setEvents(evRes.data);
      } catch (err) {
        toast.error('Failed to load system state');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCloseSemester = async () => {
    if (!config) return;
    setIsClosingSem(true);
    toast.promise(adminApi.closeSemester(config.academicYear, config.semester), {
      loading: 'Closing semester & processing grades...',
      success: 'Semester closed successfully!',
      error: 'Failed to close semester'
    }).finally(() => setIsClosingSem(false));
  };

  const onImport = (type: 'users' | 'courses' | 'sections' | 'curriculums', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let promise;
    if (type === 'users') promise = adminApi.importUsersCsv(file);
    else if (type === 'courses') promise = adminApi.importCoursesCsv(file);
    else if (type === 'sections') promise = adminApi.importSectionsCsv(file);
    else promise = adminApi.importCurriculumCsv(file);

    toast.promise(promise, {
      loading: `Importing ${type}...`,
      success: `Successfully imported ${type}`,
      error: `Failed to import ${type}`
    });
  };

  if (isLoading) {
    return (
      <div className="loading-state-premium">
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
    <div className="admin-dashboard animate-fade-in">
      {/* ── Compact greeting ── */}
      <div className="dash-greeting">
        <div className="dash-greeting-left">
          <span className="dash-hello">{t('common.hello')}, <strong>{user?.firstName ?? 'Admin'}</strong></span>
          <span className="badge badge-danger">ADMIN</span>
        </div>
        <div className="dash-greeting-stats">
          <div className="dash-mini-stat">
            <span className="label">Term</span>
            <span className="val">{config ? `${config.semester}/${config.academicYear}` : '—'}</span>
          </div>
          <div className="dash-mini-stat">
            <span className="label">Status</span>
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
              <h2 className="dash-banner-title">System Control & Bulk Operations</h2>
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

      <div className="admin-grid">
        <div className="admin-main">
          {/* Current Semester Status */}
          <div className="card system-pulse-card glass-panel-premium">
            <div className="card-header">
              <Database size={20} />
              <h4>{t('nav.semester_config')}</h4>
              <span className={`status-badge-premium ${config?.isCurrent ? 'active' : ''}`}>
                {config?.isCurrent ? 'ACTIVE' : 'IDLE'}
              </span>
            </div>
            <div className="config-grid">
              <div className="config-item">
                <span className="config-label">Academic Term</span>
                <span className="config-value">{config?.semester}/{config?.academicYear}</span>
              </div>
              <div className="config-item">
                <span className="config-label">Registration Window</span>
                <span className="config-value">
                  {config ? new Date(config.regStart).toLocaleDateString() : 'N/A'} - {config ? new Date(config.regEnd).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Bulk Operations */}
          <div className="card bulk-ops-card mt-lg">
            <div className="card-header">
              <FileUp size={20} />
              <h4>Universal CSV Import</h4>
            </div>
            <div className="ops-stack">
              {/* Users Import */}
              <div className="op-row">
                <div className="op-info">
                  <UserPlus size={24} className="text-primary" />
                  <div className="op-text">
                    <h5>Bulk User Import</h5>
                    <p>Import students, professors, and admins</p>
                  </div>
                </div>
                <label className="btn btn-secondary shadow-indigo">
                  Select CSV
                  <input type="file" hidden accept=".csv" onChange={e => onImport('users', e)} />
                </label>
              </div>

              {/* Courses Import */}
              <div className="op-row">
                <div className="op-info">
                  <BookOpen size={24} className="text-success" />
                  <div className="op-text">
                    <h5>Bulk Course Import</h5>
                    <p>Populate university course catalog</p>
                  </div>
                </div>
                <label className="btn btn-secondary shadow-emerald">
                  Select CSV
                  <input type="file" hidden accept=".csv" onChange={e => onImport('courses', e)} />
                </label>
              </div>

              {/* Sections Import */}
              <div className="op-row">
                <div className="op-info">
                  <Layers size={24} className="text-amber" />
                  <div className="op-text">
                    <h5>Bulk Section Import</h5>
                    <p>Setup master schedule & section capacities</p>
                  </div>
                </div>
                <label className="btn btn-secondary shadow-amber">
                  Select CSV
                  <input type="file" hidden accept=".csv" onChange={e => onImport('sections', e)} />
                </label>
              </div>

              {/* Curriculum Import */}
              <div className="op-row">
                <div className="op-info">
                  <BookOpen size={24} className="text-indigo" />
                  <div className="op-text">
                    <h5>Bulk Curriculum Import</h5>
                    <p>Import academic curriculum structures</p>
                  </div>
                </div>
                <label className="btn btn-secondary shadow-indigo">
                  Select CSV
                  <input type="file" hidden accept=".csv" onChange={e => onImport('curriculums', e)} />
                </label>
              </div>
            </div>
          </div>

          {/* Critical Actions */}
          <div className="card critical-card mt-lg danger-border">
            <div className="card-header">
              <ShieldAlert size={20} className="text-danger" />
              <h4>System Maintenance</h4>
            </div>
            <div className="op-row danger-bg-soft">
              <div className="op-info">
                <AlertTriangle size={24} className="text-danger" />
                <div className="op-text">
                  <h5>{t('nav.semester_close')}</h5>
                  <p>Processing final grades & advancing terms.</p>
                </div>
              </div>
              <button
                className="btn btn-danger shadow-rose"
                onClick={handleCloseSemester}
                disabled={isClosingSem}
              >
                {isClosingSem ? <Loader2 className="spin" size={16} /> : <Clock size={16} />}
                Run Global Process
              </button>
            </div>
          </div>
        </div>

        <div className="admin-sidebar">
          <div className="card events-mgr-card">
            <div className="card-header">
              <Calendar size={20} />
              <h4>Global Events</h4>
              <button className="btn-icon circle-btn primary">
                <Plus size={16} />
              </button>
            </div>
            <div className="admin-events-list">
              {events.map(ev => (
                <div key={ev.id} className="admin-event-item">
                  <div className="event-main">
                    <span className="event-name">{ev.title}</span>
                    <span className="event-date font-xs text-muted">{new Date(ev.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="event-actions">
                    <button className="btn-icon delete"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
              {events.length === 0 && <div className="no-data-msg p-md text-center">No system events scheduled</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
