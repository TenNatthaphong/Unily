import { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CourseNode from './CourseNode';
import type { CourseNodeData } from './CourseNode';

export interface FlowNode extends Node<CourseNodeData> {}

interface Props {
  initialNodes: FlowNode[];
  initialEdges: Edge[];
  onNodesChange?: (nodes: FlowNode[]) => void;
  readOnly?: boolean;
}

const nodeTypes: NodeTypes = {
  courseNode: CourseNode as any,
};

export default function FlowEditor({ initialNodes, initialEdges, onNodesChange, readOnly = false }: Props) {
  const [nodes, setNodes, onNodesStateChange] = useNodesState<Node>(initialNodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Sync prop changes (e.g. from handleCopy or delayed load) into react-flow's internal state
  useEffect(() => {
    setNodes(initialNodes as Node[]);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback((params: Connection) => {
    if (readOnly) return;
    setEdges(eds => addEdge({ ...params, type: 'smoothstep', animated: false }, eds));
  }, [readOnly, setEdges]);

  const onNodeDataChange = useCallback((nodeId: string, newData: CourseNodeData) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: newData } : n));
  }, [setNodes]);

  // Sync back to parent when nodes change (drag, delete, or data change)
  useEffect(() => {
    if (onNodesChange) {
      onNodesChange(nodes as FlowNode[]);
    }
  }, [nodes, onNodesChange]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (readOnly) return;
    const raw = e.dataTransfer.getData('application/coursenode');
    if (!raw) return;

    try {
      const data = JSON.parse(raw) as CourseNodeData;
      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = {
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      };

      const newNode: FlowNode = {
        id: `node-${Date.now()}`,
        type: 'courseNode',
        position,
        data: {
          ...data,
          year: 1,
          semester: 1,
        },
      };

      setNodes(nds => [...nds, newNode as Node]);
    } catch {
       // Ignore malformed drops
    }
  }, [readOnly, setNodes]);

  // Inject handleDataChange into nodes so they can call it
  const nodesWithHandlers = nodes.map(n => ({
    ...n,
    data: {
      ...n.data,
      onDataChange: (d: any) => onNodeDataChange(n.id, d as CourseNodeData)
    }
  }));

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodesWithHandlers}
        edges={edges}
        onNodesChange={onNodesStateChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        defaultEdgeOptions={{ type: 'smoothstep' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.05)" />
        <Controls />
        <MiniMap nodeColor={(n: any) => {
          const d = n.data as CourseNodeData;
          return d?.isWildcard ? '#374151' : (CAT_LABELS_COLORS[d?.category] || '#2D74E0');
        }} />
      </ReactFlow>
    </div>
  );
}

const CAT_LABELS_COLORS: Record<string, string> = {
  GENERAL_EDUCATION: '#60a5fa',
  CORE_COURSE: '#a78bfa',
  REQUIRED_COURSE: '#34d399',
  MAJOR_ELECTIVE: '#fbbf24',
  FREE_ELECTIVE: '#9ca3af',
  COOP_COURSE: '#f87171',
};
