import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useAuthStore } from '../../stores/auth.store';
import { professorApi } from '../../api/professor.api';
import { configApi } from '../../api/config.api';
import Timetable from '../../components/schedule/Timetable';
import type { Section, Enrollment, SemesterConfig, Event } from '../../types';
import { Users, BookOpen, Clock, Loader2, ChevronRight, CalendarDays, MapPin } from 'lucide-react';
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

export default function ProfessorDashboard() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const [sections, setSections] = useState<Section[]>([]);
  const [config, setConfig] = useState<SemesterConfig | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const confRes = await configApi.getCurrentSemester();
      setConfig(confRes.data);
      const yr = confRes.data?.academicYear;
      const sem = confRes.data?.semester;

      const [secRes, eventRes] = await Promise.all([
        professorApi.getMySections(yr, sem),
        configApi.getEvents(),
      ]);
      setSections(secRes.data);
      setEvents(eventRes.data);
    } catch (err) {
      console.error('Failed to fetch professor dashboard data', err);
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
      </div>
    );
  }

  // Pre-process sections for the Timetable component (needs Enrollment[] format)
  const mockEnrollmentsForTimetable: Enrollment[] = sections.flatMap(sec =>
    sec.schedules?.map(sch => ({
      id: `${sec.id}-${sch.id}`,
      studentId: '',
      sectionId: sec.id,
      section: { ...sec, schedules: [sch] },
      status: 'ENROLLED' as any,
      academicYear: sec.academicYear,
      semester: sec.semester,
      midtermScore: 0,
      finalScore: 0,
      totalScore: 0,
      grade: undefined,
    } as unknown as Enrollment)) || []
  );

  const totalStudents = sections.reduce((sum, s) => sum + s.enrolledCount, 0);
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
    <div className="professor-dashboard animate-fade-in">
      {/* ── Compact greeting ── */}
      <div className="dash-greeting">
        <div className="dash-greeting-left">
          <span className="dash-hello">{t('common.hello')}, <strong>{user?.firstName}</strong></span>
          <span className="badge">PROFESSOR</span>
        </div>
        <div className="dash-greeting-stats">
          <div className="dash-mini-stat">
            <span className="label">Sections</span>
            <span className="val">{sections.length}</span>
          </div>
          <div className="dash-mini-stat">
            <span className="label">Students</span>
            <span className="val">{totalStudents}</span>
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

      {/* ── Stats cards ── */}
      <div className="dashboard-stats">
        <div className="card stat-card">
          <div className="stat-icon info"><BookOpen size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Assigned Sections</span>
            <span className="stat-value">{sections.length}</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon success"><Users size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Total Students</span>
            <span className="stat-value">{totalStudents}</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon warning"><Clock size={24} /></div>
          <div className="stat-content">
            <span className="stat-label">Teaching Hours/Week</span>
            <span className="stat-value">12 hrs</span>
          </div>
        </div>
      </div>

      {/* ── Teaching schedule + Sections list ── */}
      <div className="dashboard-main">
        <div className="dashboard-content-left">
          <div className="dash-section-title mb-md">
            <Clock size={16} />
            <span>{t('nav.teaching_schedule')} — ภาคเรียน {config?.semester}/{config?.academicYear}</span>
          </div>
          <Timetable enrollments={mockEnrollmentsForTimetable} fitWidth />
        </div>

        <div className="dashboard-content-right">
          <div className="card sections-list-card">
            <div className="card-header">
              <Users size={20} />
              <h4>Active Sections</h4>
            </div>
            <div className="sections-list-compact">
              {sections.map(sec => (
                <div key={sec.id} className="compact-section-item">
                  <div className="section-info">
                    <span className="course-code">{sec.course?.courseCode}</span>
                    <p className="course-name">{sec.course?.nameTh}</p>
                    <div className="section-meta">
                      <span>Sec {sec.sectionNo}</span>
                      <span>•</span>
                      <span>{sec.enrolledCount} {t('enrollment.capacity')}</span>
                    </div>
                  </div>
                  <button className="btn-icon">
                    <ChevronRight size={18} />
                  </button>
                </div>
              ))}
              {sections.length === 0 && <div className="no-data-msg">No assigned sections</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
