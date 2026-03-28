import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

export interface CourseNodeData {
  courseCode: string;
  nameTh: string;
  credits: number;
  category: string;
  isWildcard: boolean;
  mappingPattern?: string;
  courseId: string;
  year: number;
  semester: number;
  onDataChange?: (data: any) => void;
  [key: string]: any;
}

const CAT_COLORS: Record<string, string> = {
  GENERAL_EDUCATION: '#60a5fa',
  CORE_COURSE: '#a78bfa',
  REQUIRED_COURSE: '#34d399',
  MAJOR_ELECTIVE: '#fbbf24',
  FREE_ELECTIVE: '#9ca3af',
  COOP_COURSE: '#f87171',
};

export default function CourseNode({ data, selected }: NodeProps) {
  const d = data as unknown as CourseNodeData;
  const color = CAT_COLORS[d.category] || '#60a5fa';
  const isWild = d.isWildcard;

  return (
    <div className={`course-node ${isWild ? 'wildcard' : ''} ${selected ? 'selected' : ''}`}
      style={{ borderColor: color, '--node-color': color } as React.CSSProperties}>
      <Handle type="target" position={Position.Left} />
      <div className="course-node-code" style={{ color }}>{d.courseCode}</div>
      <div className="course-node-name">
        {isWild ? (
           <input 
             className="node-pattern-input"
             placeholder="Pattern (e.g. .*)"
             value={d.mappingPattern || ''} 
             onChange={e => d.onDataChange?.({ ...d, mappingPattern: e.target.value })}
             onClick={e => e.stopPropagation()}
           />
        ) : d.nameTh}
      </div>
      <div className="course-node-credits">{d.credits} cr</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
