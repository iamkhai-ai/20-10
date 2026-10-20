import * as THREE from 'three';
import { createExteriorMaterials } from './materials';
import { buildHouse } from './build-house';
import { buildTree } from './build-tree';
import { buildGarden } from './build-garden';
import type { ImportedExterior } from '../assets/load-exterior-model';
import { disposeObjectResources } from '../dispose-object-resources';

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
  replaceArchitecture(model: ImportedExterior): void;
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

  const windowLight = new THREE.PointLight(0xffd49a, 1.15, 3.4, 2);
  windowLight.position.copy(houseResult.windowTarget).add(new THREE.Vector3(-0.6, 0, -0.72));
  group.add(windowLight);

  const windowTarget = houseResult.windowTarget.clone().add(new THREE.Vector3(-0.6, 0, 0));
  const swayTargets = treeResult.swayTargets;
  let replaced = false;

  const cameraPoses = (aspect: number): CameraPosePair => {
    const portrait = aspect < 0.85;
    const introPosition = portrait
      ? new THREE.Vector3(3.0, 7.5, 19.0)
      : new THREE.Vector3(6.4, 6.8, 15.2);
    const introTarget = portrait
      ? new THREE.Vector3(-0.42, 2.4, 1.55)
      : new THREE.Vector3(-0.42, 2.45, 1.55);
    const arrivalTarget = windowTarget.clone().add(
      portrait ? new THREE.Vector3(0.15, 0.2, 0) : new THREE.Vector3(0, 0.2, 0),
    );
    const arrivalPosition = portrait
      ? arrivalTarget.clone().add(new THREE.Vector3(0.5, 0.3, 5.2))
      : arrivalTarget.clone().add(new THREE.Vector3(1.0, 0.42, 4.1));
    return {
      intro: { position: introPosition, target: introTarget },
      arrival: { position: arrivalPosition, target: arrivalTarget },
    };
  };

  return {
    group,
    windowTarget,
    swayTargets,
    cameraPoses,
    replaceArchitecture(model) {
      if (replaced) throw new Error('Exterior architecture was already replaced.');
      model.group.position.set(-0.6, 0, 0);
      group.add(model.group);
      group.updateWorldMatrix(true, true);
      model.windowTarget.getWorldPosition(windowTarget);
      group.worldToLocal(windowTarget);
      windowLight.position.copy(windowTarget).add(new THREE.Vector3(0, 0, -0.72));
      swayTargets.splice(0, swayTargets.length, ...model.swayTargets);
      group.remove(houseResult.group, treeResult.group);
      disposeObjectResources([houseResult.group, treeResult.group], [group]);
      replaced = true;
    },
  };
}
