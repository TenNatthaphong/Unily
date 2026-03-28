import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { enrollmentApi } from '../../api/enrollment.api';
import { curriculumApi } from '../../api/curriculum.api';
import { configApi } from '../../api/config.api';
import { facultyApi } from '../../api/faculty.api';
import { departmentApi } from '../../api/department.api';
import type { Enrollment, SemesterConfig, Section, CurriculumCourse, Faculty, Department } from '../../types';
import { toast } from 'react-hot-toast';
import Timetable from '../../components/schedule/Timetable';
import {
  Loader2, Search, ChevronDown, ChevronUp, Check,
  BookOpen, Info, X, Clock, AlertTriangle, ShoppingCart,
  Trash2, ArrowLeft, ArrowLeftRight, CheckCircle2, User,
} from 'lucide-react';
import Pagination from '../../components/ui/Pagination';
import './Enrollment.css';

// ── Category labels ───────────────────────────────────────────────────────────
const CATEGORY_TH: Record<string, string> = {
  GENERAL_EDUCATION: 'วิชาศึกษาทั่วไป',
  CORE_COURSE:       'วิชาแกน',
  REQUIRED_COURSE:   'วิชาบังคับ',
  MAJOR_ELECTIVE:    'วิชาเลือกสาขา',
  FREE_ELECTIVE:     'วิชาเลือกเสรี',
  COOP_COURSE:       'สหกิจศึกษา',
};

const CATEGORY_OPTIONS = [
  { value: '', label: 'ทุกหมวดหมู่' },
  { value: 'GENERAL_EDUCATION', label: 'วิชาศึกษาทั่วไป' },
  { value: 'CORE_COURSE',       label: 'วิชาแกน' },
  { value: 'REQUIRED_COURSE',   label: 'วิชาบังคับ' },
  { value: 'MAJOR_ELECTIVE',    label: 'วิชาเลือกสาขา' },
  { value: 'FREE_ELECTIVE',     label: 'วิชาเลือกเสรี' },
  { value: 'COOP_COURSE',       label: 'สหกิจศึกษา' },
];

import { ScheduleBadge } from '../../components/ui/ScheduleBadge';
// ── Helpers ───────────────────────────────────────────────────────────────────
type SchedLike = { dayOfWeek: string; startTime: string; endTime: string };
function toMin(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function schedulesOverlap(a: SchedLike[], b: SchedLike[]): boolean {
  for (const sa of a) for (const sb of b) {
    if (sa.dayOfWeek !== sb.dayOfWeek) continue;
    if (toMin(sa.startTime) < toMin(sb.endTime) && toMin(sb.startTime) < toMin(sa.endTime)) return true;
  }
  return false;
}

type EnrollPeriod = 'before_reg' | 'reg_open' | 'withdraw_only' | 'closed';
function getEnrollPeriod(cfg: SemesterConfig): EnrollPeriod {
  const now = Date.now();
  const s = new Date(cfg.regStart).getTime();
  const e = new Date(cfg.regEnd).getTime();
  const w = new Date(cfg.withdrawEnd).getTime();
  if (now < s) return 'before_reg';
  if (now <= e) return 'reg_open';
  if (now <= w) return 'withdraw_only';
  return 'closed';
}
function capClass(enrolled: number, cap: number) {
  const r = enrolled / cap;
  return r >= 1 ? 'full' : r >= 0.7 ? 'warn' : 'avail';
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface CartItem { section: Section }
type PlanItem = CurriculumCourse & { status: 'COMPLETED' | 'REMAINING' };

interface ConfirmState {
  title: string;
  body: string;
  action: () => Promise<void>;
  variant?: 'danger' | 'primary';
}

// ── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ state, onClose }: { state: ConfirmState; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try { await state.action(); } finally { setBusy(false); onClose(); }
  };
  return (
    <div className="enr-overlay" onClick={onClose}>
      <motion.div
        className="enr-confirm-modal"
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        onClick={e => e.stopPropagation()}
      >
        <h4 className="enr-confirm-title">{state.title}</h4>
        <p className="enr-confirm-body">{state.body}</p>
        <div className="enr-confirm-actions">
          <button className="btn-enr-cancel" onClick={onClose} disabled={busy}>ยกเลิก</button>
          <button
            className={`btn-enr-confirm ${state.variant ?? 'primary'}`}
            onClick={run}
            disabled={busy}
          >
            {busy ? <Loader2 size={13} className="spin" /> : null}
            ยืนยัน
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Manage enrollments modal (batch-drop + live preview) ──────────────────────
interface ManageModalProps {
  enrollments: Enrollment[];
  period: EnrollPeriod;
  onClose: () => void;
  onBatchDrop: (ids: string[]) => void;
}
function ManageModal({ enrollments, period, onClose, onBatchDrop }: ManageModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const allSelected = selected.size === enrollments.length && enrollments.length > 0;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(enrollments.map(e => e.id)));

  // Live timetable: enrolled minus selected-to-drop
  const previewAfterDrop = useMemo(
    () => enrollments.filter(e => !selected.has(e.id)),
    [enrollments, selected],
  );

  const canDrop = period === 'reg_open' || period === 'withdraw_only';

  return (
    <div className="enr-overlay" onClick={onClose}>
      <motion.div
        className="manage-modal"
        initial={{ scale: 0.93, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 24 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="manage-modal-header">
          <div className="manage-modal-title">
            <BookOpen size={15} />
            <span>วิชาที่ลงทะเบียน</span>
            <span className="count-pill">{enrollments.length} วิชา</span>
          </div>
          <button className="enr-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {/* Live timetable preview */}
        <div className="manage-timetable-wrap">
          <p className="manage-preview-label">
            <Clock size={11} />
            {selected.size > 0 ? `ตารางหลังถอน ${selected.size} วิชา` : 'ตารางเรียนปัจจุบัน'}
          </p>
          <Timetable enrollments={previewAfterDrop} fitWidth compact />
        </div>

        {/* Course list */}
        <div className="manage-course-list">
          {canDrop && enrollments.length > 1 && (
            <div className="manage-select-all">
              <label className="manage-checkbox-row">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                <span>เลือกทั้งหมด</span>
              </label>
            </div>
          )}
          {enrollments.map(enr => {
            const sec = enr.section;
            const isSel = selected.has(enr.id);
            return (
              <div key={enr.id} className={`manage-course-row ${isSel ? 'selected' : ''}`}
                onClick={() => canDrop && toggle(enr.id)} style={{ cursor: canDrop ? 'pointer' : 'default' }}>
                <div className="manage-course-info">
                  <div className="manage-course-hdr">
                    <span className="scs-code">{sec?.course?.courseCode}</span>
                    <span className="manage-course-name">{sec?.course?.nameTh}</span>
                    <span className="manage-sec-badge">Sec {sec?.sectionNo}</span>
                  </div>
                  <div className="manage-course-meta">
                    {sec?.professor?.user && (
                      <span className="manage-prof">
                        <User size={10} />{sec.professor.user.firstName} {sec.professor.user.lastName}
                      </span>
                    )}
                    {sec?.schedules?.map(s => (
                      <ScheduleBadge key={s.id} schedule={s as any} size="sm" />
                    ))}
                  </div>
                </div>
                {canDrop && (
                  <input type="checkbox" className="manage-checkbox"
                    checked={isSel} readOnly />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {canDrop && (
          <div className="manage-footer">
            <span className="manage-footer-hint">
              {selected.size > 0 ? `เลือก ${selected.size} วิชาที่จะถอน` : 'เลือกวิชาที่ต้องการถอน'}
            </span>
            <button className="btn-batch-drop" disabled={selected.size === 0}
              onClick={() => onBatchDrop([...selected])}>
              <Trash2 size={13} /> ถอน {selected.size > 0 ? `${selected.size} วิชา` : ''}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Filter dropdown (same style as SemDropdown) ───────────────────────────────
interface FDProps { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void; icon?: React.ReactNode; disabled?: boolean; placeholder?: string }
function FilterDropdown({ options, value, onChange, icon, disabled, placeholder }: FDProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sel = options.find(o => o.value === value) ?? { value: '', label: placeholder || options[0].label };
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div className={`enr-dropdown ${disabled ? 'disabled' : ''}`} ref={ref}>
      <motion.button className="enr-dropdown-trigger" onClick={() => !disabled && setOpen(v => !v)} 
        whileHover={disabled ? {} : { scale: 1.02 }} whileTap={disabled ? {} : { scale: 0.97 }} disabled={disabled}>
        {icon && <span className="enr-trigger-icon">{icon}</span>}
        <span className="enr-trigger-label">{sel.label}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }} style={{ display: 'flex' }}>
          <ChevronDown size={14} className="enr-trigger-chevron" />
        </motion.span>
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div className="enr-dropdown-menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ type: 'spring', stiffness: 420, damping: 30 }}>
            {options.map(opt => (
              <motion.button key={opt.value} className={`enr-dropdown-item ${opt.value === value ? 'is-active' : ''}`}
                onClick={() => { onChange(opt.value); setOpen(false); }} whileHover={{ x: 3 }} transition={{ duration: 0.12 }}>
                <span>{opt.label}</span>
                {opt.value === value && <Check size={13} className="enr-check" />}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Section row ───────────────────────────────────────────────────────────────
interface SRowProps {
  sec: Section;
  period: EnrollPeriod;
  inCart: boolean;
  isEnrolled: boolean;
  courseEnrolled: boolean;    // any section of this course is already enrolled
  enrolledEnrId?: string;     // enrollment ID of the currently-enrolled section (for move)
  onAdd: (sec: Section) => void;
  onRemove: (sectionId: string) => void;
  onRequestMove: (enrolledEnrId: string, newSec: Section) => void;
}
function SectionRow({ sec, period, inCart, isEnrolled, courseEnrolled, enrolledEnrId, onAdd, onRemove, onRequestMove }: SRowProps) {
  const cls  = capClass(sec.enrolledCount, sec.capacity);
  const prof = sec.professor?.user ? `${sec.professor.user.firstName} ${sec.professor.user.lastName}` : '—';
  const full = sec.enrolledCount >= sec.capacity;
  const canMove = period === 'reg_open' && courseEnrolled && !isEnrolled && !inCart;

  return (
    <div className={`section-row ${inCart ? 'in-cart' : ''} ${isEnrolled ? 'is-enrolled' : ''}`}>
      <div className="sec-col sec-no">
        <span className="sec-no-badge">Sec {sec.sectionNo}</span>
        {isEnrolled && <CheckCircle2 size={11} className="sec-enrolled-icon" />}
      </div>
      <div className="sec-col sec-prof">
        <User size={11} className="sec-prof-icon" />
        <span>{prof}</span>
      </div>
      <div className="sec-col sec-schedule">
        {sec.schedules?.map(s => (
          <ScheduleBadge key={s.id} schedule={s as any} />
        ))}
      </div>
      <div className="sec-col sec-cap">
        <div className="cap-meta">
          <span className={`cap-text ${cls}`}>{cls === 'full' ? 'เต็ม' : cls === 'warn' ? 'ใกล้เต็ม' : 'ว่าง'}</span>
          <span className="cap-number">{sec.enrolledCount}/{sec.capacity}</span>
        </div>
        <div className="cap-bar-premium">
          <div className={`cap-fill-glow ${cls}`} style={{ width: `${Math.min(100, (sec.enrolledCount / sec.capacity) * 100)}%` }} />
        </div>
      </div>
      <div className="sec-col sec-action">
        {isEnrolled ? (
          /* This section is enrolled — show static label only, drop via manage modal */
          <span className="sec-tag enrolled"><CheckCircle2 size={11} /> ลงแล้ว</span>
        ) : inCart ? (
          <button className="btn-sec in-cart" onClick={() => onRemove(sec.id)}><X size={12} /> ลบออก</button>
        ) : canMove ? (
          /* Another section of same course is enrolled — offer to switch */
          <button className="btn-sec move" disabled={full}
            onClick={() => !full && onRequestMove(enrolledEnrId!, sec)}>
            {full ? 'เต็ม' : <><ArrowLeftRight size={11} /> ย้าย</>}
          </button>
        ) : period === 'reg_open' ? (
          <button className="btn-sec add" disabled={full} onClick={() => !full && onAdd(sec)}>
            {full ? 'เต็ม' : <><Check size={11} /> เพิ่ม</>}
          </button>
        ) : (
          <span className="sec-tag closed">ปิดแล้ว</span>
        )}
      </div>
    </div>
  );
}

// ── Course accordion card ─────────────────────────────────────────────────────
interface CCardProps {
  item: PlanItem;
  sections: Section[];
  period: EnrollPeriod;
  myEnrollments: Enrollment[];
  cart: CartItem[];
  passedCourseIds: Set<string>;
  isRetake?: boolean;
  onAdd: (sec: Section) => void;
  onRemove: (sectionId: string) => void;
  onRequestMove: (enrolledEnrId: string, newSec: Section) => void;
}
function CourseCard({ item, sections, period, myEnrollments, cart, passedCourseIds, isRetake, onAdd, onRemove, onRequestMove }: CCardProps) {
  const [open, setOpen] = useState(false);
  const course = item.course!;
  const prereqs: any[] = (course as any).prerequisites || [];
  const enrolledEnr = myEnrollments.find(e => e.section?.courseId === item.courseId && e.status !== 'DROPPED');
  const inCartAny   = cart.some(c => c.section.courseId === item.courseId);

  // Sort sections descending by sectionNo
  const sorted = [...sections].sort((a, b) => b.sectionNo - a.sectionNo);

  return (
    <div className={`course-card-enroll ${open ? 'expanded' : ''} ${isRetake ? 'retake' : ''} ${enrolledEnr ? 'enrolled' : ''}`}>
      <div className="course-card-header" onClick={() => setOpen(v => !v)}>
        <div className="course-info">
          <h3 className="course-title-row">
            <span className="course-code-badge">{course.courseCode}</span>
            <span className="course-name-th">{course.nameTh}</span>
            {enrolledEnr && <span className="status-chip enrolled-chip"><CheckCircle2 size={10} /> ลงแล้ว</span>}
            {inCartAny && !enrolledEnr && <span className="status-chip cart-chip"><ShoppingCart size={10} /> ในรายการ</span>}
          </h3>
          <p className="course-name-en">{course.nameEn}</p>
          <div className="course-meta-row">
            {(course as any).category && (
              <span className={`cat-badge cat-${(course as any).category.toLowerCase()}`}>
                {CATEGORY_TH[(course as any).category] || (course as any).category}
              </span>
            )}
            <span className="credits-badge">{course.credits} หน่วยกิต</span>
            <span className={`term-badge ${isRetake ? 'retake-badge' : ''}`}>
              {isRetake ? <AlertTriangle size={9} /> : <Clock size={9} />}
              ปีที่ {item.year} เทอม {item.semester}
            </span>
          </div>
          {prereqs.length > 0 && (
            <div className="course-meta-row" style={{ marginTop: 6 }}>
              <span className="prereq-label">บังคับก่อน:</span>
              {prereqs.map((p: any) => {
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
        <div className="expand-chevron">{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
      </div>

      {open && (
        <div className="course-sections">
          <div className="sections-container">
            <div className="sections-table-header">
              <div>Section</div><div>อาจารย์</div><div>วัน/เวลา</div><div>จำนวน</div>
              <div className="text-right">เพิ่ม/ถอน</div>
            </div>
            {sorted.length > 0 ? sorted.map(sec => {
              const enr = myEnrollments.find(e => e.sectionId === sec.id && e.status !== 'DROPPED');
              return (
                <SectionRow key={sec.id} sec={sec} period={period}
                  inCart={cart.some(c => c.section.id === sec.id)}
                  isEnrolled={!!enr}
                  courseEnrolled={!!enrolledEnr}
                  enrolledEnrId={enrolledEnr?.id}
                  onAdd={onAdd} onRemove={onRemove} onRequestMove={onRequestMove} />
              );
            }) : <div className="no-sections">ไม่มีกลุ่มเรียนเปิดสอนในเทอมนี้</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EnrollmentPage() {
  const [config, setConfig]               = useState<SemesterConfig | null>(null);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [phase, setPhase]                 = useState<'browse' | 'preview'>('browse');
  const [cart, setCart]                   = useState<CartItem[]>([]);
  const [confirmState, setConfirmState]   = useState<ConfirmState | null>(null);
  const [enrolling, setEnrolling]         = useState(false);

  const [currentTermItems, setCurrentTermItems] = useState<PlanItem[]>([]);
  const [retakeItems, setRetakeItems]           = useState<PlanItem[]>([]);
  const [sectionMap, setSectionMap]             = useState<Map<string, Section[]>>(new Map());
  const [passedCourseIds, setPassedCourseIds]   = useState<Set<string>>(new Set());
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('');
  const [showRetake, setShowRetake]  = useState(true);
  const [faculties, setFaculties]    = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedDept, setSelectedDept]       = useState('');
  const [showManage, setShowManage]           = useState(false);
  const [page, setPage]                       = useState(1);
  const PAGE_SIZE = 10;

  // ── Load ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [cfgRes, planRes] = await Promise.all([
          configApi.getCurrentSemester(),
          curriculumApi.getMyPlan(),
        ]);
        const cfg  = cfgRes.data;
        const plan = planRes.data.plan as PlanItem[];
        setConfig(cfg);

        const passed = new Set(plan.filter(i => i.status === 'COMPLETED').map(i => i.courseId));
        setPassedCourseIds(passed);

        const grouped = new Map<string, PlanItem[]>();
        for (const item of plan) {
          if (item.course?.isWildcard) continue;
          const key = `${item.year}-${item.semester}`;
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)!.push(item);
        }
        const sortedKeys = [...grouped.keys()].sort((a, b) => {
          const [ay, as_] = a.split('-').map(Number);
          const [by, bs_] = b.split('-').map(Number);
          return ay !== by ? ay - by : as_ - bs_;
        });

        const curKey = sortedKeys.find(k => grouped.get(k)!.some(i => i.status === 'REMAINING'));
        const curTermItems = curKey ? grouped.get(curKey)!.filter(i => i.status === 'REMAINING') : [];
        const curKeyIdx    = curKey ? sortedKeys.indexOf(curKey) : -1;
        const prevRetake   = sortedKeys
          .slice(0, curKeyIdx < 0 ? sortedKeys.length : curKeyIdx)
          .flatMap(k => grouped.get(k)!.filter(i => i.status === 'REMAINING'));

        const enrRes = await enrollmentApi.getMyEnrollments(cfg.academicYear, cfg.semester);
        setMyEnrollments(enrRes.data);

        const all = [...curTermItems, ...prevRetake];
        const results = await Promise.allSettled(
          all.map(item =>
            enrollmentApi.getSectionsByCourse(item.courseId, cfg.academicYear, cfg.semester)
              .then(r => ({ courseId: item.courseId, sections: r.data as Section[] }))
          )
        );
        const map = new Map<string, Section[]>();
        results.forEach(r => { if (r.status === 'fulfilled') map.set(r.value.courseId, r.value.sections); });
        setSectionMap(map);

        setCurrentTermItems(curTermItems.filter(i => (map.get(i.courseId)?.length ?? 0) > 0));
        setRetakeItems(prevRetake.filter(i => (map.get(i.courseId)?.length ?? 0) > 0));
      } catch { toast.error('โหลดข้อมูลไม่สำเร็จ'); }
      finally { setIsLoading(false); }
    })();
  }, []);

  // ── Fetch faculties once ──────────────────────────────────────────────────
  useEffect(() => {
    facultyApi.getAll().then(r => setFaculties(r.data)).catch(() => {});
  }, []);

  // ── Fetch departments when faculty changes ────────────────────────────────
  useEffect(() => {
    if (!selectedFaculty) { setDepartments([]); setSelectedDept(''); return; }
    departmentApi.getByFaculty(selectedFaculty)
      .then(r => setDepartments(r.data))
      .catch(() => setDepartments([]));
    setSelectedDept('');
  }, [selectedFaculty]);

  const refreshEnrollments = useCallback(async () => {
    if (!config) return;
    const r = await enrollmentApi.getMyEnrollments(config.academicYear, config.semester);
    setMyEnrollments(r.data);
  }, [config]);

  // ── Cart ──────────────────────────────────────────────────────────────────
  const addToCart = useCallback((sec: Section) => {
    if (cart.some(c => c.section.courseId === sec.courseId)) {
      toast.error('มีวิชานี้ในรายการแล้ว'); return;
    }
    const newSched = (sec.schedules ?? []) as SchedLike[];
    // Check conflict with cart items
    for (const c of cart) {
      if (schedulesOverlap(newSched, (c.section.schedules ?? []) as SchedLike[])) {
        toast.error(`เวลาทับกับ ${c.section.course?.courseCode} Sec ${c.section.sectionNo} ในรายการ`, { icon: '⚠️' });
        return;
      }
    }
    // Check conflict with already-enrolled sections
    for (const e of myEnrollments.filter(x => x.status !== 'DROPPED')) {
      if (schedulesOverlap(newSched, (e.section?.schedules ?? []) as SchedLike[])) {
        toast.error(`เวลาทับกับ ${e.section?.course?.courseCode} ที่ลงไปแล้ว`, { icon: '⚠️' });
        return;
      }
    }
    setCart(prev => [...prev, { section: sec }]);
    toast.success(`เพิ่ม ${sec.course?.courseCode} Sec ${sec.sectionNo}`);
  }, [cart, myEnrollments]);

  const removeFromCart = useCallback((sectionId: string) => {
    setCart(prev => prev.filter(c => c.section.id !== sectionId));
  }, []);

  // ── Enrollment confirm ────────────────────────────────────────────────────
  const executeEnroll = async () => {
    setEnrolling(true);
    let ok = 0;
    for (const item of cart) {
      try { await enrollmentApi.enroll(item.section.id); ok++; }
      catch (e: any) { toast.error(e?.response?.data?.message || `Sec ${item.section.sectionNo} ไม่สำเร็จ`); }
    }
    if (ok > 0) toast.success(`ลงทะเบียน ${ok} วิชาสำเร็จ`);
    setCart([]); setPhase('browse');
    await refreshEnrollments();
    setEnrolling(false);
  };

  const requestDrop = (enrollmentId: string, secNo: number) => {
    setConfirmState({
      title: 'ยืนยันการถอนวิชา',
      body: `ต้องการถอน Section ${secNo} ใช่หรือไม่?`,
      variant: 'danger',
      action: async () => {
        try { await enrollmentApi.drop(enrollmentId); toast.success('ถอนวิชาเรียบร้อย'); await refreshEnrollments(); }
        catch (e: any) { toast.error(e?.response?.data?.message || 'ถอนวิชาไม่สำเร็จ'); }
      },
    });
  };

  const requestMove = (enrolledEnrId: string, newSec: Section) => {
    setConfirmState({
      title: 'ยืนยันการย้ายตอนเรียน',
      body: `ต้องการย้ายไป Section ${newSec.sectionNo} ใช่หรือไม่? ตอนเรียนเดิมจะถูกถอนออก`,
      variant: 'primary',
      action: async () => {
        try {
          await enrollmentApi.drop(enrolledEnrId);
          await enrollmentApi.enroll(newSec.id);
          toast.success(`ย้ายไป Sec ${newSec.sectionNo} เรียบร้อย`);
          await refreshEnrollments();
        } catch (e: any) {
          toast.error(e?.response?.data?.message || 'ย้ายตอนเรียนไม่สำเร็จ');
        }
      },
    });
  };

  const requestEnroll = () => {
    setConfirmState({
      title: 'ยืนยันการลงทะเบียน',
      body: `ต้องการลงทะเบียน ${cart.length} วิชาใช่หรือไม่?`,
      variant: 'primary',
      action: executeEnroll,
    });
  };

  const requestBatchDrop = (ids: string[]) => {
    setShowManage(false);
    setConfirmState({
      title: `ยืนยันการถอน ${ids.length} วิชา`,
      body: `ต้องการถอนวิชาที่เลือกทั้ง ${ids.length} รายการใช่หรือไม่?`,
      variant: 'danger',
      action: async () => {
        let ok = 0;
        for (const id of ids) {
          try { await enrollmentApi.drop(id); ok++; }
          catch (e: any) { toast.error(e?.response?.data?.message || 'ถอนวิชาไม่สำเร็จ'); }
        }
        if (ok > 0) toast.success(`ถอน ${ok} วิชาเรียบร้อย`);
        await refreshEnrollments();
      },
    });
  };

  const period = config ? getEnrollPeriod(config) : 'closed';

  // ── Filters ───────────────────────────────────────────────────────────────
  const filterItem = useCallback((item: PlanItem) => {
    const c = item.course; if (!c) return false;
    if (category && c.category !== category) return false;
    if (selectedFaculty && c.facultyId !== selectedFaculty) return false;
    if (selectedDept && c.deptId !== selectedDept) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.courseCode.toLowerCase().includes(q) || c.nameTh.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q);
    }
    return true;
  }, [search, category, selectedFaculty, selectedDept]);

  const filteredCurrent = useMemo(() => currentTermItems.filter(filterItem), [currentTermItems, filterItem]);
  const filteredRetake  = useMemo(() => retakeItems.filter(filterItem), [retakeItems, filterItem]);

  // ── Pagination ────────────────────────────────────────────────────────────
  // Treat current-term + retake as one flat ordered list for page slicing
  const totalFiltered = useMemo(
    () => filteredCurrent.length + (showRetake ? filteredRetake.length : 0),
    [filteredCurrent.length, filteredRetake.length, showRetake],
  );
  const totalPages = Math.ceil(totalFiltered / PAGE_SIZE);

  const pagedCurrent = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    const end   = page * PAGE_SIZE;
    return filteredCurrent.slice(Math.max(0, start), Math.min(filteredCurrent.length, end));
  }, [filteredCurrent, page, PAGE_SIZE]);

  const pagedRetake = useMemo(() => {
    if (!showRetake) return [];
    const start = Math.max(0, (page - 1) * PAGE_SIZE - filteredCurrent.length);
    const end   = Math.max(0, page * PAGE_SIZE - filteredCurrent.length);
    return filteredRetake.slice(start, end);
  }, [filteredRetake, filteredCurrent.length, page, PAGE_SIZE, showRetake]);

  const activeEnrollments = useMemo(() => myEnrollments.filter(e => e.status !== 'DROPPED'), [myEnrollments]);

  // ── Preview timetable = enrolled + cart ───────────────────────────────────
  const cartSectionIds = useMemo(() => new Set(cart.map(c => c.section.id)), [cart]);

  const previewEnrollments = useMemo((): Enrollment[] => {
    const existing = activeEnrollments;
    const cartMocks: Enrollment[] = cart.map(({ section: sec }) => ({
      id: `preview-${sec.id}`, sectionId: sec.id, studentId: '',
      status: 'ENROLLED' as const,
      academicYear: config?.academicYear ?? 0, semester: config?.semester ?? 0,
      midtermScore: 0, finalScore: 0, totalScore: 0,
      section: sec,
    }));
    return [...existing, ...cartMocks];
  }, [activeEnrollments, cart, config]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="loading-state">
        <Loader2 className="spin" size={40} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 8 }}>กำลังโหลดรายวิชา…</p>
      </div>
    );
  }

  // ── Preview phase ─────────────────────────────────────────────────────────
  if (phase === 'preview') {
    const cartCredits = cart.reduce((s, c) => s + (c.section.course?.credits ?? 0), 0);
    const enrCredits  = activeEnrollments.reduce((s, e) => s + (e.section?.course?.credits ?? 0), 0);
    return (
      <motion.div className="enrollment-page"
        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}>

        {/* Header */}
        <div className="preview-header">
          <button className="btn-back" onClick={() => setPhase('browse')}>
            <ArrowLeft size={16} /> กลับแก้ไข
          </button>
          <div>
            <h2 className="preview-title">ตัวอย่างตารางเรียน</h2>
            <p className="preview-sub">ตรวจสอบก่อนยืนยันการลงทะเบียน</p>
          </div>
        </div>

        {/* Timetable */}
        <Timetable enrollments={previewEnrollments} fitWidth pendingSectionIds={cartSectionIds} />

        {/* Cart summary */}
        <div className="preview-summary card">
          <div className="preview-sum-header">
            <ShoppingCart size={15} />
            <h3>วิชาที่จะลงทะเบียน <span className="count-pill">{cart.length} วิชา</span></h3>
          </div>
          <div className="preview-table-wrap">
            <table className="preview-table">
              <thead><tr>
                <th>รหัสวิชา</th><th>ชื่อวิชา</th>
                <th className="text-center">หน่วยกิต</th>
                <th className="text-center">Sec</th>
                <th>อาจารย์</th><th>วัน/เวลา</th><th></th>
              </tr></thead>
              <tbody>
                {cart.map(({ section: sec }) => (
                  <tr key={sec.id} className="preview-row">
                    <td><span className="scs-code">{sec.course?.courseCode}</span></td>
                    <td>
                      <p className="scs-name-th">{sec.course?.nameTh}</p>
                      {sec.course?.nameEn && <p className="scs-name-en">{sec.course.nameEn}</p>}
                    </td>
                    <td className="text-center">{sec.course?.credits}</td>
                    <td className="text-center">{sec.sectionNo}</td>
                    <td>{sec.professor?.user ? `${sec.professor.user.firstName} ${sec.professor.user.lastName}` : '—'}</td>
                    <td>
                      {sec.schedules?.map(s => (
                        <span key={s.id} className="sched-tag">{s.dayOfWeek} {s.startTime}–{s.endTime}</span>
                      ))}
                    </td>
                    <td>
                      <button className="btn-preview-rm" onClick={() => removeFromCart(sec.id)} title="ลบออก"><X size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="preview-footer">
            <div className="preview-credits">
              <span>รวมที่จะลง: <strong>{cartCredits} หน่วยกิต</strong></span>
              {enrCredits > 0 && <span className="existing-cred">+ {enrCredits} ที่ลงแล้ว = {cartCredits + enrCredits} รวม</span>}
            </div>
            <button className="btn-confirm-enroll" onClick={requestEnroll} disabled={cart.length === 0 || enrolling}>
              {enrolling ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />}
              ยืนยันลงทะเบียน {cart.length} วิชา
            </button>
          </div>
        </div>

        {/* Existing enrolled courses */}
        {activeEnrollments.length > 0 && (
          <div className="enrolled-panel card">
            <div className="enrolled-panel-hdr">
              <BookOpen size={14} />
              <h4>ลงทะเบียนไปแล้ว ({activeEnrollments.length} วิชา)</h4>
            </div>
            <div className="enrolled-chips">
              {activeEnrollments.map(e => (
                <span key={e.id} className="enrolled-chip-sm">
                  {e.section?.course?.courseCode} Sec {e.section?.sectionNo}
                </span>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {confirmState && <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ── Browse phase ──────────────────────────────────────────────────────────
  return (
    <motion.div className="enrollment-page"
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>

      {/* Header */}
      <motion.div className="enrollment-header"
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.04 }}>
        <div className="header-content">
          <h1>ลงทะเบียน</h1>
          {config && <p className="enrollment-sub">ภาคเรียน {config.semester}/{config.academicYear}</p>}
        </div>
        <div className="enroll-header-right">
          <div className="enroll-summary-group">
            <button className="enroll-summary-btn" onClick={() => setShowManage(true)}>
              <Info size={14} /><span>{activeEnrollments.length} วิชาที่ลงทะเบียน</span>
            </button>
            {activeEnrollments.length > 0 && (period === 'reg_open' || period === 'withdraw_only') && (
              <button className="btn-manage-drop" onClick={() => setShowManage(true)} title="ถอนวิชา">
                <Trash2 size={14} />
              </button>
            )}
          </div>
          {cart.length > 0 && (
            <button className="cart-preview-btn" onClick={() => setPhase('preview')}>
              <ShoppingCart size={14} />
              รายการ ({cart.length}) → ดูตัวอย่าง
            </button>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div className="enroll-filters"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, delay: 0.08 }}>
        <div className="enr-search-box">
          <Search size={15} className="enr-search-icon" />
          <input placeholder="ค้นหารายวิชา (เช่น CS101, วิทยาศาสตร์)" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          {search && <button className="enr-clear-btn" onClick={() => { setSearch(''); setPage(1); }}><X size={13} /></button>}
        </div>
        <div className="enr-filter-row">
          <FilterDropdown options={CATEGORY_OPTIONS} value={category} onChange={v => { setCategory(v); setPage(1); }} icon={<BookOpen size={12} />} />
          <FilterDropdown
            options={[{ value: '', label: 'ทุกคณะ' }, ...faculties.map(f => ({ value: f.id, label: f.nameTh }))]}
            value={selectedFaculty}
            onChange={v => { setSelectedFaculty(v); setPage(1); }}
            icon={<BookOpen size={12} />}
            disabled={faculties.length === 0}
            placeholder="คณะ"
          />
          <FilterDropdown
            options={[{ value: '', label: 'ทุกภาควิชา' }, ...departments.map(d => ({ value: d.id, label: d.nameTh }))]}
            value={selectedDept}
            onChange={v => { setSelectedDept(v); setPage(1); }}
            icon={<BookOpen size={12} />}
            disabled={!selectedFaculty || departments.length === 0}
            placeholder="ภาควิชา"
          />
          {retakeItems.length > 0 && (
            <motion.button className={`retake-toggle ${showRetake ? 'active' : ''}`}
              onClick={() => { setShowRetake(v => !v); setPage(1); }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <AlertTriangle size={12} /> วิชาตกค้าง ({retakeItems.length})
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Course list */}
      <AnimatePresence mode="wait">
        <motion.div key="courses" className="courses-list"
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
          {filteredCurrent.length === 0 && filteredRetake.length === 0 ? (
            <div className="no-data-msg"><p>ไม่พบรายวิชาที่ตรงกับเงื่อนไข</p></div>
          ) : (
            <>
              {pagedCurrent.map(item => (
                <motion.div key={item.id}
                  variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.28 } } }}>
                  <CourseCard item={item} sections={sectionMap.get(item.courseId) ?? []}
                    period={period} myEnrollments={myEnrollments} cart={cart}
                    passedCourseIds={passedCourseIds}
                    onAdd={addToCart} onRemove={removeFromCart} onRequestMove={requestMove} />
                </motion.div>
              ))}
              {showRetake && pagedRetake.length > 0 && (
                <>
                  <div className="retake-section-label">
                    <AlertTriangle size={13} />
                    <span>วิชาตกค้างจากเทอมที่ผ่านมา</span>
                    <div className="retake-divider" />
                  </div>
                  {pagedRetake.map(item => (
                    <motion.div key={item.id}
                      variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.28 } } }}>
                      <CourseCard item={item} sections={sectionMap.get(item.courseId) ?? []}
                        period={period} myEnrollments={myEnrollments} cart={cart}
                        passedCourseIds={passedCourseIds} isRetake
                        onAdd={addToCart} onRemove={removeFromCart} onRequestMove={requestMove} />
                    </motion.div>
                  ))}
                </>
              )}
              {totalPages > 1 && (
                <Pagination 
                  currentPage={page} 
                  lastPage={totalPages} 
                  onPageChange={setPage} 
                  className="enr-pagination"
                />
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>


      {/* Sticky cart bar */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div className="cart-sticky-bar"
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 30 }}>
            <div className="cart-bar-left">
              <ShoppingCart size={15} />
              <span className="cart-bar-label">รายการลงทะเบียน</span>
              <span className="cart-bar-count">{cart.length} วิชา</span>
              <div className="cart-bar-items">
                {cart.map(c => (
                  <span key={c.section.id} className="cart-chip-sm">
                    {c.section.course?.courseCode}
                    <button onClick={() => removeFromCart(c.section.id)}><X size={9} /></button>
                  </span>
                ))}
              </div>
            </div>
            <button className="cart-bar-proceed" onClick={() => setPhase('preview')}>
              ดูตัวอย่างและยืนยัน →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmState && <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />}
      </AnimatePresence>

      {/* Manage enrollments modal */}
      <AnimatePresence>
        {showManage && (
          <ManageModal
            enrollments={activeEnrollments}
            period={period}
            onClose={() => setShowManage(false)}
            onBatchDrop={requestBatchDrop}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
