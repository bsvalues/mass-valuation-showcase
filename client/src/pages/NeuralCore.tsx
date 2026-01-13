import { AgentPersonalityTuner } from "@/components/AgentPersonalityTuner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Activity, Bot, BrainCircuit, Cpu, FileText, Gavel, Globe, MessageSquare, Shield, Terminal, Zap, Send, User } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";

interface AgentLog {
  id: string;
  agent: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'system';
  text: string;
  timestamp: string;
}

export default function NeuralCore() {
  const [logs, setLogs] = useState<AgentLog[]>([
    { id: '1', agent: 'Swarm Commander', message: 'Detected anomaly in Neighborhood 42: Land value deviation > 5%', timestamp: '10:42:01', type: 'warning' },
    { id: '2', agent: 'Market Analyst', message: 'Analyzing recent sales in Sector 7. Found 3 comparable properties.', timestamp: '10:42:05', type: 'info' },
    { id: '3', agent: 'Risk Sentinel', message: 'Verifying compliance with IAAO Standard 6. PRD is within range (1.02).', timestamp: '10:42:08', type: 'success' },
    { id: '4', agent: 'Legal Defense', message: 'Drafting defense packet for Appeal #2026-042. Evidence strength: High.', timestamp: '10:42:12', type: 'info' },
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'system', text: 'Valuation Assistant initialized. I can query the parcel database, analyze outliers, or summarize market trends. How can I help?', timestamp: new Date().toLocaleTimeString() }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage("");

    // Simulate AI response
    setTimeout(() => {
      let responseText = "I'm processing that request...";
      const lowerInput = userMsg.text.toLowerCase();

      if (lowerInput.includes("outlier") || lowerInput.includes("anomaly")) {
        responseText = "I've scanned the dataset. Found 24 parcels with valuation deviations > 3 standard deviations from the neighborhood mean. High concentration in Sector 4.";
      } else if (lowerInput.includes("commercial") || lowerInput.includes("business")) {
        responseText = "Filtering for Commercial properties... Found 1,204 records. Average price per sq.ft is $245.00, trending up 4.2% year-over-year.";
      } else if (lowerInput.includes("value") || lowerInput.includes("worth")) {
        responseText = "Based on the current calibration (Base Rate: $145.50), the total assessed value of the jurisdiction is projected at $42.5 Billion.";
      } else {
        responseText = "I can help you analyze valuation data. Try asking about 'outliers', 'commercial trends', or 'total value'.";
      }

      const systemMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        text: responseText,
        timestamp: new Date().toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, systemMsg]);
    }, 1000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Simulate live agent activity
  useEffect(() => {
    const interval = setInterval(() => {
      const agents = ['Swarm Commander', 'Market Analyst', 'Risk Sentinel', 'Legal Defense'];
      const messages = [
        'Optimizing valuation model parameters...',
        'Cross-referencing zoning data with GIS layer...',
        'Detected new building permit in database.',
        'Calibrating cost tables for Q1 2026.',
        'Running regression analysis on sub-market B.',
        'Validating outlier removal logic.',
        'Synchronizing with Rust Core Engine.',
        'Updating resonance score metrics.'
      ];
      const types: ('info' | 'warning' | 'success')[] = ['info', 'info', 'success', 'info', 'success'];
      
      const newLog: AgentLog = {
        id: Date.now().toString(),
        agent: agents[Math.floor(Math.random() * agents.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        timestamp: new Date().toLocaleTimeString(),
        type: types[Math.floor(Math.random() * types.length)]
      };

      setLogs(prev => [newLog, ...prev].slice(0, 20));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <BrainCircuit className="w-8 h-8 text-[#00ffee]" />
              The Neural Core
            </h1>
            <p className="text-slate-400 mt-1">
              Agent Council Command Center. Monitor the collective intelligence of the OS.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-[#00ffee]/10 text-[#00ffee] border-[#00ffee]/20 px-3 py-1 animate-pulse">
              <Activity className="w-3 h-3 mr-1" />
              System Consciousness: High
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent Nodes Visualization */}
          <Card className="lg:col-span-2 terra-card relative overflow-hidden min-h-[400px] flex flex-col">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <CardHeader className="relative z-10">
              <CardTitle className="text-[#00ffee] flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Active Agent Topology
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 flex-1 flex items-center justify-center">
              {/* Central Core */}
              <div className="relative">
                {/* Connecting Lines (CSS drawn for simplicity in this view) */}
                <div className="absolute top-1/2 left-1/2 w-[200px] h-[1px] bg-gradient-to-r from-[#00ffee]/50 to-transparent -translate-x-1/2 -translate-y-1/2 rotate-0" />
                <div className="absolute top-1/2 left-1/2 w-[200px] h-[1px] bg-gradient-to-r from-[#00ffee]/50 to-transparent -translate-x-1/2 -translate-y-1/2 rotate-45" />
                <div className="absolute top-1/2 left-1/2 w-[200px] h-[1px] bg-gradient-to-r from-[#00ffee]/50 to-transparent -translate-x-1/2 -translate-y-1/2 rotate-90" />
                <div className="absolute top-1/2 left-1/2 w-[200px] h-[1px] bg-gradient-to-r from-[#00ffee]/50 to-transparent -translate-x-1/2 -translate-y-1/2 rotate-135" />

                {/* The Brain */}
                <div className="w-24 h-24 rounded-full bg-[#00ffee]/10 border border-[#00ffee] shadow-[0_0_30px_rgba(0,255,238,0.3)] flex items-center justify-center relative z-20 animate-pulse">
                  <BrainCircuit className="w-10 h-10 text-[#00ffee]" />
                </div>

                {/* Orbiting Agents */}
                <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-[bounce_3s_infinite]">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500 flex items-center justify-center backdrop-blur-md">
                    <Bot className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-400 bg-black/50 px-2 py-0.5 rounded-full">Market Analyst</span>
                </div>

                <div className="absolute bottom-[-80px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-[bounce_3s_infinite_1s]">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center backdrop-blur-md">
                    <Gavel className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-[10px] font-bold text-purple-400 bg-black/50 px-2 py-0.5 rounded-full">Legal Defense</span>
                </div>

                <div className="absolute left-[-100px] top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 animate-[bounce_3s_infinite_0.5s]">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center backdrop-blur-md">
                    <Shield className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-[10px] font-bold text-green-400 bg-black/50 px-2 py-0.5 rounded-full">Risk Sentinel</span>
                </div>

                <div className="absolute right-[-100px] top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 animate-[bounce_3s_infinite_1.5s]">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500 flex items-center justify-center backdrop-blur-md">
                    <Zap className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-[10px] font-bold text-amber-400 bg-black/50 px-2 py-0.5 rounded-full">Swarm Cmdr</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Neural Stream */}
          <Card className="terra-card flex flex-col h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#00ffee]" />
                Neural Stream
              </CardTitle>
              <CardDescription>Real-time inter-agent communication.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full px-6 pb-4">
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                        log.type === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                        log.type === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 
                        log.type === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
                        'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                      }`} />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${
                            log.agent === 'Swarm Commander' ? 'text-amber-400' :
                            log.agent === 'Market Analyst' ? 'text-blue-400' :
                            log.agent === 'Risk Sentinel' ? 'text-green-400' :
                            'text-purple-400'
                          }`}>{log.agent}</span>
                          <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                        </div>
                        <p className="text-sm text-slate-300 font-mono leading-relaxed">
                          {log.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
             <AgentPersonalityTuner />
          </div>
          
          {/* Valuation Assistant Chat */}
          <Card className="terra-card flex flex-col h-[500px]">
            <CardHeader>
              <CardTitle className="text-[#00ffee] flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Valuation Assistant
              </CardTitle>
              <CardDescription>Ask questions about your data.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.sender === 'user' ? 'bg-primary/20 text-primary' : 'bg-[#00ffee]/10 text-[#00ffee]'
                      }`}>
                        {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`rounded-lg p-3 max-w-[80%] text-sm ${
                        msg.sender === 'user' ? 'bg-primary/10 text-white' : 'bg-white/5 text-slate-300'
                      }`}>
                        <p>{msg.text}</p>
                        <span className="text-[10px] opacity-50 mt-1 block">{msg.timestamp}</span>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
              <div className="flex gap-2 mt-auto pt-2 border-t border-white/10">
                <Input 
                  placeholder="Ask about outliers, trends..." 
                  className="bg-black/20 border-white/10"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button size="icon" className="bg-[#00ffee] text-black hover:bg-[#00ffee]/80" onClick={handleSendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Directives */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Autonomy Level", value: "Level 4", sub: "High Supervision", icon: Cpu, color: "text-[#00ffee]" },
            { label: "Active Threads", value: "1,024", sub: "Parallel Processes", icon: Activity, color: "text-green-400" },
            { label: "Knowledge Base", value: "Updated", sub: "2ms ago", icon: FileText, color: "text-blue-400" },
            { label: "Agent Consensus", value: "99.9%", sub: "Unified Vision", icon: MessageSquare, color: "text-purple-400" },
          ].map((stat, i) => (
            <Card key={i} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-black/30 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <h4 className="text-xl font-bold text-white">{stat.value}</h4>
                  <p className="text-xs text-slate-500">{stat.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
