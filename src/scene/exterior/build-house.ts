import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { ExteriorMaterials } from './materials';

export interface HouseBuildResult {
  group: THREE.Group;
  windowTarget: THREE.Vector3;
}

export function buildHouse(materials: ExteriorMaterials): HouseBuildResult {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(4.4, 4.2, 3.2, 4, 0.1), materials.plaster);
  body.position.y = 2.1;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const foundation = new THREE.Mesh(new THREE.BoxGeometry(4.7, 0.28, 3.45), materials.trim);
  foundation.position.y = 0.14;
  foundation.castShadow = true;
  foundation.receiveShadow = true;
  group.add(foundation);

  const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.16, 3.5), materials.roof);
  roofLeft.position.set(-1.05, 4.55, 0);
  roofLeft.rotation.z = 0.58;
  roofLeft.castShadow = true;
  group.add(roofLeft);

  const roofRight = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.16, 3.5), materials.roof);
  roofRight.position.set(1.05, 4.55, 0);
  roofRight.rotation.z = -0.58;
  roofRight.castShadow = true;
  group.add(roofRight);

  const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 3.55), materials.trim);
  ridge.position.set(0, 4.93, 0);
  ridge.castShadow = true;
  group.add(ridge);

  const eaveLeft = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 3.6), materials.trim);
  eaveLeft.position.set(-1.15, 4.2, 0);
  eaveLeft.rotation.z = 0.58;
  group.add(eaveLeft);

  const eaveRight = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 3.6), materials.trim);
  eaveRight.position.set(1.15, 4.2, 0);
  eaveRight.rotation.z = -0.58;
  group.add(eaveRight);

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.75, 0.12), materials.wood);
  door.position.set(0, 0.875, 1.66);
  door.castShadow = true;
  group.add(door);

  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.95, 0.16), materials.trim);
  doorFrame.position.set(0, 0.975, 1.62);
  group.add(doorFrame);

  const windowX = 1.25;
  const windowY = 3.05;
  const recess = new THREE.Mesh(new RoundedBoxGeometry(1.48, 1.08, 0.12, 0.05, 2), materials.interiorGlow);
  recess.position.set(windowX, windowY, 1.62);
  group.add(recess);

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 0.94), materials.glass);
  glass.position.set(windowX, windowY, 1.69);
  group.add(glass);

  const trimThickness = 0.08;
  const trimDepth = 0.1;
  const topTrim = new THREE.Mesh(new THREE.BoxGeometry(1.58, trimThickness, trimDepth), materials.trim);
  topTrim.position.set(windowX, windowY + 0.58, 1.7);
  group.add(topTrim);
  const bottomTrim = new THREE.Mesh(new THREE.BoxGeometry(1.58, trimThickness, trimDepth), materials.trim);
  bottomTrim.position.set(windowX, windowY - 0.58, 1.7);
  group.add(bottomTrim);
  const leftTrim = new THREE.Mesh(new THREE.BoxGeometry(trimThickness, 1.02, trimDepth), materials.trim);
  leftTrim.position.set(windowX - 0.75, windowY, 1.7);
  group.add(leftTrim);
  const rightTrim = new THREE.Mesh(new THREE.BoxGeometry(trimThickness, 1.02, trimDepth), materials.trim);
  rightTrim.position.set(windowX + 0.75, windowY, 1.7);
  group.add(rightTrim);
  const centerStile = new THREE.Mesh(new THREE.BoxGeometry(trimThickness, 0.94, trimDepth), materials.trim);
  centerStile.position.set(windowX, windowY, 1.7);
  group.add(centerStile);

  const curtainLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.88), materials.curtain);
  curtainLeft.position.set(windowX - 0.34, windowY, 1.64);
  group.add(curtainLeft);
  const curtainRight = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.88), materials.curtain);
  curtainRight.position.set(windowX + 0.34, windowY, 1.64);
  group.add(curtainRight);

  const windowTarget = new THREE.Vector3(windowX, windowY, 2.15);
  return { group, windowTarget };
}
