import { AIChatBox, type Message } from "@/components/AIChatBox";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  Bot,
  BrainCircuit,
  Building2,
  FileText,
  Gavel,
  Globe,
  Shield,
  Terminal,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface AgentLog {
  id: string;
  agent: string;
  message: string;
  timestamp: string;
  type: "info" | "warning" | "success" | "error";
}

const SUGGESTED_PROMPTS = [
  "What is the IAAO target range for COD on residential properties?",
  "How do I interpret a PRD greater than 1.03?",
  "Explain the difference between PRD and PRB for equity analysis.",
  "What are the steps to qualify a sale for ratio study inclusion?",
  "How should I handle outliers in a mass appraisal regression model?",
  "What Cook's Distance threshold indicates high influence on a regression?",
  "Summarize the current state of my assessment data.",
  "What is the recommended approach for time-adjusting sale prices?",
];

const AGENT_MESSAGES = [
  "Optimizing valuation model parameters...",
  "Cross-referencing zoning data with GIS layer...",
  "Detected new building permit in database.",
  "Calibrating cost tables for Q1 2026.",
  "Running regression analysis on sub-market B.",
  "Validating outlier removal logic.",
  "Synchronizing with Rust Core Engine.",
  "Updating resonance score metrics.",
  "Scanning for ratio study anomalies...",
  "Verifying IAAO compliance thresholds.",
  "Analyzing comparable sales in Sector 7.",
  "Recalculating neighborhood adjustment factors.",
];

export default function NeuralCore() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content:
        "You are TerraFusion AI — an IAAO-certified mass appraisal specialist embedded in the TerraFusion platform.",
    },
  ]);

  const [logs, setLogs] = useState<AgentLog[]>([
    {
      id: "1",
      agent: "Swarm Commander",
      message: "Detected anomaly in Neighborhood 42: Land value deviation > 5%",
      timestamp: new Date().toLocaleTimeString(),
      type: "warning",
    },
    {
      id: "2",
      agent: "Market Analyst",
      message: "Analyzing recent sales in Sector 7. Found 3 comparable properties.",
      timestamp: new Date().toLocaleTimeString(),
      type: "info",
    },
    {
      id: "3",
      agent: "Risk Sentinel",
      message: "Verifying compliance with IAAO Standard 6. PRD is within range (1.02).",
      timestamp: new Date().toLocaleTimeString(),
      type: "success",
    },
    {
      id: "4",
      agent: "Legal Defense",
      message: "Drafting defense packet for Appeal #2026-042. Evidence strength: High.",
      timestamp: new Date().toLocaleTimeString(),
      type: "info",
    },
  ]);

  // Live system stats from server
  const { data: systemStats, isLoading: statsLoading } = trpc.neuralCore.getSystemStats.useQuery(
    {},
    { refetchInterval: 30_000 }
  );

  // Chat mutation
  const chatMutation = trpc.neuralCore.chat.useMutation({
    onSuccess: (response) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.message },
      ]);
    },
    onError: (error) => {
      toast.error("AI response failed", {
        description: error.message || "Please try again.",
      });
    },
  });

  const handleSendMessage = (content: string) => {
    const newMessages: Message[] = [
      ...messages,
      { role: "user", content },
    ];
    setMessages(newMessages);
    chatMutation.mutate({ messages: newMessages });
  };

  // Simulate live agent activity in the neural stream
  useEffect(() => {
    const agents = ["Swarm Commander", "Market Analyst", "Risk Sentinel", "Legal Defense"];
    const types: ("info" | "warning" | "success")[] = ["info", "info", "success", "info", "success"];

    const interval = setInterval(() => {
      const newLog: AgentLog = {
        id: Date.now().toString(),
        agent: agents[Math.floor(Math.random() * agents.length)],
        message: AGENT_MESSAGES[Math.floor(Math.random() * AGENT_MESSAGES.length)],
        timestamp: new Date().toLocaleTimeString(),
        type: types[Math.floor(Math.random() * types.length)],
      };
      setLogs((prev) => [newLog, ...prev].slice(0, 20));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <BrainCircuit className="w-8 h-8 text-[#00ffee]" />
              The Neural Core
            </h1>
            <p className="text-slate-400 mt-1">
              IAAO AI Assistant &amp; Agent Council Command Center
            </p>
          </div>
          <Badge
            variant="outline"
            className="bg-[#00ffee]/10 text-[#00ffee] border-[#00ffee]/20 px-3 py-1 animate-pulse"
          >
            <Activity className="w-3 h-3 mr-1" />
            System Consciousness: High
          </Badge>
        </div>

        {/* Live System Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Parcels",
              value: systemStats?.parcelCount,
              icon: Building2,
              color: "text-[#00ffee]",
              format: (v: number) => v.toLocaleString(),
            },
            {
              label: "Sales Records",
              value: systemStats?.salesCount,
              icon: TrendingUp,
              color: "text-blue-400",
              format: (v: number) => v.toLocaleString(),
            },
            {
              label: "Pending Appeals",
              value: systemStats?.appealCount,
              icon: Gavel,
              color: "text-amber-400",
              format: (v: number) => v.toLocaleString(),
            },
            {
              label: "Production Model",
              value: systemStats?.productionModel ? 1 : 0,
              icon: Zap,
              color: systemStats?.productionModel ? "text-green-400" : "text-slate-500",
              format: () =>
                systemStats?.productionModel
                  ? `R² ${systemStats.productionModel.rSquared ?? "N/A"}`
                  : "None",
            },
          ].map(({ label, value, icon: Icon, color, format }) => (
            <Card key={label} className="terra-card">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    {label}
                  </span>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                {statsLoading ? (
                  <Skeleton className="h-7 w-24 bg-slate-700" />
                ) : (
                  <div className={`text-2xl font-bold ${color}`}>
                    {value !== undefined ? format(value) : "—"}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Grid: Chat + Agent Topology + Neural Stream */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Chat — takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className="terra-card h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[#00ffee] flex items-center gap-2">
                    <Bot className="w-5 h-5" />
                    TerraFusion AI Assistant
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-500/10 text-green-400 border-green-500/20"
                  >
                    IAAO Specialist
                  </Badge>
                </div>
                <CardDescription className="text-slate-400">
                  Ask about IAAO standards, mass appraisal methodology, your live data, or appeal
                  defense strategy.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <AIChatBox
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={chatMutation.isPending}
                  placeholder="Ask about IAAO standards, ratio studies, regression diagnostics..."
                  height={520}
                  emptyStateMessage="TerraFusion AI is ready. Ask me anything about mass appraisal."
                  suggestedPrompts={SUGGESTED_PROMPTS}
                  className="border-0 rounded-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right column: Agent Topology + Neural Stream */}
          <div className="flex flex-col gap-6">
            {/* Agent Topology */}
            <Card className="terra-card relative overflow-hidden" style={{ minHeight: 280 }}>
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <CardHeader className="relative z-10 pb-2">
                <CardTitle className="text-[#00ffee] flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4" />
                  Active Agent Topology
                </CardTitle>
              </CardHeader>
              <CardContent
                className="relative z-10 flex items-center justify-center"
                style={{ minHeight: 200 }}
              >
                <div className="relative">
                  {[0, 45, 90, 135].map((deg) => (
                    <div
                      key={deg}
                      className="absolute top-1/2 left-1/2 w-[160px] h-[1px] bg-gradient-to-r from-[#00ffee]/50 to-transparent"
                      style={{ transform: `translate(-50%, -50%) rotate(${deg}deg)` }}
                    />
                  ))}
                  {/* Brain core */}
                  <div className="w-16 h-16 rounded-full bg-[#00ffee]/10 border border-[#00ffee] shadow-[0_0_20px_rgba(0,255,238,0.3)] flex items-center justify-center relative z-20 animate-pulse">
                    <BrainCircuit className="w-8 h-8 text-[#00ffee]" />
                  </div>
                  {/* Orbiting agents */}
                  {[
                    {
                      label: "Market Analyst",
                      icon: Bot,
                      colorClass: "bg-blue-500/20 border-blue-500",
                      textClass: "text-blue-400",
                      pos: "top-[-70px] left-1/2 -translate-x-1/2",
                    },
                    {
                      label: "Legal Defense",
                      icon: Gavel,
                      colorClass: "bg-purple-500/20 border-purple-500",
                      textClass: "text-purple-400",
                      pos: "bottom-[-70px] left-1/2 -translate-x-1/2",
                    },
                    {
                      label: "Risk Sentinel",
                      icon: Shield,
                      colorClass: "bg-green-500/20 border-green-500",
                      textClass: "text-green-400",
                      pos: "left-[-85px] top-1/2 -translate-y-1/2",
                    },
                    {
                      label: "Swarm Cmdr",
                      icon: Zap,
                      colorClass: "bg-amber-500/20 border-amber-500",
                      textClass: "text-amber-400",
                      pos: "right-[-85px] top-1/2 -translate-y-1/2",
                    },
                  ].map(({ label, icon: Icon, colorClass, textClass, pos }) => (
                    <div key={label} className={`absolute ${pos} flex flex-col items-center gap-1`}>
                      <div
                        className={`w-9 h-9 rounded-full ${colorClass} border flex items-center justify-center`}
                      >
                        <Icon className={`w-4 h-4 ${textClass}`} />
                      </div>
                      <span
                        className={`text-[9px] font-bold ${textClass} bg-black/50 px-1.5 py-0.5 rounded-full whitespace-nowrap`}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Neural Stream */}
            <Card className="terra-card flex flex-col flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2 text-sm">
                  <Terminal className="w-4 h-4 text-[#00ffee]" />
                  Neural Stream
                </CardTitle>
                <CardDescription className="text-xs">
                  Real-time inter-agent communication
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto max-h-64 space-y-3 pr-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex gap-2 items-start animate-in fade-in slide-in-from-left-2 duration-300"
                  >
                    <div
                      className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                        log.type === "warning"
                          ? "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                          : log.type === "success"
                          ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]"
                          : log.type === "error"
                          ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                          : "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]"
                      }`}
                    />
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold ${
                            log.agent === "Swarm Commander"
                              ? "text-amber-400"
                              : log.agent === "Market Analyst"
                              ? "text-blue-400"
                              : log.agent === "Risk Sentinel"
                              ? "text-green-400"
                              : "text-purple-400"
                          }`}
                        >
                          {log.agent}
                        </span>
                        <span className="text-[9px] text-slate-500">{log.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-mono leading-relaxed break-words">
                        {log.message}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Capability Reference */}
        <Card className="terra-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-[#00ffee]" />
              AI Capability Reference
            </CardTitle>
            <CardDescription className="text-xs">
              Topics the TerraFusion AI Assistant is trained to answer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: "IAAO Standards",
                  desc: "Ratio study targets, COD/PRD/PRB interpretation, certification requirements",
                },
                {
                  label: "Regression Analysis",
                  desc: "OLS, MRA, Cook's Distance, VIF, heteroscedasticity, model diagnostics",
                },
                {
                  label: "Mass Appraisal",
                  desc: "Cost approach, sales comparison, income approach, time adjustments",
                },
                {
                  label: "Appeal Defense",
                  desc: "Hearing preparation, comparable selection, burden of proof, IAAO evidence standards",
                },
              ].map(({ label, desc }) => (
                <div
                  key={label}
                  className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
                >
                  <div className="text-xs font-semibold text-[#00ffee] mb-1">{label}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
