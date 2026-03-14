import { useStore, type Agent, type AgentStatus } from "@/store/useStore";
import { api } from "@/lib/api";

interface AgentCardProps {
  agent: Agent;
  compact?: boolean;
}

const statusConfig: Record<
  AgentStatus,
  { dot: string; text: string; label: string }
> = {
  active: {
    dot: "bg-status-healthy",
    text: "text-status-healthy",
    label: "active",
  },
  frozen: {
    dot: "bg-status-warning",
    text: "text-status-warning",
    label: "frozen",
  },
  insufficient_funds: {
    dot: "bg-status-error",
    text: "text-status-error",
    label: "insufficient_funds",
  },
};

export function AgentCard({ agent, compact }: AgentCardProps) {
  const {
    setSelectedAgent,
    setDetailDrawerOpen,
    openTopUp,
    updateAgent,
    addToast,
  } = useStore();
  const pct = agent.budget > 0 ? (agent.spentBudget / agent.budget) * 100 : 0;
  const status = statusConfig[agent.status];

  const barColor =
    pct >= 95
      ? "bg-status-error"
      : pct >= 80
        ? "bg-status-warning"
        : "bg-primary";

  const handleFreeze = async () => {
    const newStatus = agent.status === "frozen" ? "active" : "frozen";
    try {
      const updatedAgent = await api.toggleFreeze(agent.id, newStatus);
      updateAgent(updatedAgent.id, updatedAgent);
      addToast(
        "success",
        `${agent.name} ${newStatus === "frozen" ? "frozen" : "unfrozen"}`,
      );
    } catch {
      addToast("error", "Failed to update status");
    }
  };

  const handleViewDetails = () => {
    setSelectedAgent(agent);
    setDetailDrawerOpen(true);
  };

  return (
    <div
      className={`
        group border border-border bg-card rounded-sm p-5 transition-colors hover:border-foreground/20
        ${agent.status === "frozen" ? "border-l-2 border-l-status-warning" : ""}
        ${compact ? "min-w-[300px] snap-start" : ""}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-foreground">
          {agent.name}
        </span>
        <span
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-secondary`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          <span className={`font-mono text-[10px] ${status.text}`}>
            {status.label}
          </span>
        </span>
      </div>

      {/* Agent ID */}
      <div className="font-mono text-[11px] text-muted-foreground mb-4">
        id: {agent.agentId}
      </div>

      {/* Budget bar */}
      <div className="mb-1 flex justify-between">
        <span className="font-mono text-xs text-muted-foreground">
          ${agent.spentBudget.toFixed(2)} / ${agent.budget.toFixed(2)}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 bg-secondary rounded-sm overflow-hidden mb-2">
        <div
          className={`h-full ${barColor} transition-all`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      {/* Max per request */}
      <div className="font-mono text-[11px] text-muted-foreground mb-4">
        cap per req · ${agent.maxPerRequest.toFixed(2)}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Freeze toggle */}
        <button
          onClick={handleFreeze}
          className={`
            relative w-8 h-4 rounded-full transition-colors
            ${agent.status === "frozen" ? "bg-status-warning" : "bg-secondary"}
          `}
        >
          <span
            className={`
              absolute top-0.5 w-3 h-3 rounded-full bg-foreground transition-transform
              ${agent.status === "frozen" ? "left-[18px]" : "left-0.5"}
            `}
          />
        </button>

        <button
          onClick={() => openTopUp(agent.id)}
          className="font-mono text-[11px] px-2 py-1 border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
        >
          Top Up
        </button>
      </div>

      {/* Hover detail link */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-3 pt-3 border-t border-border">
        <button
          onClick={handleViewDetails}
          className="font-mono text-[11px] text-primary hover:text-primary/80 transition-colors"
        >
          View Details →
        </button>
      </div>
    </div>
  );
}
