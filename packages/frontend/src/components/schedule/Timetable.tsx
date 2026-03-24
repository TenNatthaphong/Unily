import { useMemo, useRef, useLayoutEffect, useState } from 'react';
import type { DayOfWeek, Enrollment } from '../../types';
import './Timetable.css';

interface TimetableProps {
  enrollments: Enrollment[];
  compact?: boolean;
  /** Auto-scale to fit container width — no horizontal scroll */
  fitWidth?: boolean;
  /** Section IDs to mark as "pending" (cart preview — dashed style) */
  pendingSectionIds?: Set<string>;
}

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const DAY_TH: Record<DayOfWeek, string> = {
  MON: 'จ', TUE: 'อ', WED: 'พ', THU: 'พฤ', FRI: 'ศ', SAT: 'ส', SUN: 'อา',
};

const BASE_MINUTE_WIDTH = 1.45; // compressed so 08:00–21:00 fits in most viewports
const MIN_MINUTE_WIDTH   = 0.75; // minimum allowed in fitWidth mode
const START_HOUR = 8;
const END_HOUR   = 21;                                  // ถึง 21:00 (3 ทุ่ม)
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;    // 780 min (08:00–21:00)
const DAY_LABEL_W  = 44;

export default function Timetable({ enrollments, compact = false, fitWidth = false, pendingSectionIds }: TimetableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [minuteWidth, setMinuteWidth] = useState(BASE_MINUTE_WIDTH);

  const hours = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i),
    []
  );
  // Extra boundary tick at END_HOUR (21:00) so the last column gets a closing line
  const hourBoundaries = useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i),
    []
  );

  // ── fitWidth: scale to container, no scroll ──────────────────────────────
  useLayoutEffect(() => {
    if (!fitWidth || !containerRef.current) return;
    const measure = () => {
      const w = containerRef.current!.clientWidth;
      const available = w - DAY_LABEL_W - 2; // 2px buffer
      const mw = available / TOTAL_MINUTES;
      setMinuteWidth(Math.max(MIN_MINUTE_WIDTH, mw));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [fitWidth]);

  const HOUR_WIDTH = 60 * minuteWidth;

  const timeToMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const getX = (t: string) => (timeToMin(t) - START_HOUR * 60) * minuteWidth;
  const getW = (s: string, e: string) => (timeToMin(e) - timeToMin(s)) * minuteWidth;

  // ── Build schedule map ────────────────────────────────────────────────────
  const schedulesByDay = useMemo(() => {
    const map: Partial<Record<DayOfWeek, {
      schedule: { startTime: string; endTime: string };
      courseCode: string;
      nameTh: string;
      nameEn: string;
      professor: string;
      sectionNo: number;
      pending: boolean;
    }[]>> = {};
    enrollments.forEach(enr => {
      const sec = enr.section;
      if (!sec?.schedules) return;
      sec.schedules.forEach(sch => {
        if (!map[sch.dayOfWeek]) map[sch.dayOfWeek] = [];
        map[sch.dayOfWeek]!.push({
          schedule: sch,
          courseCode: sec.course?.courseCode || '',
          nameTh:     sec.course?.nameTh    || '',
          nameEn:     sec.course?.nameEn    || '',
          professor:  sec.professor?.user ? `${sec.professor.user.firstName}` : '',
          sectionNo:  sec.sectionNo,
          pending:    pendingSectionIds?.has(enr.sectionId) ?? false,
        });
      });
    });
    return map;
  }, [enrollments]);

  // ── Only show days that have classes (+ always show Mon–Fri at least) ────
  const activeDays = useMemo(() => {
    const hasSat = !!schedulesByDay['SAT']?.length;
    const hasSun = !!schedulesByDay['SUN']?.length;
    return DAYS.filter(d => {
      if (d === 'SAT') return hasSat;
      if (d === 'SUN') return hasSun;
      return true; // Mon–Fri always shown
    });
  }, [schedulesByDay]);

  // compact = dashboard-style fill; non-compact = hug content, taller row
  const rowH      = compact ? 44 : 68;
  const veryTight = minuteWidth < 1.1; // squeeze label text

  // ── Choose how many hour-tick labels to show based on zoom ───────────────
  const hourStep = minuteWidth < 1.0 ? 2 : 1; // show every 2 hrs when tight

  return (
    <div
      ref={containerRef}
      className={`timetable-container card ${compact ? 'compact' : ''} ${fitWidth ? 'fit-width' : ''}`}
    >
      <div className={fitWidth ? 'timetable-fit-area' : 'timetable-scroll-area'}>
        <div
          className="timetable-grid-horizontal"
          style={fitWidth ? { width: '100%' } : { minWidth: hours.length * HOUR_WIDTH + DAY_LABEL_W + 8 }}
        >
          {/* ── Time header ─────────────────────────────────── */}
          <div className="timetable-time-header">
            <div className="day-label-column spacer" style={{ width: DAY_LABEL_W, minWidth: DAY_LABEL_W }} />
            <div className="time-header-track" style={{ flex: 1, position: 'relative', height: 32 }}>
              {hourBoundaries.map((h, i) => {
                const isEnd = i === hourBoundaries.length - 1;
                if (!isEnd && i % hourStep !== 0) return null;
                return (
                  <div
                    key={h}
                    className="time-tick"
                    style={{ left: i * HOUR_WIDTH, width: isEnd ? 0 : HOUR_WIDTH * hourStep }}
                  >
                    <span className={veryTight ? 'time-tick-label tight' : 'time-tick-label'}>
                      {String(h).padStart(2, '0')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Day rows ────────────────────────────────────── */}
          <div className="timetable-rows">
            {activeDays.map(day => (
              <div key={day} className="timetable-day-row" style={{ height: rowH }}>
                <div className="day-label-column" style={{ width: DAY_LABEL_W, minWidth: DAY_LABEL_W }}>
                  <span className="day-name">{DAY_TH[day]}</span>
                </div>
                <div className="day-content-area">
                  {/* grid lines — hourBoundaries includes END_HOUR to close the last column */}
                  <div className="grid-lines-overlay" aria-hidden>
                    {hourBoundaries.map((_, i) => (
                      <div key={i} className="grid-line" style={{ left: i * HOUR_WIDTH, width: HOUR_WIDTH }} />
                    ))}
                  </div>

                  {/* course items */}
                  {schedulesByDay[day]?.map((item, idx) => {
                    const x = getX(item.schedule.startTime);
                    const w = Math.max(getW(item.schedule.startTime, item.schedule.endTime) - 3, 24);
                    const showName = !compact && w > 48;
                    const showTime = w > 50;
                    const showProf = !compact && !!item.professor && w > 64;
                    return (
                      <div
                        key={idx}
                        className={`timetable-item h-mode ${compact ? 'fill' : 'hug'} day-${day.toLowerCase()} ${item.pending ? 'pending' : ''}`}
                        style={{ left: x, width: w }}
                        title={`${item.courseCode} — ${item.nameTh} | ${item.schedule.startTime}–${item.schedule.endTime}`}
                      >
                        <div className="timetable-item-inner">
                          <div className="item-header">
                            <span className="course-code">{item.courseCode}</span>
                            {showTime && (
                              <span className="course-time">{item.schedule.startTime}–{item.schedule.endTime}</span>
                            )}
                          </div>
                          {showName && (
                            <p className="course-name">{item.nameTh || item.nameEn}</p>
                          )}
                          {showProf && (
                            <div className="item-footer">{item.professor}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
