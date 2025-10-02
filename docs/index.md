---
layout: home

hero:
  name: "vhree.js"
  text: "Explicit Vue 3 bindings for Three.js"
  tagline: "Start with the lean Vhree canvas, compose meshes with VMesh, and grow towards a full declarative scene graph."
  actions:
    - theme: brand
      text: Explore Vhree
      link: /components/vhree
    - theme: alt
      text: Configure VCamera
      link: /components/vcamera
    - theme: alt
      text: Learn about VMesh
      link: /components/vmesh
    - theme: alt
      text: Explore composables
      link: /composables/

features:
  - title: SSR by default
    details: No WebGL work runs at module scope; everything is gated behind Vue lifecycle hooks.
  - title: Typed and explicit
    details: Props are narrowly typed and map one-to-one with underlying Three.js options.
  - title: Batteries included
    details: Resize handling, camera lifecycle helpers, mesh utilities, and resource disposal are wired for you while staying debuggable.
---

The project is still in exploration mode. Follow the `AGENTS.md` playbook to learn about the planned component/composable surface and contribution expectations.
