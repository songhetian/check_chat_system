import { create } from 'zustand';

interface AgentStatus {
  id: number;
  name: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  lastActive: string;
  currentInput?: string;
  violationCount: number;
  hasHelpRequest: boolean;
}

interface MonitorState {
  agents: AgentStatus[];
  stats: {
    onlineCount: number;
    violationToday: number;
    avgResponseTime: string;
  };
  updateAgentStatus: (agentId: number, status: Partial<AgentStatus>) => void;
  setAgents: (agents: AgentStatus[]) => void;
}

export const useMonitorStore = create<MonitorState>((set) => ({
  agents: [],
  stats: {
    onlineCount: 0,
    violationToday: 0,
    avgResponseTime: '1.2m',
  },
  updateAgentStatus: (agentId, status) => set((state) => ({
    agents: state.agents.map(a => a.id === agentId ? { ...a, ...status } : a)
  })),
  setAgents: (agents) => set({ agents }),
}));
