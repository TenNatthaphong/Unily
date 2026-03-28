import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../../i18n/useTranslation';
import { useAuthStore } from '../../stores/auth.store';
import { enrollmentApi } from '../../api/enrollment.api';
import { configApi } from '../../api/config.api';
import Timetable from '../../components/schedule/Timetable';
import type { Enrollment, SemesterConfig, Event } from '../../types';
import { CalendarDays, MapPin, ChevronRight, Loader2, GraduationCap } from 'lucide-react';
import './Dashboard.css';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

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

export default function StudentDashboard() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [config, setConfig] = useState<SemesterConfig | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const semsRes = await configApi.getPublicSemesters();
      const sems: SemesterConfig[] = semsRes.data ?? [];
      const current = sems.find((s: SemesterConfig) => s.isCurrent)
        ?? sems.sort((a: SemesterConfig, b: SemesterConfig) =>
            b.academicYear !== a.academicYear ? b.academicYear - a.academicYear : b.semester - a.semester
          )[0];
      if (!current) { setIsLoading(false); return; }
      setConfig(current);
      const [enrRes, eventRes] = await Promise.all([
        enrollmentApi.getMyEnrollments(current.academicYear, current.semester),
        configApi.getEvents(),
      ]);
      setEnrollments(enrRes.data.filter((e: any) => e.status !== 'DROPPED'));
      setEvents(eventRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (isLoading) return <div className="loading-state-premium"><Loader2 className="spin" size={40} /></div>;

  const student = user?.studentProfile;
  const featuredEvent = events.find(e => e.imgUrl) || events[0];

  // Build calendar items: semester key dates + upcoming events
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
    <div className="dashboard-premium">
      {/* ── Compact greeting ── */}
      <motion.div className="dash-greeting" {...fadeUp(0)}>
        <div className="dash-greeting-left">
          <span className="dash-hello">{t('common.hello')}, <strong>{user?.firstName}</strong></span>
          {student?.studentCode && <span className="badge badge-info">{student.studentCode}</span>}
          {student?.status === 'GRADUATED' && <span className="badge badge-graduated">🎓 สำเร็จการศึกษา</span>}
        </div>
        <div className="dash-greeting-stats">
          <div className="dash-mini-stat">
            <span className="label">GPAX</span>
            <span className="val">{student?.gpax?.toFixed(2) || '—'}</span>
          </div>
          <div className="dash-mini-stat">
            <span className="label">Credits</span>
            <span className="val">{student?.cs || 0}</span>
          </div>
          <div className="dash-progress-bar">
            <div className="dash-progress-fill" style={{ width: `${Math.min(((student?.cs || 0) / 128) * 100, 100)}%` }} />
          </div>
        </div>
      </motion.div>

      {/* ── Event Banner 70/30 ── */}
      <motion.div className="dash-event-panel" {...fadeUp(0.08)}>
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
      </motion.div>

      {/* ── Timetable full width ── */}
      <motion.div className="dash-timetable-section" {...fadeUp(0.16)}>
        <div className="dash-section-title">
          <GraduationCap size={18} />
          <span>ตารางเรียน — ภาคเรียน {config?.semester}/{config?.academicYear}</span>
        </div>
        <Timetable enrollments={enrollments} fitWidth compact />
      </motion.div>
    </div>
  );
}
