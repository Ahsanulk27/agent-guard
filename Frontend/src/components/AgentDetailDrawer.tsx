import { useStore } from "@/store/useStore";
import { ApiKeyField } from "@/components/ApiKeyField";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { api } from "@/lib/api";

export function AgentDetailDrawer() {
  const {
    selectedAgent,
    isDetailDrawerOpen,
    setDetailDrawerOpen,
    setSelectedAgent,
    updateAgent,
    addToast,
    auditLog,
  } = useStore();

  if (!selectedAgent) return null;

  const agentLogs = auditLog
    .filter((e) => e.agentId === selectedAgent.agentId)
    .slice(-20);

  const handleRetire = async () => {
    try {
      const updatedAgent = await api.toggleFreeze(selectedAgent.id, "frozen");
      updateAgent(updatedAgent.id, updatedAgent);
      addToast("info", `${selectedAgent.name} retired`);
      setDetailDrawerOpen(false);
      setSelectedAgent(null);
    } catch {
      addToast("error", "Failed to retire agent");
    }
  };

  const handleRegenerate = async () => {
    try {
      const updatedAgent = await api.regenerateKey(selectedAgent.id);
      updateAgent(updatedAgent.id, updatedAgent);
      addToast("success", "API key regenerated");
    } catch {
      addToast("error", "Failed to regenerate API key");
    }
  };

  return (
    <AnimatePresence>
      {isDetailDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80"
            onClick={() => {
              setDetailDrawerOpen(false);
              setSelectedAgent(null);
            }}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] bg-card border-l border-border overflow-y-auto scrollbar-thin md:w-[420px]"
          >
            <div className="p-5 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">
                  {selectedAgent.name}
                </h2>
                <button
                  onClick={() => {
                    setDetailDrawerOpen(false);
                    setSelectedAgent(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="font-mono text-[11px] text-muted-foreground">
                id: {selectedAgent.agentId}
              </div>

              {/* Spend chart */}
              {selectedAgent.spendHistory.length > 1 && (
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                    Spend Over Time
                  </div>
                  <div className="h-24 w-full">
                    <ResponsiveContainer>
                      <AreaChart data={selectedAgent.spendHistory}>
                        <defs>
                          <linearGradient
                            id="spendGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="hsl(217, 91%, 60%)"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="100%"
                              stopColor="hsl(217, 91%, 60%)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="timestamp" hide />
                        <YAxis hide domain={[0, "auto"]} />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(0 0% 7%)",
                            border: "1px solid hsl(0 0% 12%)",
                            borderRadius: "2px",
                            fontFamily: "JetBrains Mono",
                            fontSize: "10px",
                          }}
                          labelStyle={{ display: "none" }}
                          formatter={(val: number) => [
                            `$${val.toFixed(2)}`,
                            "Spend",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="hsl(217, 91%, 60%)"
                          fill="url(#spendGrad)"
                          strokeWidth={1.5}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Budget info */}
              <div className="space-y-2">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">Budget</span>
                  <span className="text-foreground">
                    ${selectedAgent.spentBudget.toFixed(2)} / $
                    {selectedAgent.budget.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">Max Per Request</span>
                  <span className="text-foreground">
                    ${selectedAgent.maxPerRequest.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">Loop Detection</span>
                  <span className="text-foreground">
                    {selectedAgent.loopDetectionWindow}s /{" "}
                    {selectedAgent.maxIdenticalRequests} max
                  </span>
                </div>
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-foreground">
                    {new Date(selectedAgent.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* API Key */}
              <ApiKeyField
                apiKey={selectedAgent.apiKey}
                onRegenerate={handleRegenerate}
              />

              {/* Transaction history */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Recent Transactions
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  {agentLogs.length === 0 && (
                    <div className="text-muted-foreground">No transactions</div>
                  )}
                  {agentLogs.map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex gap-2 ${entry.eventType === "BLOCK" ? "text-destructive" : entry.eventType === "PAYMENT" ? "text-primary" : "text-status-info"}`}
                    >
                      <span className="text-muted-foreground shrink-0">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="truncate">{entry.message}</span>
                      {entry.amount > 0 && (
                        <span className="ml-auto">
                          ${entry.amount.toFixed(4)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Retire */}
              <button
                onClick={handleRetire}
                className="w-full font-mono text-xs px-3 py-2 border border-destructive text-destructive rounded-sm hover:bg-destructive/10 transition-colors"
              >
                Retire Agent
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
