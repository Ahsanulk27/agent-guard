import { useStore } from "@/store/useStore";
import { AgentCard } from "@/components/AgentCard";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function OverviewView() {
  const { agents, setAgents, auditLog, setAuditLog, setActiveView } =
    useStore();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const visibleCount = 4;

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await api.getStats();

        setAgents(data.agents);
      } catch (err) {
        console.log("Error fetching stats ", err);
      }
    };
    loadStats();
  }, []);

  useEffect(() => {
    const loadAudit = async () => {
      try {
        const data = await api.getAudit();
        setAuditLog(data.entries);
      } catch (err) {
        console.log("Error fetching audit log", err);
      }
    };

    loadAudit();
  }, [setAuditLog]);

  const totalBudget = agents.reduce((s, a) => s + a.budget, 0);
  const totalSpend = agents.reduce((s, a) => s + a.spentBudget, 0);
  const requestCount = auditLog.length;
  const blockCount = auditLog.filter((e) => e.eventType === "BLOCK").length;

  const kpis = [
    {
      label: "Total Budget Allocated",
      value: `$${totalBudget.toFixed(2)}`,
      delta: "+12%",
    },
    { label: "Total Spend", value: `$${totalSpend.toFixed(2)}`, delta: "+8%" },
    {
      label: "Requests Intercepted",
      value: String(requestCount),
      delta: "+24%",
    },
    { label: "Firewall Blocks", value: String(blockCount), delta: "-3%" },
  ];

  const recentLogs = auditLog.slice(-5);
  const activeAgents = agents.filter((a) => a.status === "active");
  const maxStartIndex = Math.max(0, activeAgents.length - visibleCount);

  useEffect(() => {
    setCarouselIndex((prev) => Math.min(prev, maxStartIndex));
  }, [maxStartIndex]);

  const visibleAgents = useMemo(
    () => activeAgents.slice(carouselIndex, carouselIndex + visibleCount),
    [activeAgents, carouselIndex],
  );

  const scroll = (dir: number) => {
    setCarouselIndex((prev) => {
      if (dir > 0) {
        return Math.min(prev + 1, maxStartIndex);
      }
      return Math.max(prev - 1, 0);
    });
  };

  return (
    <div className="p-5 space-y-8">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-border pb-5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="px-4 first:pl-0">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              {kpi.label}
            </div>
            <div className="font-mono text-xl font-semibold text-foreground">
              {kpi.value}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground mt-0.5">
              {kpi.delta} vs yesterday
            </div>
          </div>
        ))}
      </div>

      {/* Agent Carousel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Active Agents
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => scroll(-1)}
              disabled={carouselIndex === 0}
              className="w-6 h-6 flex items-center justify-center border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => scroll(1)}
              disabled={carouselIndex >= maxStartIndex}
              className="w-6 h-6 flex items-center justify-center border border-border rounded-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden pb-2">
          {visibleAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} compact />
          ))}
        </div>
      </div>

      {/* Mini Audit Feed */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Recent Activity
          </span>
          <button
            onClick={() => setActiveView("audit")}
            className="font-mono text-[11px] text-primary hover:text-primary/80 transition-colors"
          >
            → View Full Terminal
          </button>
        </div>
        <div className="bg-terminal-bg border border-border rounded-sm p-3 font-mono text-xs space-y-1">
          {recentLogs.map((entry) => {
            const color =
              entry.eventType === "BLOCK"
                ? "text-destructive"
                : entry.eventType === "PAYMENT"
                  ? "text-primary"
                  : "text-status-info";
            return (
              <div key={entry.id} className={`flex gap-3 ${color}`}>
                <span className="text-muted-foreground shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
                <span className="shrink-0">
                  {entry.eventType === "BLOCK" ? "⊘" : "·"} {entry.agentId}
                </span>
                <span className="truncate">{entry.message}</span>
                {entry.amount > 0 && (
                  <span className="ml-auto shrink-0">
                    ${entry.amount.toFixed(4)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
