import * as THREE from 'three';
import { disposeObjectResources } from './dispose-object-resources';

export interface SceneRuntime {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  setLocation(location: 'exterior' | 'bedroom'): void;
  resize(): void;
  dispose(): void;
}

export function createScene(host: HTMLElement): SceneRuntime {
  const scene = new THREE.Scene();
  const sky = createSkyTexture();
  scene.background = sky;
  scene.fog = new THREE.Fog(0xe6eddf, 22, 65);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  camera.position.set(6, 4.5, 8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  host.appendChild(renderer.domElement);
  const environment = createEnvironment(renderer);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.7;

  const ambient = new THREE.HemisphereLight(0xe5edf0, 0x87947b, 0.75);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffedcf, 2.1);
  key.position.set(8, 12, 6);
  key.castShadow = true;
  key.shadow.radius = 2;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.normalBias = 0.025;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 40;
  key.shadow.camera.left = -10;
  key.shadow.camera.right = 10;
  key.shadow.camera.top = 10;
  key.shadow.camera.bottom = -10;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xe4edf0, 0.35);
  fill.position.set(-6, 5, 8);
  scene.add(fill);
  scene.add(key.target);
  const roomBackground = new THREE.Color(0xeee4d5);
  const exteriorFog = scene.fog;
  const setLocation = (location: 'exterior' | 'bedroom') => {
    const interior = location === 'bedroom';
    scene.background = interior ? roomBackground : sky;
    scene.fog = interior ? null : exteriorFog;
    scene.environmentIntensity = interior ? 0.55 : 0.7;
    ambient.intensity = interior ? 0.5 : 0.75;
    fill.intensity = interior ? 0.4 : 0.35;
    key.intensity = interior ? 3.2 : 2.1;
    key.position.set(interior ? 2.5 : 8, interior ? 6 : 12, interior ? -4 : 6);
    key.target.position.set(interior ? 0.5 : 0, interior ? 1 : 0, interior ? -0.5 : 0);
    const extent = interior ? 5 : 10;
    Object.assign(key.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent,
      far: interior ? 25 : 40 });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.needsUpdate = true;
  };

  const resize = () => {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    camera.aspect = width / height;
    camera.fov = camera.aspect < 0.85 ? 65 : 48;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  resize();

  const dispose = () => {
    sky.dispose();
    environment.dispose();
    key.shadow.dispose();
    disposeObjectResources([scene]);
    renderer.dispose();
    if (renderer.domElement.parentNode === host) {
      host.removeChild(renderer.domElement);
    }
  };

  return { scene, camera, renderer, setLocation, resize, dispose };
}

function createSkyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 1024;
  const context = canvas.getContext('2d');
  if (!context) {
    return new THREE.CanvasTexture(canvas);
  }
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#9bc8de');
  gradient.addColorStop(0.24, '#dce9e4');
  gradient.addColorStop(0.42, '#e6eddf');
  gradient.addColorStop(1, '#e6eddf');
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const glow = context.createRadialGradient(1190, 120, 10, 1190, 120, 230);
  glow.addColorStop(0, 'rgba(255,247,214,0.65)');
  glow.addColorStop(1, 'rgba(255,247,214,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const cloud = (x: number, y: number, width: number, height: number) => {
    context.save();
    context.filter = 'blur(7px)';
    context.globalAlpha = 0.78;
    context.translate(x, y);
    context.scale(width, height);
    const shade = context.createLinearGradient(0, -1, 0, 1);
    shade.addColorStop(0, 'rgba(255,255,249,0.92)');
    shade.addColorStop(1, 'rgba(236,244,243,0.30)');
    context.fillStyle = shade;
    context.beginPath();
    context.moveTo(-1, 0.25);
    context.bezierCurveTo(-1.15, -0.10, -0.8, -0.40, -0.55, -0.28);
    context.bezierCurveTo(-0.55, -0.95, 0.06, -1.04, 0.23, -0.48);
    context.bezierCurveTo(0.53, -0.82, 0.84, -0.47, 0.78, -0.16);
    context.bezierCurveTo(1.2, -0.10, 1.20, 0.34, 0.8, 0.39);
    context.bezierCurveTo(0.1, 0.52, -0.7, 0.48, -1, 0.25);
    context.fill();
    context.restore();
  };
  cloud(250, 175, 190, 65);
  cloud(845, 105, 230, 62);
  cloud(1310, 250, 165, 50);
  cloud(640, 330, 140, 36);
  cloud(70, 395, 125, 30);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createEnvironment(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const context = canvas.getContext('2d')!;
  const sky = context.createLinearGradient(0, 0, 0, 256);
  sky.addColorStop(0, '#a8c2cf');
  sky.addColorStop(0.48, '#f5e3c5');
  sky.addColorStop(0.56, '#b6b292');
  sky.addColorStop(1, '#58644b');
  context.fillStyle = sky;
  context.fillRect(0, 0, 512, 256);
  const sun = context.createRadialGradient(115, 75, 2, 115, 75, 75);
  sun.addColorStop(0, 'rgba(255,250,228,1)');
  sun.addColorStop(1, 'rgba(255,243,213,0)');
  context.fillStyle = sun;
  context.fillRect(0, 0, 512, 256);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.mapping = THREE.EquirectangularReflectionMapping;
  const generator = new THREE.PMREMGenerator(renderer);
  const environment = generator.fromEquirectangular(texture);
  texture.dispose();
  generator.dispose();
  return environment;
}
