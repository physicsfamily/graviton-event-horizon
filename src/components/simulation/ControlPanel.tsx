import type { ReactNode } from 'react';

interface ControlPanelProps {
  children: ReactNode;
}

export function ControlPanel({ children }: ControlPanelProps) {
  return (
    <div className="space-y-4">
      {children}
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export function Slider({ label, value, min, max, step = 0.01, unit = '', onChange }: SliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-mono text-text-muted uppercase tracking-wider">{label}</label>
        <span className="text-xs font-mono text-neon-blue">
          {value.toFixed(2)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-void-light/30 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-neon-blue
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:transition-transform
          [&::-webkit-slider-thumb]:hover:scale-125"
      />
    </div>
  );
}

interface ToggleProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-mono text-text-muted uppercase tracking-wider">{label}</label>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          value ? 'bg-neon-blue/30' : 'bg-void-light/30'
        }`}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
            value ? 'left-5 bg-neon-blue' : 'left-0.5 bg-text-muted'
          }`}
        />
      </button>
    </div>
  );
}

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onClick, variant = 'secondary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-2 px-4 rounded-lg font-mono text-sm transition-all ${
        variant === 'primary'
          ? 'bg-neon-blue/20 border border-neon-blue/50 text-neon-blue hover:bg-neon-blue/30'
          : 'bg-void-light/20 border border-void-light/50 text-text-secondary hover:bg-void-light/30'
      }`}
    >
      {label}
    </button>
  );
}

interface SelectProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export function Select({ label, value, options, onChange }: SelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-mono text-text-muted uppercase tracking-wider">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-2 px-3 rounded-lg bg-void-dark border border-void-light/30 text-text-primary text-sm font-mono focus:outline-none focus:border-neon-blue/50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-xs font-mono text-text-muted uppercase tracking-wider">{label}</label>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded cursor-pointer bg-transparent border border-void-light/30"
      />
    </div>
  );
}
