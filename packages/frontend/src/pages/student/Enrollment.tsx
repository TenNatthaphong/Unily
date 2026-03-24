import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { enrollmentApi } from '../../api/enrollment.api';
import { courseApi } from '../../api/course.api';
import { configApi } from '../../api/config.api';
import { facultyApi } from '../../api/faculty.api';
import { departmentApi } from '../../api/department.api';
import type { Course, Enrollment, SemesterConfig, Faculty, Department, Section } from '../../types';
import { toast } from 'react-hot-toast';
import {
  Loader2, Search, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Users,
} from 'lucide-react';
import './Enrollment.css';

// ── Enrollment period helper ─────────────────────────────────────────────────
type EnrollPeriod = 'before_reg' | 'reg_open' | 'withdraw_only' | 'closed';
function getEnrollPeriod(cfg: SemesterConfig): EnrollPeriod {
  const now = Date.now();
  const regStart = new Date(cfg.regStart).getTime();
  const regEnd = new Date(cfg.regEnd).getTime();
  const withdrawEnd = new Date(cfg.withdrawEnd).getTime();
  if (now < regStart) return 'before_reg';
  if (now <= regEnd) return 'reg_open';
  if (now <= withdrawEnd) return 'withdraw_only';
  return 'closed';
}

// ── Capacity color ────────────────────────────────────────────────────────────
function capacityClass(enrolled: number, cap: number) {
  const r = enrolled / cap;
  if (r >= 1) return 'full';
  if (r >= 0.7) return 'warn';
  return 'avail';
}

// ── Section row ───────────────────────────────────────────────────────────────
interface SectionRowProps {
  sec: Section;
  period: EnrollPeriod;
  myEnrollments: Enrollment[];
  onEnroll: (sectionId: string) => void;
  onDrop: (sectionId: string) => void;
}
function SectionRow({ sec, period, myEnrollments, onEnroll, onDrop }: SectionRowProps) {
  const { t } = useTranslation();
  const enrolled = myEnrollments.find(e => e.sectionId === sec.id && e.status !== 'DROPPED');
  const cls = capacityClass(sec.enrolledCount, sec.capacity);
  const profName = sec.professor?.user ? `${sec.professor.user.firstName} ${sec.professor.user.lastName}` : '-';

  return (
    <div className={`section-row ${enrolled ? 'is-enrolled' : ''}`}>
      <div className="sec-col sec-no">Sec.{sec.sectionNo}</div>
      <div className="sec-col sec-prof">{profName}</div>
      <div className="sec-col sec-schedule">
        {sec.schedules?.map(s => (
          <span key={s.id} className="sched-tag">{s.dayOfWeek} {s.startTime}–{s.endTime}</span>
        ))}
      </div>
      <div className="sec-col sec-cap">
        <span className={`cap-text ${cls}`}>{sec.enrolledCount}/{sec.capacity}</span>
        <div className="cap-bar">
          <div className={`cap-fill ${cls}`} style={{ width: `${Math.min(100, (sec.enrolledCount / sec.capacity) * 100)}%` }} />
        </div>
      </div>
      <div className="sec-col sec-status">
        <span className={`cap-dot ${cls}`} />
        {enrolled && <span className="enrolled-tag">ลงแล้ว</span>}
      </div>
      <div className="sec-col sec-action">
        {enrolled ? (
          period === 'reg_open' || period === 'withdraw_only' ? (
            <button className="btn-enroll drop" onClick={() => onDrop(sec.id)}>{t('enrollment.drop')}</button>
          ) : null
        ) : (
          period === 'reg_open' && sec.enrolledCount < sec.capacity ? (
            <button className="btn-enroll enroll" onClick={() => onEnroll(sec.id)}>{t('enrollment.enroll')}</button>
          ) : null
        )}
      </div>
    </div>
  );
}

// ── Course accordion card ─────────────────────────────────────────────────────
interface CourseCardProps {
  course: Course;
  period: EnrollPeriod;
  myEnrollments: Enrollment[];
  config: SemesterConfig;
  onEnroll: (sectionId: string) => void;
  onDrop: (sectionId: string) => void;
}
function CourseCard({ course, period, myEnrollments, config, onEnroll, onDrop }: CourseCardProps) {
  const [open, setOpen] = useState(false);
  const [sections, setSections] = useState<Section[] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!open && sections === null) {
      setLoading(true);
      try {
        const r = await enrollmentApi.getSectionsByCourse(course.id, config.academicYear, config.semester);
        setSections(r.data);
      } catch { toast.error('Failed to load sections'); }
      finally { setLoading(false); }
    }
    setOpen(v => !v);
  };

  const prereqs = course.prerequisites?.length
    ? course.prerequisites.map(p => p.requiresCourseId).join(', ')
    : 'None';

  return (
    <div className={`course-card-enroll card ${open ? 'expanded' : ''}`}>
      <div className="course-card-header" onClick={toggle}>
        <div className="course-info">
          <div className="course-main-row">
            <span className="course-code-badge">{course.courseCode}</span>
            <span className="course-name-th">{course.nameTh}</span>
            <span className="course-credits">{course.credits}({course.lectureHours}-{course.labHours}-{course.selfStudyHours})</span>
          </div>
          <div className="course-sub-row">
            <span className="course-name-en">{course.nameEn}</span>
            <span className="course-prereqs">
              <span className="prereq-label">วิชาบังคับก่อน:</span> {prereqs}
            </span>
          </div>
        </div>
        <button className="expand-btn" aria-label="expand">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {open && (
        <div className="course-sections">
          {loading ? (
            <div className="sec-loading"><Loader2 className="spin" size={20} /></div>
          ) : sections && sections.length > 0 ? (
            <>
              <div className="sections-table-header">
                <div className="sec-col sec-no">กลุ่ม</div>
                <div className="sec-col sec-prof">อาจารย์</div>
                <div className="sec-col sec-schedule">วัน-เวลา</div>
                <div className="sec-col sec-cap">จำนวน</div>
                <div className="sec-col sec-status">สถานะ</div>
                <div className="sec-col sec-action"></div>
              </div>
              {sections.map(sec => (
                <SectionRow key={sec.id} sec={sec} period={period}
                  myEnrollments={myEnrollments} onEnroll={onEnroll} onDrop={onDrop} />
              ))}
            </>
          ) : (
            <div className="no-sections">ไม่มีกลุ่มเรียนในเทอมนี้</div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EnrollmentPage() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [config, setConfig] = useState<SemesterConfig | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [search, setSearch] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [deptId, setDeptId] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load static data
  useEffect(() => {
    Promise.all([configApi.getCurrentSemester(), facultyApi.getAll()]).then(([cfgRes, facRes]) => {
      setConfig(cfgRes.data);
      setFaculties(facRes.data);
    });
  }, []);

  // Load departments when faculty changes
  useEffect(() => {
    if (facultyId) {
      departmentApi.getByFaculty(facultyId).then(r => setDepartments(r.data));
    } else {
      setDepartments([]);
      setDeptId('');
    }
  }, [facultyId]);

  // Fetch courses (server-side)
  const fetchCourses = useCallback(async () => {
    if (!config) return;
    setIsLoading(true);
    try {
      const [coursesRes, enrRes] = await Promise.all([
        courseApi.search({ search: search || undefined, facultyId: facultyId || undefined, deptId: deptId || undefined, page, limit: 10 }),
        enrollmentApi.getMyEnrollments(config.academicYear, config.semester),
      ]);
      setCourses(coursesRes.data.data);
      setLastPage(coursesRes.data.meta.lastPage);
      setMyEnrollments(enrRes.data);
    } catch { toast.error('Failed to load courses'); }
    finally { setIsLoading(false); }
  }, [config, search, facultyId, deptId, page]);

  useEffect(() => {
    if (config) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchCourses, 300);
    }
  }, [fetchCourses, config]);

  const handleEnroll = useCallback(async (sectionId: string) => {
    try {
      await enrollmentApi.enroll(sectionId);
      toast.success('ลงทะเบียนสำเร็จ');
      const enrRes = await enrollmentApi.getMyEnrollments(config?.academicYear, config?.semester);
      setMyEnrollments(enrRes.data);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'ลงทะเบียนไม่สำเร็จ');
    }
  }, [config]);

  const handleDrop = useCallback(async (sectionId: string) => {
    try {
      await enrollmentApi.drop(sectionId);
      toast.success('ถอนรายวิชาสำเร็จ');
      const enrRes = await enrollmentApi.getMyEnrollments(config?.academicYear, config?.semester);
      setMyEnrollments(enrRes.data);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'ถอนไม่สำเร็จ');
    }
  }, [config]);

  const period = config ? getEnrollPeriod(config) : 'closed';

  const periodBanner: Record<EnrollPeriod, { text: string; cls: string }> = {
    before_reg: { text: 'ยังไม่เปิดรับลงทะเบียน', cls: 'banner-info' },
    reg_open: { text: 'เปิดลงทะเบียนและถอนวิชา', cls: 'banner-success' },
    withdraw_only: { text: 'ปิดลงทะเบียนใหม่ — ถอนวิชาได้อย่างเดียว', cls: 'banner-warning' },
    closed: { text: 'สิ้นสุดช่วงลงทะเบียนแล้ว', cls: 'banner-danger' },
  };

  return (
    <div className="enrollment-page animate-fade-in">
      <div className="enrollment-header">
        <div>
          <h1>{t('nav.enrollment')}</h1>
          {config && <p className="enrollment-sub">ภาคเรียนที่ {config.semester}/{config.academicYear}</p>}
        </div>
        <div className={`period-banner ${periodBanner[period].cls}`}>
          {periodBanner[period].text}
        </div>
      </div>

      {/* Filters */}
      <div className="enroll-filters">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="ค้นหารายวิชา (ชื่อ / รหัส)"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="select-wrapper">
          <select value={facultyId} onChange={e => { setFacultyId(e.target.value); setDeptId(''); setPage(1); }}>
            <option value="">คณะทั้งหมด</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.nameEn}</option>)}
          </select>
        </div>
        <div className="select-wrapper">
          <select value={deptId} onChange={e => { setDeptId(e.target.value); setPage(1); }} disabled={!facultyId}>
            <option value="">ภาควิชาทั้งหมด</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
          </select>
        </div>
      </div>

      {/* My enrolled count */}
      <div className="enroll-summary">
        <Users size={14} />
        <span>ลงทะเบียนแล้ว {myEnrollments.filter(e => e.status !== 'DROPPED').length} วิชา
          ({myEnrollments.filter(e => e.status !== 'DROPPED').reduce((s, e) => s + (e.section?.course?.credits || 0), 0)} หน่วยกิต)
        </span>
      </div>

      {isLoading ? (
        <div className="loading-state"><Loader2 className="spin" size={36} /></div>
      ) : (
        <>
          <div className="courses-list">
            {courses.map(c => (
              <CourseCard
                key={c.id} course={c} period={period}
                myEnrollments={myEnrollments} config={config!}
                onEnroll={handleEnroll} onDrop={handleDrop}
              />
            ))}
            {courses.length === 0 && (
              <div className="empty-courses card">
                <p>ไม่พบรายวิชา</p>
              </div>
            )}
          </div>
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16} /></button>
            <span>{page} / {lastPage}</span>
            <button disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}><ChevronRight size={16} /></button>
          </div>
        </>
      )}
    </div>
  );
}
