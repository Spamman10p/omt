// Editable source model for the SIS workshop robot, styled after Orchard (super-intelligent-slave
// dist/assets/orchard-01.png): slim dark-gunmetal frame, worn olive armor plates, amber camera eyes,
// orange-ringed joints, file carrier, hand scanner. Every removable part is a named, pivoted Group.
// Edit here, then `npm run export-model` regenerates model/robot.glb (wear textures are procedural canvases).
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
// Procedural wear texture: base colour + grime + edge scratches + panel lines + rivets.
function wearTex(base, seed, { panel = true, decal = null, chips = 0, jpeg = false } = {}) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.07})`; g.beginPath(); g.arc(r() * 512, r() * 512, 4 + r() * 30, 0, 7); g.fill(); }
  g.lineCap = 'round';
  for (let i = 0; i < 260; i++) { const x = r() * 512, y = r() * 512, a = r() * 7, l = 3 + r() * 18;
    g.strokeStyle = `rgba(160,158,150,${0.08 + r() * 0.2})`; g.lineWidth = 0.6 + r(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  g.strokeStyle = 'rgba(150,148,140,0.28)'; for (let i = 0; i < 90; i++) { const x = r() * 512, y = r() * 512, l = 8 + r() * 40; g.lineWidth = 0.5 + r() * 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + l, y + (r() - 0.5) * l * 0.3); g.stroke(); } // directional scuffs
  g.strokeStyle = 'rgba(205,200,190,0.55)'; g.lineWidth = 5; g.setLineDash([30, 12, 6, 18]); g.strokeRect(3, 3, 506, 506); g.setLineDash([]); // worn edge highlight
  if (panel) { g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 2; g.strokeRect(24, 24, 464, 464); g.beginPath(); g.moveTo(24, 256); g.lineTo(488, 256); g.moveTo(300, 24); g.lineTo(300, 256); g.stroke(); g.strokeStyle = 'rgba(190,185,170,0.35)'; g.lineWidth = 3; g.strokeRect(8, 8, 496, 496); // chipped edges
    for (let i = 0; i < 30; i++) { g.fillStyle = `rgba(110,85,55,${0.15 + r() * 0.25})`; g.fillRect(r() * 512, r() * 512, 2 + r() * 14, 1 + r() * 4); } // rust flecks
    g.fillStyle = 'rgba(30,30,30,0.8)'; [[40, 40], [472, 40], [40, 472], [472, 472], [256, 40], [256, 472]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); }); }
  if (decal) { g.fillStyle = 'rgba(220,210,180,0.75)'; g.font = 'bold 48px monospace'; g.fillText(decal, 60, 200); g.fillRect(60, 220, 160, 8); }
  // paint chipped through to bare metal: jagged blobs, denser along plate edges
  for (let i = 0; i < chips; i++) { const e = r() < 0.7, x = e ? (r() < 0.5 ? r() * 30 : 482 + r() * 30) : r() * 512, y = e && r() < 0.5 ? (r() < 0.5 ? r() * 30 : 482 + r() * 30) : r() * 512;
    g.fillStyle = `rgb(${120 + r() * 30},${120 + r() * 30},${115 + r() * 25})`; g.beginPath(); for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28, rr = 2 + r() * 9; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.name = 'wear_' + seed;
  // derived maps: luminance -> height -> normal (Sobel); bright scratches/chips = smoother, grime = rougher
  const N = 512, src = g.getImageData(0, 0, N, N).data, H = new Float32Array(N * N); for (let i = 0; i < N * N; i++) H[i] = (src[i * 4] * 0.3 + src[i * 4 + 1] * 0.59 + src[i * 4 + 2] * 0.11) / 255;
  const nc = document.createElement('canvas'), rc = document.createElement('canvas'); nc.width = nc.height = rc.width = rc.height = N;
  const nd = nc.getContext('2d').createImageData(N, N), rd = rc.getContext('2d').createImageData(N, N); const h = (x, y) => H[((y + N) % N) * N + ((x + N) % N)];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const dx = (h(x + 1, y) - h(x - 1, y)) * 3, dy = (h(x, y + 1) - h(x, y - 1)) * 3, l = Math.hypot(dx, dy, 1), o = (y * N + x) * 4;
    nd.data[o] = (-dx / l * 0.5 + 0.5) * 255; nd.data[o + 1] = (dy / l * 0.5 + 0.5) * 255; nd.data[o + 2] = (1 / l * 0.5 + 0.5) * 255; nd.data[o + 3] = 255;
    const rgh = Math.max(0.15, Math.min(1, 0.95 - H[y * N + x] * 0.9)); rd.data[o] = 0; rd.data[o + 1] = rgh * 255; rd.data[o + 2] = 0; rd.data[o + 3] = 255; }
  nc.getContext('2d').putImageData(nd, 0, 0); rc.getContext('2d').putImageData(rd, 0, 0);
  const nt = new THREE.CanvasTexture(nc), rt = new THREE.CanvasTexture(rc); nt.name = 'normal_' + seed; rt.name = 'rough_' + seed;
  [t, nt].forEach(x => { x.userData.mimeType = 'image/jpeg'; }); /* v12: all colour+normal maps JPEG (size) */ // v10 size: leg-only maps as JPEG (upper-body maps untouched)
  [t, nt, rt].forEach(x => { x.wrapS = x.wrapT = THREE.RepeatWrapping; }); // shells/UVs beyond 0..1 tile instead of edge-streaking
  return { map: t, normalMap: nt, roughnessMap: rt };
}
const M = (name, color, rough, metal, map, emissive) => {
  const m = new THREE.MeshStandardMaterial({ name, color: map ? 0xffffff : color, roughness: map ? 1 : rough, metalness: metal, map: map ? map.map : null, normalMap: map ? map.normalMap : null, roughnessMap: map ? map.roughnessMap : null });
  if (map) m.normalScale.set(0.8, 0.8);
  if (emissive) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = 2; } return m;
};
export const MATS = () => ({
  olive: M('olive_armor', 0, 0.8, 0.12, wearTex('#4d5737', 7, { chips: 90 })), oliveDecal: M('olive_chest', 0, 0.8, 0.12, wearTex('#4f5a39', 11, { decal: 'SIS-07', chips: 90 })),
  gunmetal: M('gunmetal_armor', 0, 0.38, 0.9, wearTex('#3d4143', 3, { chips: 40 })), frame: M('frame_dark', 0x34373a, 0.5, 0.85),
  gunShell: M('gunmetal_shell', 0, 0.38, 0.9, wearTex('#3d4143', 3, { chips: 40, panel: false })), legMetal: M('leg_metal', 0, 0.42, 0.85, wearTex('#3b3f41', 21, { chips: 70, panel: false, jpeg: true })),
  tape: M('tape', 0x9a9278, 0.9, 0), pouchOlive: M('pouch_olive_canvas', 0x3f3d31, 0.97, 0), pouchCrease: M('pouch_crease', 0x2a2920, 0.97, 0), stitch: M('stitch', 0x6e6a58, 0.9, 0), kneeKhaki: M('knee_khaki', 0x4d4a43, 0.62, 0.45),
  pouch: M('pouch_canvas_dirty', 0x6f6650, 0.97, 0), paperDirty: M('paper_dirty', 0xa89c7e, 0.95, 0), tanDirty: M('manila_dirty', 0x8f7a50, 0.95, 0),
  steel: M('steel', 0x6d7072, 0.35, 0.9), rubber: M('rubber', 0x151515, 0.9, 0),
  amber: M('amber_glow', 0x2a1500, 0.2, 0.2, null, 0xffa024), ring: M('joint_ring', 0x6e5a3c, 0.45, 0.9, null, 0x140a00),
  canvas: M('canvas_pouch', 0x8f8670, 0.95, 0), paper: M('file_paper', 0xd8ccae, 0.95, 0), tan: M('manila', 0xc4a46e, 0.95, 0),
});
const sh = m => (m.castShadow = m.receiveShadow = true, m);
const box = (w, h, d, mat, r = 0.01) => sh(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2.1, h / 2.1, d / 2.1)), mat));
const cyl = (rt, rb, h, mat, seg = 18) => sh(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat));
const at = (m, x, y, z, rx = 0, ry = 0, rz = 0) => (m.position.set(x, y, z), m.rotation.set(rx, ry, rz), m);
function part(id, x, y, z) { const g = new THREE.Group(); g.name = id; g.position.set(x, y, z); g.userData.partId = id; return g; }
// orange-ringed joint along X axis
function joint(p, mt, r, w, x, y, z) { p.add(at(cyl(r, r, w, mt.frame), x, y, z, 0, 0, Math.PI / 2));
  [-1, 1].forEach(s => p.add(at(sh(new THREE.Mesh(new THREE.TorusGeometry(r * 0.7, r * 0.08, 8, 24), mt.ring)), x + s * w / 2, y, z, 0, Math.PI / 2, 0))); }
function cable(p, mat, pts, r = 0.008) { const c = new THREE.CatmullRomCurve3(pts.map(q => new THREE.Vector3(...q))); p.add(sh(new THREE.Mesh(new THREE.TubeGeometry(c, 14, r, 6), mat))); }
// angular armor plate: extruded chamfered outline with bevel
function plate(w, h, t, mat, ch = 0.25) { const s = new THREE.Shape(), a = w / 2, b = h / 2, c = Math.min(w, h) * ch;
  s.moveTo(-a + c, -b); s.lineTo(a - c, -b); s.lineTo(a, -b + c); s.lineTo(a, b - c); s.lineTo(a - c, b); s.lineTo(-a + c, b); s.lineTo(-a, b - c); s.lineTo(-a, -b + c); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: true, bevelThickness: t * 0.3, bevelSize: t * 0.3, bevelSegments: 1 }); g.translate(0, 0, -t / 2);
  const uv = g.attributes.uv, pos = g.attributes.position, side = g.groups[1] || { start: 0, count: 0 };
  for (let i = 0; i < uv.count; i++) { const inSide = i >= side.start && i < side.start + side.count;
    uv.setXY(i, inSide ? (pos.getX(i) + pos.getY(i)) / (w + h) + 0.5 : pos.getX(i) / w + 0.5, inSide ? 0.5 + pos.getZ(i) * 2 : pos.getY(i) / h + 0.5); } // sides: continuous, unstretched
  return sh(new THREE.Mesh(g, mat)); }
// Molded wrap shell: lathe a closed rounded-rectangle cross-section (thickness t, corner radius rr)
// through `arc` radians centred on +Z. Reads as one rounded piece that wraps the limb; lathe UVs = no stretch.
function wrap(r, h, t, arc, mat, { rr = 0.4, taper = 0, seg = 28 } = {}) {
  const pts = [], c = Math.min(t, h) * rr * 0.5 + t * 0.25, ri = r - t, top = h / 2, bot = -h / 2, rt = taper;
  const corner = (cx, cy, a0) => { for (let k = 0; k <= 4; k++) { const a = a0 + k / 4 * Math.PI / 2; pts.push(new THREE.Vector2(cx + Math.cos(a) * c, cy + Math.sin(a) * c)); } };
  corner(ri + c, bot + c, Math.PI); corner(r - c, bot + c, -Math.PI / 2); corner(r - c - rt, top - c, 0); corner(ri + c - rt, top - c, Math.PI / 2); pts.push(pts[0].clone());
  const g = new THREE.LatheGeometry(pts, seg, Math.PI - arc / 2 + Math.PI, arc); g.computeVertexNormals();
  const p = g.attributes.position, uv = g.attributes.uv, S = 0.16; // re-map UVs by arc length & height (equal texel density, no lengthwise stretch)
  for (let i = 0; i < p.count; i++) uv.setXY(i, Math.atan2(p.getX(i), p.getZ(i)) * r / S + 0.5, p.getY(i) / S + 0.5);
  const m = sh(new THREE.Mesh(g, mat));
  const sg = new THREE.ShapeGeometry(new THREE.Shape(pts)); // end caps close the open lathe ends
  [Math.PI - arc / 2 + Math.PI, Math.PI + arc / 2 + Math.PI].forEach(phi => { const cg = sg.clone(), cp = cg.attributes.position;
    for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i); cp.setXYZ(i, x * Math.sin(phi), y, x * Math.cos(phi)); } cg.computeVertexNormals();
    const cap = sh(new THREE.Mesh(cg, mat)); cap.material = mat; m.add(cap); });
  return m; }
// Curved shingle (v9 leg method): faceted outline [x,y] (x = arc length, m) extruded to thickness t with
// rounded bevel, tessellated, then bent around the vertical axis at radius R so it wraps the limb.
// Mesh origin = limb axis; plate faces +Z. Stack shingles with growing R so outer layers overlap inner ones.
function shingle(outline, t, R, mat, bevel = 0.0025) {
  let g = new THREE.ExtrudeGeometry(new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y))), { depth: t, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 1 });
  g.deleteAttribute('normal'); g = g.toNonIndexed(); g = new TessellateModifier(0.03, 5).modify(g); g.deleteAttribute('normal'); g.deleteAttribute('uv'); g = mergeVertices(g, 1e-5);
  const p = g.attributes.position, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), rad = R + z, th = x / R;
    uv[i * 2] = x / 0.5 + 0.5; uv[i * 2 + 1] = y / 0.5 + 0.5; /* one texture tile spans a whole plate: no tiling seams */ p.setXYZ(i, rad * Math.sin(th), y, rad * Math.cos(th)); }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.computeVertexNormals(); return sh(new THREE.Mesh(g, mat)); }
const onShingle = (R, x, y, yaw = 0) => { const th = x / R + yaw; return [R * Math.sin(th), y, R * Math.cos(th)]; };
function capsuleShell(r, len, mat) { const g = new THREE.CapsuleGeometry(r, len, 8, 20), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, Math.atan2(p.getX(i), p.getZ(i)) * r / 0.16 + 0.5, p.getY(i) / 0.16 + 0.5); return sh(new THREE.Mesh(g, mat)); }

// inset bolt: dark counterbore ring + hex-ish head, sits proud of plate surface at z
function bolt(p, mt, x, y, z, r = 0.007) { p.add(at(cyl(r * 1.5, r * 1.5, 0.003, mt.frame, 10), x, y, z, Math.PI / 2, 0, 0)); p.add(at(cyl(r, r, 0.005, mt.steel, 6), x, y, z + 0.002, Math.PI / 2, 0, 0)); }
// layered plate: thick extruded base + slightly smaller raised top plate, seam groove between, bolts at corners
function layered(w, h, mtBase, mtTop, mt, { t = 0.018, inset = 0.012, ch = 0.22, bolts = true } = {}) {
  const g = new THREE.Group(); g.add(plate(w, h, t, mtBase, ch)); g.add(at(plate(w - inset * 2, h - inset * 2, t * 0.8, mtTop, ch), 0, 0, t * 0.9));
  if (bolts) [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => bolt(g, mt, a * (w / 2 - inset * 2.2), b * (h / 2 - inset * 2.2), t * 1.75));
  return g; }
function arm(side, mt) {
  const s = side === 'L' ? 1 : -1;
  const a = part(`arm_${side}`, 0.2 * s, 1.5, 0);
  a.rotation.set(side === 'R' ? 0.25 : -0.35, side === 'R' ? -0.3 : 0.15, side === 'R' ? -0.32 : 0.18); // pose (as photo): R arm hooks box at right hip, L arm raises scanner
  joint(a, mt, 0.055, 0.09, 0.02 * s, 0, 0);
  a.add(at(box(0.07, 0.26, 0.07, mt.frame), 0.03 * s, -0.17, 0));
  { const g = wrap(0.058, 0.21, 0.016, Math.PI * 1.25, mt.gunShell); a.add(at(g, 0.03 * s, -0.16, 0, 0, s * Math.PI * 0.3, 0)); } // rounded upper-arm guard
  a.add(at(cyl(0.007, 0.007, 0.24, mt.steel, 6), 0.065 * s, -0.17, -0.02)); // hydraulic rod
  joint(a, mt, 0.042, 0.08, 0.03 * s, -0.32, 0);
  const fore = new THREE.Group(); fore.name = `forearm_${side}`; fore.position.set(0.03 * s, -0.32, 0);
  fore.rotation.set(side === 'R' ? -1.35 : -1.25, side === 'R' ? 0.55 : -0.35, side === 'R' ? 0.45 : 0.15); /* v12: R wraps under box, L natural bend */ a.add(fore); // elbow bend: forearms forward
  fore.add(at(box(0.06, 0.24, 0.06, mt.frame, 0.025), 0, -0.15, 0.01)); fore.add(at(wrap(0.055, 0.22, 0.016, Math.PI * 1.4, mt.gunShell, { taper: 0.008 }), 0, -0.15, 0.01, 0, s * Math.PI * 0.25, 0)); // forearm shell
  fore.add(at(wrap(0.061, 0.13, 0.008, Math.PI * 0.5, mt.olive), 0, -0.15, 0.01, 0, s * Math.PI / 2, 0)); // olive outer overlay, wrapped
  fore.add(at(cyl(0.008, 0.008, 0.22, mt.steel, 6), 0, -0.13, -0.05));
  for (let i = 0; i < 3; i++) fore.add(at(box(0.08, 0.008, 0.08, mt.frame, 0.002), 0, -0.05 - i * 0.012, 0.01)); // wrist straps
  cable(a, mt.rubber, [[0, -0.03, -0.05], [0.06 * s, -0.2, -0.06], [0.05 * s, -0.33, -0.05]], 0.006);
  cable(fore, mt.rubber, [[0.03 * s, 0, -0.04], [0.05 * s, -0.12, -0.05], [0.03 * s, -0.27, -0.02]], 0.005);
  const hand = part(`hand_${side}`, 0, -0.3, 0.01);
  hand.add(box(0.075, 0.07, 0.06, mt.frame, 0.012));
  for (let i = 0; i < 4; i++) { hand.add(at(box(0.016, 0.05, 0.018, mt.gunmetal, 0.005), (i - 1.5) * 0.019, -0.06, 0.01, 0.3, 0, 0));
    hand.add(at(box(0.015, 0.035, 0.016, mt.frame, 0.004), (i - 1.5) * 0.019, -0.095, 0.035, 0.9, 0, 0)); }
  hand.add(at(box(0.018, 0.05, 0.02, mt.gunmetal, 0.005), -0.045 * s, -0.03, 0.03, 0, 0, 0.5 * s));
  if (side === 'L') { // handheld barcode scanner like Orchard, with dangling lanyard
    hand.add(at(box(0.04, 0.09, 0.04, mt.frame, 0.01), 0, -0.07, 0.03));
    hand.add(at(box(0.075, 0.065, 0.19, mt.gunmetal, 0.016), 0, -0.12, 0.08, 1.3, 0, 0)); hand.add(at(box(0.082, 0.07, 0.05, mt.frame, 0.014), 0, -0.2, 0.06, 1.3, 0, 0)); /* chunkier scanner head */
    hand.add(at(box(0.055, 0.025, 0.005, mt.amber, 0.003), 0, -0.236, 0.066, 1.3, 0, 0));
    { const pts = []; for (let k = 0; k <= 80; k++) { const a = k / 80 * Math.PI * 12; pts.push([Math.cos(a) * 0.012, -0.1 - k / 80 * 0.17, Math.sin(a) * 0.012 - 0.01]); } cable(hand, mt.rubber, pts, 0.004); } /* coiled cord */
  }
  fore.add(hand); return a;
}
function leg(side, mt) {
  // v9: layered curved shingles per LEG-STUDY.md (inner frame -> rear shell -> front shell -> overlapping cuffs)
  const s = side === 'L' ? 1 : -1, olive = side === 'L';
  if (!mt.kneeKhaki.normalMap) { mt.kneeKhaki.normalMap = mt.legMetal.normalMap; mt.kneeKhaki.roughnessMap = mt.legMetal.roughnessMap; mt.kneeKhaki.roughness = 1; mt.kneeKhaki.normalScale.set(2.2, 2.2); } /* scuffs: reuse leg maps, 0 extra bytes */
  if (!mt.oliveShell) { mt.oliveShell = mt.olive.clone(); mt.oliveShell.name = 'olive_leg_shell'; mt.oliveShell.color.setHex(0x7a7a72); } // darker, same textures (no extra MB) // photo-right leg (robot L) carries the olive shin plate
  const l = part(`leg_${side}`, 0.085 * s, 0.98, 0); l.rotation.x = side === 'L' ? -0.28 : 0.22; // mid-stride (unchanged)
  joint(l, mt, 0.06, 0.1, 0, 0, 0);
  // ---- thigh: frame + rear shell (front shell lives in thigh_plate part)
  l.add(at(box(0.06, 0.4, 0.06, mt.frame, 0.015), 0, -0.22, 0));
  { const sh1 = shingle([[-0.075, -0.15], [0.07, -0.15], [0.085, 0.14], [-0.08, 0.15]], 0.012, 0.05, mt.legMetal); l.add(at(sh1, 0, -0.23, 0, 0, s * 1.9 + Math.PI, 0)); } // rear/outer thigh shell
  { const sh2 = shingle([[-0.05, -0.13], [0.05, -0.14], [0.06, 0.13], [-0.055, 0.14]], 0.012, 0.09, mt.legMetal); l.add(at(sh2, 0, -0.23, 0, 0, s * 1.35, 0)); } /* outer side plate: large, flat-faced (R 0.09) */
  // ---- knee: drum + ring (joint), worn khaki cap overlapping thigh lower plate and shin top, side plates
  l.add(at(cyl(0.05, 0.05, 0.11, mt.frame), 0, -0.46, 0, 0, 0, Math.PI / 2)); /* knee drum */
  if (!mt.ringDim) { mt.ringDim = mt.ring.clone(); mt.ringDim.name = 'joint_ring_dim'; mt.ringDim.color.setHex(0x4e4030); mt.ringDim.emissive.setHex(0x0a0500); }
  [-1, 1].forEach(k => l.add(at(sh(new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0035, 6, 24), mt.ringDim)), k * 0.056, -0.46, 0, 0, Math.PI / 2, 0))); /* smaller, dimmer knee rings */
  { const cap = shingle([[-0.058, -0.068], [0.058, -0.068], [0.066, -0.055], [0.066, 0.055], [-0.066, 0.055], [-0.066, -0.055]], 0.026, 0.085, mt.kneeKhaki, 0.003);
    l.add(at(cap, 0, -0.465, -0.025, 0, s * 0.15, 0)); l.add(at(shingle([[-0.056, -0.072], [0.056, -0.072], [0.072, -0.034], [0.072, 0.06], [-0.072, 0.06], [-0.072, -0.034]], 0.006, 0.072, mt.frame, 0.002), 0, -0.465, -0.025, 0, s * 0.15, 0)); /* dark under-layer: shows the cap's thickness edge + gap */ [[-0.028, 0.025], [0.028, 0.025]].forEach(([x, y]) => { const q = onShingle(0.112, x, y, s * 0.15); bolt(l, mt, q[0], q[1] - 0.465, q[2] - 0.025, 0.0045); }); }
  l.add(at(shingle([[-0.03, -0.04], [0.03, -0.04], [0.035, 0.04], [-0.035, 0.04]], 0.01, 0.055, mt.legMetal), 0, -0.47, 0, 0, s * 1.6, 0)); // knee side plate behind drum
  // ---- shin (inside out)
  l.add(at(box(0.045, 0.5, 0.045, mt.frame, 0.012), 0, -0.74, -0.012)); // inner frame
  l.add(at(cyl(0.012, 0.012, 0.12, mt.frame, 8), 0.03 * s, -0.86, -0.045)); // rear piston
  const SY = -0.74, SR = 0.052;
  { const rear = shingle([[-0.045, -0.19], [0.03, -0.19], [0.08, 0.2], [-0.09, 0.2]], 0.011, SR, mt.legMetal); l.add(at(rear, 0, SY, 0, -0.05, -s * 0.95, 0)); } // rear/inner shell, wide at top (inner side faces the other leg, as photo)
  { const front = shingle([[-0.02, -0.2], [0.018, -0.2], [0.05, 0.1], [0.008, 0.21], [-0.045, 0.16]], 0.008, SR + 0.008, olive ? mt.oliveShell : mt.legMetal, 0.0015); // shield front shell
    l.add(at(front, 0, SY, 0.0, -0.05, s * 0.18, 0));
    l.add(at(shingle([[-0.03, -0.21], [0.028, -0.21], [0.06, 0.1], [0.008, 0.22], [-0.055, 0.17]], 0.003, SR + 0.004, mt.frame, 0.001), 0, SY, 0.0, -0.05, s * 0.18, 0)); /* dark backing: deeper gap around front shell */
    [[-0.016, -0.185], [0.012, -0.185], [-0.032, 0.13], [0.034, 0.09]].forEach(([x, y]) => { const q = onShingle(SR + 0.019, x, y, s * 0.18); bolt(l, mt, q[0], SY + q[1], q[2] - 0.004, 0.0042); });
    l.add(at(shingle([[-0.038, -0.002], [0.04, -0.002], [0.04, 0.002], [-0.038, 0.002]], 0.002, SR + 0.017, mt.frame, 0.0005), 0, SY + 0.07, 0, -0.05, s * 0.18, 0)); } // seam line
  l.add(at(shingle([[-0.032, -0.02], [0.032, -0.02], [0.03, 0.025], [-0.03, 0.025]], 0.009, SR + 0.02, mt.legMetal, 0.0015), -0.03 * s, -0.5, 0.0, -0.1, s * 0.1, 0)); // upper plate: under knee cap, over front shell top
  l.add(at(shingle([[-0.07, -0.02], [0.07, -0.02], [0.07, 0.02], [-0.07, 0.02]], 0.008, SR + 0.006, mt.legMetal), 0, -0.93, 0, 0, s * 0.5, 0)); // ankle cuff band over shell ends
  [[0, 0.07, 0.035], [s * 1.3, 0.06, 0.03]].forEach(([yaw, w, h]) => l.add(at(shingle([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2 - 0.006, h / 2], [-w / 2 + 0.006, h / 2]], 0.008, SR + 0.012, mt.legMetal, 0.0015), 0, -0.965, 0.0, 0, yaw, 0))); /* upper ankle plates above the foot */
  if (!olive) l.add(at(box(0.045, 0.02, 0.003, mt.tape, 0.001), 0.01 * s, -0.66, 0.066, -0.05, 0, 0.3 * s)); // tape on dark shin
  // ---- ankle: exposed frame + pistons + drum
  [-1, 1].forEach(k => l.add(at(cyl(0.006, 0.006, 0.1, mt.steel, 8), 0.03 * k, -0.97, -0.025)));
  // ---- thigh_plate (detachable): curved front shingle + lower lame overlapping knee cap
  const tp = part(`thigh_plate_${side}`, 0.015 * s, -0.22, 0.06);
  // v10 thigh stack (LEG-STUDY): large flat-faced front plate (R 0.14) -> upper hip plate overlapping its top -> lower lame over knee; dark gaps between
  const TZ = -0.14, TR = 0.14;
  tp.add(at(shingle([[-0.05, -0.15], [0.05, -0.15], [0.066, -0.11], [0.07, 0.11], [0.05, 0.13], [-0.068, 0.13], [-0.066, -0.11]], 0.012, TR, mt.legMetal, 0.002), 0, -0.01, TZ, 0, s * 0.12, 0));
  tp.add(at(shingle([[-0.074, -0.16], [0.074, -0.16], [0.076, 0.15], [-0.076, 0.15]], 0.004, TR - 0.008, mt.frame, 0.001), 0, -0.01, TZ, 0, s * 0.12, 0)); /* dark backing: deep gaps */
  tp.add(at(shingle([[-0.06, -0.035], [0.06, -0.035], [0.065, 0.035], [-0.065, 0.035]], 0.011, TR + 0.022, mt.legMetal, 0.002), 0, 0.13, TZ, -0.12, s * 0.12, 0)); /* upper plate overlaps front plate top */
  tp.add(at(shingle([[-0.045, -0.03], [0.045, -0.03], [0.05, 0.03], [-0.05, 0.03]], 0.01, TR + 0.022, mt.legMetal, 0.002), 0, -0.18, TZ, 0.18, s * 0.12, 0)); /* lower lame over knee */
  [[-0.055, 0.1], [0.055, 0.1], [-0.045, -0.13], [0.045, -0.13], [-0.05, 0.135], [0.05, 0.135]].forEach(([x, y], i) => { const q = onShingle(TR + (i > 3 ? 0.036 : 0.015), x, y, s * 0.12); bolt(tp, mt, q[0], q[1] - 0.01, q[2] + TZ, 0.0045); });
  if (side === 'R') { // olive canvas pouch with folds, flap, strap and buckle (photo-left thigh)
    const P = new THREE.Group(); P.position.set(-0.005 * s, -0.03, 0.03); P.rotation.y = s * 0.12; tp.add(P);
    P.add(at(box(0.13, 0.19, 0.065, mt.pouchOlive, 0.022), 0, -0.02, 0)); // body, soft corners
    [-0.05, -0.005, 0.03].forEach((y, i) => P.add(at(box(0.12, 0.004, 0.003, mt.pouchCrease, 0.002), 0, y - 0.04, 0.0335, 0, 0, (i - 1) * 0.06))); // fold creases
    P.add(at(box(0.136, 0.07, 0.014, mt.pouchOlive, 0.01), 0, 0.065, 0.03, -0.18, 0, 0)); // flap, angled down
    P.add(at(box(0.138, 0.006, 0.016, mt.pouchCrease, 0.002), 0, 0.033, 0.036, -0.18, 0, 0)); // flap hem
    P.add(at(box(0.016, 0.08, 0.004, mt.tape, 0.002), 0, 0.02, 0.04)); // strap
    P.add(at(box(0.022, 0.014, 0.006, mt.steel, 0.002), 0, -0.015, 0.043)); // buckle
    P.add(at(box(0.035, 0.12, 0.035, mt.pouchOlive, 0.012), 0.08 * s, -0.03, -0.005)); // side pocket
    P.add(at(box(0.128, 0.05, 0.004, mt.pouchCrease, 0.003), 0, -0.09, 0.031)); /* grime band at bottom */
    for (let i = 0; i < 11; i++) { P.add(at(box(0.006, 0.0015, 0.002, mt.stitch, 0.0005), -0.06 + i * 0.012, 0.032, 0.044, -0.18, 0, 0)); P.add(at(box(0.0015, 0.006, 0.002, mt.stitch, 0.0005), 0.06, -0.1 + i * 0.015, 0.033)); } /* stitching: flap hem + side seam */
  } else tp.add(at(box(0.075, 0.03, 0.003, mt.tape, 0.001), 0.005 * s, -0.04, 0.026, 0, s * 0.12, 0.25)); /* tape patch on front plate */
  l.add(tp);
  // ---- foot (detachable): overlapping chamfered blocks, front-over-back
  const foot = part(`foot_${side}`, 0, -1.02, 0.0); foot.rotation.x = side === 'L' ? 0.28 : -0.22; // keep sole flat
  // v10 foot (LEG-STUDY): long and low; heel -> side drum -> stacked sloping instep plates -> mid-foot -> two tiers of toe plates -> blunt claws
  const FM = mt.legMetal;
  foot.add(at(box(0.1, 0.095, 0.075, FM, 0.018), 0, -0.025, -0.06)); foot.add(at(box(0.112, 0.03, 0.085, FM, 0.01), 0, -0.062, -0.065)); // heel + heel base
  joint(foot, mt, 0.05, 0.11, 0, -0.005, -0.01); // ankle drum at the side, mid-height
  foot.add(at(box(0.11, 0.055, 0.15, FM, 0.014), 0, -0.05, 0.075)); // mid-foot base
  foot.add(at(box(0.085, 0.03, 0.09, FM, 0.01), 0, 0.015, 0.05, 0.6, 0, 0)); foot.add(at(box(0.092, 0.03, 0.085, FM, 0.01), 0, -0.015, 0.115, 0.35, 0, 0)); // stacked sloping instep plates
  foot.add(at(box(0.1, 0.045, 0.075, FM, 0.012), 0, -0.042, 0.18)); foot.add(at(box(0.096, 0.035, 0.055, FM, 0.01), 0, -0.05, 0.23)); // toe plate tiers
  [-0.025, 0.025].forEach(x => { foot.add(at(box(0.045, 0.034, 0.035, FM, 0.009), x, -0.056, 0.265)); bolt(foot, mt, x, -0.048, 0.283, 0.0035); }); // blunt claws
  [-1, 1].forEach(k => foot.add(at(box(0.026, 0.03, 0.05, FM, 0.008), k * 0.062, -0.058, 0.13))); // side lugs
  [[-0.03, 0.18], [0.03, 0.18], [-0.03, 0.06], [0.03, 0.06]].forEach(([x, z]) => bolt(foot, mt, x, z > 0.1 ? -0.032 : -0.035, z, 0.0035));
  foot.add(at(box(0.11, 0.012, 0.34, mt.rubber, 0.004), 0, -0.07, 0.1)); // sole
  l.add(foot); return l;
}

export function buildRobot() {
  const mt = MATS(); const root = new THREE.Group(); root.name = 'SIS_Robot';
  // ---- inner chassis (fixed; exposed when armor drops)
  const ch = new THREE.Group(); ch.name = 'chassis'; root.add(ch);
  const torso = box(0.2, 0.4, 0.15, mt.frame, 0.03); torso.name = 'torso_frame'; ch.add(at(torso, 0, 1.38, 0));
  { const v = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.07, 0.3, 4, 1), mt.gunShell)); v.rotation.y = Math.PI / 4; v.scale.set(1, 1, 0.62); ch.add(at(v, 0, 1.33, -0.005)); v.rotation.y = Math.PI / 4; } /* v12: deeper V-shaped torso */
  for (let i = 0; i < 5; i++) ch.add(at(box(0.22, 0.015, 0.16, mt.steel, 0.004), 0, 1.22 + i * 0.075, 0));
  const core = cyl(0.045, 0.045, 0.04, mt.amber, 16); core.name = 'power_core'; ch.add(at(core, 0, 1.4, 0.09, Math.PI / 2, 0, 0));
  ch.add(at(cyl(0.045, 0.06, 0.16, mt.frame, 14), 0, 1.11, 0)); // abdomen
  const pelvis = box(0.19, 0.11, 0.14, mt.gunmetal, 0.05); ch.add(at(wrap(0.11, 0.1, 0.014, Math.PI * 1.1, mt.gunShell, { rr: 0.6 }), 0, 0.99, 0)); pelvis.name = 'pelvis'; ch.add(at(pelvis, 0, 1.0, 0)); // rounded hip shell (v8: fixed pelvis box lost inside a comment in v7)
  [-1, 1].forEach(x => { ch.add(at(shingle([[-0.045, -0.06], [0.04, -0.075], [0.05, 0.05], [-0.05, 0.05]], 0.01, 0.12, mt.legMetal), 0, 0.93, 0, 0.12, x * 0.32, 0)); const q = onShingle(0.132, 0.03, 0.03, x * 0.32); bolt(ch, mt, q[0], 0.93 + q[1], q[2]); }); // front faulds overlapping thigh tops
  ch.add(at(box(0.2, 0.035, 0.15, mt.canvas, 0.008), 0, 1.06, 0)); // webbing belt
  ch.add(at(box(0.05, 0.05, 0.02, mt.steel, 0.005), 0, 1.06, 0.095));
  const neck = cyl(0.042, 0.05, 0.1, mt.frame, 14); neck.name = 'neck'; ch.add(at(neck, 0, 1.63, -0.01));
  [[0.08, 1], [-0.08, 0.8]].forEach(([x, k]) => cable(ch, mt.rubber, [[x * 0.5, 1.68, -0.03], [x, 1.6, -0.1], [x * 1.4, 1.35, -0.12 * k], [x, 1.1, -0.09]], 0.009));
  for (let i = 0; i < 6; i++) { const x = (i - 2.5) * 0.035; cable(ch, i % 2 ? mt.rubber : mt.frame, [[x, 1.2, 0.07], [x * 1.3, 1.12, 0.08], [x, 1.04, 0.07]], 0.006); } // belly hoses
  [-1, 1].forEach(sx => ch.add(at(cyl(0.006, 0.006, 0.35, mt.steel, 6), sx * 0.13, 1.38, -0.06)));
  // ---- armor
  const chest = part('chest_plate', 0, 1.45, 0.085);
  chest.add(at(layered(0.23, 0.27, mt.frame, mt.gunmetal, mt, { bolts: false }), 0, -0.03, -0.015)); // dark underplate, covers core
  chest.add(at(layered(0.17, 0.12, mt.gunmetal, mt.oliveDecal, mt, { t: 0.02, ch: 0.18 }), 0, 0.02, 0.04)); // olive upper plate (v12: lower, centred)
  chest.add(at(cyl(0.011, 0.011, 0.008, mt.amber, 12), -0.055, 0.01, 0.08, Math.PI / 2, 0, 0)); // amber indicator
  chest.add(at(plate(0.04, 0.04, 0.006, mt.steel, 0.2), 0.075, 0.01, 0.078)); // tag plate
  chest.add(at(plate(0.24, 0.08, 0.022, mt.gunmetal, 0.35), 0, 0.12, -0.005, -0.35, 0, 0)); // collar
  [-1, 1].forEach(x => chest.add(at(plate(0.05, 0.12, 0.015, mt.gunmetal, 0.3), x * 0.11, -0.1, 0.0, 0, x * 0.3, 0))); // side flank lames
  // canvas pouch with flap and papers, centre-low (like photo)
  chest.add(at(box(0.1, 0.1, 0.04, mt.pouch, 0.012), 0.0, -0.15, 0.035));
  chest.add(at(box(0.104, 0.03, 0.044, mt.pouch, 0.006), 0.0, -0.105, 0.038, 0.15, 0, 0));
  for (let i = 0; i < 3; i++) chest.add(at(box(0.085, 0.035, 0.004, i % 2 ? mt.tanDirty : mt.paperDirty, 0.001), (i - 1) * 0.004, -0.085, 0.03 + i * 0.006));
  chest.add(at(box(0.025, 0.32, 0.006, mt.canvas, 0.002), -0.06, -0.02, 0.06, 0, 0, -0.45)); // diagonal strap
  chest.add(at(box(0.03, 0.02, 0.008, mt.steel, 0.002), -0.08, 0.02, 0.064, 0, 0, -0.45)); // buckle
  root.add(chest);
  const back = part('back_file_carrier', 0, 1.38, -0.11); // file tray on back (Orchard carries one)
  back.add(box(0.22, 0.28, 0.08, mt.gunmetal, 0.012));
  back.add(at(box(0.28, 0.02, 0.08, mt.frame, 0.004), 0, 0.15, -0.0));
  const pr = rng(5); for (let i = 0; i < 9; i++) back.add(at(box(0.25, 0.12 + pr() * 0.04, 0.006, i % 3 ? mt.paper : mt.tan, 0.002), (pr() - 0.5) * 0.02, 0.2, -0.04 + i * 0.009, (pr() - 0.5) * 0.15, 0, 0));

  root.add(back);
  ['L', 'R'].forEach(sd => {
    const s = sd === 'L' ? 1 : -1;
    // shoulder plate now wraps the shoulder joint (pivot at joint height, not above it)
    const sp = part(`shoulder_plate_${sd}`, 0.21 * s, 1.52, 0);
    const shell = sh(new THREE.Mesh(new THREE.SphereGeometry(0.08, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.62), mt.gunmetal)); // dome (v12: smaller)
    shell.scale.set(1.05, 0.9, 1.1); sp.add(at(shell, 0.015 * s, -0.01, 0, 0, 0, -0.35 * s));
    for (let k = 0; k < 2; k++) sp.add(at(wrap(0.1 - k * 0.008, 0.045, 0.016, Math.PI * 1.3, k ? mt.frame : mt.gunShell, { rr: 0.8 }), 0.02 * s, -0.055 - k * 0.032, 0, 0, s * Math.PI / 2, -0.3 * s)); // rounded overlapping lames
    sp.add(at(plate(0.11, 0.035, 0.012, mt.canvas, 0.3), 0.01 * s, 0.035, 0.05, -0.6, 0, -0.3 * s)); // khaki trim
    bolt(sp, mt, 0.05 * s, 0.03, 0.06); bolt(sp, mt, -0.02 * s, 0.05, 0.065);

    sp.add(at(sh(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 8, 24), mt.ring)), 0.07 * s, -0.04, 0, 0, Math.PI / 2, 0));
    root.add(sp); root.add(arm(sd, mt)); root.add(leg(sd, mt));
  });
  // ---- file box carried in front (Orchard pose), held between the forearms
  const fb = part('file_box', -0.32, 0.99, 0.1); fb.rotation.set(0.05, -1.25, -0.12); fb.scale.set(1.25, 1.35, 1.3); /* v12: bigger, deeper, lower on hip */ // tucked on right hip (viewer-left, as photo)
  fb.add(at(box(0.36, 0.1, 0.22, mt.gunmetal, 0.008), 0, -0.04, 0));
  fb.add(at(box(0.34, 0.01, 0.2, mt.frame, 0.002), 0, 0.012, 0));
  const fr = rng(9); for (let i = 0; i < 16; i++) fb.add(at(box(0.012 * 0 + 0.006, 0.1 + fr() * 0.05, 0.19, [mt.paper, mt.tan, mt.olive][i % 3], 0.002), -0.16 + i * 0.02, 0.04, (fr() - 0.5) * 0.01, 0, 0, (fr() - 0.5) * 0.15));
  [-1, 1].forEach(z => fb.add(at(cyl(0.005, 0.005, 0.38, mt.steel, 6), 0, 0.07, z * 0.1, 0, 0, Math.PI / 2))); // wire rails
  [-1, 1].forEach(x => fb.add(at(cyl(0.005, 0.005, 0.1, mt.steel, 6), x * 0.18, 0.03, 0.1)));
  root.add(fb);
  // ---- head: compact box skull, olive cap, twin amber camera eyes
  const head = part('head', 0, 1.68, -0.01); head.rotation.set(0.22, 0.35, 0.12); // tilted toward scanner in left hand
  { const sk = sh(new THREE.Mesh(new THREE.SphereGeometry(0.105, 36, 24), mt.gunShell)); sk.scale.set(1.0, 0.92, 1.08); head.add(at(sk, 0, 0.085, 0)); } /* v12: bigger dark rounded skull */
  /* v12: olive cap removed (photo head is dark) */
  head.add(at(plate(0.06, 0.11, 0.015, mt.steel, 0.3), 0.088, 0.07, 0.02, 0, Math.PI / 2, 0)); // cheek plates
  head.add(at(plate(0.06, 0.11, 0.015, mt.steel, 0.3), -0.088, 0.07, 0.02, 0, -Math.PI / 2, 0));
  head.add(at(box(0.07, 0.03, 0.04, mt.frame, 0.008), 0, 0.0, 0.07)); // jaw
  head.add(at(plate(0.17, 0.05, 0.02, mt.gunmetal, 0.3), 0, 0.13, 0.095, -0.5, 0, 0)); /* dark brow visor */
  for (let i = 0; i < 4; i++) head.add(at(box(0.05, 0.004, 0.01, mt.frame, 0.001), 0, -0.005 - i * 0.008, 0.09)); // mouth grille
  cable(head, mt.rubber, [[-0.05, 0.0, -0.05], [-0.03, -0.06, -0.06], [0, -0.1, -0.02]], 0.005); cable(head, mt.rubber, [[0.05, 0.0, -0.05], [0.04, -0.07, -0.05], [0.01, -0.1, -0.02]], 0.004);
  const ear = cyl(0.045, 0.045, 0.035, mt.frame, 20); head.add(at(ear, -0.11, 0.08, 0.0, 0, 0, Math.PI / 2));
  head.add(at(sh(new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.007, 8, 24), mt.ring)), -0.13, 0.08, 0, 0, Math.PI / 2, 0));
  const eye = part('camera_eye', 0.06, 0.07, 0.075); eye.rotation.y = 0.55; eye.scale.setScalar(1.55); // big side-mounted eye
  eye.add(at(cyl(0.04, 0.045, 0.055, mt.frame, 24), 0, 0, 0.02, Math.PI / 2, 0, 0));
  eye.add(at(sh(new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.007, 8, 24), mt.ring)), 0, 0, 0.048));
  eye.add(at(cyl(0.026, 0.026, 0.006, mt.amber, 20), 0, 0, 0.049, Math.PI / 2, 0, 0));
  eye.add(at(cyl(0.005, 0.005, 0.004, mt.frame, 8), 0.0, 0, 0.053, Math.PI / 2, 0, 0)); // pupil
  eye.add(at(cyl(0.022, 0.024, 0.03, mt.frame, 16), -0.075, 0.0, 0.01, Math.PI / 2, 0, 0)); // second eye
  eye.add(at(cyl(0.014, 0.014, 0.006, mt.amber, 14), -0.075, 0.0, 0.026, Math.PI / 2, 0, 0));
  head.add(eye);
  const ant = part('antenna', -0.06, 0.16, -0.05);
  ant.add(at(cyl(0.012, 0.012, 0.03, mt.frame, 8), 0, 0.015, 0));
  ant.add(at(cyl(0.004, 0.008, 0.08, mt.tan, 6), 0, 0.07, 0));
  ant.add(at(sh(new THREE.Mesh(new THREE.ConeGeometry(0.006, 0.03, 6), mt.tan)), 0, 0.125, 0));
  head.add(ant); root.add(head);
  // ground the posed robot: lowest point at y=0
  root.position.y = 0.09554; // pinned (v8) so lower-body edits can't shift the upper body; was auto-grounded
  return root;
}
export const PART_IDS = ['head', 'camera_eye', 'antenna', 'chest_plate', 'back_file_carrier',
  'shoulder_plate_L', 'shoulder_plate_R', 'arm_L', 'arm_R', 'hand_L', 'hand_R',
  'thigh_plate_L', 'thigh_plate_R', 'leg_L', 'leg_R', 'foot_L', 'foot_R', 'file_box'];
