import { useStore, type AuditEntry } from "@/store/useStore";
import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

type FilterType = "INFO" | "PAYMENT" | "BLOCK";

export function AuditTerminal() {
  const { auditLog, setAuditLog } = useStore();
  const [filters, setFilters] = useState<Set<FilterType>>(
    new Set(["PAYMENT", "BLOCK"]),
  );
  const [newEntryIds, setNewEntryIds] = useState<Set<string>>(new Set());
  const terminalRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [isPolling, setIsPolling] = useState(true);

  const loadAudit = useCallback(async () => {
    try {
      const data = await api.getAudit();
      const existingIds = new Set(auditLog.map((entry) => entry.id));
      const incomingNewIds = data.entries
        .filter((entry) => !existingIds.has(entry.id))
        .map((entry) => entry.id);

      setAuditLog(data.entries);

      if (incomingNewIds.length > 0) {
        setNewEntryIds((prev) => {
          const next = new Set(prev);
          incomingNewIds.forEach((id) => next.add(id));
          setTimeout(() => {
            setNewEntryIds((current) => {
              const updated = new Set(current);
              incomingNewIds.forEach((id) => updated.delete(id));
              return updated;
            });
          }, 500);
          return next;
        });
      }
    } catch (err) {
      console.log("Error fetching audit log", err);
    }
  }, [auditLog, setAuditLog]);

  useEffect(() => {
    let cancelled = false;

    const initializeAudit = async () => {
      try {
        const data = await api.getAudit();
        if (!cancelled) {
          setAuditLog(data.entries);
        }
      } catch (err) {
        console.log("Error fetching audit log", err);
      }
    };

    void initializeAudit();

    return () => {
      cancelled = true;
    };
  }, [setAuditLog]);

  // Poll for new audit entries
  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(() => {
      void loadAudit();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPolling, loadAudit]);

  // Auto-scroll
  const handleScroll = useCallback(() => {
    if (!terminalRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = terminalRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 40;
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [auditLog.length]);

  const toggleFilter = (f: FilterType) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const clearLog = () => setAuditLog([]);

  const filteredLog = auditLog.filter((e) => filters.has(e.eventType));

  const getColor = (type: AuditEntry["eventType"]) => {
    if (type === "BLOCK") return "text-destructive";
    if (type === "PAYMENT") return "text-primary";
    return "text-status-info";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${isPolling ? "bg-status-healthy animate-pulse-dot" : "bg-status-warning"}`}
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {isPolling ? "LIVE" : "PAUSED"}
          </span>
        </div>

        <button
          onClick={() => setIsPolling(!isPolling)}
          className="font-mono text-[10px] px-2 py-0.5 border border-border rounded-sm text-muted-foreground hover:text-foreground"
        >
          {isPolling ? "PAUSE" : "RESUME"}
        </button>
        <button
          onClick={clearLog}
          className="font-mono text-[10px] px-2 py-0.5 border border-border rounded-sm text-muted-foreground hover:text-foreground"
        >
          CLEAR
        </button>

        <div className="flex gap-1 ml-auto">
          {(["INFO", "PAYMENT", "BLOCK"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => toggleFilter(f)}
              className={`
                font-mono text-[10px] px-2 py-0.5 rounded-sm border transition-colors
                ${
                  filters.has(f)
                    ? f === "BLOCK"
                      ? "border-destructive/50 text-destructive bg-destructive/10"
                      : f === "PAYMENT"
                        ? "border-primary/50 text-primary bg-primary/10"
                        : "border-foreground/20 text-foreground bg-foreground/5"
                    : "border-border text-muted-foreground/40"
                }
              `}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal body */}
      <div
        ref={terminalRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto scrollbar-thin p-4 font-mono text-xs leading-relaxed"
        style={{ backgroundColor: "hsl(0 0% 3%)" }}
      >
        {filteredLog.map((entry) => (
          <motion.div
            key={entry.id}
            initial={newEntryIds.has(entry.id) ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={`flex gap-3 py-0.5 ${getColor(entry.eventType)}`}
          >
            <span className="text-muted-foreground shrink-0 w-20">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
            <span className="shrink-0 w-4 text-center">·</span>
            <span className="shrink-0 w-32 truncate">
              {entry.eventType === "BLOCK" && "⊘ "}
              {entry.agentId}
            </span>
            <span className="shrink-0 w-16">{entry.eventType}</span>
            <span className="flex-1 truncate">{entry.message}</span>
            <span
              className={`shrink-0 w-16 text-right ${entry.amount > 0 ? "text-primary" : "text-muted-foreground/30"}`}
            >
              {entry.amount > 0 ? `$${entry.amount.toFixed(4)}` : "—"}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
