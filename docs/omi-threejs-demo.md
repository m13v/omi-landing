# Omi Three.js Hardware Story

> Unofficial product concept created as a design and engineering exploration. This route is not part of Omi's production storefront.

## Live concept

[omi-threejs-demo.vercel.app/device-lab](https://omi-threejs-demo.vercel.app/device-lab)

## Thesis

As a wearable brand, Omi has to sell more than utility. It has an opportunity to position the pendant as a luxury object for tech-forward individuals: something desirable, expressive, and considered enough to wear every day. The web experience should feel like a digital flagship—memorable on first contact and rich enough to make someone imagine the product in their own hand.

This concept creates that feeling through scale, material response, dramatic light, physical depth, and interaction. The pendant does not read as a flat product image; it has weight, surface, movement, and presence. By letting people experience those qualities before they own the device, the site turns Omi from an abstract AI accessory into an object of desire.

## Design system

- Restrained black and gunmetal palette with cool key light and a muted violet environmental ring.
- Translucent plastic carrier surrounding a deep metallic device core.
- Overscale typography and sparse interface chrome keep the product dominant.
- Scroll keyframes include a short hold before each transition so each composition has time to register.
- Desktop physics are interaction-led rather than continuously decorative.

## Technical approach

- Next.js 15 and React 19
- React Three Fiber and Three.js
- Rapier rope and rigid-body physics on desktop
- SDF/implicit-volume pendant shell extracted with Marching Cubes and welded into one continuous mesh
- Instanced conveyor geometry for repeated pendants
- Framer Motion scroll choreography and UI transitions
- Selective bloom, color grading, grain, vignette, depth of field, and chromatic aberration

The feature is isolated at `/device-lab`; it does not replace or modify the existing homepage.

## Mobile and performance path

- Physics are disabled for coarse-pointer and phone-width devices; the pendant remains interactive through the static scene fallback.
- Device pixel ratio is capped more aggressively on mobile.
- Mobile particle counts and environment-map resolution are reduced.
- Depth of field and chromatic aberration are disabled on mobile; bloom uses fewer levels.
- The conveyor stays instanced and is not updated until its scene approaches the viewport.
- The WebGL experience is client-loaded behind a lightweight branded loading state.
- The canvas permits native vertical touch scrolling.

## Local development

```bash
npm install
npm run dev -- -p 3002
```

Open [localhost:3002/device-lab](http://localhost:3002/device-lab).

## Review checklist

- Desktop: verify all four keyframes, hover wake, click message, film playback, cord physics, conveyor loop, and CTA.
- Mobile: verify all four keyframes at 390×844 and 375×667, touch scrolling, static pendant interaction, film modal, proof-panel legibility, and CTA.
- Engineering: run `npx tsc --noEmit` and `npm run build`; confirm zero browser console errors.

## Asset provenance

- `public/images/omi-logo.png` and `public/videos/omi-rewind-hq.mp4` already exist in the upstream public repository.
- `public/images/omi-office-wearer.png` was supplied as a visual reference for this concept. Confirm Omi's preferred source asset and reuse permission before proposing it for production.
- The pendant geometry, materials, lighting, physics, choreography, and interface implementation are original to this concept branch.

## Contribution posture

The public `omi-landing` repository and the Shopify wearable storefront are separate product surfaces. This concept should be shared as a proof link first. A pull request should only follow confirmation that this public repository is the correct implementation destination.
