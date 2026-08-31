import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GraphNode, SiteGraph } from "./site_graph";
import { EDGE_LIVE_TOKEN, isStructural, nodeRadius, resolvedValue, tokenFor } from "./graph_theme";

const VERTEX = `
attribute float size;
attribute vec3 tint;
varying vec3 vTint;
uniform float pixelScale;
void main() {
  vTint = tint;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * pixelScale / -mv.z;
  gl_Position = projectionMatrix * mv;
}`;

const FRAGMENT = `
varying vec3 vTint;
void main() {
  vec2 d = gl_PointCoord - vec2(0.5);
  float r = length(d);
  if (r > 0.5) discard;
  // Edge-only feather. A wide falloff reads as glow on the dark ground but as
  // a smudge on the light one, and overlapping halos compound it.
  gl_FragColor = vec4(vTint, smoothstep(0.5, 0.43, r));
  // Color.set() gives linear-sRGB; built-in materials convert back on output
  // and a custom ShaderMaterial has to ask for it, or every mid-tone renders dark.
  #include <colorspace_fragment>
}`;

const CAMERA_Z = 2.9;
const FOV = 45;

export interface GraphMountOptions {
  canvas: HTMLCanvasElement;
  overlay: HTMLElement;
  graph: SiteGraph;
  mode: "ambient" | "interactive";
  labels?: "all" | "structural";
  onSelect?(node: GraphNode): void;
}

export interface GraphHandle {
  destroy(): void;
}

export function mountGraph(o: GraphMountOptions): GraphHandle {
  const { canvas, overlay, graph, mode } = o;
  const nodes = graph.nodes;
  const indexOf = new Map(nodes.map((n, i) => [n.id, i]));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.z = CAMERA_Z;

  const world = new THREE.Group();
  scene.add(world);

  const positions = new Float32Array(nodes.length * 3);
  const sizes = new Float32Array(nodes.length);
  const tints = new Float32Array(nodes.length * 3);
  const baseSizes = new Float32Array(nodes.length);

  nodes.forEach((n, i) => {
    positions[i * 3] = n.x;
    positions[i * 3 + 1] = n.y;
    positions[i * 3 + 2] = n.z;
    baseSizes[i] = nodeRadius(n);
    sizes[i] = baseSizes[i];
  });

  const pointGeo = new THREE.BufferGeometry();
  pointGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pointGeo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
  pointGeo.setAttribute("tint", new THREE.BufferAttribute(tints, 3));

  const pointMat = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    uniforms: { pixelScale: { value: 1 } },
  });
  const points = new THREE.Points(pointGeo, pointMat);
  world.add(points);

  const edgePairs = graph.edges
    .map((e) => [indexOf.get(e.source), indexOf.get(e.target)] as const)
    .filter((p): p is readonly [number, number] => p[0] !== undefined && p[1] !== undefined);

  const edgePos = new Float32Array(edgePairs.length * 6);
  edgePairs.forEach(([a, b], i) => {
    edgePos.set(positions.subarray(a * 3, a * 3 + 3), i * 6);
    edgePos.set(positions.subarray(b * 3, b * 3 + 3), i * 6 + 3);
  });
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute("position", new THREE.BufferAttribute(edgePos, 3));
  const edgeMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.4 });
  world.add(new THREE.LineSegments(edgeGeo, edgeMat));

  // Separate object rather than per-vertex alpha: LineBasicMaterial has no
  // per-vertex opacity, and this only ever holds one node's edges.
  const hotGeo = new THREE.BufferGeometry();
  hotGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nodes.length * 6), 3));
  const hotMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.95 });
  const hotLines = new THREE.LineSegments(hotGeo, hotMat);
  hotLines.visible = false;
  world.add(hotLines);

  const colorCache = new THREE.Color();
  function applyTheme() {
    nodes.forEach((n, i) => {
      colorCache.set(resolvedValue(tokenFor(n.section)));
      tints[i * 3] = colorCache.r;
      tints[i * 3 + 1] = colorCache.g;
      tints[i * 3 + 2] = colorCache.b;
    });
    pointGeo.getAttribute("tint").needsUpdate = true;
    edgeMat.color.set(resolvedValue(EDGE_LIVE_TOKEN));
    hotMat.color.set(resolvedValue(tokenFor("development")));
  }

  interface Label {
    el: HTMLElement;
    index: number;
    halfWidth: number;
    halfHeight: number;
  }
  const labels: Label[] = [];
  const labelMode = o.labels ?? "all";
  nodes.forEach((n, i) => {
    if (labelMode === "structural" && !isStructural(n)) return;
    const el = document.createElement("span");
    el.className = "graph-label";
    el.dataset.structural = String(n.kind !== "page");
    el.textContent = n.label;
    overlay.appendChild(el);
    labels.push({ el, index: i, halfWidth: 0, halfHeight: 0 });
  });
  // Measured once; re-measuring per frame would thrash layout.
  for (const l of labels) {
    l.halfWidth = l.el.offsetWidth / 2;
    l.halfHeight = l.el.offsetHeight / 2;
  }

  const raycaster = new THREE.Raycaster();
  raycaster.params.Points = { threshold: 0.045 };
  const pointer = new THREE.Vector2();
  let hovered = -1;
  let pointerInside = false;

  function setHover(next: number) {
    if (next === hovered) return;
    if (hovered >= 0) sizes[hovered] = baseSizes[hovered];
    hovered = next;
    if (hovered >= 0) sizes[hovered] = baseSizes[hovered] * 1.7;
    pointGeo.getAttribute("size").needsUpdate = true;

    if (hovered < 0) {
      hotLines.visible = false;
    } else {
      const attached = edgePairs.filter(([a, b]) => a === hovered || b === hovered);
      const arr = hotGeo.getAttribute("position").array as Float32Array;
      attached.forEach(([a, b], i) => {
        arr.set(positions.subarray(a * 3, a * 3 + 3), i * 6);
        arr.set(positions.subarray(b * 3, b * 3 + 3), i * 6 + 3);
      });
      hotGeo.setDrawRange(0, attached.length * 2);
      hotGeo.getAttribute("position").needsUpdate = true;
      hotLines.visible = attached.length > 0;
    }
    canvas.style.cursor = hovered >= 0 ? "pointer" : "";
    canvas.dispatchEvent(
      new CustomEvent<GraphNode | null>("graph:hover", {
        detail: hovered >= 0 ? nodes[hovered] : null,
        bubbles: true,
      }),
    );
  }

  let controls: OrbitControls | null = null;
  if (mode === "interactive") {
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 1.5;
    controls.maxDistance = 6;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 0.45;
    controls.addEventListener("start", () => {
      if (controls) controls.autoRotate = false;
    });
  }

  function onPointerMove(ev: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    pointerInside = true;
    schedule();
  }
  function onPointerLeave() {
    pointerInside = false;
    setHover(-1);
    schedule();
  }
  function onClick() {
    if (hovered >= 0) o.onSelect?.(nodes[hovered]);
  }

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  if (mode === "interactive") canvas.addEventListener("click", onClick);

  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // gl_PointSize is device pixels, so scale by the drawing buffer height.
    pointMat.uniforms.pixelScale.value =
      (renderer.getDrawingBufferSize(new THREE.Vector2()).y /
        (2 * Math.tan((FOV * Math.PI) / 360))) *
      0.017;
    schedule();
  }

  const projected = new THREE.Vector3();
  const viewPos = new THREE.Vector3();
  const placed: Array<[number, number, number, number]> = [];

  function positionLabels() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const dpr = renderer.getPixelRatio();
    placed.length = 0;

    const visibleLabels = labels
      .map((l) => {
        const i = l.index;
        projected.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        world.localToWorld(projected);
        viewPos.copy(projected).applyMatrix4(camera.matrixWorldInverse);
        projected.project(camera);
        // The shader sizes points by view depth, so the on-screen radius is
        // perspective-scaled — offsetting by the layout size buries the label.
        const viewZ = Math.max(0.01, -viewPos.z);
        const screenRadius = (sizes[i] * pointMat.uniforms.pixelScale.value) / viewZ / (2 * dpr);
        return {
          l,
          x: (projected.x * 0.5 + 0.5) * w,
          y: (-projected.y * 0.5 + 0.5) * h,
          z: projected.z,
          screenRadius,
        };
      })
      .sort((a, b) => a.z - b.z);

    for (const { l, x, y, z, screenRadius } of visibleLabels) {
      const isHovered = l.index === hovered;
      if (z > 1) {
        l.el.style.opacity = "0";
        continue;
      }
      const top = y - screenRadius - l.halfHeight - 4;
      const box: [number, number, number, number] = [
        x - l.halfWidth,
        top - l.halfHeight,
        x + l.halfWidth,
        top + l.halfHeight,
      ];

      const collides = placed.some(
        (q) => box[0] < q[2] && box[2] > q[0] && box[1] < q[3] && box[3] > q[1],
      );
      // A hovered label always wins its space.
      if (collides && !isHovered) {
        l.el.style.opacity = "0";
        continue;
      }
      placed.push(box);

      l.el.style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${top.toFixed(1)}px)`;
      l.el.style.opacity = isHovered ? "1" : (0.72 + 0.28 * (1 - (z + 1) / 2)).toFixed(2);
      l.el.dataset.hovered = String(isHovered);
    }
  }

  function renderFrame() {
    if (mode === "ambient" && !reduceMotion) world.rotation.y += 0.0016;
    controls?.update();

    if (pointerInside) {
      raycaster.setFromCamera(pointer, camera);
      setHover(raycaster.intersectObject(points, false)[0]?.index ?? -1);
    }

    renderer.render(scene, camera);
    positionLabels();
  }

  let rafId = 0;
  let looping = false;
  let onScreen = true;

  const wantsLoop = () => !reduceMotion && onScreen && !document.hidden;

  // Reschedule before rendering, so a throw in renderFrame cannot silently
  // kill the loop the way a schedule-at-the-end would.
  function loop() {
    if (!looping) return;
    rafId = requestAnimationFrame(loop);
    renderFrame();
  }

  function start() {
    if (looping || !wantsLoop()) return;
    looping = true;
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    looping = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  // One frame, for when there is no loop running (reduced motion, off-screen).
  function schedule() {
    if (looping) return;
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      renderFrame();
    });
  }

  const io = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen) {
      start();
      schedule();
    } else {
      stop();
    }
  });
  io.observe(canvas);

  function onVisibility() {
    if (document.hidden) stop();
    else start();
  }
  document.addEventListener("visibilitychange", onVisibility);

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const onTheme = () => {
    applyTheme();
    schedule();
  };
  document.addEventListener("themechange", onTheme);

  applyTheme();
  resize();
  start();
  schedule();

  return {
    destroy() {
      stop();
      if (rafId) cancelAnimationFrame(rafId);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("themechange", onTheme);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("click", onClick);
      controls?.dispose();
      pointGeo.dispose();
      edgeGeo.dispose();
      hotGeo.dispose();
      pointMat.dispose();
      edgeMat.dispose();
      hotMat.dispose();
      renderer.dispose();
      for (const l of labels) l.el.remove();
    },
  };
}
