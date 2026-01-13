import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Bot, Gavel, Shield, Zap } from "lucide-react";
import { useState } from "react";

interface AgentProfile {
  id: string;
  name: string;
  role: string;
  icon: any;
  color: string;
  aggression: number; // 0-100
  riskTolerance: number; // 0-100
  autonomy: boolean;
}

export function AgentPersonalityTuner() {
  const [agents, setAgents] = useState<AgentProfile[]>([
    { id: 'market', name: 'Market Analyst', role: 'Valuation Logic', icon: Bot, color: 'text-blue-400', aggression: 65, riskTolerance: 40, autonomy: true },
    { id: 'defense', name: 'Legal Defense', role: 'Appeal Strategy', icon: Gavel, color: 'text-purple-400', aggression: 85, riskTolerance: 20, autonomy: true },
    { id: 'risk', name: 'Risk Sentinel', role: 'Compliance Check', icon: Shield, color: 'text-green-400', aggression: 30, riskTolerance: 10, autonomy: true },
    { id: 'swarm', name: 'Swarm Commander', role: 'Spatial Logic', icon: Zap, color: 'text-amber-400', aggression: 75, riskTolerance: 60, autonomy: true },
  ]);

  const updateAgent = (id: string, field: keyof AgentProfile, value: any) => {
    setAgents(prev => prev.map(agent => 
      agent.id === id ? { ...agent, [field]: value } : agent
    ));
  };

  return (
    <Card className="terra-card">
      <CardHeader>
        <CardTitle className="text-[#00ffee] flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Agent Personality Matrix
        </CardTitle>
        <CardDescription>Tune the behavioral parameters of the autonomous agents.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {agents.map(agent => (
          <div key={agent.id} className="space-y-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-[#00ffee]/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md bg-black/30 ${agent.color}`}>
                  <agent.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{agent.name}</h4>
                  <p className="text-xs text-slate-400">{agent.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor={`autonomy-${agent.id}`} className="text-xs text-slate-400">Autonomy</Label>
                <Switch 
                  id={`autonomy-${agent.id}`}
                  checked={agent.autonomy}
                  onCheckedChange={(c) => updateAgent(agent.id, 'autonomy', c)}
                />
              </div>
            </div>

            <div className="space-y-4 pl-12">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Aggression / Assertiveness</span>
                  <span className="text-[#00ffee] font-mono">{agent.aggression}%</span>
                </div>
                <Slider 
                  value={[agent.aggression]} 
                  max={100} 
                  step={1}
                  onValueChange={([v]) => updateAgent(agent.id, 'aggression', v)}
                  className="py-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Risk Tolerance</span>
                  <span className={`font-mono ${agent.riskTolerance > 50 ? 'text-amber-400' : 'text-green-400'}`}>
                    {agent.riskTolerance}%
                  </span>
                </div>
                <Slider 
                  value={[agent.riskTolerance]} 
                  max={100} 
                  step={1}
                  onValueChange={([v]) => updateAgent(agent.id, 'riskTolerance', v)}
                  className="py-2"
                />
              </div>
            </div>
          </div>
        ))}
        
        <div className="pt-4 flex justify-end">
          <Button className="bg-[#00ffee]/20 text-[#00ffee] hover:bg-[#00ffee]/30 border border-[#00ffee]/50">
            Sync Personality Matrix
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
