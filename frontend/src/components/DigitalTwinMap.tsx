import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomSupplyNode } from './CustomSupplyNode';
import { GraphNodeData } from '../types';
import { Network, Eye, Filter } from 'lucide-react';

interface DigitalTwinMapProps {
  initialNodes: Node<GraphNodeData>[];
  initialEdges: Edge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeData: GraphNodeData) => void;
}

export const DigitalTwinMap: React.FC<DigitalTwinMapProps> = ({
  initialNodes,
  initialEdges,
  selectedNodeId,
  onSelectNode
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when initialNodes change
  React.useEffect(() => {
    setNodes(
      initialNodes.map((n) => ({
        ...n,
        selected: n.id === selectedNodeId
      }))
    );
  }, [initialNodes, selectedNodeId, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  const nodeTypes = useMemo(() => ({ customNode: CustomSupplyNode }), []);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onSelectNode(node.data as GraphNodeData);
    },
    [onSelectNode]
  );

  return (
    <div className="relative w-full h-[520px] rounded-2xl bg-slate-950/90 border border-slate-800/90 overflow-hidden shadow-xl">
      
      {/* Map Overlay Header */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-md">
          <Network className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-slate-100">
            Supply Chain Digital Twin DAG
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
            Live Topology
          </span>
        </div>

        {/* Legend */}
        <div className="pointer-events-auto flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-[11px] shadow-md">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-300 font-medium">Nominal (&lt;40%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-slate-300 font-medium">Elevated (40-70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-300 font-medium">Critical (&gt;70%)</span>
          </div>
        </div>

      </div>

      {/* Main Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.4}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        className="bg-[#070b14]"
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls
          className="!bg-slate-900 !border-slate-800 !rounded-xl !shadow-lg [&>button]:!bg-slate-800 [&>button]:!border-slate-700 [&>button]:!text-slate-200 hover:[&>button]:!bg-slate-700"
          showInteractive={false}
        />
        <MiniMap
          nodeStrokeColor="#334155"
          nodeColor={(n: any) => {
            if (n.data?.status_color === 'rose') return '#f43f5e';
            if (n.data?.status_color === 'amber') return '#f59e0b';
            return '#10b981';
          }}
          maskColor="rgba(15, 23, 42, 0.8)"
          className="!bg-slate-950/90 !border !border-slate-800 !rounded-xl"
        />
      </ReactFlow>

      {/* Bottom Hint */}
      <div className="absolute bottom-3 left-4 z-10 pointer-events-none text-[11px] text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800/80 backdrop-blur-sm">
        💡 Click any node to drill down into operational status, weather telemetry & business impact
      </div>
    </div>
  );
};
