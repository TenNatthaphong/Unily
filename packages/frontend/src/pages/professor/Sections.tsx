import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sectionApi } from '../../api/section.api';
import { configApi } from '../../api/config.api';
import type { Section, SemesterConfig } from '../../types';
import { BookOpen, Loader2, ClipboardList, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Sections.css';

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
      } catch { toast.error('Failed to load sections'); }
      finally { setIsLoading(false); }
    }
    load();
  }, []);

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
      <div className="page-header">
        <div className="page-title">
          <BookOpen size={24} />
          <div>
            <h1>กลุ่มเรียนของฉัน</h1>
            {config && <p className="subtitle">ภาคเรียนที่ {config.semester}/{config.academicYear}</p>}
          </div>
        </div>
      </div>

      <div className="sections-grid">
        {sections.map(s => (
          <div key={s.id} className="section-card card">
            <div className="section-header">
              <div>
                <span className="badge">{s.course?.courseCode}</span>
                <span className="section-no"> Sec.{s.sectionNo}</span>
              </div>
              <span className={`status-dot ${getCapacityClass(s)}`} />
            </div>
            <h3 className="section-course-name">{s.course?.nameTh}</h3>
            <p className="section-course-en">{s.course?.nameEn}</p>

            <div className="section-schedule">
              {s.schedules?.map(sc => (
                <span key={sc.id} className="schedule-tag">{sc.dayOfWeek} {sc.startTime}–{sc.endTime}</span>
              ))}
            </div>

            <div className="capacity-info">
              <span>นักศึกษา: {s.enrolledCount}/{s.capacity}</span>
              <div className="capacity-bar">
                <div className={`capacity-fill ${getCapacityClass(s)}`}
                  style={{ width: `${Math.min(100, getCapacityRatio(s) * 100)}%` }} />
              </div>
            </div>

            <div className="section-actions">
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/professor/section/${s.id}/grading`)}>
                <ClipboardList size={14} /> กรอกเกรด
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/professor/section/${s.id}/students`)}>
                <Users size={14} /> นักศึกษา
              </button>
            </div>
          </div>
        ))}
        {sections.length === 0 && (
          <div className="empty-state"><BookOpen size={48} /><p>ไม่มีกลุ่มเรียนในภาคเรียนนี้</p></div>
        )}
      </div>
    </div>
  );
}
