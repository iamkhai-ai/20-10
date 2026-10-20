import * as THREE from 'three';

export interface SceneRuntime {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  resize(): void;
  dispose(): void;
}

export function createScene(host: HTMLElement): SceneRuntime {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3e6d3);
  scene.fog = new THREE.Fog(0xd5bfa4, 18, 42);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.set(6, 4.5, 8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const ambient = new THREE.HemisphereLight(0xfff1dc, 0x81936d, 0.72);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffe0b5, 1.35);
  key.position.set(8, 12, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 40;
  key.shadow.camera.left = -12;
  key.shadow.camera.right = 12;
  key.shadow.camera.top = 12;
  key.shadow.camera.bottom = -12;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xd98591, 0.28);
  fill.position.set(-6, 4, -4);
  scene.add(fill);

  const resize = () => {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  resize();

  const dispose = () => {
    renderer.dispose();
    if (renderer.domElement.parentNode === host) {
      host.removeChild(renderer.domElement);
    }
  };

  return { scene, camera, renderer, resize, dispose };
}
