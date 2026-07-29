# Prompt: build a 360° walkthrough tour that feels like walking

Replace the bits in [square brackets]. Every rule has a "why" line taken from a
real failure — keep them, so they don't get optimised away later.

## The project

Build a 360° panorama tour in React + TypeScript with **three.js** (no
Pannellum, no Marzipano, no paid SDK): [describe the space — e.g. a 12-scene
tour of an office tower: entry gate, drop-off, reception, lift lobby, podium
levels, terrace].

Target device: [e.g. iPad, landscape, 1280×800, Safari] and [e.g. a kiosk PC on
integrated graphics].

**The single hardest requirement:** moving between scenes must read as *walking
to a place*, not as a slideshow. A crossfade between two still images fails
this even when it is perfectly smooth. The camera has to turn, then travel, and
the picture has to change **while you are moving**.

## Architecture

One `PanoramaEngine` class owning three.js directly — not a React component
tree. React holds a ref to a container `<div>`, a hook constructs the engine
against it, and everything else is imperative method calls. Rendering 60 fps
WebGL through React state is the wrong shape.

```
usePanoramaEngine(containerRef, options) → PanoramaEngine | null
PanoramaEngine
  ├─ two sphere meshes: front (visible) + back (arriving)
  ├─ texture cache (LRU) + in-flight dedupe + prewarm
  ├─ pointer control: drag inertia, pinch, wheel, idle auto-rotate
  └─ FloorMarkers — real 3D rings lying in the floor plane
```

Scene data is a plain graph: each scene has an equirectangular image URL, an
opening yaw/pitch, and hotspots. Each hotspot carries a bearing (`yaw`), a
downward angle (`pitch`), a label, and the id of the scene it leads to.

## The walk transition — this is the whole feature

Three phases, driven off one `requestAnimationFrame` loop:

1. **Align** (~400 ms) — turn to face the destination's bearing.
2. **Travel** (~1.2–2.6 s) — dolly the camera forward along that heading.
3. **Blend** — crossfade front → back **between 30 % and 80 % of the travel**,
   so the image changes at full stride.

Timing and distance both come from how far the destination actually is:

```
duration_ms = clamp(900 + 170 × metres, 1200, 2600)
travel_units = clamp(30 × metres, 70, 190)
```

Rules:

1. **Keep two spheres alive permanently.** Swapping the mesh's texture, or
   replacing the mesh, is a hard cut no matter how you dress it. *Why: the first
   version swapped the mesh and the tour read as a slideshow — that single
   change is the difference between "next image" and "walking".*
2. **Blend during motion, never while stopped.** A crossfade at rest is a
   dissolve; the same crossfade mid-stride is parallax. *Why: fading at 0 % or
   100 % of the journey looked exactly like the slideshow we were replacing.*
3. **Use a trapezoidal speed profile, not ease-in-out.** Ramp up over the first
   30 %, hold constant, ease off over the last 30 %. *Why: standard
   ease-in-out spends the whole journey accelerating or braking, which reads as
   a lurch. The long constant-velocity middle is what feels like covering
   ground.*
4. **Damp the pitch when turning and when travelling** (take ~15 % of the
   downward angle, all of the bearing). *Why: markers sit on the floor, so
   turning to look straight at one tips the camera at your own feet before you
   set off, and travelling along a downward view drives the camera into the
   ground. Nobody walks like that.*
5. **Carry the heading across scenes.** Keep a per-scene yaw offset so the place
   you came from ends up behind you. *Why: resetting to a fixed north on arrival
   makes every scene change disorienting — you turn, walk, and then get spun.*
6. **Time out the destination decode** (~12 s) and settle back where you
   started. *Why: without a ceiling, a stalled image leaves the tour mid-stride
   with its markers hidden and no way out.*
7. **Honour `prefers-reduced-motion`** by falling back to a plain crossfade.
   Vestibular triggers are not a nice-to-have.

## Floor markers

Navigation targets are **real 3D ring meshes lying flat in the floor plane** at
`y = −eyeHeight` — not sprites facing the camera.

8. **Never use camera-facing sprites for floor targets.** Perspective must
   squash each ring into an ellipse and shrink the distant ones on its own.
   *Why: sprites pile up in the middle of the screen and read as stickers
   floating in front of the image. Real floor geometry spreads the destinations
   into a trail leading away from you — that is most of the "it's a place"
   feeling, for very little code.*
9. **Derive distance from the hotspot's downward angle:**
   `d = eyeHeight / tan(−pitch)`, with `eyeHeight ≈ 1.6 m`. It is usually the
   only distance information the tour data holds.
10. **Clamp that distance** (e.g. 2–6 m). *Why: the angles in real tour data
    were eyeballed to place arrows, not measured. A shallow one implies a
    distance where a floor ring flattens into an unreadable sliver at the
    horizon.*
11. **Partially compensate scale for distance** — `pow(d / reference, 0.65)`.
    *Why: full perspective scaling shrinks far markers out of sight and out of
    reach of the pointer; no scaling kills the depth cue. The exponent is the
    compromise.*
12. **Give each ring a generous invisible hit disc** (~0.75 m) and render the
    rings with `depthTest: false`. *Why: a ring 6 m away is a few pixels tall;
    without a hit disc it is unclickable, and without disabling depth test it
    disappears into the sphere.*
13. **Add a ghost ring that follows the pointer across the floor.** *Why: it
    tells the user the floor is walkable before they find a marker.*
14. **Tell a click from a drag** by recording where the pointer went down. *Why:
    otherwise every drag that ends over a marker teleports the user.*

## Performance

15. **Cap the decoded-texture cache** (4 is a good default: current scene plus
    immediate neighbours). *Why: a 6000×3000 equirectangular panorama is ~72 MB
    of VRAM, ~96 MB with mipmaps. A 12-scene tour will not fit on integrated or
    kiosk hardware, and the failure is a browser tab crash, not a slowdown.*
16. **Deduplicate in-flight decodes** in a `Map<url, Promise<Texture>>`. *Why:
    prewarm and a fast click will otherwise decode the same 70 MB image twice.*
17. **Prewarm one step out** — the scenes reachable from the current one. *Why:
    it is what makes a walk start instantly instead of stalling on the decode.*
18. **Render on a dirty flag**, not every frame. Mark dirty on input, tween,
    animation, and resize. *Why: a static panorama re-rendered at 60 fps cooks a
    tablet battery for no visible benefit.*
19. **Optionally support a `{preview, full}` variant manifest** — show a small
    blurred stand-in immediately, crossfade the full image in behind it. Degrade
    silently to the original file when no manifest exists.

## Mounting — the bug that costs the most time

20. **Do not construct the WebGL renderer until the container has a non-zero
    size.** Poll with `requestAnimationFrame` until `clientWidth > 0 &&
    clientHeight > 0`, then create the engine. *Why: this cost the most time of
    anything here. Route transitions that crossfade stack the outgoing and
    incoming pages absolutely, so the container is 0×0 on the first frame. A
    canvas created then gets a 0×0 viewport and renders pure black forever — and
    every path check, every URL, and the network tab all look perfectly correct.
    The earlier fix was a scatter of forced resize calls that mostly worked,
    which is worse than a clean failure.*
21. **Use a `ResizeObserver`**, not a window resize listener. *Why: the
    container can change size without the window doing anything.*
22. **Dispose properly on unmount** — geometries, materials, textures, the
    renderer, the RAF loop, and every listener. *Why: navigating in and out of
    the tour a few times otherwise leaks whole GPU contexts and the browser
    starts dropping the oldest one, which shows up as an unrelated page going
    black.*

## Controls

- Drag to look, with inertia that decays after release.
- Pinch to zoom on touch; wheel to zoom on desktop.
- FOV: rest at ~100° (open wide — the tour should not start zoomed in), clamp to
  40–110°.
- Clamp pitch to ±85°. *Why: at ±90° the up vector flips and the view rolls.*
- Auto-rotate after ~1 s of idle, cancelled by any input.

## Testing

23. **Assert on rendered pixels, not on "a canvas exists".** Take an element
    screenshot through the browser's compositor and count non-black,
    non-uniform pixels. *Why: reading the pixels back in-page does not work —
    three.js creates its context without `preserveDrawingBuffer`, so
    `getImageData` and `drawImage(canvas, …)` both return an empty frame and
    report "black canvas" for a scene that is plainly visible. That produced a
    confident false failure.*
24. **Assert the marker count and their screen positions**, not just that
    `setMarkers` was called.
25. **Test a full walk end to end**: click a marker, wait for the transition,
    assert the scene id changed *and* that the new panorama actually painted.
26. **Test at the real target viewport**, and in WebKit as well as Chrome if the
    target is an iPad.

## Ground rules for you

- Report honestly. If you cannot reproduce a reported bug, say so plainly and
  say what you fixed anyway — never claim a fix you have not demonstrated.
- A test that passes before and after your change proves nothing. Say that out
  loud when it happens.
- State the limits of your testing. If you never touched the real target device,
  separate verified claims from inferred ones.
- Tune the feel from named constants in one block at the top of the file, not
  from magic numbers scattered through the animation code. A single
  `WALK_SPEED` multiplier over the timing constants is worth having.

---

**The rules that matter most are 1–4, 8, and 20.** Rule 20 was the actual bug
that wasted the most time. Rules 1–4 are the entire difference between a
walkthrough and a slideshow — get those wrong and everything else is polish on
the wrong thing.
