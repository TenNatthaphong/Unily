import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { enrollmentApi } from '../../api/enrollment.api';
import { configApi } from '../../api/config.api';
import Timetable from '../../components/schedule/Timetable';
import type { Enrollment, SemesterConfig } from '../../types';
import { CalendarDays, Loader2, BookOpen, User, ChevronDown, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Schedule.css';

const GRADE_LABELS: Record<string, string> = {
  A: 'A', B_PLUS: 'B+', B: 'B', C_PLUS: 'C+', C: 'C', D_PLUS: 'D+', D: 'D', F: 'F',
};
const CATEGORY_TH: Record<string, string> = {
  GENERAL_EDUCATION: 'วิชาศึกษาทั่วไป',
  CORE_COURSE: 'วิชาแกน',
  REQUIRED_COURSE: 'วิชาบังคับ',
  MAJOR_ELECTIVE: 'วิชาเลือกสาขา',
  FREE_ELECTIVE: 'วิชาเลือกเสรี',
  COOP_COURSE: 'สหกิจศึกษา',
};

// ── Custom semester dropdown ────────────────────────────────────────────────
interface SemDropdownProps {
  semesters: SemesterConfig[];
  value: string;
  onChange: (id: string) => void;
}
function SemDropdown({ semesters, value, onChange }: SemDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = semesters.find(s => s.id === value);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="sem-dropdown" ref={ref}>
      <motion.button
        className="sem-dropdown-trigger"
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        aria-expanded={open}
      >
        <CalendarDays size={14} className="sem-trigger-icon" />
        <span className="sem-trigger-label">
          {selected
            ? `ภาคเรียน ${selected.semester}/${selected.academicYear}${selected.isCurrent ? ' ★' : ''}`
            : 'เลือกภาคเรียน'}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <ChevronDown size={14} className="sem-trigger-chevron" />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="sem-dropdown-menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          >
            {semesters.map(s => {
              const isActive = s.id === value;
              return (
                <motion.button
                  key={s.id}
                  className={`sem-dropdown-item ${isActive ? 'is-active' : ''}`}
                  onClick={() => { onChange(s.id); setOpen(false); }}
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.12 }}
                >
                  <span className="sem-item-label">
                    {s.isCurrent && <span className="sem-dot" />}
                    ภาคเรียน {s.semester}/{s.academicYear}
                  </span>
                  <span className="sem-item-right">
                    {s.isCurrent && (
                      <span className="sem-current-pill">ปัจจุบัน</span>
                    )}
                    {isActive && <Check size={13} className="sem-check" />}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function StudentSchedule() {
  const [allSemesters, setAllSemesters] = useState<SemesterConfig[]>([]);
  const [selectedSemId, setSelectedSemId] = useState<string>('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sort: year desc, semester desc
  const sortedSemesters = useMemo(() =>
    [...allSemesters].sort((a, b) =>
      b.academicYear !== a.academicYear
        ? b.academicYear - a.academicYear
        : b.semester - a.semester
    ),
    [allSemesters]
  );

  // Load semesters on mount
  useEffect(() => {
    configApi.getPublicSemesters()
      .then(r => {
        setAllSemesters(r.data);
        const current = r.data.find((s: SemesterConfig) => s.isCurrent) || r.data[0];
        if (current) setSelectedSemId(current.id);
      })
      .catch(() => toast.error('โหลดภาคเรียนไม่สำเร็จ'));
  }, []);

  // Load enrollments when semester changes
  useEffect(() => {
    if (!selectedSemId) return;
    const sem = allSemesters.find(s => s.id === selectedSemId);
    if (!sem) return;
    setIsLoading(true);
    enrollmentApi.getMyEnrollments(sem.academicYear, sem.semester)
      .then(r => setEnrollments(r.data.filter((e: Enrollment) => e.status !== 'DROPPED')))
      .catch(() => toast.error('โหลดตารางเรียนไม่สำเร็จ'))
      .finally(() => setIsLoading(false));
  }, [selectedSemId, allSemesters]);

  const selectedSem = useMemo(
    () => allSemesters.find(s => s.id === selectedSemId),
    [allSemesters, selectedSemId]
  );

  if (isLoading && !selectedSemId) {
    return <div className="loading-state"><Loader2 className="spin" size={40} /></div>;
  }

  return (
    <motion.div
      className="student-schedule"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Header ──────────────────────────────────────── */}
      <div className="schedule-header">
        <motion.div
          className="page-title"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.06, duration: 0.38 }}
        >
          <CalendarDays size={22} />
          <div>
            <h1>ตารางเรียน</h1>
            {selectedSem && (
              <p className="schedule-subtitle">
                ภาคเรียนที่ {selectedSem.semester} / {selectedSem.academicYear}
                {selectedSem.isCurrent && <span className="current-tag">ปัจจุบัน</span>}
              </p>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08, duration: 0.38 }}
        >
          <SemDropdown
            semesters={sortedSemesters}
            value={selectedSemId}
            onChange={setSelectedSemId}
          />
        </motion.div>
      </div>

      {/* ── Timetable ───────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loader"
            className="loading-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="spin" size={36} />
          </motion.div>
        ) : (
          <motion.div
            key={selectedSemId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {/* fitWidth = true → auto-scale, no scroll */}
            <Timetable enrollments={enrollments} fitWidth />

            {/* ── Course list table ────────────────────── */}
            {enrollments.length > 0 ? (
              <div className="schedule-courses-section card">
                <div className="scs-header">
                  <BookOpen size={17} />
                  <h3>วิชาที่ลงทะเบียน</h3>
                  <span className="scs-count">{enrollments.length} วิชา</span>
                </div>
                <div className="scs-table-wrapper">
                  <table className="scs-table">
                    <thead>
                      <tr>
                        <th>รหัสวิชา</th>
                        <th>ชื่อวิชา</th>
                        <th className="text-center">หน่วยกิต</th>
                        <th>หมวดหมู่</th>
                        <th>วิชาบังคับก่อน</th>
                        <th>อาจารย์ผู้สอน</th>
                        <th className="text-center">Sec.</th>
                        <th className="text-center">เกรด</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map(enr => {
                        const course   = enr.section?.course;
                        const prof     = enr.section?.professor?.user;
                        const prereqs  = course?.prerequisites;
                        const prereqText = prereqs?.length
                          ? prereqs.map((p: any) => p.requiresCourse?.courseCode || p.requiresCourseId).join(', ')
                          : null;
                        return (
                          <motion.tr
                            key={enr.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <td><span className="scs-code">{course?.courseCode || '—'}</span></td>
                            <td>
                              <p className="scs-name-th">{course?.nameTh || '—'}</p>
                              {course?.nameEn && <p className="scs-name-en">{course.nameEn}</p>}
                            </td>
                            <td className="text-center">{course?.credits ?? '—'}</td>
                            <td>
                              {course?.category ? (
                                <span className="scs-category">
                                  {CATEGORY_TH[course.category] || course.category}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="scs-prereq">
                              {prereqText ?? <span className="scs-na">—</span>}
                            </td>
                            <td className="scs-prof">
                              {prof ? (
                                <span className="prof-name">
                                  <User size={11} />
                                  {prof.firstName} {prof.lastName}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="text-center scs-sec">
                              {enr.section?.sectionNo}
                            </td>
                            <td className="text-center">
                              {enr.grade
                                ? <span className={`grade-pill grade-${enr.grade.replace('_', '')}`}>
                                    {GRADE_LABELS[enr.grade] ?? enr.grade}
                                  </span>
                                : <span className="scs-na">—</span>
                              }
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card no-enroll-msg">
                <CalendarDays size={32} style={{ opacity: 0.25, marginBottom: 8 }} />
                <p>ไม่มีวิชาที่ลงทะเบียนในภาคเรียนนี้</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
