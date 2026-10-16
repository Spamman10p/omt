import * as THREE from 'three'; import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
function start(){
const el = document.getElementById('stage'), info = document.getElementById('info'), list = document.getElementById('parts');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const events = new EventTarget(); // emits 'part-damaged', 'part-detached', 'repaired'
function fail(msg) { document.body.classList.add('fallback'); info.textContent = 'Fallback image: ' + msg; window.__robot = { failed: msg }; }
let renderer; try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch (e) { fail('WebGL unavailable'); return; }
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); el.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xc9c9c6);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.75; // reflections so bare metal isn't black
const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 50); cam.position.set(1.6, 1.5, 2.6);
const ctl = new OrbitControls(cam, renderer.domElement); ctl.target.set(0, 0.95, 0); ctl.enableDamping = !reduced;
ctl.minDistance = 1.2; ctl.maxDistance = 5; ctl.maxPolarAngle = Math.PI * 0.49; ctl.enablePan = false;
scene.add(new THREE.HemisphereLight(0xf4f4f2, 0x8a8782, 1.6));
const sun = new THREE.DirectionalLight(0xfff2dd, 2.5); sun.position.set(-2, 4, 3); const fill = new THREE.DirectionalLight(0xffffff, 0.8); fill.position.set(3, 2, 1); scene.add(fill); const rim = new THREE.DirectionalLight(0xf4f6ff, 3.2); rim.position.set(1.5, 3, -4); scene.add(rim); const rim2 = new THREE.DirectionalLight(0xffffff, 1.6); rim2.position.set(-3, 1.5, -2); scene.add(rim2); /* v12 studio rim lights */ renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.5; sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 6; sun.shadow.bias = -0.0005;
Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2 }); scene.add(sun);
const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 48), new THREE.MeshStandardMaterial({ color: 0xc9c9c6, roughness: 1, metalness: 0 })); scene.fog = new THREE.Fog(0xc9c9c6, 5, 14) /* seamless studio cyc */;
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
function resize() { const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h); cam.aspect = w / h; cam.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

const parts = {}; const bodies = []; let robot, manifest, hovered = null;
const st = id => parts[id];
const SCORCH = [1, 0.72, 0.45];
function setDamage(p, lvl) { // realistic: darken/scorch, faint ember glow at level 2
  p.meshes.forEach(m => { const o = m.userData.orig; m.material.color.copy(o.color).multiplyScalar(SCORCH[lvl]).lerp(new THREE.Color(0x2a2118), lvl * 0.12);
    m.material.roughness = Math.min(1, o.rough + lvl * 0.15); m.material.emissive.copy(lvl === 2 ? new THREE.Color(0x140500) : o.emissive); });
}
// spark bursts (pooled; capped so repeated hits cannot leak)
const sparkGeo = new THREE.BufferGeometry(), SP = 60; sparkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SP * 3), 3));
const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xffb347, size: 0.02, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
sparks.name = 'sparks'; sparks.frustumCulled = false; sparks.visible = false; scene.add(sparks); const sparkV = []; let sparkT = 0;
function burst(obj, n) { if (reduced) return; const c = new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3()); const a = sparkGeo.attributes.position.array;
  for (let i = 0; i < SP; i++) { a.set(i < n ? [c.x, c.y, c.z] : [0, -9, 0], i * 3); sparkV[i] = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.8 + 0.2, Math.random() - 0.5).multiplyScalar(2.5); }
  sparkGeo.attributes.position.needsUpdate = true; sparks.visible = true; sparkT = 0.6; window.__robot && window.__robot.sparkBursts++; }
function hit(id) {
  const p = st(id); if (!p || p.detached || ancestorDetached(p)) return false;
  p.hits++; p.wobble = reduced ? 0 : 0.35;
  if (p.hits === 1) { setDamage(p, 1); burst(p.obj, 12); }
  if (p.hits === 2) { setDamage(p, 2); burst(p.obj, 30); p.obj.rotation.z += 0.12 * (p.obj.position.x >= 0 ? 1 : -1); p.obj.position.y -= 0.01; }
  if (p.hits >= 3) { burst(p.obj, 60); detach(p); }
  events.dispatchEvent(new CustomEvent('part-damaged', { detail: { id, hits: p.hits } })); updateList(); return true;
}
function ancestorDetached(p) { let a = p.obj.parent; while (a) { if (a.userData.partId && parts[a.userData.partId]?.detached) return true; a = a.parent; } return false; }
function detach(p) {
  if (p.detached) return; p.detached = true; scene.attach(p.obj);
  const out = p.obj.getWorldPosition(new THREE.Vector3()).setY(0).normalize();
  const body = { p, v: new THREE.Vector3(out.x * 0.8, 1.2, Math.max(out.z, 0.3) * 0.8), w: new THREE.Vector3(Math.random() * 4 - 2, Math.random() * 4 - 2, Math.random() * 4 - 2), floorHits: 0 };
  if (reduced) { body.v.set(out.x * 0.3, 0, 0.3); body.w.set(0, 0, 0); }
  bodies.push(body); events.dispatchEvent(new CustomEvent('part-detached', { detail: { id: p.id } }));
}
function repair() {
  bodies.length = 0;
  // reattach parents before children (manifest order = parents first)
  manifest.parts.forEach(m => { const p = parts[m.id]; p.homeParent.add(p.obj); p.obj.position.copy(p.home.pos); p.obj.quaternion.copy(p.home.quat); p.obj.scale.copy(p.home.scale);
    p.hits = 0; p.detached = false; p.wobble = 0; setDamage(p, 0); });
  events.dispatchEvent(new Event('repaired')); updateList();
}
const box3 = new THREE.Box3();
function step(dt) {
  if (sparkT > 0) { sparkT -= dt; const a = sparkGeo.attributes.position.array; for (let i = 0; i < SP; i++) { const v = sparkV[i]; v.y -= 9.8 * dt; a[i * 3] += v.x * dt; a[i * 3 + 1] = Math.max(0.005, a[i * 3 + 1] + v.y * dt); a[i * 3 + 2] += v.z * dt; }
    sparkGeo.attributes.position.needsUpdate = true; sparks.material.opacity = Math.max(0, sparkT / 0.6); if (sparkT <= 0) sparks.visible = false; }
  for (const b of bodies) { const o = b.p.obj; b.v.y -= 9.8 * dt; o.position.addScaledVector(b.v, dt);
    o.rotation.x += b.w.x * dt; o.rotation.y += b.w.y * dt; o.rotation.z += b.w.z * dt; o.updateMatrixWorld(true);
    box3.setFromObject(o); if (box3.min.y < 0) { o.position.y -= box3.min.y; if (b.v.y < 0) { b.v.y *= -0.3; b.floorHits++; } b.v.x *= 0.8; b.v.z *= 0.8; b.w.multiplyScalar(0.7);
      if (Math.abs(b.v.y) < 0.2) b.v.y = 0; } b.restingY = Math.max(box3.min.y, 0); }
  for (const id in parts) { const p = parts[id]; if (p.wobble > 0 && !p.detached) { p.wobble = Math.max(0, p.wobble - dt);
    p.obj.position.x = p.basePosX() + Math.sin(p.wobble * 60) * 0.006 * (p.wobble / 0.35); } }
}
// ---- tap detection: ignore drags, pinches, long presses
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); const ptrs = new Map(); let multi = false;
const cv = renderer.domElement;
function pick(x, y) { const r = cv.getBoundingClientRect(); ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, cam);
  for (const h of ray.intersectObject(scene, true)) { let o = h.object; while (o && !o.userData.partId) o = o.parent; if (o) return o.userData.partId; } return null; }
cv.addEventListener('pointerdown', e => { ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now(), moved: false }); if (ptrs.size > 1) multi = true; });
cv.addEventListener('pointermove', e => { const s = ptrs.get(e.pointerId); if (s && Math.hypot(e.clientX - s.x, e.clientY - s.y) > 8) s.moved = true;
  if (!ptrs.size) { const id = pick(e.clientX, e.clientY); if (id !== hovered) { hovered = id; info.textContent = id ? id.replace(/_/g, ' ') + ` (${parts[id].hits}/3)` : 'Tap a part 3×'; } } });
function end(e, cancel) { const s = ptrs.get(e.pointerId); ptrs.delete(e.pointerId); if (!s) return; const wasMulti = multi; if (!ptrs.size) multi = false;
  if (cancel || wasMulti || s.moved || performance.now() - s.t > 500) { window.__robot.ignored++; return; }
  const id = pick(e.clientX, e.clientY); if (id) { hit(id); info.textContent = `${id.replace(/_/g, ' ')} ${parts[id].hits}/3`; } }
cv.addEventListener('pointerup', e => end(e, false)); cv.addEventListener('pointercancel', e => end(e, true));
// ---- accessible list
function updateList() { list.querySelectorAll('button[data-id]').forEach(b => { const p = parts[b.dataset.id]; b.textContent = `${b.dataset.id.replace(/_/g, ' ')} — ${p.detached ? 'detached' : p.hits + '/3'}`; }); }
document.getElementById('repair').onclick = repair;

new GLTFLoader().load('model/robot.glb', async g => { try {
  manifest = await (await fetch('manifest.json')).json(); robot = g.scene; scene.add(robot);
  robot.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } if (o.userData.partId === undefined && manifest.parts.some(m => m.id === o.name)) o.userData.partId = o.name; });
  for (const m of manifest.parts) { const obj = robot.getObjectByName(m.id); if (!obj) { fail('missing part ' + m.id); return; }
    const meshes = []; obj.traverse(o => { if (o.isMesh) { let q = o.parent; while (q && !q.userData.partId) q = q.parent; if (q === obj) { o.material = o.material.clone(); o.userData.orig = { color: o.material.color.clone(), emissive: o.material.emissive.clone(), rough: o.material.roughness }; meshes.push(o); } } });
    const p = parts[m.id] = { id: m.id, obj, meshes, hits: 0, detached: false, wobble: 0, homeParent: obj.parent, home: { pos: obj.position.clone(), quat: obj.quaternion.clone(), scale: obj.scale.clone() } };
    p.basePosX = () => p.home.pos.x;
    const b = document.createElement('button'); b.dataset.id = m.id; b.onclick = () => hit(m.id); list.appendChild(b); }
  updateList(); info.textContent = 'Tap a part 3×'; window.__robot.ready = true;
} catch(e) { fail('model or manifest could not load'); } }, undefined, e => fail('model load failed'));
window.__robot = { ready: false, ignored: 0, sparkBursts: 0, ctl, hit, repair, events, parts, bodies, scene, cam, pick,
  project(id) { const v = parts[id].obj.getWorldPosition(new THREE.Vector3()); const p = parts[id]; const bb = new THREE.Box3().setFromObject(p.meshes.length ? p.meshes[0] : p.obj); bb.getCenter(v); v.project(cam); const r = cv.getBoundingClientRect();
    return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; },
  sceneCount: () => scene.children.length, setView(az) { const d = 4.6; cam.position.set(Math.sin(az) * d, 1.25, Math.cos(az) * d); ctl.update(); } };
let active=true;
window.__robot.setActive=value=>{active=!!value;};
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => { const dt = Math.min(clock.getDelta(), 1 / 30); if(!active||document.hidden)return; step(dt); ctl.update(); renderer.render(scene, cam); });

}
start();
