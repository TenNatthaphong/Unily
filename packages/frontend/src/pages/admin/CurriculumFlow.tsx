import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { curriculumApi } from '../../api/curriculum.api';
import { curriculumItemApi } from '../../api/curriculum-item.api';
import { courseApi } from '../../api/course.api';
import type { Course, Curriculum } from '../../types';
import FlowEditor, { type FlowNode } from '../../components/curriculum-flow/FlowEditor';
import CoursePalette from '../../components/curriculum-flow/CoursePalette';
import type { Edge } from '@xyflow/react';
import { ArrowLeft, Save, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './CurriculumFlow.css';

// ── 10-second countdown confirm dialog ──────────────────────────────────────
function CountdownConfirmDialog({
  onConfirm, onCancel,
}: { onConfirm: () => void; onCancel: () => void }) {
  const [seconds, setSeconds] = useState(10);
  const [canConfirm, setCanConfirm] = useState(false);

  useEffect(() => {
    if (seconds <= 0) { setCanConfirm(true); return; }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  return (
    <div className="modal-overlay">
      <div className="modal countdown-modal" onClick={e => e.stopPropagation()}>
        <div className="countdown-icon"><AlertTriangle size={40} /></div>
        <h3>Confirm Save Flow</h3>
        <p>
          This will <strong>delete all current curriculum items</strong> and re-create them
          with the new positions. This cannot be undone.
        </p>
        <div className="countdown-timer">{seconds > 0 ? seconds : '✓'}</div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onConfirm} disabled={!canConfirm}>
            {canConfirm ? 'Confirm Save' : `Wait... (${seconds})`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Map CurriculumCourse → FlowNode ─────────────────────────────────────────
function buildNodes(items: Awaited<ReturnType<typeof curriculumItemApi.getByCurriculumCode>>['data']): FlowNode[] {
  return items.map((item, idx) => ({
    id: item.id,
    type: 'courseNode',
    position: { x: item.positionX || item.semester * 220, y: item.positionY || idx * 120 },
    data: {
      courseId: item.courseId,
      courseCode: item.course?.courseCode || '?',
      nameTh: item.course?.nameTh || '',
      credits: item.course?.credits || 0,
      category: item.course?.category || 'REQUIRED_COURSE',
      isWildcard: item.course?.isWildcard || false,
      mappingPattern: item.mappingPattern,
      year: item.year,
      semester: item.semester,
    },
  }));
}

function buildEdges(courses: Course[]): Edge[] {
  const edges: Edge[] = [];
  courses.forEach(c => {
    c.prerequisites?.forEach(prereq => {
      edges.push({
        id: `e-${prereq.requiresCourseId}-${prereq.courseId}`,
        source: prereq.requiresCourseId,
        target: prereq.courseId,
        type: 'smoothstep',
        animated: false,
        style: { stroke: 'rgba(59,130,246,0.5)', strokeWidth: 2 },
      });
    });
  });
  return edges;
}

// ────────────────────────────────────────────────────────────────────────────
export default function CurriculumFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [initialNodes, setInitialNodes] = useState<FlowNode[]>([]);
  const [initialEdges, setInitialEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  const currentNodes = useRef<FlowNode[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      curriculumApi.getById(id),
      curriculumItemApi.getByCurriculumCode('').then(() => null).catch(() => null),
    ]).then(async ([currRes]) => {
      const curr = currRes.data;
      setCurriculum(curr);

      // Load items using curriculum code
      const itemsRes = await curriculumItemApi.getByCurriculumCode(curr.curriculumCode);
      const items = itemsRes.data;

      // Load all courses for palette
      const coursesRes = await courseApi.search({ limit: 500 });
      const courses = coursesRes.data.data;
      setAllCourses(courses);

      const nodes = buildNodes(items);
      setInitialNodes(nodes);
      currentNodes.current = nodes;

      const edges = buildEdges(courses);
      setInitialEdges(edges);
      setIsLoading(false);
    }).catch(() => {
      toast.error('Failed to load curriculum');
      setIsLoading(false);
    });
  }, [id]);

  const handleNodesChange = useCallback((nodes: FlowNode[]) => {
    currentNodes.current = nodes;
  }, []);

  const handleSave = () => setShowConfirm(true);

  const confirmSave = async () => {
    setShowConfirm(false);
    if (!id) return;
    const items = currentNodes.current.map(n => ({
      courseId: n.data.courseId as string,
      year: (n.data.year as number) || 1,
      semester: (n.data.semester as number) || 1,
      positionX: Math.round(n.position.x),
      positionY: Math.round(n.position.y),
      mappingPattern: n.data.mappingPattern as string | undefined,
    }));
    toast.promise(curriculumItemApi.syncFlow(id, items), {
      loading: 'Saving flow...',
      success: 'Flow saved!',
      error: 'Failed to save flow',
    });
  };

  if (isLoading) return (
    <div className="loading-state"><Loader2 className="spin" size={48} /><p>Loading curriculum...</p></div>
  );

  return (
    <div className="flow-page">
      <div className="flow-topbar">
        <button className="btn-icon" onClick={() => navigate('/admin/curriculums')}>
          <ArrowLeft size={20} />
        </button>
        <div className="flow-title">
          <h2>{curriculum?.name}</h2>
          <span className="badge">{curriculum?.curriculumCode}</span>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} /> Save Flow
        </button>
      </div>

      <div className="flow-workspace">
        <CoursePalette courses={allCourses} />
        <div className="flow-canvas">
          <FlowEditor
            initialNodes={initialNodes}
            initialEdges={initialEdges}
            onNodesChange={handleNodesChange}
          />
        </div>
      </div>

      {showConfirm && (
        <CountdownConfirmDialog onConfirm={confirmSave} onCancel={() => setShowConfirm(false)} />
      )}
    </div>
  );
}
