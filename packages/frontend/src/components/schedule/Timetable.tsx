import { useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { DayOfWeek, Enrollment } from '../../types';
import './Timetable.css';

interface TimetableProps {
  enrollments: Enrollment[];
}

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const START_HOUR = 8;
const END_HOUR = 21;
const MINUTE_WIDTH = 2; // 2px per minute = 120px per hour
const HOUR_WIDTH = 60 * MINUTE_WIDTH;

export default function Timetable({ enrollments }: TimetableProps) {
  const { t } = useTranslation();

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const getPositionX = (time: string) => {
    const totalMinutes = timeToMinutes(time);
    const startOffset = START_HOUR * 60;
    return (totalMinutes - startOffset) * MINUTE_WIDTH;
  };

  const getWidth = (start: string, end: string) => {
    return (timeToMinutes(end) - timeToMinutes(start)) * MINUTE_WIDTH;
  };

  // Pre-process schedules from enrollments
  const schedulesByDay = useMemo(() => {
    const map: Partial<Record<DayOfWeek, any[]>> = {};
    
    enrollments.forEach(enr => {
      const sec = enr.section;
      if (!sec || !sec.schedules) return;

      sec.schedules.forEach(sch => {
        if (!map[sch.dayOfWeek]) map[sch.dayOfWeek] = [];
        map[sch.dayOfWeek]!.push({
          schedule: sch,
          sectionNo: sec.sectionNo,
          courseCode: sec.course?.courseCode || 'N/A',
          courseName: sec.course?.nameTh || 'N/A',
          professor: sec.professor?.user?.firstName || 'N/A'
        });
      });
    });

    return map;
  }, [enrollments]);

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  return (
    <div className="timetable-container card animate-fade-in">
      <div className="timetable-header">
        <h3 className="timetable-title">{t('dashboard.weekly_schedule')}</h3>
        <div className="timetable-legend">
          <span className="legend-item"><div className="dot study"></div> {t('common.study')}</span>
          <span className="legend-item"><div className="dot exam"></div> {t('common.exam')}</span>
        </div>
      </div>

      <div className="timetable-scroll-area">
        <div className="timetable-grid-horizontal" style={{ minWidth: (END_HOUR - START_HOUR + 1) * HOUR_WIDTH + 100 }}>
          
          {/* Top Time Labels */}
          <div className="timetable-time-header">
            <div className="day-label-column spacer"></div>
            {hours.map(h => (
              <div key={h} className="time-column-header" style={{ width: HOUR_WIDTH }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Table Body (Rows per Day) */}
          <div className="timetable-rows">
            {DAYS.map(day => (
              <div key={day} className="timetable-day-row">
                <div className="day-label-column">
                  <span className="day-name">{day}</span>
                </div>
                
                <div className="day-content-area">
                  {/* Grid background lines */}
                  <div className="grid-lines-overlay">
                    {hours.map(h => (
                      <div key={h} className="grid-line" style={{ width: HOUR_WIDTH }}></div>
                    ))}
                    {/* Lunch Highlight (12:00) */}
                    <div 
                      className="lunch-marker" 
                      style={{ left: getPositionX('12:00'), width: HOUR_WIDTH }}
                    ></div>
                  </div>

                  {/* Course Items */}
                  {schedulesByDay[day]?.map((item, idx) => (
                    <div
                      key={`${day}-${idx}`}
                      className={`timetable-item h-mode day-${day.toLowerCase()}`}
                      style={{
                        left: getPositionX(item.schedule.startTime),
                        width: getWidth(item.schedule.startTime, item.schedule.endTime),
                      }}
                    >
                      <div className="timetable-item-inner">
                        <div className="item-header">
                          <span className="course-code">{item.courseCode}</span>
                          <span className="course-time">{item.schedule.startTime}-{item.schedule.endTime}</span>
                        </div>
                        <p className="course-name">{item.courseName}</p>
                        <div className="item-footer">
                          <span>Sec {item.sectionNo}</span>
                          <span>•</span>
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
