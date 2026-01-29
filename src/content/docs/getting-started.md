---
title: "Getting Started"
description: "Learn how to set up and run your first Entropy Zero simulation."
section: "getting-started"
order: 1
---

# Getting Started with Entropy Zero

This guide will walk you through setting up Entropy Zero and running your first simulation.

## Prerequisites

Before you begin, ensure you have:

- **Rust 1.75+** installed via [rustup](https://rustup.rs)
- A modern GPU with Vulkan support (optional, for accelerated rendering)
- 8GB RAM minimum (16GB recommended for complex simulations)

## Installation

Add Entropy Zero to your `Cargo.toml`:

```toml
[dependencies]
entropy_zero = "0.1"
```

## Your First Simulation

Create a simple particle simulation:

```rust
use entropy_zero::prelude::*;

fn main() {
    let mut sim = Simulation::new(SimConfig::default());
    
    // Add particles
    for i in 0..1000 {
        sim.add_particle(Particle {
            position: Vec3::random() * 10.0,
            velocity: Vec3::ZERO,
            mass: 1.0,
        });
    }
    
    // Run simulation
    sim.run(Duration::from_secs(10));
}
```

## Next Steps

- Explore [Core Concepts](/docs/core-concepts) to understand the simulation architecture
- Check the [API Reference](/docs/api-reference) for detailed documentation
- Join our community on Discord for support and discussions
