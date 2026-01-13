import { useState, useEffect } from 'react';

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  iconName: 'Bot' | 'Gavel' | 'Shield' | 'Zap';
  color: string;
  aggression: number; // 0-100
  riskTolerance: number; // 0-100
  autonomy: boolean;
}

const DEFAULT_AGENTS: AgentProfile[] = [
  { id: 'market', name: 'Market Analyst', role: 'Valuation Logic', iconName: 'Bot', color: 'text-blue-400', aggression: 65, riskTolerance: 40, autonomy: true },
  { id: 'defense', name: 'Legal Defense', role: 'Appeal Strategy', iconName: 'Gavel', color: 'text-purple-400', aggression: 85, riskTolerance: 20, autonomy: true },
  { id: 'risk', name: 'Risk Sentinel', role: 'Compliance Check', iconName: 'Shield', color: 'text-green-400', aggression: 30, riskTolerance: 10, autonomy: true },
  { id: 'swarm', name: 'Swarm Commander', role: 'Spatial Logic', iconName: 'Zap', color: 'text-amber-400', aggression: 75, riskTolerance: 60, autonomy: true },
];

const STORAGE_KEY = 'terra-fusion-agent-matrix-v1';

export function useAgentPersistence() {
  const [agents, setAgents] = useState<AgentProfile[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse agent profiles', e);
        }
      }
    }
    return DEFAULT_AGENTS;
  });

  const saveAgents = (newAgents: AgentProfile[]) => {
    setAgents(newAgents);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newAgents));
    }
  };

  const resetAgents = () => {
    setAgents(DEFAULT_AGENTS);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return { agents, saveAgents, resetAgents };
}
