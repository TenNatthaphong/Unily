import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { sectionApi } from '../../api/section.api';
import { configApi } from '../../api/config.api';
import type { Section, SemesterConfig, Enrollment } from '../../types';
import { BookOpen, CalendarDays, Clock, Users, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Timetable from '../../components/schedule/Timetable';
import './Sections.css';

function sectionsToEnrollments(sections: Section[]): Enrollment[] {
  return sections.map(s => ({
    id: s.id,
    sectionId: s.id,
    studentId: '',
    section: s,
  } as unknown as Enrollment));
}

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

export default function ProfessorSections() {
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [config, setConfig] = useState<SemesterConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const cfg = await configApi.getCurrentSemester();
        setConfig(cfg.data);
        const sec = await sectionApi.getMyTeaching(cfg.data.academicYear, cfg.data.semester);
        setSections(sec.data);
      } catch {
        toast.error('ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const enrollments  = useMemo(() => sectionsToEnrollments(sections), [sections]);
  const weeklyHours  = useMemo(() => calcWeeklyHours(sections), [sections]);
  const totalStudents = useMemo(() => sections.reduce((s, sec) => s + sec.enrolledCount, 0), [sections]);

  const getCapacityRatio = (s: Section) => s.enrolledCount / s.capacity;
  const getCapacityClass = (s: Section) => {
    const r = getCapacityRatio(s);
    if (r >= 1) return 'danger';
    if (r >= 0.7) return 'warning';
    return 'success';
  };

  if (isLoading) return <div className="loading-state"><Loader2 className="spin" size={40} /></div>;

  return (
    <div className="prof-sections animate-fade-in">

      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-title">
          <BookOpen size={24} />
          <div>
            <h1>รายวิชาที่สอน</h1>
            {config && <p className="subtitle">ภาคเรียนที่ {config.semester}/{config.academicYear}</p>}
          </div>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="teach-stats">
        <div className="teach-stat-card">
          <div className="teach-stat-icon"><BookOpen size={18} /></div>
          <div>
            <div className="teach-stat-value">{sections.length}</div>
            <div className="teach-stat-label">กลุ่มเรียน</div>
          </div>
        </div>
        <div className="teach-stat-card">
          <div className="teach-stat-icon"><Clock size={18} /></div>
          <div>
            <div className="teach-stat-value">{weeklyHours}</div>
            <div className="teach-stat-label">ชม./สัปดาห์</div>
          </div>
        </div>
        <div className="teach-stat-card">
          <div className="teach-stat-icon"><Users size={18} /></div>
          <div>
            <div className="teach-stat-value">{totalStudents}</div>
            <div className="teach-stat-label">นักศึกษาทั้งหมด</div>
          </div>
        </div>
      </div>

      {/* ── Timetable ── */}
      <div className="prof-block">
        <div className="block-header">
          <CalendarDays size={17} />
          <h2>ตารางสอน</h2>
        </div>
        {sections.length === 0 ? (
          <div className="card empty-timetable">ไม่มีรายวิชาในภาคเรียนนี้</div>
        ) : (
          <Timetable enrollments={enrollments} />
        )}
      </div>

      {/* ── Section Cards ── */}
      <div className="prof-block">
        <div className="block-header">
          <BookOpen size={17} />
          <h2>กลุ่มเรียน</h2>
        </div>
        <div className="sections-grid">
          {sections.map(s => (
            <div key={s.id} className="section-card card">
              <div className="section-header">
                <div className="section-title-row">
                  <span className="badge">{s.course?.courseCode}</span>
                  <span className="section-no">Sec.{s.sectionNo}</span>
                </div>
                <span className={`status-dot ${getCapacityClass(s)}`} />
              </div>

              <h3 className="section-course-name">{s.course?.nameTh}</h3>
              <p className="section-course-en">{s.course?.nameEn}</p>

              <div className="section-schedule">
                {s.schedules?.map(sc => (
                  <span key={sc.id} className="schedule-tag">
                    {sc.dayOfWeek} {sc.startTime}–{sc.endTime}
                  </span>
                ))}
              </div>

              <div className="capacity-info">
                <div className="capacity-row">
                  <span>นักศึกษา</span>
                  <span className="capacity-count">{s.enrolledCount}/{s.capacity}</span>
                </div>
                <div className="capacity-bar">
                  <div
                    className={`capacity-fill ${getCapacityClass(s)}`}
                    style={{ width: `${Math.min(100, getCapacityRatio(s) * 100)}%` }}
                  />
                </div>
              </div>

              <button
                className="btn btn-primary btn-sm section-detail-btn"
                onClick={() => navigate(`/professor/section/${s.id}`)}
              >
                ดูรายละเอียด <ChevronRight size={14} />
              </button>
            </div>
          ))}

          {sections.length === 0 && (
            <div className="empty-state">
              <BookOpen size={48} />
              <p>ไม่มีกลุ่มเรียนในภาคเรียนนี้</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
