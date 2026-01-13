import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LayoutDashboard, Monitor, MonitorSmartphone, X } from "lucide-react";
import { useState } from "react";

export function CommandCenterMode() {
  const [isOpen, setIsOpen] = useState(false);

  const openWindow = (path: string, title: string) => {
    const width = 800;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    window.open(
      path, 
      title, 
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full w-10 h-10 bg-primary/10 hover:bg-primary/20 text-primary active-recoil"
        onClick={() => setIsOpen(true)}
        title="Command Center Mode"
      >
        <LayoutDashboard className="w-5 h-5" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg bg-[#0b1020]/95 border border-[#00ffee]/30 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-[#00ffee] flex items-center gap-2">
              <MonitorSmartphone className="w-5 h-5" />
              Command Center Orchestration
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Detach modules into separate windows for multi-monitor "War Room" setup.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 border-white/10 hover:border-[#00ffee] hover:bg-[#00ffee]/10 transition-all group"
              onClick={() => openWindow('/map-explorer', 'Map Explorer')}
            >
              <Monitor className="w-8 h-8 text-slate-500 group-hover:text-[#00ffee]" />
              <span className="text-white">Map Explorer</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 border-white/10 hover:border-[#00ffee] hover:bg-[#00ffee]/10 transition-all group"
              onClick={() => openWindow('/neural-core', 'Neural Core')}
            >
              <Monitor className="w-8 h-8 text-slate-500 group-hover:text-[#00ffee]" />
              <span className="text-white">Neural Core</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 border-white/10 hover:border-[#00ffee] hover:bg-[#00ffee]/10 transition-all group"
              onClick={() => openWindow('/mass-valuation', 'Mass Valuation Studio')}
            >
              <Monitor className="w-8 h-8 text-slate-500 group-hover:text-[#00ffee]" />
              <span className="text-white">Mass Valuation</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-24 flex flex-col gap-2 border-white/10 hover:border-[#00ffee] hover:bg-[#00ffee]/10 transition-all group"
              onClick={() => openWindow('/defense', 'Defense Studio')}
            >
              <Monitor className="w-8 h-8 text-slate-500 group-hover:text-[#00ffee]" />
              <span className="text-white">Defense Studio</span>
            </Button>
          </div>

          <div className="bg-black/30 p-4 rounded-lg border border-white/5">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Preset Layouts</h4>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="flex-1 text-xs">
                Standard Ops
              </Button>
              <Button size="sm" variant="secondary" className="flex-1 text-xs">
                Crisis Response
              </Button>
              <Button size="sm" variant="secondary" className="flex-1 text-xs">
                Full Wall
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
