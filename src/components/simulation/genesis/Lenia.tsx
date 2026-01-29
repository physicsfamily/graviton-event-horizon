import { useEffect, useRef, useState } from 'react';
import { Slider, Toggle, Button, Select } from '../ControlPanel';

interface LeniaProps {
  onControlsReady?: (controls: React.ReactNode) => void;
}

export default function Lenia({ onControlsReady }: LeniaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isSupported, setIsSupported] = useState(true);
  const [fps, setFps] = useState(0);
  
  // Simulation parameters
  const [growthMu, setGrowthMu] = useState(0.15);
  const [growthSigma, setGrowthSigma] = useState(0.015);
  const [kernelRadius, setKernelRadius] = useState(13);
  const [timeStep, setTimeStep] = useState(0.1);
  const [colorScheme, setColorScheme] = useState('plasma');
  const [isRunning, setIsRunning] = useState(true);

  const paramsRef = useRef({ growthMu, growthSigma, kernelRadius, timeStep, colorScheme, isRunning });
  
  useEffect(() => {
    paramsRef.current = { growthMu, growthSigma, kernelRadius, timeStep, colorScheme, isRunning };
  }, [growthMu, growthSigma, kernelRadius, timeStep, colorScheme, isRunning]);

  useEffect(() => {
    if (!navigator.gpu) {
      setIsSupported(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    let device: GPUDevice;
    let context: GPUCanvasContext;
    let computePipeline: GPUComputePipeline;
    let renderPipeline: GPURenderPipeline;
    let stateBuffers: GPUBuffer[];
    let uniformBuffer: GPUBuffer;
    let computeBindGroups: GPUBindGroup[];
    let renderBindGroup: GPUBindGroup;
    let currentBuffer = 0;
    
    const GRID_SIZE = 512;
    let lastTime = performance.now();
    let frameCount = 0;

    const initWebGPU = async () => {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          setIsSupported(false);
          return;
        }

        device = await adapter.requestDevice();
        context = canvas.getContext('webgpu') as GPUCanvasContext;
        
        const format = navigator.gpu.getPreferredCanvasFormat();
        context.configure({ device, format, alphaMode: 'premultiplied' });

        // Lenia compute shader
        const computeShaderCode = `
          struct Params {
            growthMu: f32,
            growthSigma: f32,
            kernelRadius: f32,
            timeStep: f32,
            time: f32,
            colorScheme: f32,
          }

          @group(0) @binding(0) var<uniform> params: Params;
          @group(0) @binding(1) var<storage, read> stateIn: array<f32>;
          @group(0) @binding(2) var<storage, read_write> stateOut: array<f32>;

          const GRID_SIZE: u32 = 512u;
          const PI: f32 = 3.14159265359;

          fn idx(x: i32, y: i32) -> u32 {
            let wx = (x + i32(GRID_SIZE)) % i32(GRID_SIZE);
            let wy = (y + i32(GRID_SIZE)) % i32(GRID_SIZE);
            return u32(wy) * GRID_SIZE + u32(wx);
          }

          // Gaussian kernel
          fn kernel(r: f32, R: f32) -> f32 {
            let rNorm = r / R;
            if (rNorm > 1.0) { return 0.0; }
            return exp(4.0 - 4.0 / (4.0 * rNorm * (1.0 - rNorm) + 0.0001));
          }

          // Growth function (Gaussian)
          fn growth(u: f32, mu: f32, sigma: f32) -> f32 {
            return 2.0 * exp(-pow(u - mu, 2.0) / (2.0 * sigma * sigma)) - 1.0;
          }

          @compute @workgroup_size(16, 16)
          fn main(@builtin(global_invocation_id) id: vec3u) {
            let x = i32(id.x);
            let y = i32(id.y);
            
            if (id.x >= GRID_SIZE || id.y >= GRID_SIZE) { return; }
            
            let R = i32(params.kernelRadius);
            var sum: f32 = 0.0;
            var norm: f32 = 0.0;
            
            // Convolution with ring kernel
            for (var dy = -R; dy <= R; dy++) {
              for (var dx = -R; dx <= R; dx++) {
                let r = sqrt(f32(dx * dx + dy * dy));
                let k = kernel(r, f32(R));
                sum += stateIn[idx(x + dx, y + dy)] * k;
                norm += k;
              }
            }
            
            let potential = sum / max(norm, 0.0001);
            let currentState = stateIn[idx(x, y)];
            let g = growth(potential, params.growthMu, params.growthSigma);
            
            var newState = currentState + params.timeStep * g;
            newState = clamp(newState, 0.0, 1.0);
            
            stateOut[idx(x, y)] = newState;
          }
        `;

        // Render shader
        const renderShaderCode = `
          struct Params {
            growthMu: f32,
            growthSigma: f32,
            kernelRadius: f32,
            timeStep: f32,
            time: f32,
            colorScheme: f32,
          }

          struct VertexOutput {
            @builtin(position) position: vec4f,
            @location(0) uv: vec2f,
          }

          @group(0) @binding(0) var<uniform> params: Params;
          @group(0) @binding(1) var<storage, read> state: array<f32>;

          const GRID_SIZE: f32 = 512.0;

          fn plasma(t: f32) -> vec3f {
            return vec3f(
              0.5 + 0.5 * cos(6.28318 * (t + 0.0)),
              0.5 + 0.5 * cos(6.28318 * (t + 0.33)),
              0.5 + 0.5 * cos(6.28318 * (t + 0.67))
            );
          }

          fn viridis(t: f32) -> vec3f {
            let c0 = vec3f(0.267, 0.004, 0.329);
            let c1 = vec3f(0.282, 0.140, 0.457);
            let c2 = vec3f(0.254, 0.265, 0.529);
            let c3 = vec3f(0.206, 0.371, 0.553);
            let c4 = vec3f(0.163, 0.471, 0.558);
            let c5 = vec3f(0.127, 0.566, 0.550);
            let c6 = vec3f(0.134, 0.658, 0.517);
            let c7 = vec3f(0.267, 0.749, 0.440);
            let c8 = vec3f(0.477, 0.821, 0.318);
            let c9 = vec3f(0.741, 0.873, 0.150);
            
            let idx = t * 9.0;
            let i = u32(idx);
            let f = fract(idx);
            
            if (i >= 9u) { return c9; }
            
            var colors = array<vec3f, 10>(c0, c1, c2, c3, c4, c5, c6, c7, c8, c9);
            return mix(colors[i], colors[i + 1u], f);
          }

          fn neonLife(t: f32) -> vec3f {
            let cyan = vec3f(0.0, 0.94, 1.0);
            let magenta = vec3f(1.0, 0.0, 1.0);
            let black = vec3f(0.02, 0.02, 0.03);
            
            if (t < 0.1) { return mix(black, cyan * 0.3, t * 10.0); }
            return mix(cyan, magenta, pow(t, 0.5));
          }

          @vertex
          fn vertexMain(@builtin(vertex_index) idx: u32) -> VertexOutput {
            var pos = array<vec2f, 6>(
              vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
              vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0)
            );
            var out: VertexOutput;
            out.position = vec4f(pos[idx], 0.0, 1.0);
            out.uv = pos[idx] * 0.5 + 0.5;
            return out;
          }

          @fragment
          fn fragmentMain(in: VertexOutput) -> @location(0) vec4f {
            let x = u32(in.uv.x * GRID_SIZE);
            let y = u32(in.uv.y * GRID_SIZE);
            let i = y * u32(GRID_SIZE) + x;
            
            let value = state[i];
            
            var color: vec3f;
            if (params.colorScheme < 0.5) {
              color = plasma(value);
            } else if (params.colorScheme < 1.5) {
              color = viridis(value);
            } else {
              color = neonLife(value);
            }
            
            return vec4f(color, 1.0);
          }
        `;

        const computeModule = device.createShaderModule({ code: computeShaderCode });
        const renderModule = device.createShaderModule({ code: renderShaderCode });

        // Create buffers
        const bufferSize = GRID_SIZE * GRID_SIZE * 4;
        
        stateBuffers = [
          device.createBuffer({ size: bufferSize, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }),
          device.createBuffer({ size: bufferSize, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST }),
        ];

        uniformBuffer = device.createBuffer({
          size: 32,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Initialize with random circular patterns (Orbium-like)
        const initialState = new Float32Array(GRID_SIZE * GRID_SIZE);
        const cx = GRID_SIZE / 2;
        const cy = GRID_SIZE / 2;
        
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            const dx = x - cx;
            const dy = y - cy;
            const r = Math.sqrt(dx * dx + dy * dy);
            
            // Create initial Orbium pattern
            if (r < 20) {
              const angle = Math.atan2(dy, dx);
              const ring = Math.sin(r * 0.5) * 0.5 + 0.5;
              const spiral = Math.sin(angle * 3 + r * 0.2) * 0.3;
              initialState[y * GRID_SIZE + x] = Math.max(0, ring + spiral);
            }
            
            // Add some noise
            if (Math.random() < 0.001) {
              initialState[y * GRID_SIZE + x] = Math.random();
            }
          }
        }
        device.queue.writeBuffer(stateBuffers[0], 0, initialState);

        // Create bind group layouts
        const computeBindGroupLayout = device.createBindGroupLayout({
          entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'read-only-storage' } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
          ],
        });

        const renderBindGroupLayout = device.createBindGroupLayout({
          entries: [
            { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
            { binding: 1, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
          ],
        });

        computeBindGroups = [
          device.createBindGroup({
            layout: computeBindGroupLayout,
            entries: [
              { binding: 0, resource: { buffer: uniformBuffer } },
              { binding: 1, resource: { buffer: stateBuffers[0] } },
              { binding: 2, resource: { buffer: stateBuffers[1] } },
            ],
          }),
          device.createBindGroup({
            layout: computeBindGroupLayout,
            entries: [
              { binding: 0, resource: { buffer: uniformBuffer } },
              { binding: 1, resource: { buffer: stateBuffers[1] } },
              { binding: 2, resource: { buffer: stateBuffers[0] } },
            ],
          }),
        ];

        renderBindGroup = device.createBindGroup({
          layout: renderBindGroupLayout,
          entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: { buffer: stateBuffers[0] } },
          ],
        });

        computePipeline = device.createComputePipeline({
          layout: device.createPipelineLayout({ bindGroupLayouts: [computeBindGroupLayout] }),
          compute: { module: computeModule, entryPoint: 'main' },
        });

        renderPipeline = device.createRenderPipeline({
          layout: device.createPipelineLayout({ bindGroupLayouts: [renderBindGroupLayout] }),
          vertex: { module: renderModule, entryPoint: 'vertexMain' },
          fragment: { module: renderModule, entryPoint: 'fragmentMain', targets: [{ format }] },
          primitive: { topology: 'triangle-list' },
        });

        const render = () => {
          const now = performance.now();
          frameCount++;
          if (now - lastTime >= 1000) {
            setFps(frameCount);
            frameCount = 0;
            lastTime = now;
          }

          const params = paramsRef.current;
          
          // Update uniforms
          const colorSchemeIdx = params.colorScheme === 'plasma' ? 0 : params.colorScheme === 'viridis' ? 1 : 2;
          const uniforms = new Float32Array([
            params.growthMu,
            params.growthSigma,
            params.kernelRadius,
            params.timeStep,
            now * 0.001,
            colorSchemeIdx,
          ]);
          device.queue.writeBuffer(uniformBuffer, 0, uniforms);

          const commandEncoder = device.createCommandEncoder();

          // Compute pass
          if (params.isRunning) {
            const computePass = commandEncoder.beginComputePass();
            computePass.setPipeline(computePipeline);
            computePass.setBindGroup(0, computeBindGroups[currentBuffer]);
            computePass.dispatchWorkgroups(Math.ceil(GRID_SIZE / 16), Math.ceil(GRID_SIZE / 16));
            computePass.end();
            currentBuffer = 1 - currentBuffer;

            // Update render bind group to use current state
            renderBindGroup = device.createBindGroup({
              layout: renderBindGroupLayout,
              entries: [
                { binding: 0, resource: { buffer: uniformBuffer } },
                { binding: 1, resource: { buffer: stateBuffers[currentBuffer] } },
              ],
            });
          }

          // Render pass
          const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
              view: context.getCurrentTexture().createView(),
              clearValue: { r: 0.02, g: 0.02, b: 0.03, a: 1 },
              loadOp: 'clear',
              storeOp: 'store',
            }],
          });
          renderPass.setPipeline(renderPipeline);
          renderPass.setBindGroup(0, renderBindGroup);
          renderPass.draw(6);
          renderPass.end();

          device.queue.submit([commandEncoder.finish()]);
          animationRef.current = requestAnimationFrame(render);
        };

        render();
      } catch (error) {
        console.error('WebGPU initialization failed:', error);
        setIsSupported(false);
      }
    };

    const handleResize = () => {
      const dpr = window.devicePixelRatio;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    initWebGPU();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    const fpsEl = document.getElementById('sim-genesis-001-fps');
    if (fpsEl) fpsEl.textContent = `FPS: ${fps}`;
  }, [fps]);

  const controls = (
    <>
      <div className="mb-4 pb-4 border-b border-void-light/20">
        <h3 className="text-xs font-mono text-neon-green mb-3 tracking-wider">GROWTH FUNCTION</h3>
        <div className="space-y-4">
          <Slider label="Growth Center (μ)" value={growthMu} min={0.05} max={0.3} step={0.005} onChange={setGrowthMu} />
          <Slider label="Growth Width (σ)" value={growthSigma} min={0.005} max={0.05} step={0.001} onChange={setGrowthSigma} />
        </div>
      </div>
      
      <div className="mb-4 pb-4 border-b border-void-light/20">
        <h3 className="text-xs font-mono text-neon-green mb-3 tracking-wider">KERNEL</h3>
        <div className="space-y-4">
          <Slider label="Kernel Radius" value={kernelRadius} min={5} max={25} step={1} onChange={setKernelRadius} />
          <Slider label="Time Step (dt)" value={timeStep} min={0.01} max={0.5} step={0.01} onChange={setTimeStep} />
        </div>
      </div>
      
      <div className="mb-4 pb-4 border-b border-void-light/20">
        <h3 className="text-xs font-mono text-neon-green mb-3 tracking-wider">VISUALIZATION</h3>
        <Select
          label="Color Scheme"
          value={colorScheme}
          options={[
            { value: 'plasma', label: 'Plasma' },
            { value: 'viridis', label: 'Viridis' },
            { value: 'neon', label: 'Neon Life' },
          ]}
          onChange={setColorScheme}
        />
      </div>
      
      <div className="space-y-2">
        <Button label={isRunning ? 'PAUSE' : 'RESUME'} onClick={() => setIsRunning(!isRunning)} variant="primary" />
        <Button label="RESET" onClick={() => window.location.reload()} />
      </div>
    </>
  );

  useEffect(() => {
    if (onControlsReady) onControlsReady(controls);
  }, [growthMu, growthSigma, kernelRadius, timeStep, colorScheme, isRunning]);

  if (!isSupported) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-void-black">
        <div className="text-center p-8 rounded-xl bg-void-dark/50 border border-void-light/30">
          <p className="text-neon-green font-mono mb-2">WebGPU Not Supported</p>
          <p className="text-text-muted text-sm">This simulation requires WebGPU. Try Chrome 113+.</p>
        </div>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
}
