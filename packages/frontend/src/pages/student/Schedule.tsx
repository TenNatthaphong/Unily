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

import { Select } from '../../components/ui/Select';

// ── Main page ───────────────────────────────────────────────────────────────
export default function StudentSchedule() {
  const [allSemesters, setAllSemesters] = useState<SemesterConfig[]>([]);
  const [selectedSemId, setSelectedSemId] = useState<string>('');
  // map: semesterId → enrollments (only semesters that have ≥1 enrollment)
  const [enrollmentMap, setEnrollmentMap] = useState<Map<string, Enrollment[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // ── Load all semesters → fetch enrollments concurrently → filter to non-empty ──
  useEffect(() => {
    configApi.getPublicSemesters()
      .then(async r => {
        const sems: SemesterConfig[] = r.data;
        setAllSemesters(sems);

        // Fetch all semesters' enrollments in parallel
        const results = await Promise.allSettled(
          sems.map(s =>
            enrollmentApi.getMyEnrollments(s.academicYear, s.semester)
              .then(res => ({
                id: s.id,
                enr: (res.data as Enrollment[]).filter(e => e.status !== 'DROPPED'),
              }))
          )
        );

        const map = new Map<string, Enrollment[]>();
        results.forEach(r => {
          if (r.status === 'fulfilled' && r.value.enr.length > 0) {
            map.set(r.value.id, r.value.enr);
          }
        });
        setEnrollmentMap(map);

        // Default: current semester if it has enrollments, else first available
        const sorted = [...sems].sort((a, b) =>
          b.academicYear !== a.academicYear ? b.academicYear - a.academicYear : b.semester - a.semester
        );
        const first =
          sorted.find(s => s.isCurrent && map.has(s.id)) ||
          sorted.find(s => map.has(s.id));
        if (first) setSelectedSemId(first.id);
        setIsLoading(false);
      })
      .catch(() => {
        toast.error('โหลดภาคเรียนไม่สำเร็จ');
        setIsLoading(false);
      });
  }, []);

  // Only semesters where student has enrollments, sorted year/term desc
  const validSemesters = useMemo(() =>
    [...allSemesters]
      .filter(s => enrollmentMap.has(s.id))
      .sort((a, b) =>
        b.academicYear !== a.academicYear
          ? b.academicYear - a.academicYear
          : b.semester - a.semester
      ),
    [allSemesters, enrollmentMap]
  );

  const selectedSem = useMemo(
    () => allSemesters.find(s => s.id === selectedSemId),
    [allSemesters, selectedSemId]
  );

  // Enrollments for selected semester — from cache (no extra fetch)
  const enrollments = useMemo(
    () => enrollmentMap.get(selectedSemId) || [],
    [enrollmentMap, selectedSemId]
  );

  if (isLoading) {
    return (
      <div className="loading-state">
        <Loader2 className="spin" size={40} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 8 }}>
          กำลังโหลดประวัติการเรียน…
        </p>
      </div>
    );
  }

  if (validSemesters.length === 0) {
    return (
      <div className="student-schedule">
        <div className="card no-enroll-msg">
          <CalendarDays size={36} style={{ opacity: 0.25, marginBottom: 8 }} />
          <p>ยังไม่มีประวัติการลงทะเบียน</p>
        </div>
      </div>
    );
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
          <div style={{ minWidth: 220 }}>
            <Select
              value={selectedSemId}
              onChange={setSelectedSemId}
              options={validSemesters.map(s => ({
                value: s.id,
                label: `ภาคเรียน ${s.semester}/${s.academicYear}${s.isCurrent ? ' (ปัจจุบัน)' : ''}`
              }))}
            />
          </div>
        </motion.div>
      </div>

      {/* ── Content: timetable + table ──────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedSemId}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          <Timetable enrollments={enrollments} compact fitWidth />

          {/* ── Course list table ────────────────────────── */}
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
                    const course  = enr.section?.course;
                    const prof    = enr.section?.professor?.user;
                    const prereqs = course?.prerequisites;
                    const prereqText = prereqs?.length
                      ? prereqs.map((p: any) => p.requiresCourse?.courseCode || p.requiresCourseId).join(', ')
                      : null;
                    return (
                      <tr key={enr.id}>
                        <td><span className="scs-code">{course?.courseCode || '—'}</span></td>
                        <td>
                          <p className="scs-name-th">{course?.nameTh || '—'}</p>
                          {course?.nameEn && <p className="scs-name-en">{course.nameEn}</p>}
                        </td>
                        <td className="text-center">{course?.credits ?? '—'}</td>
                        <td>
                          {course?.category
                            ? <span className="scs-category">{CATEGORY_TH[course.category] || course.category}</span>
                            : '—'}
                        </td>
                        <td className="scs-prereq">{prereqText ?? <span className="scs-na">—</span>}</td>
                        <td className="scs-prof">
                          {prof
                            ? <span className="prof-name"><User size={11} />{prof.firstName} {prof.lastName}</span>
                            : '—'}
                        </td>
                        <td className="text-center scs-sec">{enr.section?.sectionNo}</td>
                        <td className="text-center">
                          {enr.grade
                            ? <span className={`grade-pill grade-${enr.grade.replace('_', '')}`}>{GRADE_LABELS[enr.grade] ?? enr.grade}</span>
                            : <span className="scs-na">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
