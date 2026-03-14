import { useState } from "react";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { api } from "@/lib/api";

export function TopUpDrawer() {
  const {
    isTopUpDrawerOpen,
    topUpAgentId,
    closeTopUp,
    agents,
    updateAgent,
    addToast,
  } = useStore();
  const [amount, setAmount] = useState("");

  const agent = agents.find((a) => a.id === topUpAgentId);

  const handleConfirm = async () => {
    const val = parseFloat(amount);
    if (!agent || isNaN(val) || val <= 0) {
      addToast("error", "Enter a valid amount");
      return;
    }

    try {
      const updatedAgent = await api.topUpBudget(agent.id, val);
      updateAgent(updatedAgent.id, updatedAgent);
      addToast("success", `Added $${val.toFixed(2)} to ${agent.name}`);
      setAmount("");
      closeTopUp();
    } catch {
      addToast("error", "Top-up failed");
    }
  };

  return (
    <AnimatePresence>
      {isTopUpDrawerOpen && agent && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-background/80"
            onClick={closeTopUp}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[320px] bg-card border-l border-border md:w-[320px]"
          >
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  Top Up — {agent.name}
                </h3>
                <button
                  onClick={closeTopUp}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="font-mono text-xs text-muted-foreground">
                Current: ${agent.spentBudget.toFixed(2)} / $
                {agent.budget.toFixed(2)}
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full mt-1 font-mono text-xs bg-background border border-border rounded-sm px-3 py-2 text-foreground outline-none focus:border-primary/50"
                />
              </div>

              <button
                onClick={handleConfirm}
                className="w-full font-mono text-xs px-3 py-2 bg-primary text-primary-foreground rounded-sm hover:bg-primary/90 transition-colors"
              >
                Confirm Top Up
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
