"use client";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { initialNodes, initialEdges } from "@/lib/tree-config";
import { SkillNode } from "./skill-node";
import { PhaseLegend } from "./phase-legend";

const nodeTypes: NodeTypes = {
  skillNode: SkillNode,
};

export function SkillTreeCanvas() {
  return (
    <div className="relative h-[calc(100vh-64px)] w-full bg-background" data-onboarding="skill-tree">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <Background color="var(--color-border)" gap={30} size={1} />
        <Controls
          className="!bg-card !border-border !rounded-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-accent"
        />
        <MiniMap
          nodeColor="#a78bfa"
          maskColor="rgba(0,0,0,0.3)"
          className="!bg-card !border-border !rounded-lg"
        />
      </ReactFlow>
      <PhaseLegend />
    </div>
  );
}
