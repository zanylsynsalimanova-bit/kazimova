/* «Әр сабақ — шағын ғылыми зертхана» — one WebGL math world, camera driven by page scroll.
   Board photo → dive through the circle x²+y²=r² → coordinate axes → surface z=sin x·cos y →
   dodecahedron gate → gallery of solids → number line of years → golden spiral (the end). */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const P = window.portfolio, root = document.documentElement;
if (!root.classList.contains("static")) {
  try { init(); } catch (e) { console.warn("WebGL off:", e); P.toStatic(); }
}

function init() {
  const canvas = document.getElementById("gl"), veil = document.getElementById("veil");
  const mob = innerWidth < 820 || matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mob, alpha: true, powerPreference: "high-performance" });
  if (!renderer.getContext()) throw new Error("no gl");
  renderer.setPixelRatio(Math.min(devicePixelRatio, mob ? 1.25 : 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const CY = 0x3fd6e0, GD = 0xf2c45a, BG = new THREE.Color(0x061325), BG2 = new THREE.Color(0x07182c);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07182c, .012);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  const camera = new THREE.PerspectiveCamera(mob ? 52 : 38, innerWidth / innerHeight, .05, 400);
  scene.add(new THREE.HemisphereLight(0x9fe8ff, 0x050a18, .6));
  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-4, 8, 6); scene.add(key);

  /* ---------- helpers ---------- */
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const sm = (a, b, v) => { const x = Math.min(1, Math.max(0, (v - a) / (b - a))); return x * x * (3 - 2 * x); };
  const lineMat = (c, o = 1) => new THREE.LineBasicMaterial({ color: c, transparent: o < 1, opacity: o, depthWrite: o >= 1 });
  const poly = (parent, pts, c, o = 1) => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(c, o)); parent.add(l); return l; };
  const segs = (parent, arr, c, o = 1) => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3)); const l = new THREE.LineSegments(g, lineMat(c, o)); parent.add(l); return l; };
  const glowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.25, "rgba(255,255,255,.45)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
  function glow(parent, color, size, pos, op = .6) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); s.scale.setScalar(size); s.position.copy(pos); parent.add(s); return s; }
  function label(parent, text, pos, h = .5, color = "#EEF3FF", italic = false) {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 192; const x = c.getContext("2d");
    x.font = `${italic ? "italic " : ""}700 120px "Cambria Math",Cambria,"Times New Roman",serif`; x.fillStyle = color; x.textAlign = "center"; x.textBaseline = "middle";
    x.shadowColor = color; x.shadowBlur = 18; x.fillText(text, 512, 100);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: true }));
    s.scale.set(h * 5.33, h, 1); s.position.copy(pos); parent.add(s); return s; }
  function dot(parent, p, c, r = .07) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), new THREE.MeshBasicMaterial({ color: c })); m.position.copy(p); parent.add(m); glow(parent, c, r * 14, p, .45); return m; }
  function wire(geo, c, o = .9) { const g = new THREE.Group(); g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat(c, o)));
    const pos = geo.getAttribute("position"), seen = new Set(), pts = [];
    for (let i = 0; i < pos.count; i++) { const k = [pos.getX(i), pos.getY(i), pos.getZ(i)].map(v => v.toFixed(2)).join(); if (!seen.has(k)) { seen.add(k); pts.push(pos.getX(i), pos.getY(i), pos.getZ(i)); } }
    const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    g.add(new THREE.Points(pg, new THREE.PointsMaterial({ map: glowTex, color: GD, size: .35, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))); return g; }
  const spinners = [];
  const spin = (m, s = .3) => { m.userData.spin = V((Math.random() - .5) * s, (Math.random() - .5) * s * 1.4, (Math.random() - .5) * s * .6); spinners.push(m); return m; };

  /* ================= BOARD (HTML photo underneath) — glass solids in front ================= */
  const lab = new THREE.Group(); scene.add(lab);
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xe6fbff, roughness: .05, transmission: mob ? 0 : 1, thickness: .6, ior: 1.45, transparent: true, opacity: mob ? .35 : 1,
    clearcoat: 1, clearcoatRoughness: .04, envMapIntensity: 1.4, attenuationColor: new THREE.Color(CY), attenuationDistance: 4 });
  const L = mob ? { cam: V(0, .7, 10.5), look: V(0, .7, 0) } : { cam: V(0, .2, 9.2), look: V(0, .2, 0) };
  const fore = mob ? [[-2.4, 4.4, 1, .55, 0], [2.4, -1.4, 2.5, .5, 2]] : [[-6.4, -3.1, 1.5, .8, 0], [-1.6, 3.9, -1, .55, 1], [6.6, 3.5, 0, .6, 2], [3.6, -3.7, 3, .5, 3]];
  const foreGeo = [new THREE.IcosahedronGeometry(1, 0), new THREE.OctahedronGeometry(1, 0), new THREE.TorusGeometry(.8, .28, 20, 48), new THREE.TetrahedronGeometry(1, 0)];
  fore.forEach(([x, y, z, s, k]) => { const m = new THREE.Mesh(foreGeo[k], glass); m.position.set(x, y, z); m.scale.setScalar(s); lab.add(spin(m)); });

  /* ================= MATH WORLD ================= */
  const world = new THREE.Group(); scene.add(world); world.visible = false;
  // graph-paper floor and ceiling glow
  const grid = new THREE.GridHelper(170, 85, CY, CY); grid.material.transparent = true; grid.material.opacity = .14; grid.material.depthWrite = false; grid.position.set(0, -5.5, -255); world.add(grid);
  const grid2 = new THREE.GridHelper(170, 17, GD, GD); grid2.material.transparent = true; grid2.material.opacity = .12; grid2.material.depthWrite = false; grid2.position.set(0, -5.49, -255); world.add(grid2);

  // 1 · the circle from the board: x² + y² = r² (camera flies through it)
  const circ = new THREE.Group(); circ.position.set(0, mob ? 1.2 : 0, -197); world.add(circ);
  { const R = 3.3, pts = []; for (let i = 0; i <= 128; i++) { const a = i / 128 * Math.PI * 2; pts.push(V(Math.cos(a) * R, Math.sin(a) * R, 0)); }
    poly(circ, pts, CY); segs(circ, [-R - .6, 0, 0, R + .6, 0, 0, 0, -R - .6, 0, 0, R + .6, 0], CY, .35);
    const e = V(Math.cos(.7) * R, Math.sin(.7) * R, 0); poly(circ, [V(0, 0, 0), e], GD, .7); dot(circ, e, GD, .07);
    label(circ, "r", V(Math.cos(.7) * R * .5 - .25, Math.sin(.7) * R * .5 + .3, 0), .55, "#F2C45A", true);
    label(circ, "x² + y² = r²", V(0, R + 1.1, 0), .8, "#F2C45A", true); }

  // 2 · coordinate space: axes, parabola, sine wave (right of the "about" text)
  const AX = mob ? V(0, 2.4, -214) : V(4.6, -.4, -213);
  const axes = new THREE.Group(); axes.position.copy(AX); world.add(axes);
  { const A = 3.2, t = [];
    segs(axes, [-A, 0, 0, A, 0, 0, 0, -A, 0, 0, A, 0, 0, 0, -A, 0, 0, A], 0xeef3ff, .8);
    for (let i = -3; i <= 3; i++) if (i) t.push(i, -.08, 0, i, .08, 0, -.08, i, 0, .08, i, 0); segs(axes, t, 0xeef3ff, .6);
    label(axes, "x", V(A + .4, -.3, 0), .5, "#EEF3FF", true); label(axes, "y", V(.35, A + .3, 0), .5, "#EEF3FF", true); label(axes, "z", V(0, -.3, A + .4), .5, "#EEF3FF", true);
    const par = [], sin = []; for (let i = 0; i <= 80; i++) { const x = -1.8 + i / 80 * 3.6; par.push(V(x, x * x * .85 - .6, 0)); }
    for (let i = 0; i <= 120; i++) { const x = -3 + i / 120 * 6; sin.push(V(x, Math.sin(x * 2) * .7, .9)); }
    poly(axes, par, GD); poly(axes, sin, CY);
    label(axes, "y = x²", V(-2.1, 2.3, 0), .45, "#F2C45A", true); label(axes, "y = sin 2x", V(2.2, -1.3, .9), .4, "#3FD6E0", true); }

  // 3 · surface z = sin x · cos y with four "method" points (approach section)
  const SW = mob ? V(0, 2.2, -225) : V(4.4, -.8, -225);
  const surf = new THREE.Group(); surf.position.copy(SW); world.add(surf);
  const steps4 = [];
  { const g = new THREE.PlaneGeometry(6.4, 6.4, mob ? 24 : 40, mob ? 24 : 40), p = g.getAttribute("position");
    const f = (x, y) => Math.sin(x * 1.1) * Math.cos(y * 1.1) * .9;
    for (let i = 0; i < p.count; i++) p.setZ(i, f(p.getX(i), p.getY(i))); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: CY, wireframe: true, transparent: true, opacity: .38, depthWrite: false }));
    const fill = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x0c3550, metalness: .3, roughness: .5, transparent: true, opacity: .55, side: THREE.DoubleSide }));
    const pl = new THREE.Group(); pl.add(fill, m); pl.rotation.x = -Math.PI / 2.6; surf.add(pl);
    [[-2, -1.4], [-.6, 1.4], [1.2, -1.2], [2.3, 1.6]].forEach(([x, y]) => { const q = V(x, y, f(x, y) + .12); const d = dot(pl, q, GD, .1); steps4.push(d); });
    label(surf, "z = sin x · cos y", V(0, 2.6, 0), .45, "#3FD6E0", true); }

  // 4 · dodecahedron gate the camera passes through
  const gate = wire(new THREE.DodecahedronGeometry(3.6, 0), CY, .8); gate.position.set(0, mob ? 1 : 0, -237); world.add(gate);

  // 5 · gallery of solids around the diplomas
  const solids = new THREE.Group(); world.add(solids);
  const SG = [new THREE.TetrahedronGeometry(1.2), new THREE.BoxGeometry(1.6, 1.6, 1.6), new THREE.OctahedronGeometry(1.2), new THREE.IcosahedronGeometry(1.2), new THREE.ConeGeometry(1, 1.8, 24, 1), new THREE.CylinderGeometry(.8, .8, 1.6, 24, 1)];
  (mob ? [[-2.4, 4, -256, 1], [2.5, 3.8, -259, 3]] : [[-7.4, 2.8, -256, 0], [7.4, 2.4, -257, 1], [-6.4, -2.9, -259, 2], [6.8, -2.6, -258, 3], [0, 4.8, -262, 4], [-1.8, -4.4, -262, 5]])
    .forEach(([x, y, z, k], i) => { const w = wire(SG[k], i % 2 ? GD : CY, .85); w.position.set(x, y, z); solids.add(spin(w, .5)); });

  // 6 · number line with years (timeline)
  const tl = new THREE.Group(); world.add(tl);
  const LY = mob ? 1.6 : -1.4, LZ = -276, NODE = i => -1 + i * 4;
  const YEARS = window.TL_YEARS || ["2024", "2025", "2026"], TN = YEARS.length, TS = 4 * TN, LEND = TS + 6, nodes = [];
  const axisMat = new THREE.MeshBasicMaterial({ color: 0xeef3ff, fog: false });
  const line = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 120, 8), axisMat); line.rotation.z = Math.PI / 2; line.position.set(14, LY, LZ); tl.add(line);
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(.12, .4, 16), axisMat); arrow.rotation.z = -Math.PI / 2; arrow.position.set(LEND + .2, LY, LZ); tl.add(arrow);
  const tick = []; for (let x = -12; x <= LEND; x += .5) { const h = Math.abs(x % 2) < 1e-6 ? .22 : .1; tick.push(x, LY - h, LZ, x, LY + h, LZ); }
  const ticks = segs(tl, tick, 0xeef3ff, .7);
  YEARS.forEach((y, i) => { const p = V(NODE(i), LY, LZ); const n = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: GD })); n.scale.setScalar(.14); n.position.copy(p); tl.add(n);
    nodes.push([n, glow(tl, GD, 1.6, p, .5), label(tl, y, p.clone().add(V(0, .7, 0)), .5, "#C9D6EE")]); });

  // 7 · golden spiral (final) — r = a·φ^(2θ/π)
  const SC = mob ? V(0, 2.6, -306) : V(4.6, -.2, -306);
  const spiral = new THREE.Group(); spiral.position.copy(SC); world.add(spiral);
  const phi = (1 + Math.sqrt(5)) / 2, b = Math.log(phi) / (Math.PI / 2), a = .045;
  { const pts = []; for (let i = 0; i <= 600; i++) { const th = i / 600 * Math.PI * 4.6; const r = a * Math.exp(b * th); pts.push(V(Math.cos(th) * r, Math.sin(th) * r, 0)); }
    poly(spiral, pts, GD); glow(spiral, GD, 3, V(0, 0, 0), .35);
    [1, 1, 2, 3, 5, 8, 13, 21].forEach((n, k) => { const th = (k + 2) * Math.PI / 2 * .9; const r = a * Math.exp(b * th) + .35; if (r < 4.2) label(spiral, String(n), V(Math.cos(th) * r, Math.sin(th) * r, 0), .32, "#EEF3FF"); });
    label(spiral, "φ ≈ 1,618", V(0, -3.6, 0), .55, "#F2C45A", true); }

  // floating symbols along the whole path (kept out of the reading column)
  const SYM = ["π", "∑", "√x", "∞", "∫", "Δ", "φ", "sin α", "cos β", "f(x)", "a²+b²=c²", "∠", "≈", "e", "log₂", "x₁,₂", "%", "≠", "n!", "lim"];
  const syms = []; const SN = mob ? 20 : 48;
  for (let i = 0; i < SN; i++) { const z = -192 - i * (118 / SN) - Math.random() * 2; let x, y;
    if (mob) { x = (Math.random() - .5) * 6; y = 1 + Math.random() * 3.6; } else { const right = Math.random() < .72; x = right ? 2.4 + Math.random() * 6 : -5.2 - Math.random() * 3.5; y = (Math.random() - .5) * 6.5; }
    if (Math.abs(z + 237) < 5) continue;
    const s = label(world, SYM[i % SYM.length], V(x, y, z), .35 + Math.random() * .3, i % 3 ? "#7FE6EE" : "#F2C45A", true);
    s.material.opacity = .55; s.userData.y = y; s.userData.ph = Math.random() * 6; syms.push(s); }
  // dust
  { const n = mob ? 260 : 700, arr = new Float32Array(n * 3); for (let i = 0; i < n; i++) { arr[i * 3] = (Math.random() - .5) * 34; arr[i * 3 + 1] = (Math.random() - .5) * 16; arr[i * 3 + 2] = -188 - Math.random() * 130; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    world.add(new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex, color: 0xcfefff, size: .12, transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }))); }

  /* ================= camera path (always forward) ================= */
  const K = [
    { g: 0, p: L.cam, l: L.look },
    { g: .4, p: mob ? V(.3, .4, 6) : V(.4, -.3, 5.4), l: mob ? V(.4, 0, -4) : V(.6, -.6, -4) },
    { g: .8, p: mob ? V(.5, -.2, 2) : V(.6, -.5, 1.6), l: mob ? V(.6, -.6, -6) : V(.7, -.8, -6) },
    { g: .92, p: V(0, mob ? 1.2 : 0, -186), l: V(0, mob ? 1.2 : 0, -200), cut: true },
    { g: 1.5, p: V(0, mob ? 1.3 : 0, -199), l: V(mob ? .2 : 1.2, mob ? 1.6 : 0, -210) },
    { g: 2.0, p: V(mob ? 0 : .2, mob ? 1.6 : .1, -209), l: V(mob ? 0 : 2.4, mob ? 1.9 : -.2, -221) },
    { g: 2.5, p: V(mob ? 0 : -1.2, mob ? 1.4 : .5, mob ? -214 : -213), l: V(mob ? 0 : SW.x * .35, SW.y, -225) },
    { g: 2.95, p: V(0, mob ? 1.1 : 0, -228), l: V(0, mob ? 1 : 0, -242) },
    { g: 3.3, p: V(0, mob ? 1 : 0, -240), l: V(0, mob ? 1.1 : 0, -252) },
    { g: 3.6, p: V(0, mob ? 1 : 0, -246), l: V(0, mob ? 1.2 : 0, -258) },
    { g: 4.0, p: V(-7, LY + 2.4, -265), l: V(-1, LY + (mob ? -3.3 : 1.5), -276) },
    { g: 5.0, p: V(-7 + TS, LY + 2.4, -265), l: V(-1 + TS, LY + (mob ? -3.3 : 1.5), -276) },
    { g: 5.45, p: mob ? V(0, 2.2, -288) : V(-.8, .6, -289), l: mob ? SC : V(SC.x - 2.6, SC.y, SC.z) },
    { g: 6.0, p: mob ? V(0, 2.4, -296) : V(-.4, .4, -297.5), l: mob ? SC : V(SC.x - 3.4, SC.y, SC.z) }
  ];
  const tmpP = V(0, 0, 0), tmpL = V(0, 0, 0);
  function cam(G) {
    let i = 0; while (i < K.length - 2 && G >= K[i + 1].g) i++;
    const A = K[i], B = K[i + 1], t = Math.min(1, Math.max(0, (G - A.g) / (B.g - A.g)));
    let v = 0;
    if (B.cut) { const s = t < .5 ? A : B; tmpP.copy(s.p); tmpL.copy(s.l); v = Math.pow(1 - Math.abs(t - .5) * 2, .7); if (t < .5) tmpP.lerp(tmpL, t * .5); }
    else if (A.g === 4) { const q = sm(.08, .92, G - 4); tmpP.set(-7 + TS * q, LY + 2.4, -265); tmpL.set(-1 + TS * q, LY + (mob ? -3.3 : 1.5), -276); }
    else { const e = t * t * (3 - 2 * t); tmpP.lerpVectors(A.p, B.p, e); tmpL.lerpVectors(A.l, B.l, e); }
    return v;
  }

  /* ================= loop ================= */
  let G = P.getG(), prev = performance.now(), first = true; const t0 = prev;
  function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
  addEventListener("resize", resize); resize();
  function frame(now) {
    const dt = Math.min(.1, (now - prev) / 1000), t = (now - t0) / 1000; prev = now;
    G += (P.getG() - G) * (1 - Math.exp(-dt * 6)); if (Math.abs(P.getG() - G) < 1e-4) G = P.getG(); window.__G3 = G;
    const v = cam(G); camera.position.copy(tmpP); camera.lookAt(tmpL);
    veil.style.opacity = v.toFixed(3);
    const inLab = G < .86; lab.visible = inLab; world.visible = !inLab || G > .7;
    scene.background = inLab ? null : BG2; scene.fog.color.copy(inLab ? BG : BG2); scene.fog.density = inLab ? .012 : (mob ? .03 : .026);
    spinners.forEach(m => { if (m.parent.visible) { m.rotation.x += m.userData.spin.x * dt * .5; m.rotation.y += m.userData.spin.y * dt * .5; } });
    if (world.visible) {
      circ.rotation.z = t * .05; circ.visible = G < 2;
      axes.visible = G > 1 && G < 2.7; axes.rotation.y = -.5 + Math.min(1, Math.max(0, G - 1)) * .9 + Math.sin(t * .3) * .04;
      const u2 = Math.min(1, Math.max(0, G - 2)); surf.visible = G > (mob ? 1.8 : 1.5) && G < 3.1; surf.rotation.y = -.6 + u2 * 1.2;
      steps4.forEach((d, j) => { const on = u2 > .2 + j * .12; d.scale.setScalar(on ? 1.6 + Math.sin(t * 3 + j) * .2 : .6); });
      gate.visible = G > 2.55 && G < 3.5; gate.rotation.set(G * .3, G * .45, 0);
      solids.visible = G > 2.9 && G < 4.3; tl.visible = G > 3.6 && G < 5.6; spiral.visible = G > 4.7;
      spiral.scale.setScalar(.75 + sm(4.9, 5.7, G) * .35);
      syms.forEach(s => { s.position.y = s.userData.y + Math.sin(t * .5 + s.userData.ph) * .15; });
      const q = sm(.08, .92, G - 4), act = Math.min(TN - 1, Math.floor(q * TN - 1e-6));
      // number line begins right of the reading column, so it never crosses the text
      const cx = camera.position.x + (mob ? -3 : 6.5), len = Math.max(.01, LEND - cx);
      line.scale.y = len / 120; line.position.x = cx + len / 2;
      const first0 = Math.max(0, Math.ceil((cx + 12) / .5)); ticks.geometry.setDrawRange(first0 * 2, 1e6);
      nodes.forEach(([n, gl, lb], i) => { const on = G > 3.9 && G < 5.05 && i === act, vis = NODE(i) > cx - .3; n.visible = gl.visible = vis; lb.visible = vis && !mob;
        n.scale.setScalar(on ? .22 : .12); gl.material.opacity = on ? .9 : .3; lb.material.opacity = on ? 1 : .55; });
    }
    renderer.render(scene, camera);
    if (first) { first = false; root.classList.add("gl-ready"); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.__setG = g => { window.__forceG = g; };
}
