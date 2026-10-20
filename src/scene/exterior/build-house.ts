import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { ExteriorMaterials } from './materials';

export interface HouseBuildResult {
  group: THREE.Group;
  windowTarget: THREE.Vector3;
}

const box = (width: number, height: number, depth: number, radius = 0.04) =>
  new RoundedBoxGeometry(width, height, depth, 3, radius);

export function buildHouse(materials: ExteriorMaterials): HouseBuildResult {
  const group = new THREE.Group();

  // A clear plinth, ground floor, belt course and upper floor make the two-storey
  // silhouette readable even in the establishing view.
  addMesh(group, box(4.72, 0.24, 3.55, 0.045), materials.trim, [0, 0.13, 0], true);
  addMesh(group, box(4.42, 2.35, 3.3, 0.035), materials.plaster, [0, 1.47, 0], true);
  addMesh(group, box(4.52, 0.11, 3.4, 0.025), materials.trim, [0, 2.68, 0], true);
  addMesh(group, box(4.25, 1.72, 3.22, 0.035), materials.plaster, [0, 3.62, 0], true);

  const front = 1.64;
  addGroundFloorWindow(group, materials, -1.56, 1.48, front);
  addGroundFloorWindow(group, materials, 1.34, 1.48, front);
  for (const x of [-2.08, 2.08]) {
    addMesh(group, box(0.08, 3.9, 0.1, 0.025), materials.trim, [x, 2.3, front + 0.055]);
  }
  addSideWindow(group, materials, 2.2, 1.52, -0.55);
  addSideWindow(group, materials, 2.14, 3.56, -0.55);

  // Slightly off-centre panel door, with inset panels and a small porch canopy.
  const doorX = -0.3;
  addMesh(group, box(0.96, 1.91, 0.12, 0.045), materials.trim, [doorX, 1.23, front + 0.035]);
  addMesh(group, box(0.82, 1.69, 0.08, 0.035), materials.wood, [doorX, 1.16, front + 0.095], true);
  addMesh(group, box(0.59, 0.48, 0.025, 0.018), materials.trim, [doorX, 1.62, front + 0.145]);
  addMesh(group, box(0.59, 0.62, 0.025, 0.018), materials.trim, [doorX, 0.88, front + 0.145]);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), materials.brass);
  knob.position.set(doorX + 0.27, 1.12, front + 0.18);
  group.add(knob);
  addMesh(group, box(1.42, 0.13, 0.82, 0.06), materials.roof, [doorX, 2.26, front + 0.36], true);
  addMesh(group, box(1.5, 0.09, 0.88, 0.035), materials.trim, [doorX, 2.18, front + 0.36]);

  // Gable face sits behind the pitched roof and gives the second floor a house-like
  // termination instead of a flat box under two floating roof strips.
  const gableShape = new THREE.Shape();
  gableShape.moveTo(-2.18, 4.42);
  gableShape.lineTo(2.18, 4.42);
  gableShape.lineTo(0, 5.34);
  gableShape.closePath();
  const gable = new THREE.Mesh(
    new THREE.ExtrudeGeometry(gableShape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.025,
      bevelThickness: 0.025,
    }),
    materials.plaster,
  );
  gable.position.z = 1.48;
  gable.castShadow = true;
  gable.receiveShadow = true;
  group.add(gable);

  // Small attic vent softens the blank gable plane and gives the roofline a
  // recognizable house detail at the establishing distance.
  const ventX = -0.62;
  const ventY = 4.86;
  const ventOuter = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), materials.trim);
  ventOuter.position.set(ventX, ventY, front + 0.055);
  group.add(ventOuter);
  const ventInner = new THREE.Mesh(new THREE.CircleGeometry(0.115, 20), materials.wood);
  ventInner.position.set(ventX, ventY, front + 0.061);
  group.add(ventInner);
  for (let slat = -1; slat <= 1; slat++) {
    addMesh(group, box(0.16, 0.018, 0.015, 0.006), materials.trim, [ventX, ventY + slat * 0.042, front + 0.073]);
  }

  // Paired, deep eaves with softened edges. Their slope and overhang read clearly
  // from the three-quarter camera without turning into a cone cap.
  addMesh(group, box(2.72, 0.24, 3.72, 0.07), materials.roof, [-1.22, 4.83, 0], true, 0.38);
  addMesh(group, box(2.72, 0.24, 3.72, 0.07), materials.roof, [1.22, 4.83, 0], true, -0.38);
  addMesh(group, box(0.22, 0.18, 3.79, 0.07), materials.trim, [0, 5.31, 0], true);
  addMesh(group, box(2.62, 0.1, 3.79, 0.035), materials.trim, [-1.24, 4.83, 0], true, 0.38);
  addMesh(group, box(2.62, 0.1, 3.79, 0.035), materials.trim, [1.24, 4.83, 0], true, -0.38);

  const chimneyX = -1.45;
  const chimneyZ = -0.62;
  addMesh(group, box(0.38, 0.88, 0.46, 0.035), materials.plaster, [chimneyX, 5.12, chimneyZ], true);
  addMesh(group, box(0.48, 0.12, 0.56, 0.035), materials.trim, [chimneyX, 5.6, chimneyZ], true);
  addMesh(group, box(0.2, 0.2, 0.035, 0.015), materials.wood, [chimneyX, 5.36, chimneyZ + 0.247]);

  const windowX = 1.18;
  const windowY = 3.62;
  addUpperWindow(group, materials, windowX, windowY, front);

  const windowTarget = new THREE.Vector3(windowX, windowY, front + 0.28);
  return { group, windowTarget };
}

function addGroundFloorWindow(
  group: THREE.Group,
  materials: ExteriorMaterials,
  x: number,
  y: number,
  front: number,
): void {
  addMesh(group, box(0.9, 0.99, 0.13, 0.025), materials.trim, [x, y, front + 0.04]);
  addMesh(group, box(0.72, 0.81, 0.045, 0.02), materials.interiorGlow, [x, y, front + 0.09]);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.81), materials.glass);
  glass.position.set(x, y, front + 0.12);
  group.add(glass);
  addMesh(group, box(0.055, 0.86, 0.07, 0.015), materials.wood, [x, y, front + 0.15]);
  addMesh(group, box(0.78, 0.055, 0.07, 0.015), materials.wood, [x, y, front + 0.15]);
  addMesh(group, box(1.02, 0.09, 0.26, 0.03), materials.trim, [x, y - 0.55, front + 0.16]);
}

function addSideWindow(
  group: THREE.Group,
  materials: ExteriorMaterials,
  x: number,
  y: number,
  z: number,
): void {
  addMesh(group, box(0.13, 1.08, 0.92, 0.04), materials.wood, [x + 0.025, y, z]);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.86), materials.glass);
  pane.rotation.y = Math.PI / 2;
  pane.position.set(x + 0.1, y, z);
  group.add(pane);
  addMesh(group, box(0.11, 0.92, 0.075, 0.025), materials.trim, [x + 0.13, y, z]);
  addMesh(group, box(0.11, 0.075, 0.78, 0.025), materials.trim, [x + 0.13, y, z]);
  addMesh(group, box(0.25, 0.11, 1.1, 0.04), materials.trim, [x + 0.12, y - 0.59, z]);
}

function addUpperWindow(
  group: THREE.Group,
  materials: ExteriorMaterials,
  x: number,
  y: number,
  front: number,
): void {
  const width = 1.66;
  const height = 1.16;
  addMesh(group, box(width + 0.24, height + 0.22, 0.11, 0.035), materials.trim, [x, y, front + 0.035]);
  addMesh(group, box(width, height, 0.04, 0.018), materials.interiorGlow, [x, y, front + 0.07]);

  for (const paneX of [x - width * 0.245, x + width * 0.245]) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.45, height * 0.85), materials.glass);
    pane.position.set(paneX, y, front + 0.14);
    group.add(pane);
  }

  // Folded fabric panels are visible through the glass and leave both casements legible.
  addFoldedCurtain(group, materials.curtain, x - 0.65, y + 0.015, front + 0.11, 0.32, 0.99);
  addFoldedCurtain(group, materials.curtain, x + 0.65, y + 0.015, front + 0.11, 0.32, 0.99);

  const frameZ = front + 0.2;
  addMesh(group, box(width + 0.2, 0.075, 0.13, 0.025), materials.trim, [x, y + height * 0.5 + 0.025, frameZ]);
  addMesh(group, box(width + 0.26, 0.1, 0.22, 0.035), materials.trim, [x, y - height * 0.5 - 0.045, frameZ + 0.04], true);
  addMesh(group, box(0.075, height, 0.13, 0.02), materials.trim, [x - width * 0.5, y, frameZ]);
  addMesh(group, box(0.075, height, 0.13, 0.02), materials.trim, [x + width * 0.5, y, frameZ]);
  addMesh(group, box(0.06, height * 0.88, 0.13, 0.018), materials.trim, [x, y, frameZ + 0.015]);
  addMesh(group, box(width * 0.91, 0.05, 0.12, 0.016), materials.trim, [x, y, frameZ + 0.015]);

  for (const shutterX of [x - width * 0.5 - 0.2, x + width * 0.5 + 0.2]) {
    addMesh(group, box(0.24, 1.1, 0.09, 0.025), materials.shutter, [shutterX, y, front + 0.13], true);
    for (let slat = 0; slat < 4; slat++) {
      addMesh(group, box(0.19, 0.035, 0.025, 0.01), materials.foliageDeep, [shutterX, y - 0.37 + slat * 0.24, front + 0.19]);
    }
  }

  // A tiny brass latch catches the warm light at the meeting edge.
  const latch = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), materials.brass);
  latch.position.set(x + 0.035, y - 0.04, frameZ + 0.1);
  group.add(latch);
}

function addFoldedCurtain(
  group: THREE.Group,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
): void {
  const columns = 8;
  const rows = 4;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    for (let col = 0; col <= columns; col++) {
      const u = col / columns;
      const fold = Math.sin(u * Math.PI * 4) * 0.018;
      positions.push((u - 0.5) * width, (0.5 - v) * height, fold);
    }
  }
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const a = row * (columns + 1) + col;
      const b = a + columns + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const curtain = new THREE.Mesh(geometry, material);
  curtain.position.set(x, y, z);
  group.add(curtain);
}

function addMesh(
  group: THREE.Group,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
  castShadow = false,
  rotationZ = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.z = rotationZ;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}
