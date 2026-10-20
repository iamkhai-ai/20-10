import * as THREE from 'three';
import { createExteriorMaterials } from './materials';
import { buildHouse } from './build-house';
import { buildTree } from './build-tree';
import { buildGarden } from './build-garden';

export interface CameraPose {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export interface CameraPosePair {
  intro: CameraPose;
  arrival: CameraPose;
}

export interface ExteriorBuildResult {
  group: THREE.Group;
  windowTarget: THREE.Vector3;
  swayTargets: THREE.Object3D[];
  cameraPoses: (aspect: number) => CameraPosePair;
}

export function buildExterior(): ExteriorBuildResult {
  const materials = createExteriorMaterials();
  const houseResult = buildHouse(materials);
  const treeResult = buildTree(materials, houseResult.windowTarget);
  const garden = buildGarden(materials);

  const group = new THREE.Group();
  group.add(garden);
  houseResult.group.position.set(-0.6, 0, 0);
  group.add(houseResult.group);
  treeResult.group.position.set(-0.6, 0, 0);
  group.add(treeResult.group);

  const windowTarget = houseResult.windowTarget.clone().add(new THREE.Vector3(-0.6, 0, 0));

  const cameraPoses = (aspect: number): CameraPosePair => {
    const portrait = aspect < 1;
    const introPosition = portrait
      ? new THREE.Vector3(6.2, 5.4, 7.2)
      : new THREE.Vector3(7.6, 4.9, 8.6);
    const introTarget = new THREE.Vector3(-0.2, 2.0, 0);
    const arrivalPosition = new THREE.Vector3(windowTarget.x + 0.95, windowTarget.y + 0.05, windowTarget.z + 1.25);
    const arrivalTarget = windowTarget.clone();
    return {
      intro: { position: introPosition, target: introTarget },
      arrival: { position: arrivalPosition, target: arrivalTarget },
    };
  };

  return {
    group,
    windowTarget,
    swayTargets: treeResult.swayTargets,
    cameraPoses,
  };
}
