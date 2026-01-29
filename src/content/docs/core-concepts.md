---
title: "Core Concepts"
description: "Understand the fundamental architecture and concepts behind Entropy Zero."
section: "core-concepts"
order: 2
---

# Core Concepts

Understanding these fundamental concepts will help you make the most of Entropy Zero.

## The Simulation Loop

Entropy Zero uses a fixed-timestep simulation loop for deterministic results:

```
┌─────────────────────────────────────────┐
│  Accumulate Time                        │
│  ↓                                      │
│  While (accumulated >= timestep)        │
│    → Apply Forces                       │
│    → Detect Collisions                  │
│    → Resolve Constraints                │
│    → Integrate Motion                   │
│    → accumulated -= timestep            │
│  ↓                                      │
│  Interpolate for Rendering              │
└─────────────────────────────────────────┘
```

## Entity-Component Architecture

Simulated objects are composed of components:

- **Transform** — Position, rotation, scale
- **RigidBody** — Mass, velocity, angular momentum
- **Collider** — Shape for collision detection
- **Constraint** — Joints, springs, distance limits

## Spatial Partitioning

For performance, Entropy Zero uses adaptive spatial partitioning:

- Small scenes → Uniform grid
- Large scenes → BVH (Bounding Volume Hierarchy)
- Mixed scales → Hybrid approach

## Parallelism

The simulation leverages Rayon for parallel processing:

- Broadphase collision detection runs in parallel
- Force calculations are batched and parallelized
- Constraint solving uses parallel Gauss-Seidel iterations
