'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useRouter } from 'next/navigation';
import { MODULES } from '@/lib/concepts-data';

type ConceptNodeData = {
  label: string;
  slug: string;
  subConceptCount: number;
  isPlaceholder: boolean;
};

function ConceptNodeContent({ data }: { data: ConceptNodeData }) {
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'transparent', border: 'none' }}
      />
      
      <div
        style={{
          padding: '12px 24px',
          borderRadius: '16px',
          cursor: 'pointer',
          background: data.isPlaceholder ? '#1e293b' : '#2563eb',
          border: `2px solid ${data.isPlaceholder ? '#475569' : '#3b82f6'}`,
          transition: 'all 0.2s ease',
          width: '160px',
          minWidth: '160px',
          boxSizing: 'border-box',
        }}
        className="hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
      >
        <div style={{ 
          color: 'white', 
          fontWeight: 600, 
          fontSize: '14px', 
          whiteSpace: 'nowrap',
          textAlign: 'center'
        }}>
          {data.label}
        </div>
        
        <div style={{
          marginTop: '8px',
          height: '6px',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div
            style={{
              height: '100%',
              borderRadius: '4px',
              background: data.isPlaceholder ? '#475569' : '#34d399',
              width: data.isPlaceholder ? '0%' : '10%',
              transition: 'width 0.5s ease'
            }}
          />
        </div>
        
        {!data.isPlaceholder && data.subConceptCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#10b981',
            color: 'white',
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '9999px',
            minWidth: '20px',
            textAlign: 'center'
          }}>
            {data.subConceptCount}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: 'transparent', border: 'none' }}
      />
    </>
  );
}

const nodeTypes = {
  concept: ConceptNodeContent,
};

function RoadmapFlow() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const initialNodes: Node<ConceptNodeData>[] = useMemo(
    () =>
      MODULES.map((module, index) => ({
        id: module.slug,
        type: 'concept',
        position: module.position,
        data: {
          label: module.title,
          slug: module.slug,
          subConceptCount: module.subConcepts.length,
          isPlaceholder: module.subConcepts.length === 0,
        },
      })),
    []
  );

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    MODULES.forEach((module) => {
      module.dependencies.forEach((dep) => {
        edges.push({
          id: `${dep}-${module.slug}`,
          source: dep,
          target: module.slug,
          type: 'smoothstep',
          style: {
            stroke: '#475569',
            strokeWidth: 2,
          },
        });
      });
    });
    return edges;
  }, []);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<ConceptNodeData>) => {
      router.push(`/concepts/${node.data.slug}`);
    },
    [router]
  );

  if (!mounted) {
    return (
      <div className="w-full h-[700px] bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          Loading roadmap...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[700px] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.4,
          maxZoom: 1.5,
        }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        panOnScroll={false}
        zoomOnScroll={false}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#1e293b"
        />
      </ReactFlow>
    </div>
  );
}

export default function RoadmapDiagram() {
  return (
    <ReactFlowProvider>
      <RoadmapFlow />
    </ReactFlowProvider>
  );
}
