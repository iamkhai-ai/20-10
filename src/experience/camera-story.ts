import * as THREE from 'three';
import gsap from 'gsap';

export interface CameraPose {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export interface CameraPosePair {
  intro: CameraPose;
  arrival: CameraPose;
}

export interface BedroomPoses {
  entry: CameraPose;
  room: CameraPose;
  desk: CameraPose;
}

export interface CameraStoryHandle {
  skip(): void;
  reframe(): void;
  dispose(): void;
}

export function createCameraStory(
  camera: THREE.PerspectiveCamera,
  getPoses: (aspect: number) => CameraPosePair,
  options: { reducedMotion: boolean; onArrive: () => void },
): CameraStoryHandle {
  let progress = options.reducedMotion ? 1 : 0;
  let arrived = false;
  const position = new THREE.Vector3();
  const target = new THREE.Vector3();
  const proxy = { value: progress };

  const apply = () => {
    const poses = getPoses(camera.aspect);
    position.lerpVectors(poses.intro.position, poses.arrival.position, progress);
    target.lerpVectors(poses.intro.target, poses.arrival.target, progress);
    camera.position.copy(position);
    camera.lookAt(target);
  };

  const arrive = () => {
    if (arrived) return;
    arrived = true;
    options.onArrive();
  };

  apply();

  const tween = options.reducedMotion
    ? null
    : gsap.to(proxy, {
        value: 1,
        duration: 6,
        ease: 'power2.inOut',
        onUpdate: () => {
          progress = proxy.value;
          apply();
        },
        onComplete: () => {
          progress = 1;
          apply();
          arrive();
        },
      });

  if (options.reducedMotion) {
    progress = 1;
    apply();
    arrive();
  }

  return {
    skip() {
      if (tween) tween.kill();
      progress = 1;
      proxy.value = 1;
      apply();
      arrive();
    },
    reframe() {
      apply();
    },
    dispose() {
      if (tween) tween.kill();
    },
  };
}
