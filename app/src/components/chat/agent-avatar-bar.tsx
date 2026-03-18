"use client";

export interface AgentStatus {
  role: string;
  name: string;
  emoji: string;
  status: "idle" | "thinking" | "speaking";
}

export function AgentAvatarBar({ agents }: { agents: AgentStatus[] }) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-2 bg-card/50">
      {agents.map((agent) => (
        <div key={agent.role} className="flex items-center gap-1.5" title={agent.name}>
          <div className="relative">
            <span className={`text-lg ${agent.status === "thinking" ? "animate-pulse" : ""}`}>
              {agent.emoji}
            </span>
            {agent.status === "thinking" && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
              </span>
            )}
            {agent.status === "speaking" && (
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-green-500" />
            )}
          </div>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">{agent.name}</span>
        </div>
      ))}
    </div>
  );
}
