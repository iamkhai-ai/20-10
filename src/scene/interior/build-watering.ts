import * as THREE from 'three';
import gsap from 'gsap';
import type { BedroomWateringRig } from './build-bedroom';

export interface WateringView {
  beginDrag(): void;
  drag(ray: THREE.Ray): void;
  aimAutomatically(): void;
  cancel(immediate: boolean): void;
  isValidAim(): boolean;
  render(now: number, pouring: boolean, progress: number): void;
  setReducedMotion(value: boolean): void;
  dispose(): void;
}

export function createWateringView(rig: BedroomWateringRig,
  options: { reducedMotion: boolean }): WateringView {
  const { can, pot, plant, room } = rig;
  const rest = can.position.clone(), restQ = can.quaternion.clone();
  const potQ = pot.quaternion.clone(), plantQ = plant.quaternion.clone();
  const from = new THREE.Vector3(), goal = new THREE.Vector3();
  const fromQ = new THREE.Quaternion(), goalQ = new THREE.Quaternion();
  const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
  const start = new THREE.Vector3(), soil = new THREE.Vector3(), direction = new THREE.Vector3();
  const impact = new THREE.Vector3(), delta = new THREE.Vector3(), point = new THREE.Vector3();
  const rotatedOutlet = new THREE.Vector3();
  const unitY = new THREE.Vector3(0, 1, 0);
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.8);
  let reducedMotion = options.reducedMotion, disposed = false, snapping = false;
  let tween: gsap.core.Tween | null = null;
  const clock = { blend: 0 };
  const effects = new THREE.Group(); effects.name = 'watering-effects'; effects.visible = false;
  const water = new THREE.MeshStandardMaterial({ color: 0xccebf0, roughness: 0.25,
    transparent: true, opacity: 0.72, metalness: 0.05 });
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.007, 1, 7), water);
  stream.name = 'watering-stream'; effects.add(stream);
  const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.007, 6, 4), water, 16);
  drops.name = 'watering-drops'; drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  drops.frustumCulled = false; effects.add(drops); room.add(effects);
  const instance = new THREE.Object3D();
  const wet = new THREE.Mesh(new THREE.CircleGeometry(0.13, 24),
    new THREE.MeshBasicMaterial({ color: 0x302b20, transparent: true, opacity: 0, depthWrite: false }));
  wet.name = 'watering-wet-soil'; wet.rotation.x = -Math.PI / 2; room.add(wet);
  const target = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.195, 32),
    new THREE.MeshBasicMaterial({ color: 0xe6d4a3, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
  target.name = 'watering-target'; target.rotation.x = -Math.PI / 2; target.visible = false; room.add(target);
  const stopTween = () => { tween?.kill(); tween = null; };
  const pose = (position: THREE.Vector3, rotation: THREE.Quaternion, immediate = false) => {
    stopTween();
    if (immediate || reducedMotion) { can.position.copy(position); can.quaternion.copy(rotation); return; }
    from.copy(can.position); fromQ.copy(can.quaternion); goal.copy(position); goalQ.copy(rotation); clock.blend = 0;
    tween = gsap.to(clock, { blend: 1, duration: 0.32, ease: 'power2.out',
      onUpdate: () => { can.position.lerpVectors(from, goal, clock.blend); can.quaternion.slerpQuaternions(fromQ, goalQ, clock.blend); },
      onComplete: () => { tween = null; } });
  };
  const restoreFeedback = () => { pot.quaternion.copy(potQ); plant.quaternion.copy(plantQ); };
  const cancel = (immediate: boolean) => {
    if (disposed) return;
    effects.visible = false; target.visible = false; snapping = false; restoreFeedback();
    pose(rest, restQ, immediate);
  };
  const aimAutomatically = () => {
    if (disposed) return;
    snapping = true; rig.soilTarget.getWorldPosition(soil);
    // Position the tilted outlet so its directed ray lands beside the seedling stem.
    goalQ.copy(tilt).multiply(restQ);
    direction.copy(rig.outletDirection).applyQuaternion(goalQ).normalize();
    point.copy(soil); point.x += 0.065; point.z += 0.045;
    point.addScaledVector(direction, -0.24 / -direction.y);
    rotatedOutlet.copy(rig.outlet.position).applyQuaternion(goalQ);
    point.sub(rotatedOutlet);
    // The room is currently world-aligned; convert the destination through the actual parent.
    can.parent!.worldToLocal(point);
    pose(point, goalQ);
  };
  const isValidAim = () => {
    if (disposed || tween) return false;
    room.updateWorldMatrix(true, true);
    rig.outlet.getWorldPosition(start); rig.soilTarget.getWorldPosition(soil);
    direction.copy(rig.outletDirection).transformDirection(can.matrixWorld);
    const height = start.y - soil.y;
    if (height < 0.06 || height > 0.85 || direction.y > -0.25) return false;
    const distance = -height / direction.y;
    impact.copy(start).addScaledVector(direction, distance);
    return Math.hypot(impact.x - soil.x, impact.z - soil.z) <= rig.soilRadius;
  };
  return {
    aimAutomatically, isValidAim, cancel,
    beginDrag() {
      if (disposed) return;
      stopTween(); effects.visible = false; snapping = false; target.visible = true;
      point.copy(rest); point.y += 0.2; pose(point, restQ, true);
    },
    drag(ray) {
      if (disposed) return;
      rig.soilTarget.getWorldPosition(soil);
      if (ray.distanceSqToPoint(soil) < 0.30 ** 2) {
        if (!snapping) aimAutomatically();
        return;
      }
      stopTween(); snapping = false; effects.visible = false;
      if (ray.intersectPlane(plane, point)) {
        point.x = THREE.MathUtils.clamp(point.x, 1.25, 2.0);
        point.z = THREE.MathUtils.clamp(point.z, -1.0, -0.65);
        can.parent!.worldToLocal(point); can.position.copy(point); can.quaternion.copy(restQ);
      }
    },
    render(now, pouring, progress) {
      if (disposed) return;
      restoreFeedback();
      effects.visible = pouring && isValidAim();
      rig.soilTarget.getWorldPosition(soil); wet.position.copy(soil); wet.position.y += 0.003;
      target.position.copy(soil); target.position.y += 0.025;
      wet.material.opacity = THREE.MathUtils.clamp(progress, 0, 1) * 0.28;
      if (!effects.visible) return;
      delta.subVectors(impact, start);
      stream.position.copy(start).addScaledVector(delta, 0.5);
      stream.scale.set(1, delta.length(), 1);
      stream.quaternion.setFromUnitVectors(unitY, delta.normalize());
      drops.visible = !reducedMotion;
      if (!reducedMotion) {
        for (let i = 0; i < 16; i++) {
          const t = (now * 0.0018 + i / 16) % 1;
          instance.position.lerpVectors(start, impact, t);
          instance.position.x += Math.sin(i * 2.4) * 0.012 * t;
          instance.position.z += Math.cos(i * 2.4) * 0.012 * t;
          instance.scale.set(0.55, 1.35, 0.55); instance.updateMatrix(); drops.setMatrixAt(i, instance.matrix);
        }
        drops.instanceMatrix.needsUpdate = true;
        plant.rotation.z += Math.sin(now * 0.004) * 0.012;
        pot.rotation.z += Math.sin(now * 0.003) * 0.002;
      }
    },
    setReducedMotion(value) { if (!disposed) { reducedMotion = value; cancel(true); } },
    dispose() {
      if (disposed) return;
      cancel(true); disposed = true; stopTween();
      room.remove(effects, wet, target);
      stream.geometry.dispose(); drops.geometry.dispose(); drops.dispose(); water.dispose();
      wet.geometry.dispose(); wet.material.dispose(); target.geometry.dispose(); target.material.dispose();
    },
  };
}
