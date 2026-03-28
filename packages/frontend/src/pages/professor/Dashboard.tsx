import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import { useAuthStore } from '../../stores/auth.store';
import { professorApi } from '../../api/professor.api';
import { configApi } from '../../api/config.api';
import Timetable from '../../components/schedule/Timetable';
import type { Section, Enrollment, SemesterConfig, Event } from '../../types';
import { Users, BookOpen, Clock, Loader2, ChevronRight, CalendarDays, MapPin, ClipboardList } from 'lucide-react';
import './Dashboard.css';

function calcWeeklyHours(sections: Section[]): number {
  let total = 0;
  for (const sec of sections) {
    for (const sch of sec.schedules ?? []) {
      const [sh, sm] = sch.startTime.split(':').map(Number);
      const [eh, em] = sch.endTime.split(':').map(Number);
      total += (eh + em / 60) - (sh + sm / 60);
    }
  }
  return Math.round(total * 10) / 10;
}

const DAY_TH: Record<string, string> = {
  MON: 'จ', TUE: 'อ', WED: 'พ', THU: 'พฤ', FRI: 'ศ', SAT: 'ส', SUN: 'อา',
};

function calcTermHours(sections: Section[], config: SemesterConfig | null): number {
  const weekly = calcWeeklyHours(sections);
  if (!config?.startDate || !config?.endDate) return weekly;
  const weeks = Math.round(
    (new Date(config.endDate).getTime() - new Date(config.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)
  );
  return Math.round(weekly * weeks * 10) / 10;
}

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
  const navigate = useNavigate();
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
            <span className="stat-label">ชั่วโมงสอน/เทอม</span>
            <span className="stat-value">{calcTermHours(sections, config)} <small>hrs</small></span>
          </div>
        </div>
      </div>

      {/* ── Timetable (full width) ── */}
      <div className="dash-block">
        <div className="dash-block-header">
          <Clock size={16} />
          <span>ตารางสอน — ภาคเรียน {config?.semester}/{config?.academicYear}</span>
        </div>
        {sections.length === 0
          ? <div className="card dash-empty">ไม่มีรายวิชาที่สอนในภาคเรียนนี้</div>
          : <Timetable enrollments={mockEnrollmentsForTimetable} fitWidth compact />
        }
      </div>

      {/* ── Section cards ── */}
      <div className="dash-block">
        <div className="dash-block-header">
          <ClipboardList size={16} />
          <span>กลุ่มเรียน</span>
        </div>
        <div className="dash-sections-grid">
          {sections.map(sec => {
            const ratio = sec.enrolledCount / sec.capacity;
            const capCls = ratio >= 1 ? 'danger' : ratio >= 0.7 ? 'warning' : 'success';
            return (
              <div key={sec.id} className="card dash-sec-card">
                <div className="dash-sec-top">
                  <div>
                    <span className="badge">{sec.course?.courseCode}</span>
                    <span className="dash-sec-no">Sec.{sec.sectionNo}</span>
                  </div>
                  <span className={`status-dot ${capCls}`} />
                </div>
                <p className="dash-sec-name">{sec.course?.nameTh}</p>
                <p className="dash-sec-en">{sec.course?.nameEn}</p>
                <div className="dash-sec-schedules">
                  {sec.schedules?.map(sc => (
                    <span key={sc.id} className={`sched-day-tag day-${sc.dayOfWeek.toLowerCase()}`}>
                      <span className="sched-day-pill">{DAY_TH[sc.dayOfWeek]}</span>
                      {sc.startTime}–{sc.endTime}
                    </span>
                  ))}
                </div>
                <div className="dash-cap-row">
                  <span>นักศึกษา</span>
                  <span className="dash-cap-count">{sec.enrolledCount}/{sec.capacity}</span>
                </div>
                <div className="capacity-bar">
                  <div className={`capacity-fill ${capCls}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                </div>
                <button
                  className="btn btn-primary btn-sm dash-sec-btn"
                  onClick={() => navigate(`/professor/section/${sec.id}`, { state: { section: sec } })}
                >
                  ดูรายละเอียด <ChevronRight size={14} />
                </button>
              </div>
            );
          })}
          {sections.length === 0 && (
            <div className="dash-empty-grid">
              <BookOpen size={40} />
              <p>ไม่มีกลุ่มเรียน</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
