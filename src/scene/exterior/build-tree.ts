import * as THREE from 'three';
import type { ExteriorMaterials } from './materials';

export interface TreeBuildResult {
  group: THREE.Group;
  swayTargets: THREE.Object3D[];
}

const canopyMassGeometry = new THREE.IcosahedronGeometry(1, 2);
const leafShape = new THREE.Shape();
leafShape.moveTo(0, 0);
leafShape.bezierCurveTo(-0.12, 0.16, -0.19, 0.43, 0, 0.62);
leafShape.bezierCurveTo(0.19, 0.43, 0.12, 0.16, 0, 0);
const leafGeometry = new THREE.ExtrudeGeometry(leafShape, {
  depth: 0.018,
  bevelEnabled: true,
  bevelSegments: 1,
  steps: 1,
  bevelSize: 0.008,
  bevelThickness: 0.008,
});

export function buildTree(materials: ExteriorMaterials, windowTarget: THREE.Vector3): TreeBuildResult {
  const group = new THREE.Group();
  const swayTargets: THREE.Object3D[] = [];

  // Curved trunk and limbs have tapered, botanical silhouettes rather than the
  // straight cylinders used in the first blockout.
  addBranch(group, materials.wood, [
    [2.65, 0.03, 0.16], [2.7, 1.0, 0.12], [2.58, 2.05, 0.05], [2.7, 3.12, 0.14], [2.58, 4.05, 0.3], [2.25, 4.68, 0.78],
  ], [0.27, 0.22, 0.175, 0.13, 0.075, 0.035]);

  addBranch(group, materials.wood, [
    [2.68, 2.48, 0.5], [2.45, 3.35, 1.05], [2.0, 4.0, 1.6], [1.35, 4.48, 1.9], [0.78, 4.62, 1.95],
  ], [0.15, 0.12, 0.095, 0.07, 0.035]);
  addBranch(group, materials.wood, [
    [2.68, 2.9, 0.45], [3.02, 3.45, 1.05], [3.2, 4.1, 1.55], [3.06, 4.72, 1.75],
  ], [0.13, 0.105, 0.07, 0.035]);
  addBranch(group, materials.wood, [
    [2.56, 3.62, 0.7], [2.18, 4.05, 1.45], [1.78, 4.33, 1.9],
  ], [0.09, 0.06, 0.025]);

  const windowX = windowTarget.x;
  const windowY = windowTarget.y;
  // Keep the glazing readable: foliage follows the top and outer edge of the
  // window instead of sitting in front of its panes.
  const canopy = [
    { x: windowX + 1.95, y: windowY + 1.0, z: 1.86, sx: 0.8, sy: 0.34, sz: 0.27 },
    { x: windowX + 2.48, y: windowY + 0.54, z: 1.88, sx: 0.49, sy: 0.68, sz: 0.28 },
    { x: windowX + 2.5, y: windowY - 0.13, z: 1.82, sx: 0.45, sy: 0.47, sz: 0.26 },
  ];

  for (let index = 0; index < canopy.length; index++) {
    const data = canopy[index];
    const cluster = new THREE.Group();
    cluster.position.set(data.x, data.y, data.z);
    const massMaterial = index === 1 ? materials.foliageLight : materials.foliage;
    const mass = new THREE.Mesh(canopyMassGeometry, massMaterial);
    mass.scale.set(data.sx, data.sy, data.sz);
    mass.castShadow = false;
    mass.receiveShadow = true;
    cluster.add(mass);
    const leafCount = 28;
    for (let leaf = 0; leaf < leafCount; leaf++) {
      const angle = leaf * 2.399 + index * 0.43;
      const radius = Math.sqrt((leaf + 0.5) / leafCount);
      const blade = new THREE.Mesh(
        leafGeometry,
        [materials.foliageLight, materials.foliage, materials.foliage][(leaf + index) % 3],
      );
      blade.position.set(
        Math.cos(angle) * radius * data.sx * 0.96,
        Math.sin(angle) * radius * data.sy * 0.96,
        Math.cos(angle * 1.7) * data.sz * 0.1 + data.sz * 1.18,
      );
      blade.rotation.z = angle - Math.PI / 2 + (leaf % 3 - 1) * 0.18;
      blade.rotation.y = (leaf % 2 ? -1 : 1) * (0.22 + (leaf % 4) * 0.11);
      blade.scale.setScalar(0.3 + (leaf % 3) * 0.035);
      blade.castShadow = false;
      blade.receiveShadow = true;
      cluster.add(blade);
    }
    group.add(cluster);
    swayTargets.push(cluster);
  }

  return { group, swayTargets };
}

function addBranch(
  group: THREE.Group,
  material: THREE.Material,
  points: Array<[number, number, number]>,
  radii: number[],
): void {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const segments = 28;
  const radialSegments = 8;
  const frames = curve.computeFrenetFrames(segments, false);
  const vertices: number[] = [];
  const indices: number[] = [];
  for (let segment = 0; segment <= segments; segment++) {
    const t = segment / segments;
    const point = curve.getPointAt(t);
    const radiusPosition = t * (radii.length - 1);
    const radiusIndex = Math.min(radii.length - 2, Math.floor(radiusPosition));
    const radiusBlend = radiusPosition - radiusIndex;
    const radius = THREE.MathUtils.lerp(radii[radiusIndex], radii[radiusIndex + 1], radiusBlend);
    for (let side = 0; side <= radialSegments; side++) {
      const angle = (side / radialSegments) * Math.PI * 2;
      const normal = frames.normals[segment].clone().multiplyScalar(Math.cos(angle));
      const binormal = frames.binormals[segment].clone().multiplyScalar(Math.sin(angle));
      const vertex = point.clone().addScaledVector(normal, radius).addScaledVector(binormal, radius);
      vertices.push(vertex.x, vertex.y, vertex.z);
    }
  }
  for (let segment = 0; segment < segments; segment++) {
    for (let side = 0; side < radialSegments; side++) {
      const a = segment * (radialSegments + 1) + side;
      const b = a + radialSegments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const branch = new THREE.Mesh(geometry, material);
  branch.castShadow = true;
  branch.receiveShadow = true;
  group.add(branch);

}
