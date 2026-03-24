import { useState, useEffect, useMemo } from 'react';
import { sectionApi } from '../../api/section.api';
import { configApi } from '../../api/config.api';
import type { Section, SemesterConfig, Enrollment } from '../../types';
import { CalendarDays, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Timetable from '../../components/schedule/Timetable';
import './Schedule.css';

/**
 * Convert Section[] → Enrollment[] shape that Timetable expects.
 * Timetable reads: enr.section.schedules, enr.section.course, enr.section.professor
 */
function sectionsToEnrollments(sections: Section[]): Enrollment[] {
  return sections.map(s => ({
    id: s.id,
    sectionId: s.id,
    studentId: '',
    section: s,
  } as unknown as Enrollment));
}

export default function ProfessorSchedule() {
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
        toast.error('Failed to load schedule');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const enrollments = useMemo(() => sectionsToEnrollments(sections), [sections]);

  if (isLoading) return <div className="loading-state"><Loader2 className="spin" size={40} /></div>;

  return (
    <div className="prof-schedule animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <CalendarDays size={24} />
          <div>
            <h1>ตารางสอน</h1>
            {config && <p className="subtitle">ภาคเรียนที่ {config.semester}/{config.academicYear}</p>}
          </div>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="card no-data-msg" style={{ padding: '48px', textAlign: 'center' }}>
          ไม่มีรายวิชาที่สอนในภาคเรียนนี้
        </div>
      ) : (
        <Timetable enrollments={enrollments} />
      )}
    </div>
  );
}
