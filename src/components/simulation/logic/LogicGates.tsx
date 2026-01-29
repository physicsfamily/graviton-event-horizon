import { useEffect, useRef, useState, useCallback } from 'react';
import { Slider, Toggle, Button, Select } from '../ControlPanel';

interface LogicGatesProps {
  onControlsReady?: (controls: React.ReactNode) => void;
}

type GateType = 'AND' | 'OR' | 'XOR' | 'NAND' | 'NOR' | 'NOT';

interface Gate {
  id: string;
  type: GateType;
  x: number;
  y: number;
  inputs: boolean[];
  output: boolean;
  frequency: number;
}

interface Wire {
  from: { gateId: string; output: number };
  to: { gateId: string; input: number };
}

export default function LogicGates({ onControlsReady }: LogicGatesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<Map<string, OscillatorNode>>(new Map());
  const animationRef = useRef<number>();
  
  const [gates, setGates] = useState<Gate[]>([
    { id: 'in1', type: 'NOT', x: 100, y: 150, inputs: [false], output: false, frequency: 220 },
    { id: 'in2', type: 'NOT', x: 100, y: 350, inputs: [false], output: false, frequency: 330 },
    { id: 'and1', type: 'AND', x: 300, y: 200, inputs: [false, false], output: false, frequency: 440 },
    { id: 'or1', type: 'OR', x: 300, y: 350, inputs: [false, false], output: false, frequency: 550 },
    { id: 'xor1', type: 'XOR', x: 500, y: 275, inputs: [false, false], output: false, frequency: 660 },
  ]);
  
  const [wires] = useState<Wire[]>([
    { from: { gateId: 'in1', output: 0 }, to: { gateId: 'and1', input: 0 } },
    { from: { gateId: 'in2', output: 0 }, to: { gateId: 'and1', input: 1 } },
    { from: { gateId: 'in1', output: 0 }, to: { gateId: 'or1', input: 0 } },
    { from: { gateId: 'in2', output: 0 }, to: { gateId: 'or1', input: 1 } },
    { from: { gateId: 'and1', output: 0 }, to: { gateId: 'xor1', input: 0 } },
    { from: { gateId: 'or1', output: 0 }, to: { gateId: 'xor1', input: 1 } },
  ]);

  const [clockSpeed, setClockSpeed] = useState(2);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.3);
  const [visualMode, setVisualMode] = useState('schematic');
  const [showPropagation, setShowPropagation] = useState(true);
  const [isRunning, setIsRunning] = useState(true);

  const paramsRef = useRef({ clockSpeed, audioEnabled, audioVolume, visualMode, showPropagation, isRunning });
  
  useEffect(() => {
    paramsRef.current = { clockSpeed, audioEnabled, audioVolume, visualMode, showPropagation, isRunning };
  }, [clockSpeed, audioEnabled, audioVolume, visualMode, showPropagation, isRunning]);

  // Evaluate gate logic
  const evaluateGate = useCallback((type: GateType, inputs: boolean[]): boolean => {
    switch (type) {
      case 'AND': return inputs.every(i => i);
      case 'OR': return inputs.some(i => i);
      case 'XOR': return inputs.filter(i => i).length % 2 === 1;
      case 'NAND': return !inputs.every(i => i);
      case 'NOR': return !inputs.some(i => i);
      case 'NOT': return !inputs[0];
      default: return false;
    }
  }, []);

  // Audio synthesis
  const playGateSound = useCallback((gate: Gate, active: boolean) => {
    if (!audioContextRef.current || !paramsRef.current.audioEnabled) return;
    
    const existingOsc = oscillatorsRef.current.get(gate.id);
    
    if (active && !existingOsc) {
      const osc = audioContextRef.current.createOscillator();
      const gain = audioContextRef.current.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = gate.frequency;
      gain.gain.value = paramsRef.current.audioVolume * 0.1;
      
      osc.connect(gain);
      gain.connect(audioContextRef.current.destination);
      osc.start();
      
      oscillatorsRef.current.set(gate.id, osc);
    } else if (!active && existingOsc) {
      existingOsc.stop();
      oscillatorsRef.current.delete(gate.id);
    }
  }, []);

  // Initialize audio context on user interaction
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    setAudioEnabled(true);
  }, []);

  // Draw circuit
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    let lastClockState = false;

    const drawGate = (gate: Gate, highlight: boolean) => {
      const { x, y, type, output } = gate;
      const size = 60;
      
      ctx.save();
      ctx.translate(x, y);
      
      // Gate body
      ctx.beginPath();
      if (type === 'NOT') {
        // Triangle for NOT
        ctx.moveTo(-size/2, -size/2);
        ctx.lineTo(size/2, 0);
        ctx.lineTo(-size/2, size/2);
        ctx.closePath();
      } else {
        // Curved shape for other gates
        ctx.moveTo(-size/2, -size/2);
        ctx.lineTo(size/4, -size/2);
        ctx.quadraticCurveTo(size/2 + 10, 0, size/4, size/2);
        ctx.lineTo(-size/2, size/2);
        ctx.closePath();
      }
      
      // Fill based on output state
      const fillColor = output ? 
        (highlight ? 'rgba(0, 240, 255, 0.4)' : 'rgba(0, 240, 255, 0.2)') : 
        'rgba(30, 30, 35, 0.8)';
      ctx.fillStyle = fillColor;
      ctx.fill();
      
      // Border
      ctx.strokeStyle = output ? '#00F0FF' : '#444';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // NOT bubble
      if (type === 'NOT' || type === 'NAND' || type === 'NOR') {
        ctx.beginPath();
        ctx.arc(size/2 + 8, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = output ? '#00F0FF' : '#222';
        ctx.fill();
        ctx.strokeStyle = output ? '#00F0FF' : '#444';
        ctx.stroke();
      }
      
      // Label
      ctx.fillStyle = output ? '#00F0FF' : '#888';
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(type, 0, 0);
      
      // Input pins
      const inputCount = type === 'NOT' ? 1 : 2;
      for (let i = 0; i < inputCount; i++) {
        const pinY = inputCount === 1 ? 0 : (i === 0 ? -size/3 : size/3);
        ctx.beginPath();
        ctx.arc(-size/2 - 10, pinY, 4, 0, Math.PI * 2);
        ctx.fillStyle = gate.inputs[i] ? '#00F0FF' : '#333';
        ctx.fill();
      }
      
      // Output pin
      const outX = (type === 'NOT' || type === 'NAND' || type === 'NOR') ? size/2 + 18 : size/2 + 10;
      ctx.beginPath();
      ctx.arc(outX, 0, 4, 0, Math.PI * 2);
      ctx.fillStyle = output ? '#00F0FF' : '#333';
      ctx.fill();
      
      ctx.restore();
    };

    const drawWire = (wire: Wire, gates: Gate[]) => {
      const fromGate = gates.find(g => g.id === wire.from.gateId);
      const toGate = gates.find(g => g.id === wire.to.gateId);
      if (!fromGate || !toGate) return;
      
      const fromX = fromGate.x + 70;
      const fromY = fromGate.y;
      const toX = toGate.x - 70;
      const inputCount = toGate.type === 'NOT' ? 1 : 2;
      const toY = toGate.y + (inputCount === 1 ? 0 : (wire.to.input === 0 ? -20 : 20));
      
      const active = fromGate.output;
      
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      
      // Bezier curve for wire
      const midX = (fromX + toX) / 2;
      ctx.bezierCurveTo(midX, fromY, midX, toY, toX, toY);
      
      ctx.strokeStyle = active ? '#00F0FF' : '#333';
      ctx.lineWidth = active ? 3 : 2;
      ctx.stroke();
      
      // Signal propagation animation
      if (paramsRef.current.showPropagation && active) {
        const t = (time * 2) % 1;
        const px = fromX + (toX - fromX) * t;
        const py = fromY + (toY - fromY) * t;
        
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FF00FF';
        ctx.fill();
      }
    };

    const render = () => {
      const params = paramsRef.current;
      time += 0.016 * params.clockSpeed;
      
      // Clear canvas
      ctx.fillStyle = '#0B0B0B';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      
      // Clock signal
      if (params.isRunning) {
        const clockState = Math.sin(time * Math.PI) > 0;
        if (clockState !== lastClockState) {
          lastClockState = clockState;
          
          // Update input gates based on clock
          setGates(prevGates => {
            const newGates = [...prevGates];
            
            // Toggle inputs based on different clock divisions
            const in1 = newGates.find(g => g.id === 'in1');
            const in2 = newGates.find(g => g.id === 'in2');
            
            if (in1) {
              in1.inputs[0] = clockState;
              in1.output = evaluateGate(in1.type, in1.inputs);
            }
            if (in2) {
              in2.inputs[0] = Math.sin(time * Math.PI * 0.5) > 0;
              in2.output = evaluateGate(in2.type, in2.inputs);
            }
            
            // Propagate through circuit
            for (const wire of wires) {
              const fromGate = newGates.find(g => g.id === wire.from.gateId);
              const toGate = newGates.find(g => g.id === wire.to.gateId);
              if (fromGate && toGate) {
                toGate.inputs[wire.to.input] = fromGate.output;
                toGate.output = evaluateGate(toGate.type, toGate.inputs);
              }
            }
            
            // Update audio
            for (const gate of newGates) {
              playGateSound(gate, gate.output);
            }
            
            return newGates;
          });
        }
      }
      
      // Draw wires
      for (const wire of wires) {
        drawWire(wire, gates);
      }
      
      // Draw gates
      for (const gate of gates) {
        drawGate(gate, gate.output);
      }
      
      // Draw clock indicator
      ctx.fillStyle = '#00F0FF';
      ctx.font = '14px JetBrains Mono, monospace';
      ctx.fillText(`CLK: ${lastClockState ? 'HIGH' : 'LOW'}`, 50, 50);
      ctx.fillText(`T: ${time.toFixed(2)}s`, 50, 70);
      
      animationRef.current = requestAnimationFrame(render);
    };

    const handleResize = () => {
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      oscillatorsRef.current.forEach(osc => osc.stop());
      oscillatorsRef.current.clear();
    };
  }, [gates, wires, evaluateGate, playGateSound]);

  const controls = (
    <>
      <div className="mb-4 pb-4 border-b border-void-light/20">
        <h3 className="text-xs font-mono text-neon-blue mb-3 tracking-wider">CLOCK</h3>
        <div className="space-y-4">
          <Slider label="Clock Speed" value={clockSpeed} min={0.1} max={10} step={0.1} unit=" Hz" onChange={setClockSpeed} />
          <Toggle label="Running" value={isRunning} onChange={setIsRunning} />
        </div>
      </div>
      
      <div className="mb-4 pb-4 border-b border-void-light/20">
        <h3 className="text-xs font-mono text-neon-blue mb-3 tracking-wider">AUDIO DEBUGGING</h3>
        <div className="space-y-3">
          {!audioEnabled ? (
            <Button label="ENABLE AUDIO" onClick={initAudio} variant="primary" />
          ) : (
            <>
              <Toggle label="Audio Enabled" value={audioEnabled} onChange={setAudioEnabled} />
              <Slider label="Volume" value={audioVolume} min={0} max={1} onChange={setAudioVolume} />
            </>
          )}
          <p className="text-xs text-text-muted mt-2">
            Each gate produces a unique tone when HIGH. Listen for the "singing circuit"!
          </p>
        </div>
      </div>
      
      <div className="mb-4 pb-4 border-b border-void-light/20">
        <h3 className="text-xs font-mono text-neon-blue mb-3 tracking-wider">VISUALIZATION</h3>
        <div className="space-y-3">
          <Toggle label="Show Propagation" value={showPropagation} onChange={setShowPropagation} />
          <Select
            label="Visual Mode"
            value={visualMode}
            options={[
              { value: 'schematic', label: 'Schematic' },
              { value: 'timing', label: 'Timing Diagram' },
              { value: 'truth', label: 'Truth Table' },
            ]}
            onChange={setVisualMode}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Button label="RESET" onClick={() => window.location.reload()} />
      </div>
      
      <div className="mt-6 p-4 rounded-lg bg-void-dark/50 border border-void-light/20">
        <h4 className="text-xs font-mono text-text-muted mb-2">FREQUENCY MAP</h4>
        <div className="space-y-1 text-xs font-mono">
          {gates.map(g => (
            <div key={g.id} className="flex justify-between">
              <span className={g.output ? 'text-neon-blue' : 'text-text-muted'}>{g.type}</span>
              <span className="text-text-muted">{g.frequency} Hz</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  useEffect(() => {
    if (onControlsReady) onControlsReady(controls);
  }, [clockSpeed, audioEnabled, audioVolume, visualMode, showPropagation, isRunning, gates]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
}
