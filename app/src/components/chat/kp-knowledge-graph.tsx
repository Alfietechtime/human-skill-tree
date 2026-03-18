"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { getSkillProgress, type KnowledgePoint } from "@/lib/learning-tracker";
import { useTranslations } from "next-intl";

function stageColor(stage: number): string {
  if (stage >= 5) return "#22c55e"; // green
  if (stage >= 3) return "#3b82f6"; // blue
  if (stage >= 1) return "#a855f7"; // purple
  return "#f59e0b"; // amber
}

function stageBg(stage: number): string {
  if (stage >= 5) return "rgba(34,197,94,0.15)";
  if (stage >= 3) return "rgba(59,130,246,0.15)";
  if (stage >= 1) return "rgba(168,85,247,0.15)";
  return "rgba(245,158,11,0.15)";
}

function stageLabel(stage: number): string {
  if (stage >= 5) return "Mastered";
  if (stage >= 3) return "Reviewing";
  if (stage >= 1) return "Learning";
  return "New";
}

export function KpKnowledgeGraph({
  slug,
  refreshKey,
}: {
  slug: string;
  refreshKey: number;
}) {
  const t = useTranslations("teaching");
  const progress = getSkillProgress(slug);
  const kps = progress.knowledgePoints;

  const { nodes, edges } = useMemo(() => {
    if (kps.length === 0) return { nodes: [], edges: [] };

    // Group KPs by batchId
    const batchMap = new Map<string, KnowledgePoint[]>();
    const noBatchKps: KnowledgePoint[] = [];

    kps.forEach((kp) => {
      const batchId = (kp as KnowledgePoint & { batchId?: string }).batchId;
      if (batchId) {
        if (!batchMap.has(batchId)) batchMap.set(batchId, []);
        batchMap.get(batchId)!.push(kp);
      } else {
        noBatchKps.push(kp);
      }
    });

    // Group by tutor for layout
    const tutorGroups = new Map<string, KnowledgePoint[]>();
    kps.forEach((kp) => {
      const tutor = kp.taughtBy || "self";
      if (!tutorGroups.has(tutor)) tutorGroups.set(tutor, []);
      tutorGroups.get(tutor)!.push(kp);
    });

    const ns: Node[] = [];
    let groupX = 0;

    tutorGroups.forEach((groupKps, tutorKey) => {
      groupKps.forEach((kp, i) => {
        const y = i * 90;
        ns.push({
          id: kp.id,
          position: { x: groupX, y },
          data: {
            label: kp.content.length > 30 ? kp.content.slice(0, 27) + "..." : kp.content,
            kp,
          },
          style: {
            background: stageBg(kp.stage),
            border: `1.5px solid ${stageColor(kp.stage)}`,
            borderRadius: "12px",
            padding: "8px 12px",
            fontSize: "11px",
            color: stageColor(kp.stage),
            maxWidth: "180px",
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
      });
      groupX += 240;
    });

    // Edges: connect KPs within the same batch
    const es: Edge[] = [];
    batchMap.forEach((batchKps) => {
      for (let i = 0; i < batchKps.length - 1; i++) {
        es.push({
          id: `${batchKps[i].id}-${batchKps[i + 1].id}`,
          source: batchKps[i].id,
          target: batchKps[i + 1].id,
          style: { stroke: "rgba(168,85,247,0.3)", strokeWidth: 1.5 },
          animated: true,
        });
      }
    });

    return { nodes: ns, edges: es };
  }, [kps]);

  if (kps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-400 mb-3">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
          </svg>
        </div>
        <p className="text-[11px] text-muted-foreground">{t("kpMap")} — empty</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full" key={refreshKey}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={false}
        minZoom={0.3}
        maxZoom={2}
      >
        <Background gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
