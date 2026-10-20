import * as THREE from 'three';
import type { ImportedBedroom } from '../assets/load-bedroom-model';
import type { BedroomPoses, CameraPose } from '../../experience/camera-story';

export interface BedroomBuildResult {
  group: THREE.Group;
  swayTargets: THREE.Object3D[];
  cameraPoses(aspect: number): BedroomPoses;
  watering: BedroomWateringRig;
}

export interface BedroomWateringRig {
  room: THREE.Group;
  can: THREE.Object3D;
  pot: THREE.Object3D;
  plant: THREE.Object3D;
  outlet: THREE.Object3D;
  soilTarget: THREE.Object3D;
  outletDirection: THREE.Vector3;
  soilRadius: number;
}

export function buildBedroom(model: ImportedBedroom): BedroomBuildResult {
  const group = model.group;
  group.visible = false;
  group.updateWorldMatrix(true, true);
  // Exterior scenery is a window view, not an occluder of the room's daylight.
  group.traverse((object) => {
    const name = object.userData.name ?? object.name;
    if (name === 'window_backdrop') object.traverse((child) => {
      if (child instanceof THREE.Mesh) child.castShadow = child.receiveShadow = false;
    });
    if (object instanceof THREE.Mesh) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if (material instanceof THREE.MeshStandardMaterial) {
          material.aoMapIntensity = material.name === 'Warm limewash' ? 0.22 :
            ['Hand thrown clay', 'Unbleached linen', 'Ivory cotton', 'Dusty rose quilt',
              'Sage woven throw'].includes(material.name) ? 0.32 : 0.48;
        }
      }
    }
  });
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
  const can = model.nodes.watering_can;
  const outlet = new THREE.Object3D(); outlet.name = 'watering-outlet';
  outlet.position.copy(can.worldToLocal(new THREE.Vector3(1.407, 1.525, -0.85)));
  can.add(outlet);
  const soilTarget = new THREE.Object3D(); soilTarget.name = 'watering-soil';
  soilTarget.position.copy(model.nodes.plant_pot.worldToLocal(new THREE.Vector3(1.10, 1.405, -0.88)));
  model.nodes.plant_pot.add(soilTarget);
  const inverse = new THREE.Matrix4().copy(can.matrixWorld).invert();
  const watering: BedroomWateringRig = { room: group, can, pot: model.nodes.plant_pot,
    plant: model.nodes.plant_rest, outlet, soilTarget, soilRadius: 0.14,
    outletDirection: new THREE.Vector3(-0.383, 0.355, 0).normalize().transformDirection(inverse) };
  // Calibrate in authored coordinates first, then resize the complete prop and outlet together.
  can.scale.multiplyScalar(0.82);
  return { group, watering, swayTargets: [model.nodes.curtain_left, model.nodes.curtain_right],
    cameraPoses: (aspect) => aspect < 0.85 ? portrait : landscape };
}
