import * as THREE from 'three'; import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { buildRobot, PART_IDS } from '../src/robot.js';
window.__export = async () => {
  const r = buildRobot(); r.updateMatrixWorld(true);
  const parts = PART_IDS.map(id => { const o = r.getObjectByName(id); let p = o.parent; while (p && !p.userData.partId && p !== r) p = p.parent;
    const bb = new THREE.Box3().setFromObject(o), sz = bb.getSize(new THREE.Vector3());
    return { id, parent: p && p.userData.partId ? p.userData.partId : 'chassis', pivot: o.position.toArray().map(v => +v.toFixed(4)),
      rotation: o.rotation.toArray().slice(0, 3), collider: { type: 'box', size: sz.toArray().map(v => +v.toFixed(3)) },
      children: o.children.filter(c => c.userData.partId).map(c => c.name), catalogMapped: false }; });
  let tris = 0; r.traverse(o => { if (o.isMesh) tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  const buf = await new GLTFExporter().parseAsync(r, { binary: true });
  let s = ''; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode(...u.subarray(i, i + 8192));
  return { glb: btoa(s), manifest: { model: 'model/robot.glb', units: 'meters', up: '+Y', triangles: tris, parts } };
};
