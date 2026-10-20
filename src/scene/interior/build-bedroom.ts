import * as THREE from 'three';
import type { ImportedBedroom } from '../assets/load-bedroom-model';
import type { BedroomPoses, CameraPose } from '../../experience/camera-story';

export interface BedroomBuildResult {
  group: THREE.Group;
  swayTargets: THREE.Object3D[];
  cameraPoses(aspect: number): BedroomPoses;
}

export function buildBedroom(model: ImportedBedroom): BedroomBuildResult {
  const group = model.group;
  group.visible = false;
  group.updateWorldMatrix(true, true);
  const roomTarget = model.nodes.room_target.getWorldPosition(new THREE.Vector3());
  const deskTarget = model.nodes.desk_target.getWorldPosition(new THREE.Vector3());
  const windowTarget = model.nodes.window_anchor.getWorldPosition(new THREE.Vector3());
  const lamp = new THREE.PointLight(0xffd69a, 0.45, 2.2, 2);
  lamp.position.set(0.25, 1.63, -1.24);
  group.add(lamp);
  const pose = (position: [number, number, number], target: THREE.Vector3): CameraPose =>
    ({ position: new THREE.Vector3(...position), target: target.clone() });
  const landscape: BedroomPoses = {
    entry: pose([3.7, 2.9, 5.0], windowTarget),
    room: pose([5.3, 3.8, 7.2], roomTarget),
    desk: pose([2.75, 2.45, 3.15], deskTarget),
  };
  const portrait: BedroomPoses = {
    entry: pose([2.0, 2.7, 4.8], windowTarget),
    room: pose([3.0, 4.0, 9.0], roomTarget),
    desk: pose([2.15, 2.35, 2.75], deskTarget),
  };
  return { group, swayTargets: [model.nodes.curtain_left, model.nodes.curtain_right],
    cameraPoses: (aspect) => aspect < 0.85 ? portrait : landscape };
}
