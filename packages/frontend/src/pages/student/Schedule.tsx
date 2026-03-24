import { useState, useEffect } from 'react';
import { enrollmentApi } from '../../api/enrollment.api';
import { configApi } from '../../api/config.api';
import Timetable from '../../components/schedule/Timetable';
import type { Enrollment, SemesterConfig } from '../../types';
import { CalendarDays, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Schedule.css';

export default function StudentSchedule() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [config, setConfig] = useState<SemesterConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const cfg = await configApi.getCurrentSemester();
        setConfig(cfg.data);
        const enr = await enrollmentApi.getMyEnrollments(cfg.data.academicYear, cfg.data.semester);
        setEnrollments(enr.data.filter(e => e.status !== 'DROPPED'));
      } catch { toast.error('Failed to load schedule'); }
      finally { setIsLoading(false); }
    }
    load();
  }, []);

  if (isLoading) return <div className="loading-state"><Loader2 className="spin" size={40} /></div>;

  return (
    <div className="student-schedule animate-fade-in">
      <div className="page-header">
        <div className="page-title">
          <CalendarDays size={24} />
          <div>
            <h1>ตารางเรียน</h1>
            {config && <p className="subtitle">ภาคเรียนที่ {config.semester}/{config.academicYear}</p>}
          </div>
        </div>
      </div>
      <Timetable enrollments={enrollments} />
    </div>
  );
}
