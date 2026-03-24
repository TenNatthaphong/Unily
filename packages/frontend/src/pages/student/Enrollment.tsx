import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
  ChevronLeft, ChevronRight, Info, X
} from 'lucide-react';
import './Enrollment.css';

// ── Category display names ────────────────────────────────────────────────────
const CATEGORY_TH: Record<string, string> = {
  GENERAL_EDUCATION: 'วิชาศึกษาทั่วไป',
  CORE_COURSE: 'วิชาแกน',
  REQUIRED_COURSE: 'วิชาบังคับสาขา',
  MAJOR_ELECTIVE: 'วิชาเลือกสาขา',
  FREE_ELECTIVE: 'วิชาเลือกเสรี',
  COOP_COURSE: 'สหกิจศึกษา',
};

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
  if (r >= 0.8) return 'warn';
  return 'avail';
}

// ── Section row ───────────────────────────────────────────────────────────────
interface SectionRowProps {
  sec: Section;
  period: EnrollPeriod;
  myEnrollments: Enrollment[];
  onEnroll: (sectionId: string) => void;
  onDrop: (enrollmentId: string) => void;
}
function SectionRow({ sec, period, myEnrollments, onEnroll, onDrop }: SectionRowProps) {
  const { t } = useTranslation();
  const enrolled = myEnrollments.find(e => e.sectionId === sec.id && e.status !== 'DROPPED');
  const cls = capacityClass(sec.enrolledCount, sec.capacity);
  const profName = sec.professor?.user ? `${sec.professor.user.firstName} ${sec.professor.user.lastName}` : '-';

  return (
    <div className={`section-row ${enrolled ? 'is-enrolled' : ''}`}>
      <div className="sec-col sec-no">Section {sec.sectionNo}</div>
      <div className="sec-col sec-prof">{profName}</div>
      <div className="sec-col sec-schedule">
        {sec.schedules?.map(s => (
          <span key={s.id} className="sched-tag">{s.dayOfWeek} {s.startTime}–{s.endTime}</span>
        ))}
      </div>
      <div className="sec-col sec-cap">
        <div className="cap-meta">
          <span className={`cap-text ${cls}`}>Available</span>
          <span className="cap-number">{sec.enrolledCount}/{sec.capacity}</span>
        </div>
        <div className="cap-bar-premium">
          <div className={`cap-fill-glow ${cls}`} style={{ width: `${Math.min(100, (sec.enrolledCount / sec.capacity) * 100)}%` }} />
        </div>
      </div>
      <div className="sec-col sec-action">
        {enrolled ? (
          period === 'reg_open' || period === 'withdraw_only' ? (
            <button className="btn-enroll-premium drop" onClick={() => onDrop(enrolled.id)}>{t('enrollment.drop')}</button>
          ) : <button className="btn-enroll-premium" disabled>Enrolled</button>
        ) : (
          period === 'reg_open' ? (
            <button className="btn-enroll-premium" disabled={sec.enrolledCount >= sec.capacity} onClick={() => onEnroll(sec.id)}>
              {sec.enrolledCount >= sec.capacity ? 'Full' : 'Enroll'}
            </button>
          ) : <button className="btn-enroll-premium" disabled>Closed</button>
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
  passedCourseIds: Set<string>;
}
function CourseCard({ course, period, myEnrollments, config, onEnroll, onDrop, passedCourseIds }: CourseCardProps) {
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

  const prereqList: any[] = (course as any).prerequisites || [];

  return (
    <div className={`course-card-enroll ${open ? 'expanded' : ''}`}>
      <div className="course-card-header" onClick={toggle}>
        <div className="course-info">
          <h3 className="course-title-row">
            <span className="course-code font-bold mr-sm">{course.courseCode}</span>
            <span className="course-name-th">{course.nameTh}</span>
          </h3>
          <p className="course-name-en">{course.nameEn}</p>
          <div className="course-meta-row">
            {(course as any).category && (
              <span className={`cat-badge cat-${(course as any).category.toLowerCase()}`}>
                {CATEGORY_TH[(course as any).category] || (course as any).category}
              </span>
            )}
            {course.credits && <span className="credits-badge">{course.credits} หน่วยกิต</span>}
          </div>
          {prereqList.length > 0 && (
            <div className="course-meta-row" style={{ marginTop: 6 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: 4 }}>Prereq:</span>
              {prereqList.map((p: any) => {
                const passed = passedCourseIds.has(p.requiresCourseId);
                return (
                  <span key={p.id || p.requiresCourseId} className={`prereq-tag ${passed ? 'passed' : 'missing'}`}>
                    {passed ? '✓' : '✗'} {p.requiresCourse?.courseCode || p.requiresCourseId}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="expand-chevron">
          {open ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
      </div>

      {open && (
        <div className="course-sections">
          {loading ? (
            <div className="sec-loading"><Loader2 className="spin" size={30} /></div>
          ) : (
            <div className="sections-container px-lg pb-lg">
              <div className="sections-table-header px-md">
                <div>Section</div>
                <div>Professor</div>
                <div>Day/Time</div>
                <div>Capacity</div>
                <div className="text-right">Action</div>
              </div>
              {sections && sections.length > 0 ? (
                sections.map(sec => (
                  <SectionRow key={sec.id} sec={sec} period={period}
                    myEnrollments={myEnrollments} onEnroll={onEnroll} onDrop={onDrop} />
                ))
              ) : (
                <div className="no-sections py-xl text-center opacity-50">ไม่มีกลุ่มเรียนเปิดสอนในเทอมนี้</div>
              )}
            </div>
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
  const [category, setCategory] = useState('');
  const [prereqFilter, setPrereqFilter] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    Promise.all([configApi.getCurrentSemester(), facultyApi.getAll()]).then(([cfgRes, facRes]) => {
      setConfig(cfgRes.data);
      setFaculties(facRes.data);
    });
  }, []);

  useEffect(() => {
    if (facultyId) {
      departmentApi.getByFaculty(facultyId).then(r => setDepartments(r.data));
    } else {
      setDepartments([]);
      setDeptId('');
    }
  }, [facultyId]);

  const fetchCourses = useCallback(async () => {
    if (!config) return;
    setIsLoading(true);
    try {
      const [coursesRes, enrRes] = await Promise.all([
        courseApi.search({ search: search || undefined, facultyId: facultyId || undefined, deptId: deptId || undefined, category: category || undefined, page, limit: 12 }),
        enrollmentApi.getMyEnrollments(config.academicYear, config.semester),
      ]);
      setCourses(coursesRes.data.data);
      setLastPage(coursesRes.data.meta.lastPage);
      setMyEnrollments(enrRes.data);
    } catch { toast.error('Failed to load courses'); }
    finally { setIsLoading(false); }
  }, [config, search, facultyId, deptId, category, page]);

  useEffect(() => {
    if (config) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchCourses, 300);
    }
  }, [fetchCourses, config]);

  const handleEnroll = useCallback(async (sectionId: string) => {
    try {
      await enrollmentApi.enroll(sectionId);
      toast.success('Enrollment successful');
      const enrRes = await enrollmentApi.getMyEnrollments(config?.academicYear, config?.semester);
      setMyEnrollments(enrRes.data);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Enrollment failed');
    }
  }, [config]);

  const handleDrop = useCallback(async (enrollmentId: string) => {
    const ok = confirm('Drop this course?');
    if (!ok) return;
    try {
      await enrollmentApi.drop(enrollmentId);
      toast.success('Course dropped');
      const enrRes = await enrollmentApi.getMyEnrollments(config?.academicYear, config?.semester);
      setMyEnrollments(enrRes.data);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Drop failed');
    }
  }, [config]);

  const period = config ? getEnrollPeriod(config) : 'closed';

  const passedCourseIds = useMemo(() => new Set(
    myEnrollments
      .filter(e => e.status !== 'DROPPED' && e.grade && e.grade !== 'F')
      .map(e => (e.section as any)?.courseId || '')
      .filter(Boolean)
  ), [myEnrollments]);

  const displayCourses = useMemo(() => {
    if (!prereqFilter.trim()) return courses;
    const code = prereqFilter.trim().toUpperCase();
    return courses.filter(c =>
      (c as any).prerequisites?.some((p: any) =>
        ((p.requiresCourse?.courseCode || '') as string).toUpperCase().includes(code)
      )
    );
  }, [courses, prereqFilter]);

  return (
    <div className="enrollment-page animate-fade-in">
      <div className="enrollment-header">
        <div className="header-content">
          <h1>{t('nav.enrollment')}</h1>
          {config && <p className="enrollment-sub font-mono">TERM {config.academicYear}/{config.semester}</p>}
        </div>
        <div className="enroll-summary glass-panel p-sm px-lg rounded-full flex gap-sm border">
          <Info size={16} className="text-primary" />
          <span className="text-sm font-bold">{myEnrollments.filter(e => e.status !== 'DROPPED').length} Courses Enrolled</span>
        </div>
      </div>

      <div className="enroll-filters glass-panel-premium p-md rounded-xl">
        <div className="filter-row-1">
          <div className="search-box">
            <Search size={20} className="text-muted" />
            <input
              placeholder="Search for courses (e.g., CS101, Data Science)"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button className="search-clear-btn" onClick={() => { setSearch(''); setPage(1); }}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="filter-row-2">
          <div className="select-wrapper">
            <select value={facultyId} onChange={e => { setFacultyId(e.target.value); setDeptId(''); setPage(1); }}>
              <option value="">All Faculties</option>
              {faculties.map(f => <option key={f.id} value={f.id}>{f.nameEn}</option>)}
            </select>
          </div>
          <div className="select-wrapper">
            <select value={deptId} onChange={e => { setDeptId(e.target.value); setPage(1); }} disabled={!facultyId}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.nameEn}</option>)}
            </select>
          </div>
          <div className="select-wrapper">
            <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
              <option value="">ทุกหมวดหมู่</option>
              <option value="GENERAL_EDUCATION">วิชาศึกษาทั่วไป</option>
              <option value="CORE_COURSE">วิชาแกน</option>
              <option value="REQUIRED_COURSE">วิชาบังคับสาขา</option>
              <option value="MAJOR_ELECTIVE">วิชาเลือกสาขา</option>
              <option value="FREE_ELECTIVE">วิชาเลือกเสรี</option>
              <option value="COOP_COURSE">สหกิจศึกษา</option>
            </select>
          </div>
          <div className="prereq-filter-wrap">
            <Search size={14} />
            <input
              className="prereq-filter-input"
              placeholder="กรองตาม prereq (เช่น CS101)"
              value={prereqFilter}
              onChange={e => setPrereqFilter(e.target.value)}
            />
            {prereqFilter && (
              <button className="search-clear-btn" onClick={() => setPrereqFilter('')}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state-premium h-96"><Loader2 className="spin" size={48} /></div>
      ) : (
        <>
          <div className="courses-list mt-lg">
            {displayCourses.map(c => (
              <CourseCard
                key={c.id} course={c} period={period}
                myEnrollments={myEnrollments} config={config!}
                onEnroll={handleEnroll} onDrop={handleDrop}
                passedCourseIds={passedCourseIds}
              />
            ))}
            {displayCourses.length === 0 && (
              <div className="no-data-msg card bg-card-dark p-xl text-center border">
                <p className="opacity-40">No matching courses found in the current term.</p>
              </div>
            )}
          </div>
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={24} /></button>
            <span className="current-page text-lg">{page}</span>
            <button disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}><ChevronRight size={24} /></button>
          </div>
        </>
      )}
    </div>
  );
}
