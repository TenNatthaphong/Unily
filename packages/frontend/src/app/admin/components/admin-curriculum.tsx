import { useState, useCallback, useMemo, useRef, useEffect, type DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Search, AlertTriangle, Save, GripVertical,
  X, RotateCcw, Loader2, WifiOff, RefreshCw,
  BookOpen, Layers, Sparkles, Globe, Bookmark, Cloud, CloudOff,
  ChevronLeft, ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getCategoryColor, getCategoryLabel,
  type Course, type CurriculumCourse, type CourseCategory, type Prerequisite,
} from "@/app/admin/components/mock-data";
import {
  fetchAllCurriculumData,
  batchUpdateCurriculumCourses,
  resetCurriculum as resetCurriculumApi,
} from "@/app/admin/components/curriculum-api";
import { mockCurricula } from "@/app/admin/components/admin-shared";

// ==================== Constants ====================
const SEMESTER_WIDTH = 200;
const SEMESTER_GAP = 40;
const NODE_HEIGHT = 100;
const NODE_GAP = 16;
const HEADER_OFFSET = 80;
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

// ==================== Helpers ====================

function semesterX(sem: number): number {
  return (sem - 1) * (SEMESTER_WIDTH + SEMESTER_GAP) + 40;
}

function courseY(index: number): number {
  return HEADER_OFFSET + index * (NODE_HEIGHT + NODE_GAP) + 20;
}

function checkPrerequisiteErrors(
  courseId: string,
  targetSemester: number,
  currCourses: CurriculumCourse[],
  prerequisites: Prerequisite[]
): { hasError: boolean; missingPrereqs: string[] } {
  const prereqs = prerequisites.filter(p => p.courseId === courseId);
  if (prereqs.length === 0) return { hasError: false, missingPrereqs: [] };

  const missing: string[] = [];
  for (const prereq of prereqs) {
    const preReqPlacement = currCourses.find(cc => cc.courseId === prereq.preCourseId);
    if (!preReqPlacement || preReqPlacement.semester >= targetSemester) {
      missing.push(prereq.preCourseId);
    }
  }

  return { hasError: missing.length > 0, missingPrereqs: missing };
}

function getSemesterCredits(semester: number, currCourses: CurriculumCourse[], courses: Course[]): number {
  return currCourses
    .filter(cc => cc.semester === semester)
    .reduce((sum, cc) => {
      const course = courses.find(c => c.id === cc.courseId);
      return sum + (course?.credits ?? 0);
    }, 0);
}

function CategoryIcon({ category }: { category: CourseCategory }) {
  switch (category) {
    case 'required': return <BookOpen className="w-3 h-3" />;
    case 'elective': return <Sparkles className="w-3 h-3" />;
    case 'general': return <Globe className="w-3 h-3" />;
    case 'free': return <Bookmark className="w-3 h-3" />;
  }
}

// ==================== Custom Node ====================
type CourseNodeData = {
  course: Course;
  semester: number;
  hasPrereqError: boolean;
  missingPrereqs: string[];
  prereqList: Prerequisite[];
  onRemove: (courseId: string) => void;
};

function CourseNode({ data, selected }: NodeProps<Node<CourseNodeData>>) {
  const { course, hasPrereqError, missingPrereqs, prereqList, onRemove } = data;
  const isWildcard = course.isWildcard;
  const prereqs = prereqList.filter(p => p.courseId === course.id);

  const baseCategoryClasses = getCategoryColor(course.category);

  return (
    <div
      className={`
        relative rounded-xl p-3 border-2 transition-all group
        ${isWildcard ? 'border-dashed' : ''}
        ${isWildcard
          ? 'bg-amber-50/80 border-amber-300 dark:bg-amber-950/30 dark:border-amber-600'
          : hasPrereqError
            ? 'border-red-400 bg-red-50/60 dark:bg-red-950/30 dark:border-red-600'
            : baseCategoryClasses
        }
        ${selected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}
      `}
      style={{ width: SEMESTER_WIDTH - 30, minHeight: 70 }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary !border-2 !border-white dark:!border-gray-800 !-left-1.5"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary !border-2 !border-white dark:!border-gray-800 !-right-1.5"
      />

      {hasPrereqError && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center z-10 shadow-md"
          title={`Pre-req missing: ${missingPrereqs.join(', ')}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
        </div>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onRemove(course.id); }}
        className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md"
      >
        <X className="w-3 h-3" />
      </button>

      {isWildcard && (
        <div className="absolute top-1 right-1">
          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber-200/80 text-amber-800 dark:bg-amber-800/50 dark:text-amber-200">
            Wildcard
          </span>
        </div>
      )}

      <div className="flex items-start gap-1.5">
        <GripVertical className="w-3.5 h-3.5 mt-0.5 opacity-30 shrink-0 cursor-grab" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <CategoryIcon category={course.category} />
            <span className="text-[11px] opacity-80">{course.id}</span>
          </div>
          <p className="text-[11px] truncate mt-0.5">{course.nameEn}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] opacity-60">
              {course.credits} cr ({course.lectureHours}-{course.labHours}-{course.selfStudyHours})
            </span>
          </div>
          {prereqs.length > 0 && (
            <div className="mt-0.5">
              <span className="text-[9px] opacity-40">Pre: </span>
              <span className={`text-[9px] ${hasPrereqError ? 'text-red-500' : 'opacity-50'}`}>
                {prereqs.map(p => p.preCourseId).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== Semester Header Nodes ====================
type SemesterHeaderData = {
  semester: number;
  totalCredits: number;
  isOverLimit: boolean;
};

function SemesterHeaderNode({ data }: NodeProps<Node<SemesterHeaderData>>) {
  const { semester, totalCredits, isOverLimit } = data;
  const yearNum = Math.ceil(semester / 2);
  const semInYear = semester % 2 === 1 ? 1 : 2;

  return (
    <div
      className="rounded-xl border-2 border-dashed border-border/60 bg-card/50 backdrop-blur-sm"
      style={{ width: SEMESTER_WIDTH - 10 }}
    >
      <div className="text-center py-2 px-3">
        <p className="text-[13px]">
          ปี {yearNum} / เทอม {semInYear}
        </p>
        <p className="text-[10px] text-muted-foreground">Semester {semester}</p>
        <div className={`mt-1 text-[12px] ${isOverLimit ? 'text-red-500' : 'text-muted-foreground'}`}>
          {isOverLimit && <AlertTriangle className="w-3 h-3 inline mr-1" />}
          {totalCredits} หน่วยกิต
          {isOverLimit && <span className="text-[10px] ml-1">(เกิน 22!)</span>}
        </div>
      </div>
    </div>
  );
}

const allNodeTypes = {
  courseNode: CourseNode,
  semesterHeader: SemesterHeaderNode,
};

// ==================== Course Pool Panel ====================
function CoursePool({
  allCourses,
  allPrerequisites,
  currCourses,
  onDragStart,
}: {
  allCourses: Course[];
  allPrerequisites: Prerequisite[];
  currCourses: CurriculumCourse[];
  onDragStart: (event: DragEvent, courseId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showPlaced, setShowPlaced] = useState(false);
  const placedIds = currCourses.map(cc => cc.courseId);

  const filtered = allCourses.filter(c => {
    const matchSearch =
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.nameEn.toLowerCase().includes(search.toLowerCase()) ||
      c.nameTh.includes(search);
    const matchCat = categoryFilter === 'all' || c.category === categoryFilter;
    const matchPlaced = showPlaced || !placedIds.includes(c.id);
    return matchSearch && matchCat && matchPlaced;
  });

  const categories = [
    { value: 'all', label: 'ทั้งหมด', icon: <Layers className="w-3 h-3" /> },
    { value: 'required', label: 'บังคับ', icon: <BookOpen className="w-3 h-3" /> },
    { value: 'elective', label: 'เลือก', icon: <Sparkles className="w-3 h-3" /> },
    { value: 'general', label: 'ทั่วไป', icon: <Globe className="w-3 h-3" /> },
    { value: 'free', label: 'เสรี', icon: <Bookmark className="w-3 h-3" /> },
  ];

  return (
    <div className="w-[280px] shrink-0 bg-card border-r-2 border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <h2 className="text-[16px] flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          คลังวิชา
        </h2>
        <p className="text-[11px] text-muted-foreground mt-1">ลากวิชาไปวางบน Canvas</p>
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ค้นหาวิชา..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-xl bg-accent/50 border-2 border-border focus:border-primary transition-all outline-none text-[12px]"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 pt-2 pb-1">
        <div className="flex flex-wrap gap-1">
          {categories.map(f => (
            <button
              key={f.value}
              onClick={() => setCategoryFilter(f.value)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] border transition-all ${
                categoryFilter === f.value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-accent'
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={showPlaced}
            onChange={e => setShowPlaced(e.target.checked)}
            className="w-3 h-3 rounded"
          />
          แสดงวิชาที่วางแล้ว
        </label>
      </div>

      {/* Course List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-[12px]">
            ไม่พบวิชา
          </div>
        )}
        {filtered.map(course => {
          const isPlaced = placedIds.includes(course.id);
          const prereqs = allPrerequisites.filter(p => p.courseId === course.id);

          return (
            <div
              key={course.id}
              draggable={!isPlaced}
              onDragStart={(e) => onDragStart(e, course.id)}
              className={`
                rounded-xl p-2.5 border-2 transition-all
                ${course.isWildcard ? 'border-dashed' : ''}
                ${isPlaced
                  ? 'opacity-40 cursor-not-allowed bg-muted/30 border-border/30'
                  : 'cursor-grab active:cursor-grabbing hover:shadow-md'
                }
                ${!isPlaced ? getCategoryColor(course.category) : 'border-border/50'}
              `}
            >
              <div className="flex items-start gap-1.5">
                <GripVertical className="w-3.5 h-3.5 mt-0.5 opacity-30 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <CategoryIcon category={course.category} />
                    <span className="text-[11px]">{course.id}</span>
                    {course.isWildcard && (
                      <span className="text-[8px] px-1 py-0.5 rounded bg-amber-200/80 text-amber-800 dark:bg-amber-800/50 dark:text-amber-200">
                        Wildcard
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] truncate">{course.nameEn}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] opacity-60">
                      {course.credits} cr ({course.lectureHours}-{course.labHours}-{course.selfStudyHours})
                    </span>
                    <span className="text-[9px] opacity-40">
                      {getCategoryLabel(course.category)}
                    </span>
                  </div>
                  {prereqs.length > 0 && (
                    <p className="text-[8px] opacity-40 mt-0.5">
                      Pre: {prereqs.map(p => p.preCourseId).join(', ')}
                    </p>
                  )}
                  {isPlaced && (
                    <span className="text-[9px] text-primary">
                      วางอยู่ใน Sem {currCourses.find(cc => cc.courseId === course.id)?.semester}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-t border-border/50 bg-accent/20">
        <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
          <div>วิชาทั้งหมด: <span className="text-foreground">{allCourses.length}</span></div>
          <div>วางแล้ว: <span className="text-primary">{placedIds.length}</span></div>
          <div>เหลือ: <span className="text-foreground">{allCourses.length - placedIds.length}</span></div>
          <div>
            รวม cr: <span className="text-foreground">
              {currCourses.reduce((sum, cc) => {
                const c = allCourses.find(x => x.id === cc.courseId);
                return sum + (c?.credits ?? 0);
              }, 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== Main Flow Editor ====================
function CurriculumFlowEditor({
  allCourses,
  allPrerequisites,
  initialCurrCourses,
}: {
  allCourses: Course[];
  allPrerequisites: Prerequisite[];
  initialCurrCourses: CurriculumCourse[];
}) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const [currCourses, setCurrCourses] = useState<CurriculumCourse[]>(initialCurrCourses);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Sync if initialCurrCourses changes (e.g. after reset refetch)
  useEffect(() => {
    setCurrCourses(initialCurrCourses);
  }, [initialCurrCourses]);

  const handleRemoveCourse = useCallback((courseId: string) => {
    setCurrCourses(prev => prev.filter(cc => cc.courseId !== courseId));
    setHasChanges(true);
  }, []);

  // Build nodes from currCourses
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    SEMESTERS.forEach(sem => {
      const totalCredits = getSemesterCredits(sem, currCourses, allCourses);
      const isOverLimit = totalCredits > 22;

      nodes.push({
        id: `sem-header-${sem}`,
        type: 'semesterHeader',
        position: { x: semesterX(sem), y: 10 },
        data: { semester: sem, totalCredits, isOverLimit },
        draggable: false,
        selectable: false,
        connectable: false,
      });
    });

    const semesterGroups = new Map<number, CurriculumCourse[]>();
    currCourses.forEach(cc => {
      if (!semesterGroups.has(cc.semester)) semesterGroups.set(cc.semester, []);
      semesterGroups.get(cc.semester)!.push(cc);
    });

    semesterGroups.forEach((courses, sem) => {
      courses.forEach((cc, idx) => {
        const course = allCourses.find(c => c.id === cc.courseId);
        if (!course) return;

        const { hasError, missingPrereqs } = checkPrerequisiteErrors(cc.courseId, sem, currCourses, allPrerequisites);

        nodes.push({
          id: cc.courseId,
          type: 'courseNode',
          position: { x: semesterX(sem) + 5, y: courseY(idx) },
          data: {
            course,
            semester: sem,
            hasPrereqError: hasError,
            missingPrereqs,
            prereqList: allPrerequisites,
            onRemove: handleRemoveCourse,
          } satisfies CourseNodeData,
          draggable: true,
        });
      });
    });

    allPrerequisites.forEach(prereq => {
      const sourcePlaced = currCourses.find(cc => cc.courseId === prereq.preCourseId);
      const targetPlaced = currCourses.find(cc => cc.courseId === prereq.courseId);

      if (sourcePlaced && targetPlaced) {
        const isValid = sourcePlaced.semester < targetPlaced.semester;

        edges.push({
          id: `prereq-${prereq.preCourseId}-${prereq.courseId}`,
          source: prereq.preCourseId,
          target: prereq.courseId,
          type: 'default',
          animated: !isValid,
          style: {
            stroke: isValid ? '#22c55e' : '#ef4444',
            strokeWidth: 2,
          },
          label: isValid ? '' : 'Pre-req!',
          labelStyle: {
            fill: '#ef4444',
            fontSize: 10,
          },
          labelBgStyle: {
            fill: 'transparent',
          },
        });
      }
    });

    return { nodes, edges };
  }, [currCourses, allCourses, allPrerequisites, handleRemoveCourse]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type !== 'courseNode') return;

    const nodeX = node.position.x;
    let closestSem = 1;
    let minDist = Infinity;

    SEMESTERS.forEach(sem => {
      const sx = semesterX(sem);
      const dist = Math.abs(nodeX - sx);
      if (dist < minDist) {
        minDist = dist;
        closestSem = sem;
      }
    });

    setCurrCourses(prev => {
      const updated = prev.map(cc => {
        if (cc.courseId === node.id) {
          return { ...cc, semester: closestSem, positionX: node.position.x, positionY: node.position.y };
        }
        return cc;
      });
      return updated;
    });
    setHasChanges(true);
  }, []);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: DragEvent) => {
    event.preventDefault();
    const courseId = event.dataTransfer.getData('application/reactflow-courseId');
    if (!courseId) return;

    if (currCourses.find(cc => cc.courseId === courseId)) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    let closestSem = 1;
    let minDist = Infinity;
    SEMESTERS.forEach(sem => {
      const sx = semesterX(sem);
      const dist = Math.abs(position.x - sx);
      if (dist < minDist) {
        minDist = dist;
        closestSem = sem;
      }
    });

    const newCc: CurriculumCourse = {
      id: `cc-${Date.now()}`,
      curriculumId: 'cur1',
      courseId,
      semester: closestSem,
      year: Math.ceil(closestSem / 2),
      positionX: position.x,
      positionY: position.y,
    };

    setCurrCourses(prev => [...prev, newCc]);
    setHasChanges(true);
  }, [currCourses, screenToFlowPosition]);

  const onDragStartFromPool = useCallback((event: DragEvent, courseId: string) => {
    event.dataTransfer.setData('application/reactflow-courseId', courseId);
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  // Save handler - real Supabase API
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const result = await batchUpdateCurriculumCourses(currCourses);
      console.log('Batch update result:', result);
      setHasChanges(false);
      setShowSaveConfirm(false);
      setConfirmText('');
      toast.success('บันทึกหลักสูตรสำเร็จ!', {
        description: `อัปเดต ${result.count} วิชาลง Supabase เรียบร้อย`,
      });
    } catch (err) {
      console.error('Save error:', err);
      toast.error('บันทึกไม่สำเร็จ', {
        description: `${err}`,
      });
    } finally {
      setIsSaving(false);
    }
  }, [currCourses]);

  // Reset handler - real Supabase API
  const handleReset = useCallback(async () => {
    setIsResetting(true);
    try {
      await resetCurriculumApi();
      // Refetch the reset data
      const data = await fetchAllCurriculumData();
      setCurrCourses(data.curriculumCourses);
      setHasChanges(false);
      toast.info('รีเซ็ตกลับเป็นค่าเริ่มต้นจาก Supabase');
    } catch (err) {
      console.error('Reset error:', err);
      toast.error('รีเซ็ตไม่สำเร็จ', {
        description: `${err}`,
      });
    } finally {
      setIsResetting(false);
    }
  }, []);

  // Validation summary
  const validationSummary = useMemo(() => {
    let prereqErrors = 0;
    let overLimitSemesters = 0;

    currCourses.forEach(cc => {
      const { hasError } = checkPrerequisiteErrors(cc.courseId, cc.semester, currCourses, allPrerequisites);
      if (hasError) prereqErrors++;
    });

    SEMESTERS.forEach(sem => {
      if (getSemesterCredits(sem, currCourses, allCourses) > 22) overLimitSemesters++;
    });

    return { prereqErrors, overLimitSemesters };
  }, [currCourses, allCourses, allPrerequisites]);

  const semesterBgNodes = useMemo(() => {
    return SEMESTERS.map(sem => ({
      id: `sem-bg-${sem}`,
      type: 'group',
      position: { x: semesterX(sem) - 10, y: 0 },
      style: {
        width: SEMESTER_WIDTH + 10,
        height: 800,
        backgroundColor: 'transparent',
        border: '1px dashed var(--border)',
        borderRadius: 16,
        pointerEvents: 'none' as const,
        zIndex: -1,
      },
      data: {},
      selectable: false,
      draggable: false,
      connectable: false,
    }));
  }, []);

  const CONFIRM_STRING = 'วิทยาการคอมพิวเตอร์ 2568';

  return (
    <div className="flex h-full">
      {/* Side Panel */}
      <CoursePool
        allCourses={allCourses}
        allPrerequisites={allPrerequisites}
        currCourses={currCourses}
        onDragStart={onDragStartFromPool}
      />

      {/* Flow Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-card border-b-2 border-border">
          <div>
            <h1 className="text-[20px] flex items-center gap-2">
              จัดการหลักสูตร
              <span className="text-[12px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                Supabase
              </span>
            </h1>
            <p className="text-[12px] text-muted-foreground">
              ลากวิชาจากคลังไปวางบน Canvas หรือลากย้ายระหว่าง Semester | เส้นสีเขียว = Pre-req ถูกต้อง, สีแดง = ผิดเงื่อนไข
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Validation Status */}
            {(validationSummary.prereqErrors > 0 || validationSummary.overLimitSemesters > 0) && (
              <div className="flex items-center gap-2 mr-2">
                {validationSummary.prereqErrors > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {validationSummary.prereqErrors} Pre-req errors
                  </span>
                )}
                {validationSummary.overLimitSemesters > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {validationSummary.overLimitSemesters} semester(s) &gt; 22 cr
                  </span>
                )}
              </div>
            )}

            <button
              onClick={handleReset}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-border text-[12px] hover:bg-accent transition-all disabled:opacity-50"
            >
              {isResetting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              รีเซ็ต
            </button>

            <button
              onClick={() => setShowSaveConfirm(true)}
              disabled={isSaving || !hasChanges}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] transition-all ${
                hasChanges
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Save Confirmation Dialog */}
        {showSaveConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4" onClick={() => setShowSaveConfirm(false)}>
            <div className="bg-card rounded-2xl p-6 w-full max-w-md border-2 border-border shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-[16px]">ยืนยันการบันทึก</h3>
                  <p className="text-[12px] text-muted-foreground">การเปลี่ยนแปลงจะส่งผลต่อหลักสูตรที่นักศึกษาเห็น</p>
                </div>
              </div>
              <div className="bg-accent/50 rounded-xl p-4 mb-4">
                <p className="text-[12px] text-muted-foreground mb-1">กรุณาพิมพ์ข้อความด้านล่างเพื่อยืนยัน:</p>
                <p className="text-[14px] text-primary select-none">{CONFIRM_STRING}</p>
              </div>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="พิมพ์ชื่อหลักสูตรพร้อมปี..."
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-accent/30 focus:border-primary outline-none text-[14px] mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowSaveConfirm(false); setConfirmText(''); }}
                  className="flex-1 py-3 rounded-xl border-2 border-border hover:bg-accent transition-all text-[14px]"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={confirmText !== CONFIRM_STRING || isSaving}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-[14px] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  ยืนยันบันทึก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* React Flow Canvas */}
        <div ref={reactFlowWrapper} className="flex-1" onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={[...semesterBgNodes, ...nodes]}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={allNodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            snapToGrid
            snapGrid={[10, 10]}
            deleteKeyCode={null}
            proOptions={{ hideAttribution: true }}
            style={{ background: 'var(--background)' }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
            <Controls
              className="!bg-card !border-2 !border-border !rounded-xl !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-accent"
            />
            <MiniMap
              className="!bg-card !border-2 !border-border !rounded-xl"
              nodeColor={(node) => {
                if (node.type === 'semesterHeader') return 'var(--accent)';
                const data = node.data as CourseNodeData;
                if (data?.hasPrereqError) return '#ef4444';
                if (data?.course?.isWildcard) return '#f59e0b';
                return 'var(--primary)';
              }}
              maskColor="rgba(0,0,0,0.1)"
            />

            {/* Legend Panel */}
            <Panel position="bottom-left" className="!m-3">
              <div className="bg-card/90 backdrop-blur-sm rounded-xl border-2 border-border p-3 text-[10px] space-y-1.5">
                <p className="text-[11px] opacity-70 mb-2">Legend</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-green-500 rounded" />
                  <span>Pre-req สำเร็จ</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-red-500 rounded relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                  </div>
                  <span>Pre-req ผิดเงื่อนไข</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-dashed border-amber-400 bg-amber-100 dark:bg-amber-900/30" />
                  <span>Wildcard (วิชาเลือกเสรี)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <AlertTriangle className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span>Warning Badge</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                  <Cloud className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Connected to Supabase</span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

// ==================== Loading / Error States ====================
function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full bg-background">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <Cloud className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div>
          <p className="text-[16px]">กำลังโหลดข้อมูลหลักสูตร...</p>
          <p className="text-[12px] text-muted-foreground mt-1">เชื่อมต่อ Supabase KV Store</p>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center h-full bg-background">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
          <CloudOff className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <p className="text-[16px]">ไม่สามารถโหลดข้อมูลได้</p>
          <p className="text-[12px] text-muted-foreground mt-1">{error}</p>
        </div>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] hover:bg-primary/90 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          ลองใหม่อีกครั้ง
        </button>
      </div>
    </div>
  );
}

// ==================== Export ====================
export function AdminCurriculum() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allPrerequisites, setAllPrerequisites] = useState<Prerequisite[]>([]);
  const [initialCurrCourses, setInitialCurrCourses] = useState<CurriculumCourse[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllCurriculumData();
      console.log('Loaded curriculum data from Supabase:', {
        courses: data.courses.length,
        prerequisites: data.prerequisites.length,
        curriculumCourses: data.curriculumCourses.length,
      });
      setAllCourses(data.courses);
      setAllPrerequisites(data.prerequisites);
      setInitialCurrCourses(data.curriculumCourses);
    } catch (err) {
      console.error('Failed to load curriculum data:', err);
      setError(`${err}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={loadData} />;

  return (
    <ReactFlowProvider>
      <CurriculumFlowEditor
        allCourses={allCourses}
        allPrerequisites={allPrerequisites}
        initialCurrCourses={initialCurrCourses}
      />
    </ReactFlowProvider>
  );
}