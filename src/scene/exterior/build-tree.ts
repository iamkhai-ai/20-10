import * as THREE from 'three';
import type { ExteriorMaterials } from './materials';

export interface TreeBuildResult {
  group: THREE.Group;
  swayTargets: THREE.Object3D[];
}

export function buildTree(materials: ExteriorMaterials, windowTarget: THREE.Vector3): TreeBuildResult {
  const group = new THREE.Group();
  const swayTargets: THREE.Object3D[] = [];

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.34, 4.6, 12), materials.wood);
  trunk.position.set(2.35, 2.3, 0.35);
  trunk.castShadow = true;
  group.add(trunk);

  const branchData = [
    { pos: [1.95, 3.5, 0.55], rot: [0.2, 0, -0.75], size: [0.12, 0.12, 1.8] },
    { pos: [1.75, 4.0, 0.35], rot: [0.1, 0, -1.05], size: [0.1, 0.1, 1.5] },
    { pos: [2.05, 3.0, 0.75], rot: [-0.15, 0, -0.55], size: [0.1, 0.1, 1.3] },
    { pos: [2.55, 3.7, 0.2], rot: [0.25, 0, 0.65], size: [0.1, 0.1, 1.4] },
  ] as const;

  for (const data of branchData) {
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(data.size[0] * 0.5, data.size[0] * 0.8, data.size[2], 8), materials.wood);
    branch.position.set(data.pos[0], data.pos[1], data.pos[2]);
    branch.rotation.set(data.rot[0], data.rot[1], data.rot[2]);
    branch.castShadow = true;
    group.add(branch);
  }

  const foliagePositions = [
    [1.55, 4.35, 0.55],
    [1.95, 4.75, 0.35],
    [2.35, 4.95, 0.2],
    [2.75, 4.55, 0.45],
    [1.75, 3.95, 0.85],
    [2.25, 4.2, 0.9],
    [2.65, 4.05, 0.7],
  ];

  for (const [x, y, z] of foliagePositions) {
    const cluster = new THREE.Group();
    cluster.position.set(x, y, z);
    const leafCount = 5;
    for (let i = 0; i < leafCount; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.28 + (i % 3) * 0.08, 10, 8), materials.foliage);
      leaf.position.set((i - 2) * 0.18, (i % 2) * 0.12 - 0.06, (i % 3) * 0.16 - 0.16);
      leaf.scale.set(1.2, 0.75, 1.0);
      leaf.castShadow = true;
      cluster.add(leaf);
    }
    group.add(cluster);
    swayTargets.push(cluster);
  }

  // Keep the tree from obscuring the window by pushing foliage to the right/top.
  void windowTarget;
  return { group, swayTargets };
}
