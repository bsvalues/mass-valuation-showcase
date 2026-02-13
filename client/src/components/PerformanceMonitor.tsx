import { Profiler, ProfilerOnRenderCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  renderCount: number;
  slowRenders: number;
}

interface PerformanceMonitorProps {
  children: React.ReactNode;
  enabled?: boolean; // Only show in development
}

/**
 * TerraFusion OS Performance Monitor
 * Enforces 60fps standard and tracks render performance
 */
export function PerformanceMonitor({ children, enabled = import.meta.env.DEV }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    renderTime: 0,
    renderCount: 0,
    slowRenders: 0,
  });
  const [showMonitor, setShowMonitor] = useState(false);

  // FPS tracking using requestAnimationFrame
  useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrameId: number;

    const measureFPS = (currentTime: number) => {
      frameCount++;
      
      const elapsed = currentTime - lastTime;
      if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        setMetrics(prev => ({ ...prev, fps }));
        
        // Log warning if FPS drops below 60
        if (fps < 60) {
          console.warn(`[TerraFusion Performance] FPS dropped to ${fps} (target: 60fps)`);
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [enabled]);

  // React Profiler callback
  const onRenderCallback: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    if (!enabled) return;

    setMetrics(prev => {
      const slowRenders = actualDuration > 16 ? prev.slowRenders + 1 : prev.slowRenders; // 16ms = 60fps threshold
      
      // Log slow renders
      if (actualDuration > 16) {
        console.warn(
          `[TerraFusion Performance] Slow render detected: ${actualDuration.toFixed(2)}ms (target: <16ms for 60fps)`,
          { id, phase, actualDuration, baseDuration }
        );
      }

      return {
        ...prev,
        renderTime: actualDuration,
        renderCount: prev.renderCount + 1,
        slowRenders,
      };
    });
  };

  if (!enabled) {
    return <>{children}</>;
  }

  const fpsStatus = metrics.fps >= 60 ? 'good' : metrics.fps >= 30 ? 'warning' : 'critical';
  const renderStatus = metrics.renderTime < 16 ? 'good' : metrics.renderTime < 32 ? 'warning' : 'critical';

  return (
    <Profiler id="TerraFusion-App" onRender={onRenderCallback}>
      {children}

      {/* Performance Monitor Toggle */}
      <button
        onClick={() => setShowMonitor(!showMonitor)}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg
                   bg-[var(--color-glass-2)] backdrop-blur-xl border border-white/10
                   text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                   hover:bg-[var(--color-glass-3)] transition-all duration-[var(--duration-fast)]
                   shadow-lg"
        title="Performance Monitor"
      >
        <Activity className="w-4 h-4" />
        <span className="text-xs font-mono">{metrics.fps} FPS</span>
      </button>

      {/* Performance Monitor Panel */}
      {showMonitor && (
        <div className="fixed top-16 right-4 z-50 w-80 p-4 rounded-xl
                        bg-[var(--color-government-night-elevated)] backdrop-blur-xl
                        border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[var(--color-signal-primary)] uppercase tracking-wider">
              Performance Monitor
            </h3>
            <button
              onClick={() => setShowMonitor(false)}
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {/* FPS Metric */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-glass-1)]">
              <div className="flex items-center gap-2">
                {fpsStatus === 'good' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {fpsStatus === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                {fpsStatus === 'critical' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                <span className="text-sm text-[var(--color-text-secondary)]">Frame Rate</span>
              </div>
              <span className={`text-lg font-bold font-mono ${
                fpsStatus === 'good' ? 'text-green-500' :
                fpsStatus === 'warning' ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {metrics.fps} FPS
              </span>
            </div>

            {/* Render Time Metric */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-glass-1)]">
              <div className="flex items-center gap-2">
                {renderStatus === 'good' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                {renderStatus === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                {renderStatus === 'critical' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                <span className="text-sm text-[var(--color-text-secondary)]">Render Time</span>
              </div>
              <span className={`text-lg font-bold font-mono ${
                renderStatus === 'good' ? 'text-green-500' :
                renderStatus === 'warning' ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {metrics.renderTime.toFixed(2)}ms
              </span>
            </div>

            {/* Render Count */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-glass-1)]">
              <span className="text-sm text-[var(--color-text-secondary)]">Total Renders</span>
              <span className="text-lg font-bold font-mono text-[var(--color-text-primary)]">
                {metrics.renderCount}
              </span>
            </div>

            {/* Slow Renders */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-glass-1)]">
              <span className="text-sm text-[var(--color-text-secondary)]">Slow Renders (&gt;16ms)</span>
              <span className={`text-lg font-bold font-mono ${
                metrics.slowRenders === 0 ? 'text-green-500' : 'text-yellow-500'
              }`}>
                {metrics.slowRenders}
              </span>
            </div>
          </div>

          {/* TerraFusion Standard */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-[var(--color-text-tertiary)]">
              <span className="font-bold text-[var(--color-signal-primary)]">TerraFusion Standard:</span> 60fps, &lt;16ms renders
            </p>
          </div>
        </div>
      )}
    </Profiler>
  );
}
