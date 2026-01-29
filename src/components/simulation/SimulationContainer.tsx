import { useState, type ReactNode } from 'react';

interface SimulationContainerProps {
  id: string;
  title: string;
  category: 'LOGIC' | 'TENSOR' | 'GENESIS' | 'NEURAL' | 'AXIOM';
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  children: ReactNode;
  description?: string;
}

const categoryColors = {
  LOGIC: 'neon-blue',
  TENSOR: 'neon-pink',
  GENESIS: 'neon-green',
  NEURAL: 'neon-orange',
  AXIOM: 'text-primary',
};

const categoryIcons = {
  LOGIC: '⚡',
  TENSOR: '🌊',
  GENESIS: '🧬',
  NEURAL: '🧠',
  AXIOM: '∞',
};

export default function SimulationContainer({
  id,
  title,
  category,
  complexity,
  children,
  description,
}: SimulationContainerProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className={`relative w-full h-screen bg-void-black overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Simulation Canvas Area */}
      <div className="absolute inset-0">
        {children}
      </div>

      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top HUD Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between pointer-events-auto">
          {/* Title Badge */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-void-black/70 backdrop-blur-md border border-void-light/30">
            <span className="text-2xl">{categoryIcons[category]}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono text-${categoryColors[category]} tracking-wider`}>
                  {category}
                </span>
                <span className="text-xs text-text-muted">•</span>
                <span className="text-xs font-mono text-text-muted">{id}</span>
              </div>
              <h1 className="text-lg font-bold text-text-primary">{title}</h1>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="p-2 rounded-lg bg-void-black/70 backdrop-blur-md border border-void-light/30 hover:border-neon-blue/50 transition-colors"
              title="Toggle Inspector"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-void-black/70 backdrop-blur-md border border-void-light/30 hover:border-neon-blue/50 transition-colors"
              title="Fullscreen"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isFullscreen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                )}
              </svg>
            </button>
            <a
              href={`/${category.toLowerCase()}`}
              className="p-2 rounded-lg bg-void-black/70 backdrop-blur-md border border-void-light/30 hover:border-neon-blue/50 transition-colors"
              title="Back to Dimension"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </a>
          </div>
        </div>

        {/* Bottom HUD - Performance Stats */}
        <div className="absolute bottom-4 left-4 flex items-center gap-4 px-4 py-2 rounded-lg bg-void-black/70 backdrop-blur-md border border-void-light/30 pointer-events-auto">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-${complexity === 'HIGH' ? 'neon-pink' : complexity === 'MEDIUM' ? 'neon-orange' : 'neon-green'} animate-pulse`} />
            <span className="text-xs font-mono text-text-muted">COMPLEXITY: {complexity}</span>
          </div>
          <div className="w-px h-4 bg-void-light/50" />
          <span className="text-xs font-mono text-text-muted" id={`${id}-fps`}>FPS: --</span>
          <div className="w-px h-4 bg-void-light/50" />
          <span className="text-xs font-mono text-text-muted" id={`${id}-gpu`}>GPU: ACTIVE</span>
        </div>

        {/* Home Button */}
        <a
          href="/"
          className="absolute bottom-4 right-4 p-3 rounded-lg bg-void-black/70 backdrop-blur-md border border-void-light/30 hover:border-neon-blue/50 transition-colors pointer-events-auto"
          title="Home"
        >
          <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </a>
      </div>

      {/* Inspector Panel (Glassmorphism Sidebar) */}
      <div
        className={`absolute top-0 right-0 h-full w-80 bg-void-black/80 backdrop-blur-xl border-l border-void-light/30 transform transition-transform duration-300 ${
          isPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-mono text-text-muted tracking-wider">INSPECTOR</h2>
            <button
              onClick={() => setIsPanelOpen(false)}
              className="p-1 rounded hover:bg-void-light/20 transition-colors"
            >
              <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {description && (
            <div className="mb-6 p-4 rounded-lg bg-void-dark/50 border border-void-light/20">
              <p className="text-sm text-text-secondary leading-relaxed">{description}</p>
            </div>
          )}

          {/* Control Panel slot - children with controls will be rendered here */}
          <div id={`${id}-controls`} className="space-y-4">
            {/* Controls are injected by child components */}
          </div>
        </div>
      </div>
    </div>
  );
}
