import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { ExteriorMaterials } from './materials';

/** Complete garden enclosure; the open gate lines up with the stepping stones. */
export function buildBoundary(materials: ExteriorMaterials): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Garden fence and wooden gate';
  const left = -4.55;
  const right = 4.55;
  const rear = -3.4;
  const front = 6.65;
  const gateCenter = -0.87;
  const gateHalf = 0.72;
  const profile = new THREE.Shape();
  profile.moveTo(-0.045, 0);
  profile.lineTo(0.045, 0);
  profile.lineTo(0.045, 0.72);
  profile.quadraticCurveTo(0, 0.84, -0.045, 0.72);
  profile.closePath();
  const picketGeometry = new THREE.ExtrudeGeometry(profile, { depth: 0.045, bevelEnabled: false });
  const transforms: THREE.Matrix4[] = [];
  const dummy = new THREE.Object3D();
  const railGeometry = new THREE.BoxGeometry(1, 0.055, 0.055);
  const segment = (ax: number, az: number, bx: number, bz: number) => {
    const length = Math.hypot(bx - ax, bz - az);
    const yaw = -Math.atan2(bz - az, bx - ax);
    const count = Math.max(1, Math.ceil(length / 0.20));
    for (let i = 0; i <= count; i++) {
      dummy.position.set(THREE.MathUtils.lerp(ax, bx, i / count), 0, THREE.MathUtils.lerp(az, bz, i / count));
      dummy.rotation.set(0, yaw, 0);
      dummy.updateMatrix();
      transforms.push(dummy.matrix.clone());
    }
    for (const y of [0.22, 0.57]) {
      const rail = new THREE.Mesh(railGeometry, materials.trim);
      rail.position.set((ax + bx) / 2, y, (az + bz) / 2);
      rail.rotation.y = yaw;
      rail.scale.x = length;
      rail.castShadow = true;
      rail.receiveShadow = true;
      group.add(rail);
    }
  };
  segment(left, rear, right, rear);
  segment(left, rear, left, front);
  segment(right, rear, right, front);
  segment(left, front, gateCenter - gateHalf, front);
  segment(gateCenter + gateHalf, front, right, front);
  const fence = new THREE.InstancedMesh(picketGeometry, materials.trim, transforms.length);
  transforms.forEach((matrix, index) => fence.setMatrixAt(index, matrix));
  fence.castShadow = true;
  fence.receiveShadow = true;
  group.add(fence);

  const postGeometry = new RoundedBoxGeometry(0.15, 1.04, 0.15, 2, 0.025);
  const capGeometry = new RoundedBoxGeometry(0.21, 0.06, 0.21, 2, 0.02);
  for (const x of [gateCenter - gateHalf, gateCenter + gateHalf]) {
    const post = new THREE.Mesh(postGeometry, materials.wood);
    post.position.set(x, 0.52, front);
    post.castShadow = true;
    post.receiveShadow = true;
    group.add(post);
    const cap = new THREE.Mesh(capGeometry, materials.wood);
    cap.position.set(x, 1.05, front);
    group.add(cap);
  }
  // Open both leaves far enough to keep the full stepping-stone width clear.
  const slatGeometry = new RoundedBoxGeometry(0.09, 1, 0.055, 2, 0.018);
  const braceGeometry = new RoundedBoxGeometry(1, 0.055, 0.06, 2, 0.012);
  for (const side of [-1, 1]) {
    const leaf = new THREE.Group();
    leaf.position.set(gateCenter + side * gateHalf, 0, front);
    leaf.rotation.y = -side * 1.25;
    const width = gateHalf - 0.07;
    for (let i = 0; i < 6; i++) {
      const u = (i + 0.5) / 6;
      const height = 0.76 + 0.16 * Math.sin(u * Math.PI);
      const slat = new THREE.Mesh(slatGeometry, materials.wood);
      slat.scale.y = height;
      slat.position.set(-side * u * width, 0.08 + height / 2, 0);
      slat.castShadow = true;
      slat.receiveShadow = true;
      leaf.add(slat);
    }
    for (const y of [0.27, 0.64]) {
      const rail = new THREE.Mesh(braceGeometry, materials.wood);
      rail.position.set(-side * width / 2, y, -0.055);
      rail.scale.x = width;
      leaf.add(rail);
    }
    const brace = new THREE.Mesh(braceGeometry, materials.wood);
    brace.position.set(-side * width / 2, 0.46, -0.06);
    brace.rotation.z = -side * Math.atan2(0.37, width);
    brace.scale.x = Math.hypot(width, 0.37);
    leaf.add(brace);
    group.add(leaf);
  }
  return group;
}
