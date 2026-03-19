import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

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
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ChevronLeft, Edit2, BookOpen, Sparkles, Globe, Bookmark,
  AlertTriangle, Cloud, Loader2, CloudOff, RefreshCw
} from 'lucide-react';
import {
  getCategoryColor, getCategoryLabel,
  type Course, type CurriculumCourse, type CourseCategory, type Prerequisite,
} from "@/app/admin/components/mock-data";
import { fetchAllCurriculumData } from "@/app/admin/components/curriculum-api";
import { mockCurricula } from "@/app/admin/components/admin-shared";

const SEMESTER_WIDTH = 200;
const SEMESTER_GAP = 40;
const NODE_HEIGHT = 90;
const NODE_GAP = 14;
const HEADER_OFFSET = 70;
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

function semesterX(sem: number) { return (sem - 1) * (SEMESTER_WIDTH + SEMESTER_GAP) + 40; }
function courseY(index: number) { return HEADER_OFFSET + index * (NODE_HEIGHT + NODE_GAP) + 20; }

function CategoryIcon({ category }: { category: CourseCategory }) {
  switch (category) {
    case 'required': return <BookOpen className="w-3 h-3" />;
    case 'elective': return <Sparkles className="w-3 h-3" />;
    case 'general': return <Globe className="w-3 h-3" />;
    case 'free': return <Bookmark className="w-3 h-3" />;
  }
}

type CourseNodeData = {
  course: Course;
  hasPrereqError: boolean;
  prereqList: Prerequisite[];
};

function ReadOnlyCourseNode({ data }: NodeProps<Node<CourseNodeData>>) {
  const { course, hasPrereqError, prereqList } = data;
  const prereqs = prereqList.filter(p => p.courseId === course.id);
  const baseCategoryClasses = getCategoryColor(course.category);

  return (
    <div
      className={`rounded-xl p-3 border-2 transition-all ${
        course.isWildcard ? 'border-dashed bg-amber-50/80 border-amber-300 dark:bg-amber-950/30 dark:border-amber-600'
        : hasPrereqError ? 'border-red-400 bg-red-50/60 dark:bg-red-950/30'
        : baseCategoryClasses
      }`}
      style={{ width: SEMESTER_WIDTH - 30, minHeight: 65 }}
    >
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-primary !border-2 !border-white dark:!border-gray-800 !-left-1.5" />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-primary !border-2 !border-white dark:!border-gray-800 !-right-1.5" />
      <div className="flex items-center gap-1">
        <CategoryIcon category={course.category} />
        <span className="text-[11px] opacity-80">{course.id}</span>
        <span className="text-[9px] opacity-50 ml-auto">{course.credits} cr</span>
      </div>
      <p className="text-[10px] truncate mt-1">{course.nameEn}</p>
      <p className="text-[9px] opacity-60 truncate">{course.nameTh}</p>
      {prereqs.length > 0 && (
        <p className="text-[8px] opacity-40 mt-0.5">Pre: {prereqs.map(p => p.preCourseId).join(', ')}</p>
      )}
    </div>
  );
}

type SemHeaderData = { semester: number; totalCredits: number };
function SemesterHeaderNode({ data }: NodeProps<Node<SemHeaderData>>) {
  const yearNum = Math.ceil(data.semester / 2);
  const semInYear = data.semester % 2 === 1 ? 1 : 2;
  return (
    <div className="rounded-xl border-2 border-dashed border-border/60 bg-card/50 backdrop-blur-sm text-center py-2 px-3" style={{ width: SEMESTER_WIDTH - 10 }}>
      <p className="text-[12px]">ปี {yearNum} / เทอม {semInYear}</p>
      <p className="text-[10px] text-muted-foreground">{data.totalCredits} หน่วยกิต</p>
    </div>
  );
}

const nodeTypes = { courseNode: ReadOnlyCourseNode, semesterHeader: SemesterHeaderNode };

function FlowViewer({ allCourses, allPrereqs, currCourses }: {
  allCourses: Course[];
  allPrereqs: Prerequisite[];
  currCourses: CurriculumCourse[];
}) {
  const { nodes: initNodes, edges: initEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    SEMESTERS.forEach(sem => {
      const creds = currCourses.filter(cc => cc.semester === sem).reduce((s, cc) => {
        const c = allCourses.find(x => x.id === cc.courseId);
        return s + (c?.credits ?? 0);
      }, 0);
      nodes.push({ id: `sh-${sem}`, type: 'semesterHeader', position: { x: semesterX(sem), y: 10 }, data: { semester: sem, totalCredits: creds }, draggable: false, selectable: false, connectable: false });
    });

    const groups = new Map<number, CurriculumCourse[]>();
    currCourses.forEach(cc => { if (!groups.has(cc.semester)) groups.set(cc.semester, []); groups.get(cc.semester)!.push(cc); });

    groups.forEach((ccs, sem) => {
      ccs.forEach((cc, idx) => {
        const course = allCourses.find(c => c.id === cc.courseId);
        if (!course) return;
        const prereqs = allPrereqs.filter(p => p.courseId === cc.courseId);
        const missingPrereqs = prereqs.filter(p => {
          const pre = currCourses.find(x => x.courseId === p.preCourseId);
          return !pre || pre.semester >= sem;
        });
        nodes.push({
          id: cc.courseId, type: 'courseNode',
          position: { x: semesterX(sem) + 5, y: courseY(idx) },
          data: { course, hasPrereqError: missingPrereqs.length > 0, prereqList: allPrereqs },
          draggable: false,
        });
      });
    });

    allPrereqs.forEach(p => {
      const src = currCourses.find(cc => cc.courseId === p.preCourseId);
      const tgt = currCourses.find(cc => cc.courseId === p.courseId);
      if (src && tgt) {
        const valid = src.semester < tgt.semester;
        edges.push({
          id: `e-${p.preCourseId}-${p.courseId}`, source: p.preCourseId, target: p.courseId,
          animated: !valid,
          style: { stroke: valid ? '#22c55e' : '#ef4444', strokeWidth: 2 },
        });
      }
    });

    return { nodes, edges };
  }, [allCourses, allPrereqs, currCourses]);

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, , onEdgesChange] = useEdgesState(initEdges);

  return (
    <ReactFlow
      nodes={nodes} edges={edges}
      onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView fitViewOptions={{ padding: 0.2 }}
      nodesDraggable={false} nodesConnectable={false}
      proOptions={{ hideAttribution: true }}
      style={{ background: 'var(--background)' }}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
      <Controls className="!bg-card !border-2 !border-border !rounded-xl !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-accent" />
      <MiniMap className="!bg-card !border-2 !border-border !rounded-xl" nodeColor={() => 'var(--primary)'} maskColor="rgba(0,0,0,0.1)" />
      <Panel position="top-right" className="!m-3">
        <div className="bg-card/90 backdrop-blur-sm rounded-xl border-2 border-border p-3 text-[10px] space-y-1">
          <p className="text-[11px] opacity-70 mb-1">Legend</p>
          <div className="flex items-center gap-2"><div className="w-6 h-0.5 bg-green-500 rounded" /><span>Pre-req ถูก</span></div>
          <div className="flex items-center gap-2"><div className="w-6 h-0.5 bg-red-500 rounded" /><span>Pre-req ผิด</span></div>
        </div>
      </Panel>
    </ReactFlow>
  );
}

export function AdminCurriculumView() {
  const { id } = useParams();
  const router = useRouter();
  const curriculum = mockCurricula.find(c => c.id === id) ?? mockCurricula[0];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [allPrereqs, setAllPrereqs] = useState<Prerequisite[]>([]);
  const [currCourses, setCurrCourses] = useState<CurriculumCourse[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchAllCurriculumData();
      setAllCourses(data.courses);
      setAllPrereqs(data.prerequisites);
      setCurrCourses(data.curriculumCourses.filter(cc => cc.curriculumId === (id ?? 'cur1')));
    } catch (err) {
      setError(`${err}`);
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="relative"><div className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" /><Cloud className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></div>
          <p className="text-[14px]">กำลังโหลดข้อมูลหลักสูตร...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <CloudOff className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-[14px]">โหลดข้อมูลไม่สำเร็จ</p>
          <p className="text-[12px] text-muted-foreground">{error}</p>
          <button onClick={loadData} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px]"><RefreshCw className="w-4 h-4" />ลองใหม่</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-card border-b-2 border-border shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/admin/curricula')} className="p-2 rounded-xl hover:bg-accent"><ChevronLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-[18px]">{curriculum.name} พ.ศ. {curriculum.year}</h1>
            <p className="text-[12px] text-muted-foreground">โหมดดูอย่างเดียว — {curriculum.totalCredits} หน่วยกิต</p>
          </div>
        </div>
        <button
          onClick={() => router.push(`/admin/curricula/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-[13px]"
        >
          <Edit2 className="w-4 h-4" />
          แก้ไข
        </button>
      </div>

      {/* Flow */}
      <div className="flex-1">
        <ReactFlowProvider>
          <FlowViewer allCourses={allCourses} allPrereqs={allPrereqs} currCourses={currCourses} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
