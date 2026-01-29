# PROJECT GRAVITON: THE GENESIS SPECIFICATION

## 1. Project Identity & Mission
* **Project Name:** Graviton ("The Executable Truth")
* **Domain:** `https://graviton.dev`
* **Core Stack:** Astro v5 (SSG) + React (UI) + Rust/WASM (Compute) + WebGPU (Render).
* **Mission:** To build the "OS for the Mind" — a platform simulating 256 fundamental principles of the universe, divided into 5 dimensions.

---

## 2. The Dimensional Architecture (Routing & Content)

We are organizing the 256 simulations into **5 Core Dimensions**. Each dimension maps to a specific URL path and a specific rendering strategy.

### Dimension I: `/logic` (Logic & Foundations)
* **Theme:** The digital substrate. From bits to silicon.
* **Rendering Tech:** SVG (for schematics) + Rust WASM (for simulation ticks).
* **Key Modules to Implement:**
    1.  **The Entropy of Reality:** "Imperfect Mode" showing metastability, crosstalk, and ground bounce using probabilistic clouds.
    2.  **Reverse Engineering:** "Black Box" puzzles where users deduce logic from I/O timing diagrams.
    3.  **The Compiler Lens:** Visualizing C code expanding into Assembly -> RTL -> Transistors.
    4.  **Auditory Debugging:** Mapping clock frequencies to audio pitch (The "Singing Circuit").
    5.  **Exotic Computing:** Reversible Computing (Zero Entropy), Optical Computing (Beam Splitters), Memristors, and 555 Timers.
    6.  **Cyber Security:** Buffer Overflow visualization (Stack/Heap), SQL Injection logic flow, Side-Channel Power Analysis.

### Dimension II: `/tensor` (Physics & Fields)
* **Theme:** The physical laws. Continuous fields and spacetime.
* **Rendering Tech:** **Strictly WebGPU Compute Shaders**. (Target: 60FPS @ 4K).
* **Key Modules to Implement:**
    1.  **Relativistic Engine:** Visualizing Time Dilation and Length Contraction near light speed.
    2.  **Fluid Dynamics (CFD):** Real-time Virtual Wind Tunnel (Navier-Stokes) with lift/drag visualization.
    3.  **Cosmic Mechanics:** Gravitational Lensing (Black Holes), Three-Body Problem (Chaos), Roche Limit, and Dyson Sphere orbital mechanics.
    4.  **Quantum Mechanics:** Quantum Tunneling, Double Slit Experiment (Wave function collapse), and Feynman Path Integrals.
    5.  **Mechanical Engineering:** Stirling Engines, Differential Gears, and Gyroscopic Precession.

### Dimension III: `/genesis` (Life & Emergence)
* **Theme:** Biological complexity arising from simple rules.
* **Rendering Tech:** WebGPU (for massive particle systems) + Canvas API.
* **Key Modules to Implement:**
    1.  **Lenia:** Continuous Cellular Automata (Liquid Lifeform) using FFT convolution.
    2.  **Evolutionary Arena:** Genetic Algorithms driving "creatures" to walk/survive in a physics sandbox.
    3.  **Micro-Biology:** CRISPR-Cas9 gene editing visualization, Protein Folding (Force-directed), ATP Synthase motors.
    4.  **Ecosystems:** Predator-Prey cycles (Lotka-Volterra phase plots), Slime Mold network optimization.
    5.  **Viral Diffusion:** SIR Models for pandemic simulation with spatial isolation variables.

### Dimension IV: `/neural` (Intelligence & Cognition)
* **Theme:** The structure of thought and networks.
* **Rendering Tech:** D3.js / Force-Graph (WebGL) + Python/Pyodide (optional for local inference).
* **Key Modules to Implement:**
    1.  **The LLM Gate:** A logic gate that accepts natural language prompts and outputs True/False based on semantic sentiment.
    2.  **The Loss Landscape:** 3D visualization of Gradient Descent finding the global minimum.
    3.  **Network Science:** Small World Networks, PageRank hydraulic metaphor, BGP Routing visualization.
    4.  **Game Theory:** Iterated Prisoner's Dilemma tournaments, Nash Equilibrium.
    5.  **Neuromorphic:** Spiking Neural Networks (SNN) and Hebbian Learning visualization.

### Dimension V: `/axiom` (Math & Order)
* **Theme:** Pure abstract truth and geometry.
* **Rendering Tech:** GLSL Shaders (Raymarching) + Three.js.
* **Key Modules to Implement:**
    1.  **Hyper-Geometry:** Non-Euclidean VR (Hyperbolic space), Tesseract (4D rotation), Klein Bottle topology.
    2.  **Number Theory:** The Riemann Zeta Landscape (Zeros as deep wells), Ulam Spirals, The Collatz Coral.
    3.  **Information Theory:** Maxwell’s Demon (Entropy vs Information), Huffman Coding gravity trees.
    4.  **Chaos Theory:** The Lorenz Attractor, Double Pendulum, Logistic Map bifurcation.
    5.  **Godel's Loop:** Visualizing Self-Reference and Quines.

---

## 3. Technical Implementation Directives

### A. The "Zero-Jank" Policy
* **Heavy Simulations (`/tensor`, `/genesis`):** MUST utilize `wgpu` (via Rust) or raw WebGPU JS API. CPU-bound rendering is forbidden for these modules.
* **Light Simulations (`/logic`, `/neural`):** React functional components with optimized Canvas drawing or SVG for crisp vectors.

### B. The "Immersive First" Layout
* **No Standard Navbars:** The UI should look like a HUD (Heads-Up Display) overlaying the simulation.
* **The "Inspector" Panel:** Every simulation must have a collapsible sidebar (glassmorphism style) exposing the mathematical variables (e.g., "Gravity Constant", "Learning Rate", "Reynolds Number").

### C. Reusable Component Strategy
Create a standardized wrapper for all 256 simulations:
```tsx
<SimulationContainer 
  id="sim-042" 
  title="The Fluid Tunnel" 
  category="TENSOR" 
  complexity="HIGH"
>
  <WebGpuCanvas shader={fluidShader} />
  <ControlPanel>
    <Slider label="Viscosity" min={0} max={1} />
    <Slider label="Wind Speed" min={0} max={100} />
  </ControlPanel>
</SimulationContainer>

4. Immediate Task: The "MVP" Launch Sequence
We will not build all 256 at once. We will build the "Hero" of each dimension first.

Action Items:

Initialize Astro Project: Set up routes for /logic, /tensor, /genesis, /neural, /axiom.

Build Hero 1 (Tensor): Implement the Virtual Wind Tunnel (CFD) using WebGPU.

Goal: Real-time smoke visualization over a user-drawn shape.

Build Hero 2 (Genesis): Implement Lenia (Continuous Cellular Automata).

Goal: A mesmerizing, self-organizing digital lifeform on the landing page.

Build Hero 3 (Logic): Port the Logic Gate basics but add the "Audio Debugging" (Sound) feature.

End of Specification.