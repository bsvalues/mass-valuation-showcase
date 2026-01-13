import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Bot, Gavel, Shield, Zap, Save, RotateCcw } from "lucide-react";
import { useAgentPersistence, AgentProfile } from "@/hooks/useAgentPersistence";
import { toast } from "sonner";

const ICON_MAP = {
  'Bot': Bot,
  'Gavel': Gavel,
  'Shield': Shield,
  'Zap': Zap
};

export function AgentPersonalityTuner() {
  const { agents, saveAgents, resetAgents } = useAgentPersistence();

  const updateAgent = (id: string, field: keyof AgentProfile, value: any) => {
    const newAgents = agents.map(agent => 
      agent.id === id ? { ...agent, [field]: value } : agent
    );
    saveAgents(newAgents);
  };

  const handleSync = () => {
    toast.success("Agent Matrix Synchronized", {
      description: "Personality profiles have been persisted to the Neural Core."
    });
  };

  const handleReset = () => {
    resetAgents();
    toast.info("Agent Matrix Reset", {
      description: "Factory default personality profiles restored."
    });
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
                  {(() => {
                    const Icon = ICON_MAP[agent.iconName];
                    return <Icon className="w-5 h-5" />;
                  })()}
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
        
        <div className="pt-4 flex justify-end gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleReset}
            className="border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Defaults
          </Button>
          <Button 
            onClick={handleSync}
            className="bg-[#00ffee]/20 text-[#00ffee] hover:bg-[#00ffee]/30 border border-[#00ffee]/50"
          >
            <Save className="w-4 h-4 mr-2" />
            Sync Personality Matrix
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
