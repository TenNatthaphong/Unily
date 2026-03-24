import { useState, useEffect } from 'react';
import { sectionApi } from '../../api/section.api';
import { configApi } from '../../api/config.api';
import type { Section, SemesterConfig } from '../../types';
import { CalendarDays, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Schedule.css';

const DAY_COLORS: Record<string, string> = {
  MON: '#FBBF24', TUE: '#F472B6', WED: '#34D399',
  THU: '#FB923C', FRI: '#60A5FA', SAT: '#A78BFA', SUN: '#F87171',
};
const DAY_LABELS: Record<string, string> = {
  MON: 'จันทร์', TUE: 'อังคาร', WED: 'พุธ',
  THU: 'พฤหัส', FRI: 'ศุกร์', SAT: 'เสาร์', SUN: 'อาทิตย์',
};
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 07:00-19:00

function parseTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h + m / 60;
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
      } catch { toast.error('Failed to load schedule'); }
      finally { setIsLoading(false); }
    }
    load();
  }, []);

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

      <div className="timetable-wrapper card">
        <div className="timetable-grid" style={{ gridTemplateColumns: `60px repeat(${DAYS.length}, 1fr)` }}>
          {/* Header */}
          <div className="tt-header-cell"></div>
          {DAYS.map(d => (
            <div key={d} className="tt-header-cell" style={{ borderBottom: `3px solid ${DAY_COLORS[d]}` }}>
              {DAY_LABELS[d]}
            </div>
          ))}

          {/* Time rows */}
          {HOURS.map(h => (
            <>
              <div key={`t-${h}`} className="tt-time-cell">{String(h).padStart(2, '0')}:00</div>
              {DAYS.map(d => {
                const blocks = sections.flatMap(s =>
                  (s.schedules || []).filter(sc => sc.dayOfWeek === d && parseTime(sc.startTime) === h).map(sc => ({ sc, s }))
                );
                return (
                  <div key={`${d}-${h}`} className="tt-cell">
                    {blocks.map(({ sc, s }) => (
                      <div key={sc.id} className="tt-block"
                        style={{ background: `${DAY_COLORS[d]}22`, borderLeft: `3px solid ${DAY_COLORS[d]}` }}>
                        <div className="tt-block-code">{s.course?.courseCode}</div>
                        <div className="tt-block-sec">Sec.{s.sectionNo}</div>
                        <div className="tt-block-time">{sc.startTime}–{sc.endTime}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
