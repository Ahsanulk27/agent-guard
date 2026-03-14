import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useStore } from '@/store/useStore';
import { OverviewView } from '@/components/views/OverviewView';
import { AgentsView } from '@/components/views/AgentsView';
import { AuditTerminal } from '@/components/views/AuditTerminal';
import { SettingsView } from '@/components/views/SettingsView';
import { ToastContainer } from '@/components/Toast';
import { OnboardingModal } from '@/components/OnboardingModal';
import { AgentDetailDrawer } from '@/components/AgentDetailDrawer';
import { TopUpDrawer } from '@/components/TopUpDrawer';
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts';

const views = {
  overview: OverviewView,
  agents: AgentsView,
  audit: AuditTerminal,
  settings: SettingsView,
};

export function Layout() {
  const { activeView } = useStore();
  const ActiveView = views[activeView];

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen pb-14 md:pb-0">
        <Header />
        <main className="flex-1 overflow-auto scrollbar-thin">
          <ActiveView />
        </main>
      </div>
      <ToastContainer />
      <OnboardingModal />
      <AgentDetailDrawer />
      <TopUpDrawer />
      <KeyboardShortcuts />
    </div>
  );
}
