import { useState, useEffect } from 'react';

interface HeroOverlayProps {
  appUrl?: string;
}

export default function HeroOverlay({ appUrl = 'https://app.graviton.dev' }: HeroOverlayProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [typedText, setTypedText] = useState('');
  const fullText = 'BUILD UNIVERSES';

  useEffect(() => {
    setIsLoaded(true);
    
    let index = 0;
    const typeInterval = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index));
        index++;
      } else {
        clearInterval(typeInterval);
      }
    }, 100);

    return () => clearInterval(typeInterval);
  }, []);

  return (
    <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      {/* Logo */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-neon-blue/30 bg-void-black/50 backdrop-blur-sm">
          <div className="relative h-6 w-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-neon-blue to-neon-pink animate-pulse" />
            <div className="absolute inset-[2px] rounded-full bg-void-black flex items-center justify-center">
              <span className="text-neon-blue font-bold text-xs">G</span>
            </div>
          </div>
          <span className="text-sm font-mono text-text-secondary tracking-wider">GRAVITON.DEV</span>
        </div>
      </div>

      {/* Main Title */}
      <h1 className="font-mono text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6">
        <span className="text-text-primary">{typedText}</span>
        <span className="animate-pulse text-neon-blue">_</span>
      </h1>

      {/* Subtitle */}
      <p className="font-mono text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
        <span className="text-neon-blue">{'>'}</span> The universal simulation platform.
        <br />
        <span className="text-neon-pink">{'>'}</span> Logic circuits. Fluid dynamics. Artificial life.
        <br />
        <span className="text-neon-green">{'>'}</span> Powered by <span className="text-neon-orange">Rust</span> + <span className="text-neon-blue">WebGPU</span>.
      </p>

      {/* CTA Button */}
      <div className="space-y-6">
        <a
          href={appUrl}
          className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-lg overflow-hidden transition-all duration-300 hover:scale-105"
        >
          {/* Animated gradient border */}
          <div className="absolute inset-0 bg-gradient-to-r from-neon-blue via-neon-pink to-neon-blue bg-[length:200%_100%] animate-gradient rounded-lg" />
          <div className="absolute inset-[2px] bg-void-black rounded-md" />
          
          <span className="relative font-mono font-bold text-lg text-text-primary group-hover:text-neon-blue transition-colors">
            INITIALIZE UNIVERSE
          </span>
          <svg className="relative w-5 h-5 text-neon-blue group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>

        {/* Secondary Links */}
        <div className="flex items-center justify-center gap-6 text-sm font-mono">
          <a href="/docs" className="text-text-muted hover:text-neon-blue transition-colors">
            [DOCS]
          </a>
          <a href="https://github.com/physicsfamily/graviton" className="text-text-muted hover:text-neon-blue transition-colors">
            [GITHUB]
          </a>
          <a href="/blog" className="text-text-muted hover:text-neon-blue transition-colors">
            [BLOG]
          </a>
        </div>
      </div>

      {/* Dimension Navigation */}
      <nav className="mt-16 pt-8 border-t border-void-light/30">
        <p className="text-xs font-mono text-text-muted mb-4 tracking-widest">EXPLORE DIMENSIONS</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {[
            { href: '/logic', label: 'LOGIC', icon: '⚡' },
            { href: '/tensor', label: 'TENSOR', icon: '🌊' },
            { href: '/genesis', label: 'GENESIS', icon: '🧬' },
            { href: '/neural', label: 'NEURAL', icon: '🧠' },
            { href: '/axiom', label: 'AXIOM', icon: '∞' },
          ].map((dim) => (
            <a
              key={dim.href}
              href={dim.href}
              className="group flex items-center gap-2 px-4 py-2 rounded-lg border border-void-light/50 bg-void-black/30 backdrop-blur-sm hover:border-neon-blue/50 hover:bg-neon-blue/5 transition-all"
            >
              <span className="text-lg">{dim.icon}</span>
              <span className="font-mono text-xs text-text-muted group-hover:text-neon-blue transition-colors">
                /{dim.label}
              </span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}
