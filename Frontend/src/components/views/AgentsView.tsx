import { useStore, type AgentStatus } from '@/store/useStore';
import { AgentCard } from '@/components/AgentCard';
import { useState, useEffect } from 'react';
import { mockAgents } from '@/data/mockData';
import { Plus } from 'lucide-react';

type Filter = 'all' | AgentStatus;

export function AgentsView() {
  const { agents, setAgents, setOnboardingOpen } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (agents.length === 0) setAgents(mockAgents);
  }, []);

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'frozen', label: 'Frozen' },
    { key: 'insufficient_funds', label: 'Insufficient Funds' },
  ];

  const filtered = agents.filter((a) => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (search && !a.agentId.includes(search.toLowerCase()) && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="font-mono text-sm text-muted-foreground mb-4">
          no agents registered · deploy your first agent to begin
        </p>
        <button
          onClick={() => setOnboardingOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-primary text-primary font-mono text-xs rounded-sm hover:bg-primary/10 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Agent</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-5">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`
                font-mono text-[11px] px-3 py-1 rounded-sm border transition-colors
                ${filter === f.key
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search agent_id..."
          className="font-mono text-xs bg-card border border-border rounded-sm px-3 py-1.5 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 w-48"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
