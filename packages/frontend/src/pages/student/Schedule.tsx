import { useState, useEffect, useMemo } from 'react';
import { enrollmentApi } from '../../api/enrollment.api';
import { configApi } from '../../api/config.api';
import Timetable from '../../components/schedule/Timetable';
import type { Enrollment, SemesterConfig } from '../../types';
import { CalendarDays, Loader2, BookOpen, User, ChevronDown } from 'lucide-react';
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

export default function StudentSchedule() {
  const [allSemesters, setAllSemesters] = useState<SemesterConfig[]>([]);
  const [selectedSemId, setSelectedSemId] = useState<string>('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all semesters on mount
  useEffect(() => {
    configApi.getAllSemesters().then(r => {
      const sems = r.data;
      setAllSemesters(sems);
      const current = sems.find(s => s.isCurrent) || sems[0];
      if (current) setSelectedSemId(current.id);
    }).catch(() => toast.error('Failed to load semesters'));
  }, []);

  // Load enrollments when semester changes
  useEffect(() => {
    if (!selectedSemId) return;
    const sem = allSemesters.find(s => s.id === selectedSemId);
    if (!sem) return;
    setIsLoading(true);
    enrollmentApi.getMyEnrollments(sem.academicYear, sem.semester)
      .then(r => setEnrollments(r.data.filter(e => e.status !== 'DROPPED')))
      .catch(() => toast.error('Failed to load schedule'))
      .finally(() => setIsLoading(false));
  }, [selectedSemId, allSemesters]);

  const selectedSem = useMemo(() => allSemesters.find(s => s.id === selectedSemId), [allSemesters, selectedSemId]);

  const activeEnrollments = useMemo(
    () => enrollments.filter(e => e.status !== 'DROPPED'),
    [enrollments]
  );

  if (isLoading && !selectedSemId) {
    return <div className="loading-state"><Loader2 className="spin" size={40} /></div>;
  }

  return (
    <div className="student-schedule animate-fade-in">
      <div className="schedule-header">
        <div className="page-title">
          <CalendarDays size={24} />
          <div>
            <h1>ตารางเรียน</h1>
            {selectedSem && <p className="subtitle">ภาคเรียนที่ {selectedSem.semester}/{selectedSem.academicYear}</p>}
          </div>
        </div>
        {/* Semester selector */}
        <div className="sem-selector-wrap">
          <label className="sem-selector-label">ภาคเรียน</label>
          <div className="sem-select-box">
            <select
              value={selectedSemId}
              onChange={e => setSelectedSemId(e.target.value)}
              className="sem-select"
            >
              {allSemesters.map(s => (
                <option key={s.id} value={s.id}>
                  {s.isCurrent ? '★ ' : ''}{s.semester}/{s.academicYear}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="sem-select-icon" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state"><Loader2 className="spin" size={36} /></div>
      ) : (
        <>
          <Timetable enrollments={activeEnrollments} />

          {/* Enrolled courses detail table */}
          {activeEnrollments.length > 0 && (
            <div className="schedule-courses-section card">
              <div className="scs-header">
                <BookOpen size={18} />
                <h3>วิชาที่ลงทะเบียน</h3>
                <span className="scs-count">{activeEnrollments.length} วิชา</span>
              </div>
              <div className="scs-table-wrapper">
                <table className="scs-table">
                  <thead>
                    <tr>
                      <th>รหัสวิชา</th>
                      <th>ชื่อวิชา (ไทย)</th>
                      <th>ชื่อวิชา (EN)</th>
                      <th className="text-center">หน่วยกิต</th>
                      <th>หมวดหมู่</th>
                      <th>วิชาบังคับก่อน</th>
                      <th>อาจารย์ผู้สอน</th>
                      <th className="text-center">Section</th>
                      <th className="text-center">เกรด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeEnrollments.map(enr => {
                      const course = enr.section?.course;
                      const prof = enr.section?.professor?.user;
                      const prereqs = course?.prerequisites;
                      const prereqText = prereqs && prereqs.length > 0
                        ? prereqs.map((p: any) => p.requiresCourse?.courseCode || p.requiresCourseId).join(', ')
                        : null;
                      return (
                        <tr key={enr.id}>
                          <td><span className="scs-code">{course?.courseCode || '-'}</span></td>
                          <td className="scs-name-th">{course?.nameTh || '-'}</td>
                          <td className="scs-name-en">{course?.nameEn || '-'}</td>
                          <td className="text-center">{course?.credits ?? '-'}</td>
                          <td>
                            <span className="scs-category">
                              {course?.category ? (CATEGORY_TH[course.category] || course.category) : '-'}
                            </span>
                          </td>
                          <td className="scs-prereq">
                            {prereqText ?? <span className="scs-na">N/A</span>}
                          </td>
                          <td className="scs-prof">
                            {prof ? (
                              <span className="prof-name">
                                <User size={12} />{prof.firstName} {prof.lastName}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="text-center">Sec.{enr.section?.sectionNo}</td>
                          <td className="text-center">
                            {enr.grade
                              ? <span className={`grade-pill grade-${enr.grade.replace('_', '')}`}>{GRADE_LABELS[enr.grade] ?? enr.grade}</span>
                              : <span className="scs-na">-</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeEnrollments.length === 0 && (
            <div className="card no-data-msg" style={{ padding: '48px', textAlign: 'center' }}>
              ไม่มีวิชาที่ลงทะเบียนในภาคเรียนนี้
            </div>
          )}
        </>
      )}
    </div>
  );
}
