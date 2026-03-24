import { useMemo } from 'react';
import { useLocaleStore } from '../../stores/locale.store';
import type { DayOfWeek, Enrollment } from '../../types';
import './Timetable.css';

interface TimetableProps {
  enrollments: Enrollment[];
  compact?: boolean;
}

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_TH: Record<DayOfWeek, string> = {
  MON: 'จ', TUE: 'อ', WED: 'พ', THU: 'พฤ', FRI: 'ศ', SAT: 'ส', SUN: 'อา',
};
const DAY_EN: Record<DayOfWeek, string> = {
  MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun',
};

const START_HOUR = 7;
const END_HOUR = 20;
const MINUTE_WIDTH = 1.5; // px per minute
const HOUR_WIDTH = 60 * MINUTE_WIDTH;

export default function Timetable({ enrollments, compact = false }: TimetableProps) {
  const { locale } = useLocaleStore();

  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const getX = (t: string) => (timeToMinutes(t) - START_HOUR * 60) * MINUTE_WIDTH;
  const getW = (s: string, e: string) => (timeToMinutes(e) - timeToMinutes(s)) * MINUTE_WIDTH;

  const schedulesByDay = useMemo(() => {
    const map: Partial<Record<DayOfWeek, { schedule: { startTime: string; endTime: string }; courseCode: string; nameTh: string; nameEn: string; professor: string; sectionNo: number }[]>> = {};
    enrollments.forEach(enr => {
      const sec = enr.section;
      if (!sec?.schedules) return;
      sec.schedules.forEach(sch => {
        if (!map[sch.dayOfWeek]) map[sch.dayOfWeek] = [];
        map[sch.dayOfWeek]!.push({
          schedule: sch,
          courseCode: sec.course?.courseCode || '',
          nameTh: sec.course?.nameTh || '',
          nameEn: sec.course?.nameEn || '',
          professor: sec.professor?.user ? `${sec.professor.user.firstName}` : '',
          sectionNo: sec.sectionNo,
        });
      });
    });
    return map;
  }, [enrollments]);

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const rowH = compact ? 56 : 72;

  return (
    <div className={`timetable-container card ${compact ? 'compact' : ''}`}>
      <div className="timetable-scroll-area">
        <div className="timetable-grid-horizontal" style={{ minWidth: hours.length * HOUR_WIDTH + 60 }}>
          {/* Time header */}
          <div className="timetable-time-header">
            <div className="day-label-column spacer" />
            {hours.map(h => (
              <div key={h} className="time-column-header" style={{ width: HOUR_WIDTH }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>
          {/* Rows */}
          <div className="timetable-rows">
            {DAYS.map(day => (
              <div key={day} className="timetable-day-row" style={{ minHeight: rowH }}>
                <div className="day-label-column">
                  <span className="day-name">{locale === 'th' ? DAY_TH[day] : DAY_EN[day]}</span>
                </div>
                <div className="day-content-area">
                  <div className="grid-lines-overlay">
                    {hours.map(h => <div key={h} className="grid-line" style={{ width: HOUR_WIDTH }} />)}
                  </div>
                  {schedulesByDay[day]?.map((item, idx) => (
                    <div key={idx} className={`timetable-item h-mode day-${day.toLowerCase()}`}
                      style={{ left: getX(item.schedule.startTime), width: Math.max(getW(item.schedule.startTime, item.schedule.endTime) - 4, 40) }}>
                      <div className="timetable-item-inner">
                        <div className="item-header">
                          <span className="course-code">{item.courseCode}</span>
                          <span className="course-time">{item.schedule.startTime}–{item.schedule.endTime}</span>
                        </div>
                        <p className="course-name">
                          {locale === 'th' ? item.nameTh : (item.nameEn || item.nameTh)}
                        </p>
                        <div className="item-footer">
                          <span>{item.professor}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
