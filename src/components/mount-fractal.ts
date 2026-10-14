import * as THREE from "three";
import type { MotionState } from "@/components/motion-state";

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform float uTime;
uniform float uScroll;
uniform vec2 uPointer;
uniform float uAspect;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uBg;
varying vec2 vUv;

void main() {
  float s = clamp(uScroll, 0.0, 1.0);
  vec2 uv = (vUv - 0.5) * vec2(uAspect, 1.0);
  float ang = uTime * 0.03 + s * 0.65 + uPointer.x * 0.08;
  float ca = cos(ang);
  float sa = sin(ang);
  uv = mat2(ca, -sa, sa, ca) * uv;
  float zoom = mix(1.85, 0.72, s);
  uv *= zoom;
  uv += uPointer * vec2(0.025, 0.018);

  vec2 c = vec2(-0.745, 0.186);
  c = mix(c, vec2(-0.8, 0.156), smoothstep(0.0, 0.34, s));
  c = mix(c, vec2(0.285, 0.01), smoothstep(0.26, 0.66, s));
  c = mix(c, vec2(-0.42, 0.6), smoothstep(0.58, 1.0, s));
  c += uPointer * 0.028;

  vec2 z = uv;
  float iter = 0.0;
  float trap = 8.0;
  const float MAX_ITER = 46.0;
  for (int i = 0; i < 46; i++) {
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    float mag = dot(z, z);
    trap = min(trap, mag);
    if (mag > 64.0) break;
    iter += 1.0;
  }

  float t = iter / MAX_ITER;
  if (iter < MAX_ITER - 0.5) {
    float mag = max(dot(z, z), 1.0001);
    t = clamp((iter - log2(log2(mag)) + 4.0) / MAX_ITER, 0.0, 1.0);
  }
  float interior = step(MAX_ITER - 0.5, iter);
  float band = abs(fract(t * 3.0 + uTime * 0.015 + s) - 0.5);
  float filament = smoothstep(0.48, 0.12, band) * (1.0 - interior);
  float orbit = smoothstep(0.62, 0.0, trap);

  vec3 col = uBg;
  col = mix(col, uColorA, interior * 0.34);
  col = mix(col, uColorA, smoothstep(0.0, 0.4, t) * (1.0 - interior) * 0.26);
  col = mix(col, uColorB, filament * 0.34);
  col = mix(col, uColorB, orbit * 0.1);

  float center = smoothstep(0.5, 0.05, length((vUv - 0.5) * vec2(uAspect * 0.55, 0.82)));
  col = mix(col, uBg, center * 0.84);

  float vig = smoothstep(1.15, 0.22, length((vUv - 0.5) * vec2(uAspect * 0.75, 1.0)));
  col = mix(uBg, col, 0.5 + 0.5 * vig);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

function tetraPoints(count: number, seed: number) {
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const tetra = [
    new THREE.Vector3(1, 1, 1),
    new THREE.Vector3(1, -1, -1),
    new THREE.Vector3(-1, 1, -1),
    new THREE.Vector3(-1, -1, 1),
  ];
  tetra.forEach((vertex) => vertex.normalize());
  const point = tetra[0].clone();
  const positions = new Float32Array(count * 3);
  const warm = 16;
  for (let i = 0; i < count + warm; i++) {
    const target = tetra[Math.floor(rand() * 4)];
    point.add(target).multiplyScalar(0.5);
    if (i < warm) continue;
    const offset = (i - warm) * 3;
    positions[offset] = point.x;
    positions[offset + 1] = point.y;
    positions[offset + 2] = point.z;
  }
  return positions;
}

function readColor(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(value || fallback);
}

export function mountFractal(canvas: HTMLCanvasElement, motion: MotionState) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(readColor("--bg", "#f3ecdf"), 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 90);
  scene.add(camera);

  const uniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uPointer: { value: new THREE.Vector2() },
    uAspect: { value: 1 },
    uColorA: { value: readColor("--mist", "#e4d3c3") },
    uColorB: { value: readColor("--fractal", "#b08978") },
    uBg: { value: readColor("--bg", "#f3ecdf") },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  plane.position.set(0, 0, -28);
  plane.renderOrder = -1;
  camera.add(plane);

  const world = new THREE.Group();
  scene.add(world);

  const geometries: THREE.BufferGeometry[] = [plane.geometry];
  const materials: THREE.Material[] = [material];
  const torus = new THREE.TorusGeometry(1, 0.008, 8, 72);
  geometries.push(torus);

  type Dust = {
    mesh: THREE.Points;
    mode: "static" | "depth";
    spin: number;
    base: number;
    baseScale: number;
    mat: THREE.PointsMaterial;
  };
  type Halo = {
    mesh: THREE.Mesh;
    mode: "static" | "depth";
    base: number;
    mat: THREE.MeshBasicMaterial;
  };

  const dusts: Dust[] = [];
  const halos: Halo[] = [];

  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const mode = i % 2 === 0 ? "static" : "depth";
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(tetraPoints(mode === "static" ? 900 : 1400, 11 + i * 17), 3));
    geometries.push(geometry);
    const mat = new THREE.PointsMaterial({
      color: readColor(mode === "static" ? "--mist" : "--fractal", "#b08978"),
      size: mode === "static" ? 0.022 : 0.04,
      transparent: true,
      opacity: mode === "static" ? 0.28 : 0,
      depthWrite: false,
      sizeAttenuation: true,
    });
    materials.push(mat);
    const mesh = new THREE.Points(geometry, mat);
    const baseScale = mode === "static" ? 0.85 + (i % 3) * 0.12 : 1.15 + (i % 3) * 0.2;
    mesh.scale.setScalar(baseScale);
    mesh.position.set(i % 2 === 0 ? -0.42 : 0.48, (i % 3) - 1, THREE.MathUtils.lerp(5.2, -16.4, t));
    world.add(mesh);
    dusts.push({
      mesh,
      mode,
      spin: mode === "static" ? 0.012 : 0.05 + i * 0.006,
      base: mode === "static" ? 0.34 : 0.72,
      baseScale,
      mat,
    });
  }

  for (let i = 0; i < 10; i++) {
    const mode = i % 3 === 0 ? "static" : "depth";
    const mat = new THREE.MeshBasicMaterial({
      color: readColor("--fractal", "#b08978"),
      transparent: true,
      opacity: mode === "static" ? 0.16 : 0,
      depthWrite: false,
    });
    materials.push(mat);
    const mesh = new THREE.Mesh(torus, mat);
    const t = i / 9;
    mesh.scale.setScalar(1.35 + (i % 4) * 0.28);
    mesh.position.set(0, 0, THREE.MathUtils.lerp(6, -17.2, t));
    mesh.rotation.x = Math.PI / 2;
    mesh.rotation.z = i * 0.4;
    world.add(mesh);
    halos.push({ mesh, mode, base: mode === "static" ? 0.14 : 0.42, mat });
  }

  const syncTheme = () => {
    uniforms.uBg.value.copy(readColor("--bg", "#f3ecdf"));
    uniforms.uColorA.value.copy(readColor("--mist", "#e4d3c3"));
    uniforms.uColorB.value.copy(readColor("--fractal", "#b08978"));
    const mist = readColor("--mist", "#e4d3c3");
    const fractal = readColor("--fractal", "#b08978");
    dusts.forEach((dust) => dust.mat.color.copy(dust.mode === "static" ? mist : fractal));
    halos.forEach((halo) => halo.mat.color.copy(fractal));
    renderer.setClearColor(uniforms.uBg.value, 1);
  };
  const themeObserver = new MutationObserver(syncTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });

  const fit = () => {
    const width = window.innerWidth;
    const height = Math.max(window.innerHeight, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 760 ? 1.15 : 1.35));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    uniforms.uAspect.value = camera.aspect;
    const distance = 28;
    const heightWorld = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance * 1.08;
    plane.scale.set(heightWorld * camera.aspect, heightWorld, 1);
    const mobile = width < 760;
    dusts.forEach((dust) => {
      dust.mat.size = mobile ? dust.base * 0.09 : dust.mode === "static" ? 0.02 : 0.034;
    });
  };
  fit();
  window.addEventListener("resize", fit);

  let raf = 0;
  let time = 0;
  let last = performance.now();

  const frame = (now: number) => {
    raf = window.requestAnimationFrame(frame);
    const delta = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!motion.reduced) time += delta;

    uniforms.uTime.value = time;
    uniforms.uScroll.value = motion.scroll;
    uniforms.uPointer.value.set(motion.px, -motion.py);

    const z = THREE.MathUtils.lerp(8.6, -14.6, motion.scroll);
    const sway = motion.reduced ? 0 : Math.sin(motion.scroll * Math.PI * 2) * 0.08;
    camera.position.set(motion.px * 0.28, -motion.py * 0.16 + sway, z);
    camera.up.set(Math.sin(motion.px * -0.04), 1, 0);
    camera.lookAt(motion.px * 0.08, -motion.py * 0.04, z - 6);

    world.rotation.y = motion.px * 0.08;
    world.rotation.x = motion.py * 0.04;
    dusts.forEach((dust) => {
      const dist = Math.abs(dust.mesh.position.z - z);
      const near = Math.max(0, 1 - dist / 5.2);
      const fade = dust.mode === "static" ? 1 : near * near;
      dust.mat.opacity = dust.base * fade;
      if (dust.mode === "depth") {
        const scale = dust.baseScale * (0.72 + 0.28 * near);
        dust.mesh.scale.setScalar(scale);
      }
      if (!motion.reduced) {
        dust.mesh.rotation.y = time * dust.spin;
        if (dust.mode === "depth") dust.mesh.rotation.x = time * dust.spin * 0.45;
      }
    });
    halos.forEach((halo) => {
      const dist = Math.abs(halo.mesh.position.z - z);
      const near = Math.max(0, 1 - dist / 4.4);
      halo.mat.opacity = halo.base * (halo.mode === "static" ? 1 : near * near);
    });

    renderer.render(scene, camera);
  };
  raf = window.requestAnimationFrame(frame);

  return () => {
    window.cancelAnimationFrame(raf);
    window.removeEventListener("resize", fit);
    themeObserver.disconnect();
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((item) => item.dispose());
    renderer.dispose();
  };
}
