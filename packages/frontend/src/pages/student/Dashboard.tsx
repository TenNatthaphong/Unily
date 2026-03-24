import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAuthStore } from '../../stores/auth.store';
import { enrollmentApi } from '../../api/enrollment.api';
import { configApi } from '../../api/config.api';
import Timetable from '../../components/schedule/Timetable';
import type { Enrollment, SemesterConfig, Event } from '../../types';
import { 
  Award, CheckCircle2, CalendarDays, 
  Loader2, GraduationCap, ArrowUpRight, 
  MapPin, Clock 
} from 'lucide-react';
import './Dashboard.css';

export default function StudentDashboard() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [config, setConfig] = useState<SemesterConfig | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const confRes = await configApi.getCurrentSemester();
      setConfig(confRes.data);
      
      const yr = confRes.data?.academicYear;
      const sem = confRes.data?.semester;

      const [enrRes, eventRes] = await Promise.all([
        enrollmentApi.getMyEnrollments(yr, sem),
        configApi.getEvents()
      ]);
      setEnrollments(enrRes.data);
      setEvents(eventRes.data.slice(0, 4));
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="loading-state-premium">
        <Loader2 className="spin" size={40} />
        <p className="animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  const student = user?.studentProfile;
  const currentSemesterLabel = config ? `${config.semester}/${config.academicYear}` : 'N/A';
  const totalCredits = enrollments.reduce((sum, e) => sum + (e.section?.course?.credits || 0), 0);

  return (
    <div className="dashboard-premium animate-fade-in">
      {/* ── Summary Heroes ── */}
      <section className="dashboard-hero">
        <div className="card hero-card">
          <div className="hero-content">
            <div className="user-welcome">
              <span className="badge badge-info">{student?.studentCode}</span>
              <h1>{t('common.hello')}, <span>{user?.firstName} {user?.lastName}</span></h1>
              <div className="user-details">
                <span className="detail-item"><MapPin size={14} /> {student?.department?.nameTh}</span>
                <span className="detail-item">•</span>
                <span className="detail-item">Year {student?.year}</span>
              </div>
            </div>
            
            <div className="hero-stats">
              <div className="stat-giant">
                <span className="stat-label">{t('dashboard.gpax')}</span>
                <span className="stat-value">{student?.gpax.toFixed(2) || '0.00'}</span>
                <div className="stat-trend positive"><ArrowUpRight size={14} /> +0.05</div>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-secondary">
                <div className="sub-stat">
                  <span className="stat-label">{t('dashboard.credits_earned')}</span>
                  <span className="stat-value small">{student?.cs || 0} / 128</span>
                </div>
                <div className="progress-bar-mini">
                  <div className="progress-fill" style={{ width: `${((student?.cs || 0) / 128) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-decoration">
            <GraduationCap className="hero-bg-icon" />
          </div>
        </div>
      </section>

      <div className="dashboard-grid">
        {/* ── Left Column: Timetable ── */}
        <div className="column-timetable">
          <Timetable enrollments={enrollments} compact />
        </div>

        {/* ── Right Column: Info & Events ── */}
        <div className="column-info">
          
          {/* Current Term Info */}
          <div className="card term-info-card">
            <div className="card-header-compact">
              <Clock size={16} />
              <h4>{currentSemesterLabel}</h4>
            </div>
            <div className="term-body">
              <div className="term-stat-row">
                <span className="label">Registered Credits</span>
                <span className="val">{totalCredits}</span>
              </div>
              <div className="term-deadline-item">
                <div className="deadline-title">Registration Closes</div>
                <div className="deadline-date">{config ? new Date(config.regEnd).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>
            <button className="btn btn-primary pulse-hover">{t('nav.register')}</button>
          </div>

          {/* Academic Events */}
          <div className="card events-compact-card">
            <div className="card-header-compact">
              <CalendarDays size={16} />
              <h4>{t('dashboard.events_calendar')}</h4>
            </div>
            <div className="events-compact-list">
              {events.map(event => (
                <div key={event.id} className="event-row">
                  <div className={`event-dot cat-${event.category.toLowerCase()}`}></div>
                  <div className="event-info-compact">
                    <span className="title truncate">{event.title}</span>
                    <span className="date">{new Date(event.startDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {events.length === 0 && <div className="no-data-msg-compact">{t('common.no_data')}</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
