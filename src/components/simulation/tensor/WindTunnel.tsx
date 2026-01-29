import { useEffect, useRef, useState, useCallback } from 'react';
import { Slider, Toggle, Button, Select } from '../ControlPanel';

interface WindTunnelProps {
  onControlsReady?: (controls: React.ReactNode) => void;
}

export default function WindTunnel({ onControlsReady }: WindTunnelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isSupported, setIsSupported] = useState(true);
  const [fps, setFps] = useState(0);
  
  // Simulation parameters
  const [viscosity, setViscosity] = useState(0.1);
  const [windSpeed, setWindSpeed] = useState(50);
  const [showVelocity, setShowVelocity] = useState(true);
  const [showPressure, setShowPressure] = useState(false);
  const [obstacleShape, setObstacleShape] = useState('circle');
  const [isRunning, setIsRunning] = useState(true);

  const paramsRef = useRef({ viscosity, windSpeed, showVelocity, showPressure, obstacleShape, isRunning });
  
  useEffect(() => {
    paramsRef.current = { viscosity, windSpeed, showVelocity, showPressure, obstacleShape, isRunning };
  }, [viscosity, windSpeed, showVelocity, showPressure, obstacleShape, isRunning]);

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
    let velocityBuffer: GPUBuffer;
    let pressureBuffer: GPUBuffer;
    let obstacleBuffer: GPUBuffer;
    let uniformBuffer: GPUBuffer;
    let computeBindGroup: GPUBindGroup;
    let renderBindGroup: GPUBindGroup;
    
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

        // Compute shader for fluid simulation (Lattice Boltzmann Method simplified)
        const computeShaderCode = `
          struct Params {
            viscosity: f32,
            windSpeed: f32,
            time: f32,
            showVelocity: f32,
            showPressure: f32,
            obstacleType: f32,
          }

          @group(0) @binding(0) var<uniform> params: Params;
          @group(0) @binding(1) var<storage, read_write> velocity: array<vec2f>;
          @group(0) @binding(2) var<storage, read_write> pressure: array<f32>;
          @group(0) @binding(3) var<storage, read> obstacles: array<f32>;

          const GRID_SIZE: u32 = 512u;

          fn idx(x: u32, y: u32) -> u32 {
            return y * GRID_SIZE + x;
          }

          @compute @workgroup_size(16, 16)
          fn main(@builtin(global_invocation_id) id: vec3u) {
            let x = id.x;
            let y = id.y;
            
            if (x >= GRID_SIZE || y >= GRID_SIZE) { return; }
            
            let i = idx(x, y);
            let obstacle = obstacles[i];
            
            if (obstacle > 0.5) {
              velocity[i] = vec2f(0.0, 0.0);
              pressure[i] = 1.0;
              return;
            }
            
            // Inlet velocity (left side)
            if (x < 5u) {
              velocity[i] = vec2f(params.windSpeed * 0.01, 0.0);
              pressure[i] = 0.0;
              return;
            }
            
            // Simple advection and diffusion
            var vel = velocity[i];
            var pres = pressure[i];
            
            // Sample neighbors
            let left = select(velocity[idx(x - 1u, y)], vec2f(0.0), x == 0u);
            let right = select(velocity[idx(x + 1u, y)], vec2f(0.0), x >= GRID_SIZE - 1u);
            let down = select(velocity[idx(x, y - 1u)], vec2f(0.0), y == 0u);
            let up = select(velocity[idx(x, y + 1u)], vec2f(0.0), y >= GRID_SIZE - 1u);
            
            // Viscous diffusion
            let laplacian = left + right + down + up - 4.0 * vel;
            vel += params.viscosity * 0.1 * laplacian;
            
            // Pressure gradient
            let pLeft = select(pressure[idx(x - 1u, y)], pres, x == 0u);
            let pRight = select(pressure[idx(x + 1u, y)], pres, x >= GRID_SIZE - 1u);
            let pDown = select(pressure[idx(x, y - 1u)], pres, y == 0u);
            let pUp = select(pressure[idx(x, y + 1u)], pres, y >= GRID_SIZE - 1u);
            
            let gradP = vec2f(pRight - pLeft, pUp - pDown) * 0.5;
            vel -= gradP * 0.1;
            
            // Update pressure (divergence)
            let div = (right.x - left.x + up.y - down.y) * 0.5;
            pres -= div * 0.1;
            
            // Clamp values
            vel = clamp(vel, vec2f(-2.0), vec2f(2.0));
            pres = clamp(pres, -1.0, 1.0);
            
            velocity[i] = vel;
            pressure[i] = pres;
          }
        `;

        // Render shader for visualization
        const renderShaderCode = `
          struct Params {
            viscosity: f32,
            windSpeed: f32,
            time: f32,
            showVelocity: f32,
            showPressure: f32,
            obstacleType: f32,
          }

          struct VertexOutput {
            @builtin(position) position: vec4f,
            @location(0) uv: vec2f,
          }

          @group(0) @binding(0) var<uniform> params: Params;
          @group(0) @binding(1) var<storage, read> velocity: array<vec2f>;
          @group(0) @binding(2) var<storage, read> pressure: array<f32>;
          @group(0) @binding(3) var<storage, read> obstacles: array<f32>;

          const GRID_SIZE: f32 = 512.0;

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

          fn hsv2rgb(h: f32, s: f32, v: f32) -> vec3f {
            let c = v * s;
            let x = c * (1.0 - abs(fract(h * 6.0) * 2.0 - 1.0));
            let m = v - c;
            var rgb: vec3f;
            let hi = u32(h * 6.0) % 6u;
            if (hi == 0u) { rgb = vec3f(c, x, 0.0); }
            else if (hi == 1u) { rgb = vec3f(x, c, 0.0); }
            else if (hi == 2u) { rgb = vec3f(0.0, c, x); }
            else if (hi == 3u) { rgb = vec3f(0.0, x, c); }
            else if (hi == 4u) { rgb = vec3f(x, 0.0, c); }
            else { rgb = vec3f(c, 0.0, x); }
            return rgb + m;
          }

          @fragment
          fn fragmentMain(in: VertexOutput) -> @location(0) vec4f {
            let x = u32(in.uv.x * GRID_SIZE);
            let y = u32(in.uv.y * GRID_SIZE);
            let i = y * u32(GRID_SIZE) + x;
            
            let obstacle = obstacles[i];
            if (obstacle > 0.5) {
              return vec4f(0.2, 0.2, 0.25, 1.0);
            }
            
            let vel = velocity[i];
            let pres = pressure[i];
            
            var color = vec3f(0.02, 0.02, 0.03);
            
            if (params.showVelocity > 0.5) {
              let speed = length(vel);
              let angle = atan2(vel.y, vel.x) / 6.283185 + 0.5;
              color = hsv2rgb(angle, 0.8, speed * 2.0);
            }
            
            if (params.showPressure > 0.5) {
              let p = pres * 0.5 + 0.5;
              color = mix(vec3f(0.0, 0.0, 1.0), vec3f(1.0, 0.0, 0.0), p);
            }
            
            // Add some smoke/particle visualization
            let smoke = sin(in.uv.x * 50.0 + params.time + vel.x * 10.0) * 0.5 + 0.5;
            let smokeIntensity = length(vel) * smoke * 0.3;
            color += vec3f(smokeIntensity);
            
            return vec4f(color, 1.0);
          }
        `;

        const computeModule = device.createShaderModule({ code: computeShaderCode });
        const renderModule = device.createShaderModule({ code: renderShaderCode });

        // Create buffers
        const bufferSize = GRID_SIZE * GRID_SIZE;
        
        velocityBuffer = device.createBuffer({
          size: bufferSize * 8, // vec2f
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        pressureBuffer = device.createBuffer({
          size: bufferSize * 4, // f32
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        obstacleBuffer = device.createBuffer({
          size: bufferSize * 4, // f32
          usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        uniformBuffer = device.createBuffer({
          size: 32, // 6 floats + padding
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Initialize obstacle (circle in center)
        const obstacles = new Float32Array(bufferSize);
        const centerX = GRID_SIZE / 2;
        const centerY = GRID_SIZE / 2;
        const radius = GRID_SIZE / 8;
        
        for (let y = 0; y < GRID_SIZE; y++) {
          for (let x = 0; x < GRID_SIZE; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            if (dx * dx + dy * dy < radius * radius) {
              obstacles[y * GRID_SIZE + x] = 1.0;
            }
          }
        }
        device.queue.writeBuffer(obstacleBuffer, 0, obstacles);

        // Create bind group layout
        const bindGroupLayout = device.createBindGroupLayout({
          entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT, buffer: { type: 'storage' } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT, buffer: { type: 'storage' } },
            { binding: 3, visibility: GPUShaderStage.COMPUTE | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
          ],
        });

        computeBindGroup = device.createBindGroup({
          layout: bindGroupLayout,
          entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: { buffer: velocityBuffer } },
            { binding: 2, resource: { buffer: pressureBuffer } },
            { binding: 3, resource: { buffer: obstacleBuffer } },
          ],
        });

        renderBindGroup = computeBindGroup;

        const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] });

        computePipeline = device.createComputePipeline({
          layout: pipelineLayout,
          compute: { module: computeModule, entryPoint: 'main' },
        });

        renderPipeline = device.createRenderPipeline({
          layout: pipelineLayout,
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
          const uniforms = new Float32Array([
            params.viscosity,
            params.windSpeed,
            now * 0.001,
            params.showVelocity ? 1.0 : 0.0,
            params.showPressure ? 1.0 : 0.0,
            params.obstacleShape === 'circle' ? 0.0 : 1.0,
          ]);
          device.queue.writeBuffer(uniformBuffer, 0, uniforms);

          const commandEncoder = device.createCommandEncoder();

          // Compute pass (multiple iterations per frame for stability)
          if (params.isRunning) {
            for (let i = 0; i < 4; i++) {
              const computePass = commandEncoder.beginComputePass();
              computePass.setPipeline(computePipeline);
              computePass.setBindGroup(0, computeBindGroup);
              computePass.dispatchWorkgroups(Math.ceil(GRID_SIZE / 16), Math.ceil(GRID_SIZE / 16));
              computePass.end();
            }
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

  // Update FPS display
  useEffect(() => {
    const fpsEl = document.getElementById('sim-tensor-001-fps');
    if (fpsEl) fpsEl.textContent = `FPS: ${fps}`;
  }, [fps]);

  const controls = (
    <>
      <div className="mb-4 pb-4 border-b border-void-light/20">
        <h3 className="text-xs font-mono text-neon-pink mb-3 tracking-wider">FLOW PARAMETERS</h3>
        <div className="space-y-4">
          <Slider label="Viscosity" value={viscosity} min={0.01} max={1} onChange={setViscosity} />
          <Slider label="Wind Speed" value={windSpeed} min={0} max={100} unit=" m/s" onChange={setWindSpeed} />
        </div>
      </div>
      
      <div className="mb-4 pb-4 border-b border-void-light/20">
        <h3 className="text-xs font-mono text-neon-pink mb-3 tracking-wider">VISUALIZATION</h3>
        <div className="space-y-3">
          <Toggle label="Show Velocity" value={showVelocity} onChange={setShowVelocity} />
          <Toggle label="Show Pressure" value={showPressure} onChange={setShowPressure} />
        </div>
      </div>
      
      <div className="mb-4 pb-4 border-b border-void-light/20">
        <h3 className="text-xs font-mono text-neon-pink mb-3 tracking-wider">OBSTACLE</h3>
        <Select
          label="Shape"
          value={obstacleShape}
          options={[
            { value: 'circle', label: 'Circle' },
            { value: 'airfoil', label: 'Airfoil' },
            { value: 'square', label: 'Square' },
          ]}
          onChange={setObstacleShape}
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
  }, [viscosity, windSpeed, showVelocity, showPressure, obstacleShape, isRunning]);

  if (!isSupported) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-void-black">
        <div className="text-center p-8 rounded-xl bg-void-dark/50 border border-void-light/30">
          <p className="text-neon-pink font-mono mb-2">WebGPU Not Supported</p>
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
