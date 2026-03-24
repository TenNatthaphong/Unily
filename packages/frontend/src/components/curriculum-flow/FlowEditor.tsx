import { useCallback, useRef } from 'react';
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

export interface FlowNode extends Node {
  data: CourseNodeData;
}

interface Props {
  initialNodes: FlowNode[];
  initialEdges: Edge[];
  onNodesChange?: (nodes: FlowNode[]) => void;
  readOnly?: boolean;
}

const nodeTypes: NodeTypes = {
  courseNode: CourseNode,
};

export default function FlowEditor({ initialNodes, initialEdges, onNodesChange, readOnly = false }: Props) {
  const [nodes, setNodes, onNodesStateChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onConnect = useCallback((params: Connection) => {
    if (readOnly) return;
    setEdges(eds => addEdge({ ...params, type: 'smoothstep', animated: false }, eds));
  }, [readOnly, setEdges]);

  const onNodeDragStop = useCallback(() => {
    if (onNodesChange) onNodesChange(nodes as FlowNode[]);
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

    const data = JSON.parse(raw) as CourseNodeData & { courseId: string };
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
      data,
    };

    setNodes(nds => [...nds, newNode]);
    if (onNodesChange) onNodesChange([...nodes as FlowNode[], newNode]);
  }, [nodes, onNodesChange, readOnly, setNodes]);

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesStateChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
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
        <MiniMap nodeColor={n => {
          const d = n.data as CourseNodeData;
          return d?.isWildcard ? '#374151' : '#2D74E0';
        }} />
      </ReactFlow>
    </div>
  );
}
