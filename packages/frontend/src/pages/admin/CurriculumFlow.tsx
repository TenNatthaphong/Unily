import { useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { curriculumApi } from '../../api/curriculum.api';
import { curriculumItemApi } from '../../api/curriculum-item.api';
import { courseApi } from '../../api/course.api';
import { facultyApi } from '../../api/faculty.api';
import { departmentApi } from '../../api/department.api';
import type { Course, Curriculum, Faculty, Department } from '../../types';
import Portal from '../../components/ui/Portal';
import { Select } from '../../components/ui/Select';
import {
  ArrowLeft, Save, Loader2, Plus, ZoomIn, ZoomOut,
  ChevronRight, Copy, Search, GraduationCap, X, BookOpen, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import './CurriculumFlow.css';

const formatCourseCredits = (c: any) => {
  if (!c) return '?';
  if (c.isWildcard) return `${c.credits}(x-x-x)`;
  const hasHours = c.lectureHours != null || c.labHours != null || c.selfStudyHours != null;
  if (!hasHours) return String(c.credits ?? '?');
  return `${c.credits}(${c.lectureHours ?? 0}-${c.labHours ?? 0}-${c.selfStudyHours ?? 0})`;
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface ColKey { year: number; semester: number; }
interface CourseItem {
  id?: string;
  renderId: string; // Internal stable key for UI
  courseId: string;
  year: number;
  semester: number;
  mappingPattern?: string;
  course?: Course;
}

const CAT_LABELS: Record<string, string> = {
  GENERAL_EDUCATION: 'ศึกษาทั่วไป', CORE_COURSE: 'วิชาแกน',
  REQUIRED_COURSE: 'วิชาเอกบังคับ', MAJOR_ELECTIVE: 'วิชาเอกเลือก',
  FREE_ELECTIVE: 'วิชาเสรี', COOP_COURSE: 'สหกิจศึกษา',
};
const CAT_COLORS: Record<string, string> = {
  GENERAL_EDUCATION: '#3b82f6', CORE_COURSE: '#8b5cf6',
  REQUIRED_COURSE: '#10b981', MAJOR_ELECTIVE: '#f59e0b',
  FREE_ELECTIVE: '#6b7280', COOP_COURSE: '#ef4444',
};

function colKey(y: number, s: number) { return `${y}-${s}`; }

// ── Copy Curriculum Modal ─────────────────────────────────────────────────────
function CopyCurriculumModal({ onConfirm, onCancel }: { onConfirm: (id: string) => void; onCancel: () => void }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!search) { setResults([]); return; }
    const t = setTimeout(() => {
      setLoading(true);
      curriculumApi.search({ search, limit: 10 }).then(r => setResults(r.data.data)).finally(() => setLoading(false));
    }, 500);
    return () => clearTimeout(t);
  }, [search]);
  return (
    <Portal>
      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal modal-md" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3><Copy size={18} /> คัดลอกจากหลักสูตรอื่น</h3>
            <button className="btn-close" onClick={onCancel}>×</button>
          </div>
          <div className="modal-content">
            <div className="search-box mb-4"><Search size={18} /><input placeholder="ค้นหารหัสหรือชื่อหลักสูตร..." autoFocus value={search} onChange={e => setSearch(e.target.value)} /></div>
            <div className="copy-list">
              {loading && <div className="text-center py-4"><Loader2 className="spin" /></div>}
              {results.map(c => (
                <div key={c.id} className="copy-item" onClick={() => onConfirm(c.id)}>
                  <div className="copy-item-info"><span className="code">{c.curriculumCode}</span><span className="name">{c.name} (ปี {c.year})</span></div>
                  <ChevronRight size={16} />
                </div>
              ))}
              {!loading && search && results.length === 0 && <div className="text-center py-4 text-muted">ไม่พบข้อมูล</div>}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

// ── Add Column Modal ──────────────────────────────────────────────────────────
function AddColumnModal({ existingCols, onAdd, onCancel }: { existingCols: ColKey[]; onAdd: (y: number, s: number) => void; onCancel: () => void }) {
  const [year, setYear] = useState(1);
  const [semester, setSemester] = useState(1);
  const exists = existingCols.some(c => c.year === year && c.semester === semester);
  return (
    <Portal>
      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header"><h3>เพิ่มคอลัมน์ใหม่</h3><button className="btn-close" onClick={onCancel}>×</button></div>
          <div className="modal-content">
            <div className="hours-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>ปีที่ <small className="req">*</small></label>
                <input type="number" min={1} max={10} value={year} onChange={e => setYear(Math.max(1, +e.target.value))} />
              </div>
              <div className="form-group">
                <label>เทอมที่ <small className="req">*</small></label>
                <input type="number" min={1} max={4} value={semester} onChange={e => setSemester(Math.max(1, +e.target.value))} />
              </div>
            </div>
            {exists && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: 8 }}>⚠ ปีที่ {year} เทอม {semester} มีอยู่แล้วในหลักสูตร</p>}
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" style={{ padding: '8px 16px', border: 'none', background: 'transparent', cursor: 'pointer' }} onClick={onCancel}>ยกเลิก</button>
            <button className="btn btn-primary" disabled={exists} onClick={() => onAdd(year, semester)}>
              <Plus size={16} /> เพิ่มคอลัมน์
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}


// ── Main Component ────────────────────────────────────────────────────────────
export default function CurriculumFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [isLoading, setIsLoading] = useState(true);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  // Structured state
  const [columns, setColumns] = useState<ColKey[]>(() => {
    const cols: ColKey[] = [];
    for (let y = 1; y <= 4; y++) for (let s = 1; s <= 2; s++) cols.push({ year: y, semester: s });
    return cols;
  });
  const [coursesByCol, setCoursesByCol] = useState<Record<string, CourseItem[]>>({});

  const [form, setForm] = useState({ name: '', curriculumCode: '', year: new Date().getFullYear() + 543, facultyId: '', deptId: '', description: '', note: '' });

  // Palette State
  const [paletteSearch, setPaletteSearch] = useState('');
  const [paletteCat, setPaletteCat] = useState('');

  // Modals
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showAddColModal, setShowAddColModal] = useState(false);

  // Drag State
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Validation Check State
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState({ isOpen: false, maxYear: 0 });

  // Zoom
  const [zoomLevel, setZoomLevel] = useState(1);

  // SVG Refs & State
  const trackRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [arrows, setArrows] = useState<{ srcId: string; dstId: string; x1: number; y1: number; x2: number; y2: number; }[]>([]);
  const lastCompute = useRef(0);
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);

  const flatCoursesInPlan = useMemo(() => Object.values(coursesByCol).flat(), [coursesByCol]);
  
  const allCourseIds = useMemo(() => {
    const s = new Set<string>();
    flatCoursesInPlan.forEach(i => s.add(i.courseId));
    return s;
  }, [flatCoursesInPlan]);

  const courseRenderIdMap = useMemo(() => new Map(flatCoursesInPlan.map(i => [i.renderId, i])), [flatCoursesInPlan]);
  
  // To find a course's occurrence by its courseId (for arrows/prereqs)
  const courseIdToRenderIds = useMemo(() => {
    const m = new Map<string, string[]>();
    flatCoursesInPlan.forEach(i => {
      const list = m.get(i.courseId) || [];
      list.push(i.renderId);
      m.set(i.courseId, list);
    });
    return m;
  }, [flatCoursesInPlan]);

  const sortedColumns = useMemo(() =>
    [...columns].sort((a, b) => a.year !== b.year ? a.year - b.year : a.semester - b.semester),
    [columns]
  );
  
  const totalCreditsUsed = useMemo(() => flatCoursesInPlan.reduce((s, i) => s + (i.course?.credits || 0), 0), [flatCoursesInPlan]);

  // ── Compute Arrows ───────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!trackRef.current) return;
    const compute = () => {
      if (!trackRef.current) return;
      
      // Throttle/Debounce check to prevent DOM trashing during rapid resizing or state batching
      const now = performance.now();
      if (now - lastCompute.current < 16) return; // Cap at ~60fps
      lastCompute.current = now;

      const trackRect = trackRef.current.getBoundingClientRect();
      const newArrows: typeof arrows = [];
      
      for (const [rId, item] of courseRenderIdMap) {
        const prereqs = item.course?.prerequisites || [];
        for (const p of prereqs) {
          // Find all occurrences of the REQUIRED course
          const srcRenderIds = courseIdToRenderIds.get(p.requiresCourseId) || [];
          
          for (const sRId of srcRenderIds) {
            const srcEl = nodeRefs.current.get(sRId);
            const tgtEl = nodeRefs.current.get(rId);
            if (!srcEl || !tgtEl) continue;
            
            const srcR = srcEl.getBoundingClientRect();
            const tgtR = tgtEl.getBoundingClientRect();
            
            const x1 = (srcR.right - trackRect.left) / zoomLevel;
            const y1 = (srcR.top + srcR.height / 2 - trackRect.top) / zoomLevel;
            const x2 = (tgtR.left - trackRect.left) / zoomLevel;
            const y2 = (tgtR.top + tgtR.height / 2 - trackRect.top) / zoomLevel;
            
            newArrows.push({ srcId: sRId, dstId: rId, x1, y1, x2, y2 });
          }
        }
      }
      setArrows(newArrows);
    };
    
    // Initial run
    setTimeout(compute, 0); 
    const ro = new ResizeObserver(() => requestAnimationFrame(compute));
    ro.observe(trackRef.current);
    // Observe all children too
    Array.from(nodeRefs.current.values()).forEach(node => ro.observe(node));
    return () => ro.disconnect();
  }, [flatCoursesInPlan, courseRenderIdMap, courseIdToRenderIds, zoomLevel]);

  const [palettePage, setPalettePage] = useState(1);
  const PALETTE_PAGE_SIZE = 10;

  const filteredPaletteRaw = useMemo(() => {
    let r = allCourses;
    if (paletteCat) r = r.filter(c => c.category === paletteCat);
    if (paletteSearch) {
      const q = paletteSearch.toLowerCase();
      r = r.filter(c => c.courseCode.toLowerCase().includes(q) || c.nameTh.toLowerCase().includes(q));
    }
    return r;
  }, [allCourses, paletteSearch, paletteCat]);

  const filteredPalette = useMemo(() => {
    const start = (palettePage - 1) * PALETTE_PAGE_SIZE;
    return filteredPaletteRaw.slice(start, start + PALETTE_PAGE_SIZE);
  }, [filteredPaletteRaw, palettePage]);

  useEffect(() => { setPalettePage(1); }, [paletteSearch, paletteCat]);


  // ── Load initial ─────────────────────────────────────────────────────────
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    Promise.all([facultyApi.getAll(), courseApi.search({ limit: 2000 })]).then(([fr, cr]) => {
      setFaculties(Array.isArray(fr.data) ? fr.data : (fr.data as any).data || []);
      setAllCourses(Array.isArray(cr.data) ? cr.data : cr.data.data || []);
      setIsReady(true);
    });
  }, []);

  const courseMap = useMemo(() => new Map(allCourses.map(c => [c.id, c])), [allCourses]);

  // Detail Modal State
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const selectedCourse = useMemo(() => {
    if (!selectedCourseId) return null;
    return courseMap.get(selectedCourseId);
  }, [selectedCourseId, courseMap]);

  // ── Apply loaded curriculum data ──────────────────────────────────────────
  const applyData = useCallback((c: any, nameOverride?: string, codeOverride?: string, preserveIds: boolean = true) => {
    setForm({
      name: nameOverride ?? c.name,
      curriculumCode: codeOverride ?? c.curriculumCode,
      year: c.year,
      facultyId: c.facultyId, deptId: c.deptId,
      description: c.description || '', note: c.note || '',
    });

    const items: CourseItem[] = (c.curriculumCourses || []).sort(
      // Ensure we sort by their stored Y position (1-n) to maintain vertical order when rendering
      (a: any, b: any) => a.positionY - b.positionY
    ).map((ci: any) => ({
      id: preserveIds ? ci.id : undefined,
      renderId: crypto.randomUUID(),
      courseId: ci.courseId,
      year: ci.year,
      semester: ci.semester,
      positionX: ci.positionX,
      positionY: ci.positionY,
      mappingPattern: ci.mappingPattern,
      course: ci.course ? ci.course : courseMap.get(ci.courseId),
    }));

    const usedCols: ColKey[] = [];
    const colMap: Record<string, CourseItem[]> = {};
    items.forEach(item => {
      const k = colKey(item.year, item.semester);
      if (!colMap[k]) { colMap[k] = []; usedCols.push({ year: item.year, semester: item.semester }); }
      colMap[k].push(item);
    });

    const defaultCols: ColKey[] = [];
    for (let y = 1; y <= 4; y++) for (let s = 1; s <= 2; s++) defaultCols.push({ year: y, semester: s });
    const allColKeys = new Set([...defaultCols.map(c => colKey(c.year, c.semester)), ...usedCols.map(c => colKey(c.year, c.semester))]);
    const mergedCols = [...allColKeys].map(k => { const [y, s] = k.split('-').map(Number); return { year: y, semester: s }; });
    setColumns(mergedCols);
    setCoursesByCol(colMap);
  }, [courseMap]);

  const loadCurriculum = useCallback(async (currId: string) => {
    setIsLoading(true);
    try {
      const r = await curriculumApi.getById(currId);
      const c = (r.data as any).data || r.data;
      applyData(c, isNew ? `${c.name} (สำเนา)` : undefined, isNew ? `${c.curriculumCode}-COPY` : undefined);
    } catch { toast.error('ไม่สามารถโหลดข้อมูลหลักสูตรได้'); }
    finally { setIsLoading(false); }
  }, [isNew, applyData]);

  useEffect(() => {
    if (!isReady) return;
    if (isNew) setIsLoading(false);
    else if (id) loadCurriculum(id);
  }, [id, isNew, isReady, loadCurriculum]);

  useEffect(() => {
    if (form.facultyId) departmentApi.getByFaculty(form.facultyId).then(r => setDepartments(r.data));
    else setDepartments([]);
  }, [form.facultyId]);

  // ── Column management ─────────────────────────────────────────────────────
  const handleAddColumn = (y: number, s: number) => {
    setColumns(p => [...p, { year: y, semester: s }]);
    setShowAddColModal(false);
  };

  const handleRemoveColumn = (y: number, s: number) => {
    const k = colKey(y, s);
    const count = coursesByCol[k]?.length || 0;
    if (count > 0 && !confirm(`ปีที่ ${y} เทอม ${s} มี ${count} วิชา ต้องการลบคอลัมน์นี้ทั้งหมด?`)) return;
    setColumns(p => p.filter(c => !(c.year === y && c.semester === s)));
    setCoursesByCol(p => { const n = { ...p }; delete n[k]; return n; });
  };

  const trackWrapperRef = useRef<HTMLDivElement>(null);
  const [viewportStyle, setViewportStyle] = useState({ left: '0%', width: '100%', top: '0%', height: '100%' });

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollWidth === 0 || el.scrollHeight === 0) return;
    setViewportStyle({
      left: `${(el.scrollLeft / el.scrollWidth) * 100}%`,
      width: `${(el.clientWidth / el.scrollWidth) * 100}%`,
      top: `${(el.scrollTop / el.scrollHeight) * 100}%`,
      height: `${(el.clientHeight / el.scrollHeight) * 100}%`
    });
  }, []);

  useEffect(() => {
    if (trackWrapperRef.current) {
      handleScroll({ currentTarget: trackWrapperRef.current } as React.UIEvent<HTMLDivElement>);
    }
  }, [columns, zoomLevel, flatCoursesInPlan.length, handleScroll]);

  // ── Track Panning ────────────────────────────────────────────────────────
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const onPanStart = (e: React.MouseEvent) => {
    // Only pan if clicking empty track areas
    if ((e.target as HTMLElement).closest('.cf-card, .cf-col-header, .cf-add-course-btn, button, input')) return;
    isPanning.current = true;
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: trackWrapperRef.current?.scrollLeft || 0,
      scrollTop: trackWrapperRef.current?.scrollTop || 0
    };
    if (trackWrapperRef.current) trackWrapperRef.current.style.cursor = 'grabbing';
  };

  const onPanMove = (e: React.MouseEvent) => {
    if (!isPanning.current || !trackWrapperRef.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    trackWrapperRef.current.scrollLeft = panStart.current.scrollLeft - dx;
    trackWrapperRef.current.scrollTop = panStart.current.scrollTop - dy;
  };

  const onPanEnd = () => {
    isPanning.current = false;
    if (trackWrapperRef.current) trackWrapperRef.current.style.cursor = '';
  };

  // ── Minimap Panning ───────────────────────────────────────────────────────
  const minimapRef = useRef<HTMLDivElement>(null);
  const isMinimapPanning = useRef(false);

  const handleMinimapPan = useCallback((e: React.MouseEvent) => {
    if (!minimapRef.current || !trackWrapperRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const tw = trackWrapperRef.current;
    
    // We want the user's mouse pointer to match the center of the rendered viewport
    tw.scrollLeft = (x * tw.scrollWidth) - (tw.clientWidth / 2);
    tw.scrollTop = (y * tw.scrollHeight) - (tw.clientHeight / 2);
  }, []);

  const onMinimapMouseDown = (e: React.MouseEvent) => {
    isMinimapPanning.current = true;
    if (minimapRef.current) minimapRef.current.style.cursor = 'grabbing';
    handleMinimapPan(e);
  };

  const onMinimapMouseMove = (e: React.MouseEvent) => {
    if (isMinimapPanning.current) handleMinimapPan(e);
  };

  const onMinimapMouseUp = () => {
    isMinimapPanning.current = false;
    if (minimapRef.current) minimapRef.current.style.cursor = 'crosshair';
  };

  // Object mapping courseId -> { year, semester } for prerequisite checks
  const courseTermMap = useMemo(() => {
    const m = new Map<string, { year: number, semester: number }>();
    flatCoursesInPlan.forEach(i => m.set(i.courseId, { year: i.year, semester: i.semester }));
    return m;
  }, [flatCoursesInPlan]);

  // ── Drag and Drop Handlers ────────────────────────────────────────────────
  const onDragStart = (e: React.DragEvent, courseId: string, sourceCol?: string) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ courseId, sourceCol }));
    e.dataTransfer.effectAllowed = 'all'; // Critical to allow cross-region move evaluation
  };

  const onDragOver = (e: React.DragEvent, col: ColKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colKey(col.year, col.semester));
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCol(null);
  };

  const onDrop = (e: React.DragEvent, col: ColKey) => {
    e.preventDefault();
    setDragOverCol(null);
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const k = colKey(col.year, col.semester);
      
      const colBody = e.currentTarget.querySelector('.cf-col-body');
      let dropIndex = coursesByCol[k]?.length || 0;
      if (colBody) {
        const cards = Array.from(colBody.querySelectorAll('.cf-card'));
        for (let i = 0; i < cards.length; i++) {
          const rect = cards[i].getBoundingClientRect();
          if (e.clientY < rect.top + rect.height / 2) {
            dropIndex = i;
            break;
          }
        }
      }

      if (data.courseId) {
        if (data.sourceCol) {
           // Move existing course from another term or inside same term
           setCoursesByCol(p => {
             const newP = { ...p };
             const sourceItems = newP[data.sourceCol] || [];
             const itemToMove = sourceItems.find(i => i.courseId === data.courseId);
             if (!itemToMove) return p;
             
             newP[data.sourceCol] = sourceItems.filter(i => i.courseId !== data.courseId);
             newP[k] = [...(newP[k] || [])];
             
             let adjDropIndex = dropIndex;
             if (data.sourceCol === k) {
                const oldIndex = p[k].findIndex(i => i.courseId === data.courseId);
                if (oldIndex < dropIndex) adjDropIndex--; 
             }
             newP[k].splice(adjDropIndex, 0, { ...itemToMove, renderId: itemToMove.renderId || crypto.randomUUID(), year: col.year, semester: col.semester });
             return newP;
           });
        } else {
           // Add new course from palette
           if (allCourseIds.has(data.courseId)) {
             toast.error('วิชานี้มีอยู่ในหลักสูตรแล้ว');
             return;
           }
           const course = courseMap.get(data.courseId);
           if (course) {
             setCoursesByCol(p => {
               const newP = { ...p };
               newP[k] = [...(newP[k] || [])];
               newP[k].splice(dropIndex, 0, { 
                 renderId: crypto.randomUUID(),
                 courseId: course.id, 
                 year: col.year, 
                 semester: col.semester, 
                 course 
               });
               return newP;
             });
           }
        }
      }
    } catch {
      // Ignore
    }
  };

  const handleRemoveCourse = (col: ColKey, courseId: string) => {
    const k = colKey(col.year, col.semester);
    setCoursesByCol(p => ({ ...p, [k]: p[k].filter(i => i.courseId !== courseId) }));
  };

  const addMissingPrereqs = (col: ColKey, missingCourseIds: string[]) => {
    const k = colKey(col.year, col.semester);
    setCoursesByCol(p => {
      const newP = { ...p };
      const newItems = missingCourseIds.map(mc => ({
        renderId: crypto.randomUUID(),
        courseId: mc, year: col.year, semester: col.semester, course: courseMap.get(mc)!
      }));
      newP[k] = [...(newP[k] || []), ...newItems];
      return newP;
    });
    toast.success('เพิ่มวิชาบังคับก่อนลงในเทอมนี้แล้ว');
  };

  // ── Copy ──────────────────────────────────────────────────────────────────
  const handleCopy = async (sourceId: string) => {
    setShowCopyModal(false);
    const tid = toast.loading('กำลังคัดลอกข้อมูล...');
    try {
      const fr = await curriculumApi.getById(sourceId);
      const fs = (fr.data as any).data || fr.data;
      applyData(fs, `${fs.name} (สำเนา)`, undefined, false);
      toast.success('คัดลอกข้อมูลต้นแบบแล้ว', { id: tid });
    } catch { toast.error('ไม่สามารถคัดลอกข้อมูลได้', { id: tid }); }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!form.name || !form.curriculumCode || !form.facultyId || !form.deptId) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน'); return;
    }

    // --- Prerequisite Validation ---
    let hasValidationError = false;
    for (const item of flatCoursesInPlan) {
      const prereqs = item.course?.prerequisites || [];
      for (const pr of prereqs) {
        const prereqTerm = courseTermMap.get(pr.requiresCourseId);
        if (!prereqTerm) {
          toast.error(`วิชา ${item.course?.courseCode} ขาดวิชาบังคับก่อน: ${courseMap.get(pr.requiresCourseId)?.courseCode || pr.requiresCourseId}`);
          hasValidationError = true;
          break;
        }
        if (prereqTerm.year > item.year || (prereqTerm.year === item.year && prereqTerm.semester >= item.semester)) {
          toast.error(`วิชาบังคับก่อน (${courseMap.get(pr.requiresCourseId)?.courseCode}) ของ ${item.course?.courseCode} ต้องอยู่เทอมก่อนหน้าเท่านั้น`);
          hasValidationError = true;
          break;
        }
      }
      if (hasValidationError) break;
    }
    if (hasValidationError) return;

    const maxYear = Math.max(...sortedColumns.map(c => c.year), 0);
    if (maxYear > 4) {
      setShowSaveConfirmModal({ isOpen: true, maxYear });
    } else {
      executeSave();
    }
  };

  const executeSave = async () => {
    setShowSaveConfirmModal({ isOpen: false, maxYear: 0 });

    const tid = toast.loading('กำลังบันทึกข้อมูลหลักสูตร...');
    try {
      let currId = id as string;
      const savePayload = { ...form, totalCredits: totalCreditsUsed };

      if (isNew) {
        const nr = await curriculumApi.create(savePayload);
        currId = (nr.data as any).id || nr.data.id;
      } else {
        await curriculumApi.update(currId, savePayload);
      }

      // Map positions correctly (1-n) based on render order (vertical list array order equals positionY)
      const items = sortedColumns.flatMap((col, colIdx) => {
        const k = colKey(col.year, col.semester);
        return (coursesByCol[k] || []).map((item, idx) => ({
          courseId: item.courseId,
          year: col.year,
          semester: col.semester,
          positionX: colIdx + 1, // Start column 1
          positionY: idx + 1, // Start element 1
          mappingPattern: item.mappingPattern,
        }));
      });

      await curriculumItemApi.syncFlow(currId, items);
      toast.success('บันทึกหลักสูตรสำเร็จ', { id: tid });
      if (isNew) navigate(`/admin/curriculums/${currId}/flow`, { replace: true });
      else loadCurriculum(currId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'บันทึกไม่สำเร็จ', { id: tid });
    }
  };


  if (isLoading) return <div className="loading-state"><Loader2 className="spin" size={48} /><p>กำลังเตรียมพื้นที่ทำงาน...</p></div>;

  return (
    <div className="cf-page">
      <div className="cf-header">
        <div className="cf-header-top">
          <button className="btn-icon" onClick={() => navigate('/admin/curriculums')}><ArrowLeft size={20} /></button>
          <div className="cf-title">
            <GraduationCap size={22} className="text-primary" />
            <h2>{isNew ? 'สร้างหลักสูตรใหม่' : 'แก้ไขโครงสร้างหลักสูตร'}</h2>
            <span className="badge badge-ghost">{flatCoursesInPlan.length} วิชา · {totalCreditsUsed} หน่วยกิตรวม</span>
          </div>
          <div className="cf-header-actions">

            <button className="btn btn-secondary" onClick={() => setShowCopyModal(true)}><Copy size={16} /> คัดลอก</button>
            <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> บันทึกหลักสูตร</button>
          </div>
        </div>

        <div className="cf-form card">
          <div className="form-grid-4">
            <div className="form-group">
              <label>รหัสหลักสูตร <small className="req">*</small></label>
              <input placeholder="เช่น CS-2567" value={form.curriculumCode} onChange={e => setForm(p => ({ ...p, curriculumCode: e.target.value }))} />
            </div>
            <div className="form-group span-2">
              <label>ชื่อหลักสูตร <small className="req">*</small></label>
              <input placeholder="ระบุชื่อหลักสูตรภาษาไทย" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>ปีปรับปรุง</label>
              <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: +e.target.value }))} />
            </div>
            <div className="form-group">
              <label>คณะ <small className="req">*</small></label>
              <Select value={form.facultyId} onChange={v => setForm(p => ({ ...p, facultyId: v, deptId: '' }))} options={faculties.map(f => ({ value: f.id, label: f.nameTh }))} placeholder="เลือกคณะ" />
            </div>
            <div className="form-group">
              <label>สาขาวิชา <small className="req">*</small></label>
              <Select value={form.deptId} disabled={!form.facultyId} onChange={v => setForm(p => ({ ...p, deptId: v }))} options={departments.map(d => ({ value: d.id, label: d.nameTh }))} placeholder="เลือกสาขา" />
            </div>
            <div className="form-group span-2">
              <label>หมายเหตุ / Note</label>
              <input placeholder="ข้อมูลเพิ่มเติม..." value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      <div className="flow-workspace">
        {/* Left Sidebar Palette */}
        <div className="course-palette">
          <div className="palette-header">
            <h4><BookOpen size={18} /> รายวิชาทั้งหมด</h4>
            <div className="palette-filters">
              <div className="search-box">
                <Search size={16} className="text-muted" />
                <input placeholder="รหัส หรือ ชื่อวิชา..." value={paletteSearch} onChange={e => setPaletteSearch(e.target.value)} />
              </div>
              <Select 
                value={paletteCat} onChange={setPaletteCat} 
                options={[{value: '', label: 'ทุกหมวดหมู่'}].concat(Object.entries(CAT_LABELS).map(([k, v]) => ({ value: k, label: v })))} 
              />
            </div>
          </div>
          <div className="palette-list">
            {filteredPalette.map(c => {
              const used = allCourseIds.has(c.id);
              return (
                <div 
                  key={c.id} 
                  className={`acm-course-item ${used ? 'used' : ''}`}
                  draggable={!used}
                  onDragStart={e => onDragStart(e, c.id)}
                  title={used ? 'วิชานี้ถูกเพิ่มในโครงสร้างแล้ว' : 'คลิกค้างแล้วลากเพื่อเพิ่มในเทอม'}
                >
                  <span className="ac-cat-badge" style={{ background: CAT_COLORS[c.category] + '20', color: CAT_COLORS[c.category] }}>{CAT_LABELS[c.category] || '...'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--primary)', lineHeight: 1.1 }}>{c.courseCode}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nameTh}</div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{formatCourseCredits(c)}</span>
                </div>
              );
            })}
            {filteredPalette.length === 0 && <div className="text-center py-4 text-muted">ไม่พบข้อมูล</div>}
            
            {filteredPaletteRaw.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <button className="btn btn-ghost btn-sm" disabled={palettePage === 1} onClick={() => setPalettePage(p => p - 1)}>ก่อนหน้า</button>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{palettePage} / {Math.ceil(filteredPaletteRaw.length / PALETTE_PAGE_SIZE)}</span>
                <button className="btn btn-ghost btn-sm" disabled={palettePage * PALETTE_PAGE_SIZE >= filteredPaletteRaw.length} onClick={() => setPalettePage(p => p + 1)}>ถัดไป</button>
              </div>
            )}
          </div>
        </div>

        {/* Main Canvas Tracks (Zoomable Container) */}
        <div className="cf-canvas">
          <div 
            className="cf-track-wrapper" 
            ref={trackWrapperRef} 
            onScroll={handleScroll}
            onMouseDown={onPanStart}
            onMouseMove={onPanMove}
            onMouseUp={onPanEnd}
            onMouseLeave={onPanEnd}
          >
             {/* Uses transform: scale() to emulate zooming while maintaining scroll logic. 
                 Using Zoom CSS property handles scrollbar preservation correctly on most browsers */}
            <div 
              className="cf-track" 
              ref={trackRef} 
              style={{ 
                position: 'relative', 
                transform: `scale(${zoomLevel})`, 
                transformOrigin: '0 0',
                minHeight: 'calc(100vh - 120px)' 
              }}
            >
              
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                <defs>
                  <marker id="arrow-head" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                    <path d="M0,0.5 L0,6.5 L6.5,3.5 z" fill="rgba(30, 58, 138, 0.85)" />
                  </marker>
                </defs>
                {arrows.map(a => {
                  const dx = a.x2 - a.x1;
                  const cpX = Math.min(dx * 0.5, 110);
                  const cx1 = a.x1 + cpX;
                  const cx2 = a.x2 - cpX;
                  const d = `M${a.x1},${a.y1} C${cx1},${a.y1} ${cx2},${a.y2} ${a.x2},${a.y2}`;
                  const isHovered = hoveredCourseId && (a.srcId === hoveredCourseId || a.dstId === hoveredCourseId);
                  const opacity = hoveredCourseId ? (isHovered ? 1 : 0.05) : 0.85;
                  const color = `rgba(30, 58, 138, ${isHovered ? 1 : 0.75})`;
                  
                  return (
                    <path
                      key={`${a.srcId}-${a.dstId}`}
                      d={d}
                      stroke={color}
                      strokeWidth={isHovered ? 3 : 2}
                      fill="none"
                      strokeLinecap="round"
                      markerEnd="url(#arrow-head)"
                      opacity={opacity}
                      style={{ transition: 'opacity 0.2s' }}
                    />
                  );
                })}
              </svg>

              {sortedColumns.map((col) => {
                const k = colKey(col.year, col.semester);
                const items = coursesByCol[k] || [];
                const credits = items.reduce((s, i) => s + (i.course?.credits || 0), 0);
                const isDragOver = dragOverCol === k;

                return (
                  <div
                    key={k}
                    className={`cf-column ${isDragOver ? 'drag-over' : ''}`}
                    onDragOver={e => onDragOver(e, col)}
                    onDragLeave={onDragLeave}
                    onDrop={e => onDrop(e, col)}
                  >
                    <div className="cf-col-header">
                      <div className="cf-col-title">
                        <span className="cf-col-year">ปีที่ {col.year} เทอม {col.semester}</span>
                        <span className="cf-col-credits">{credits} หน่วยกิต</span>
                      </div>
                      <button className="cf-col-del" title="ลบคอลัมน์นี้" onClick={() => handleRemoveColumn(col.year, col.semester)}><X size={12} /></button>
                    </div>

                    <div className="cf-col-body">
                      {items.length === 0 && <div style={{ textAlign: 'center', padding: '16px', color: 'rgba(0,0,0,0.1)', fontSize: '0.8rem', border: '1px dashed var(--border)', borderRadius: '8px' }}>ลากวิชามาวางที่นี่</div>}
                      {items.map((item) => {
                        const c = item.course;
                        const color = c ? CAT_COLORS[c.category] : '#6b7280';
                        
                        // Check Missing Prereqs (Strictly Prior Terms)
                        const prereqs = c?.prerequisites || [];
                        const missingCourseIds: string[] = [];
                        let isMissing = false;
                        
                        prereqs.forEach(pr => {
                          const prereqTerm = courseTermMap.get(pr.requiresCourseId);
                          if (!prereqTerm) {
                            // Missing entirely from curriculum
                            isMissing = true;
                            missingCourseIds.push(pr.requiresCourseId);
                          } else if (
                            prereqTerm.year > col.year || 
                            (prereqTerm.year === col.year && prereqTerm.semester >= col.semester)
                          ) {
                            // Found, but placed in a later or same term!
                            isMissing = true;
                          }
                        });

                        return (
                          <div 
                            key={item.renderId} 
                            className={`cf-card ${isMissing ? 'has-error' : ''}`} 
                            style={{ borderLeftColor: color, cursor: 'pointer' }}
                            onClick={() => setSelectedCourseId(item.courseId)}
                            ref={el => {
                              if (el) nodeRefs.current.set(item.renderId, el);
                              else nodeRefs.current.delete(item.renderId);
                            }}
                            onMouseEnter={() => setHoveredCourseId(item.renderId)}
                            onMouseLeave={() => setHoveredCourseId(null)}
                            draggable
                            onDragStart={e => onDragStart(e, item.courseId, k)}
                            title="ลากเพื่อย้ายเทอม"
                          >
                            <div className="cf-card-top">
                              <span className="cf-card-code" style={{ color }}>{c?.courseCode || '?'}</span>
                              <span className="cf-card-cr">{formatCourseCredits(c)}</span>
                              <button 
                                className="cf-card-del" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  handleRemoveCourse(col, item.courseId); 
                                }}
                              >
                                <X size={11} />
                              </button>
                            </div>
                            <div className="cf-card-name" title={c?.nameTh || item.mappingPattern || '-'}>{c?.nameTh || item.mappingPattern || '-'}</div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              {c && <span className="cf-cat-badge" style={{ background: color + '18', color }}>{CAT_LABELS[c.category]}</span>}
                            </div>

                            {isMissing && (
                              <div className="cf-card-error">
                                <div className="cf-error-text"><AlertCircle size={10} /> {missingCourseIds.length > 0 ? "ขาดวิชาบังคับก่อน" : "วิชาบังคับผิดเทอม"}</div>
                                {missingCourseIds.length > 0 && (
                                  <button className="add-prereq-btn" onClick={(e) => { e.stopPropagation(); addMissingPrereqs(col, missingCourseIds); }}>+ เพิ่มวิชาบังคับ</button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* --- Add Column Button --- */}
              <div className="cf-add-col-wrapper">
                <button className="cf-add-col-btn" onClick={() => setShowAddColModal(true)}>
                  <Plus size={20} /><span>เพิ่มคอลัมน์</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── ReactFlow-like Bottom Right UI ──────────────────────── ── */}
          <div style={{ position: 'fixed', bottom: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', pointerEvents: 'none', zIndex: 100 }}>
            
            {/* Viewport Map (MiniMap) */}
            <div 
              className="custom-minimap" 
              ref={minimapRef}
              onMouseDown={onMinimapMouseDown}
              onMouseMove={onMinimapMouseMove}
              onMouseUp={onMinimapMouseUp}
              onMouseLeave={onMinimapMouseUp}
              style={{ width: 180, height: 'max-content', minHeight: 40, maxHeight: 200, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', overflow: 'hidden', pointerEvents: 'auto', position: 'relative', cursor: 'crosshair', display: 'flex' }}
            >
              <div style={{ padding: 8, display: 'flex', gap: 4, width: '100%' }}>
                {sortedColumns.map((col, cIdx) => {
                  const items = coursesByCol[colKey(col.year, col.semester)] || [];
                  return (
                    <div key={cIdx} style={{ flexShrink: 0, width: 22, height: 'max-content', minHeight: '100%', background: 'var(--bg-body)', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 2, padding: 2 }}>
                       {items.map((_, iIdx) => (
                         <div key={iIdx} style={{ width: '100%', height: 10, background: 'var(--primary)', opacity: 0.6, borderRadius: 1 }} />
                       ))}
                    </div>
                  );
                })}
              </div>
              <div className="minimap-viewport-indicator" style={{ position: 'absolute', border: '2px solid var(--primary)', background: 'rgba(59, 130, 246, 0.1)', pointerEvents: 'none', transition: 'all 0.1s', ...viewportStyle }} />
            </div>

            {/* Controls */}
            <div className="custom-controls" style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', pointerEvents: 'auto' }}>
              <button title="Zoom In" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', color: 'var(--text-primary)' }} disabled={zoomLevel >= 1.5} onClick={() => setZoomLevel(z => Math.min(1.5, z + 0.15))}><ZoomIn size={16} /></button>
              <button title="Zoom Out" style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }} disabled={zoomLevel <= 0.4} onClick={() => setZoomLevel(z => Math.max(0.4, z - 0.15))}><ZoomOut size={16} /></button>
            </div>

          </div>
        </div>
      </div>

      {showCopyModal && <CopyCurriculumModal onConfirm={handleCopy} onCancel={() => setShowCopyModal(false)} />}
      {showAddColModal && <AddColumnModal existingCols={sortedColumns} onAdd={handleAddColumn} onCancel={() => setShowAddColModal(false)} />}

      {/* Save Confirmation Modal */}
      {showSaveConfirmModal.isOpen && (
        <Portal>
          <div className="modal-overlay" onClick={() => setShowSaveConfirmModal({ isOpen: false, maxYear: 0 })} style={{ zIndex: 9999 }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460, padding: '24px 28px' }}>
              <div className="modal-header" style={{ borderBottom: 'none', padding: 0 }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                    <AlertCircle className="text-warning" size={24} /> ยืนยันโครงสร้างปีเกิน
                  </h3>
                </div>
                <button className="btn-close" style={{ top: 20, right: 20, position: 'absolute' }} onClick={() => setShowSaveConfirmModal({ isOpen: false, maxYear: 0 })}><X size={18} /></button>
              </div>
              <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16, paddingBottom: 0 }}>
                <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  ระบบตรวจสอบพบว่าหลักสูตรของคุณมีการบรรจุรายวิชาลากยาวไปจนถึง <strong>ปีที่ {showSaveConfirmModal.maxYear}</strong> 
                  <br/><br/>
                  คุณต้องการยืนยันว่าหลักสูตรนี้คือ <strong>หลักสูตร {showSaveConfirmModal.maxYear} ปี</strong> ใช่หรือไม่?
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 4 }}>
                   <button className="btn btn-secondary" onClick={() => setShowSaveConfirmModal({ isOpen: false, maxYear: 0 })}>กลับไปแก้ไข</button>
                   <button className="btn btn-primary" onClick={executeSave}>ยืนยันและบันทึก</button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Course Detail Modal */}
      {selectedCourse && (
        <Portal>
          <div className="modal-overlay" onClick={() => setSelectedCourseId(null)} style={{ zIndex: 9999 }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
              <div className="modal-header" style={{ alignItems: 'flex-start', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)', lineHeight: 1.2 }}>
                    {selectedCourse.courseCode}
                  </div>
                  <div style={{ fontSize: '1rem', color: 'var(--text-primary)', marginTop: 4 }}>{selectedCourse.nameTh}</div>
                  {selectedCourse.nameEn && <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{selectedCourse.nameEn}</div>}
                </div>
                <button className="btn-close" onClick={() => setSelectedCourseId(null)}><X size={18} /></button>
              </div>
              <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>หน่วยกิต</span>
                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>{formatCourseCredits(selectedCourse)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>หมวดหมู่วิชา</span>
                  <span className="ac-cat-badge" style={{ background: (CAT_COLORS[selectedCourse.category] || '#6b7280') + '20', color: CAT_COLORS[selectedCourse.category] || '#6b7280' }}>
                    {CAT_LABELS[selectedCourse.category] || selectedCourse.category}
                  </span>
                </div>
                {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>วิชาบังคับก่อน (Prerequisites)</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {selectedCourse.prerequisites.map(pr => (
                        <span key={pr.requiresCourseId} style={{ fontSize: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>
                           {courseMap.get(pr.requiresCourseId)?.courseCode || pr.requiresCourseId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
