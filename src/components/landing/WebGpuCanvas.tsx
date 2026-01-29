import { useEffect, useRef, useState } from 'react';

export default function WebGpuCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSupported, setIsSupported] = useState(true);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    if (!navigator.gpu) {
      setIsSupported(false);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    let device: GPUDevice;
    let context: GPUCanvasContext;
    let pipeline: GPURenderPipeline;
    let uniformBuffer: GPUBuffer;
    let bindGroup: GPUBindGroup;
    let startTime = performance.now();

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
        context.configure({
          device,
          format,
          alphaMode: 'premultiplied',
        });

        const shaderCode = `
          struct Uniforms {
            time: f32,
            mouseX: f32,
            mouseY: f32,
            aspect: f32,
          }

          @group(0) @binding(0) var<uniform> uniforms: Uniforms;

          struct VertexOutput {
            @builtin(position) position: vec4f,
            @location(0) uv: vec2f,
          }

          @vertex
          fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
            var pos = array<vec2f, 6>(
              vec2f(-1.0, -1.0),
              vec2f(1.0, -1.0),
              vec2f(-1.0, 1.0),
              vec2f(-1.0, 1.0),
              vec2f(1.0, -1.0),
              vec2f(1.0, 1.0)
            );
            
            var output: VertexOutput;
            output.position = vec4f(pos[vertexIndex], 0.0, 1.0);
            output.uv = pos[vertexIndex] * 0.5 + 0.5;
            return output;
          }

          fn hash(p: vec2f) -> f32 {
            return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
          }

          fn noise(p: vec2f) -> f32 {
            let i = floor(p);
            let f = fract(p);
            let u = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(hash(i + vec2f(0.0, 0.0)), hash(i + vec2f(1.0, 0.0)), u.x),
              mix(hash(i + vec2f(0.0, 1.0)), hash(i + vec2f(1.0, 1.0)), u.x),
              u.y
            );
          }

          fn fbm(p: vec2f) -> f32 {
            var value = 0.0;
            var amplitude = 0.5;
            var frequency = 1.0;
            var pos = p;
            for (var i = 0; i < 5; i++) {
              value += amplitude * noise(pos * frequency);
              amplitude *= 0.5;
              frequency *= 2.0;
            }
            return value;
          }

          @fragment
          fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
            var uv = input.uv;
            uv.x *= uniforms.aspect;
            
            let time = uniforms.time * 0.15;
            let mouse = vec2f(uniforms.mouseX * uniforms.aspect, uniforms.mouseY);
            
            // Distance to mouse for interaction
            let mouseDist = length(uv - mouse);
            let mouseInfluence = smoothstep(0.5, 0.0, mouseDist) * 0.3;
            
            // Gravitational field simulation
            var field = 0.0;
            for (var i = 0; i < 5; i++) {
              let fi = f32(i);
              let center = vec2f(
                0.5 * uniforms.aspect + sin(time * 0.5 + fi * 1.5) * 0.3 * uniforms.aspect,
                0.5 + cos(time * 0.7 + fi * 1.2) * 0.25
              );
              let dist = length(uv - center);
              field += 0.02 / (dist + 0.1);
            }
            
            // Add mouse attractor
            field += mouseInfluence * 2.0;
            
            // Flowing noise
            let n1 = fbm(uv * 3.0 + vec2f(time * 0.5, time * 0.3));
            let n2 = fbm(uv * 2.0 - vec2f(time * 0.3, time * 0.5) + vec2f(n1 * 0.5));
            
            // Color palette - Cyberpunk Scientific
            let neonBlue = vec3f(0.0, 0.94, 1.0);    // #00F0FF
            let neonPink = vec3f(1.0, 0.0, 1.0);     // #FF00FF
            let voidBlack = vec3f(0.043, 0.043, 0.043); // #0B0B0B
            
            // Combine effects
            let intensity = field * 0.3 + n2 * 0.4;
            let colorMix = sin(intensity * 3.14159 + time) * 0.5 + 0.5;
            
            var color = mix(neonBlue, neonPink, colorMix) * intensity;
            color = mix(voidBlack, color, smoothstep(0.0, 0.3, intensity));
            
            // Vignette
            let vignette = 1.0 - smoothstep(0.3, 0.9, length(input.uv - 0.5) * 1.2);
            color *= vignette;
            
            // Grid overlay (subtle)
            let grid = smoothstep(0.98, 1.0, max(
              abs(sin(uv.x * 50.0)),
              abs(sin(uv.y * 50.0))
            )) * 0.03;
            color += vec3f(grid) * neonBlue;
            
            return vec4f(color, 1.0);
          }
        `;

        const shaderModule = device.createShaderModule({ code: shaderCode });

        uniformBuffer = device.createBuffer({
          size: 16,
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const bindGroupLayout = device.createBindGroupLayout({
          entries: [{
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: { type: 'uniform' },
          }],
        });

        bindGroup = device.createBindGroup({
          layout: bindGroupLayout,
          entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer },
          }],
        });

        pipeline = device.createRenderPipeline({
          layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
          vertex: {
            module: shaderModule,
            entryPoint: 'vertexMain',
          },
          fragment: {
            module: shaderModule,
            entryPoint: 'fragmentMain',
            targets: [{ format }],
          },
          primitive: { topology: 'triangle-list' },
        });

        const render = () => {
          const time = (performance.now() - startTime) / 1000;
          const aspect = canvas.width / canvas.height;

          device.queue.writeBuffer(
            uniformBuffer,
            0,
            new Float32Array([time, mouseRef.current.x, mouseRef.current.y, aspect])
          );

          const commandEncoder = device.createCommandEncoder();
          const textureView = context.getCurrentTexture().createView();

          const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
              view: textureView,
              clearValue: { r: 0.043, g: 0.043, b: 0.043, a: 1 },
              loadOp: 'clear',
              storeOp: 'store',
            }],
          });

          renderPass.setPipeline(pipeline);
          renderPass.setBindGroup(0, bindGroup);
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
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX / window.innerWidth,
        y: 1.0 - e.clientY / window.innerHeight,
      };
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    initWebGPU();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!isSupported) {
    return (
      <div className="fixed inset-0 w-full h-full z-0 bg-gradient-to-br from-void-black via-void-dark to-void-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,240,255,0.1)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0"
      style={{ touchAction: 'none' }}
    />
  );
}
