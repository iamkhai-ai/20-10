import * as THREE from 'three';

const loading = document.getElementById('loading');
const hint = document.getElementById('hint');
const modal = document.getElementById('modal');
const modalText = document.getElementById('modalText');
const closeModal = document.getElementById('closeModal');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1024);
scene.fog = new THREE.Fog(0x1a1024, 12, 30);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.8, 9);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xfff1e0, 1.1);
sun.position.set(5, 8, 6);
sun.castShadow = true;
scene.add(sun);
const point = new THREE.PointLight(0xffb6c1, 0.8, 12);
point.position.set(0, 2, 2);
scene.add(point);

const matWall = new THREE.MeshStandardMaterial({ color: 0xf5e6d3, roughness: 0.9 });
const matRoof = new THREE.MeshStandardMaterial({ color: 0x8b3a3a, roughness: 0.8 });
const matFrame = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.7 });
const matGlass = new THREE.MeshStandardMaterial({ color: 0xaed6f1, transparent: true, opacity: 0.35, roughness: 0.1 });
const matFloor = new THREE.MeshStandardMaterial({ color: 0x6b4f3a, roughness: 0.95 });
const matTable = new THREE.MeshStandardMaterial({ color: 0xc9a27a, roughness: 0.8 });
const matPot = new THREE.MeshStandardMaterial({ color: 0xb5651d, roughness: 0.9 });
const matSoil = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 1 });
const matSeed = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.9 });
const matCan = new THREE.MeshStandardMaterial({ color: 0x4a90d9, roughness: 0.5, metalness: 0.3 });

const house = new THREE.Group();
const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), matFloor);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

function box(w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

house.add(box(1.4, 3, 0.2, matWall, -1.3, 1.5, 1.5));
house.add(box(1.4, 3, 0.2, matWall, 1.3, 1.5, 1.5));
house.add(box(1.2, 1.1, 0.2, matWall, 0, 2.45, 1.5));
house.add(box(1.2, 0.9, 0.2, matWall, 0, 0.45, 1.5));
house.add(box(4, 0.2, 3, matWall, 0, 3, 0));
house.add(box(4, 3, 0.2, matWall, 0, 1.5, -1.5));
house.add(box(0.2, 3, 3, matWall, -2, 1.5, 0));
house.add(box(0.2, 3, 3, matWall, 2, 1.5, 0));
const roofMesh = new THREE.Mesh(new THREE.ConeGeometry(2.9, 1.6, 4), matRoof);
roofMesh.position.set(0, 3.8, 0);
roofMesh.rotation.y = Math.PI / 4;
roofMesh.castShadow = true;
house.add(roofMesh);
const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.05, 0.05), matFrame);
windowFrame.position.set(0, 1.8, 1.52);
house.add(windowFrame);
const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.95), matGlass);
glass.position.set(0, 1.8, 1.53);
house.add(glass);
scene.add(house);

const interior = new THREE.Group();
const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.9), matTable);
tableTop.position.set(0, 0.8, -0.2);
tableTop.castShadow = true;
tableTop.receiveShadow = true;
interior.add(tableTop);
for (const [x, z] of [[-0.7, 0.3], [0.7, 0.3], [-0.7, -0.7], [0.7, -0.7]]) {
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), matTable);
  leg.position.set(x, 0.45, z - 0.2);
  interior.add(leg);
}
const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.3, 24), matPot);
pot.position.set(0, 0.95, -0.2);
pot.castShadow = true;
interior.add(pot);
const soil = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), matSoil);
soil.rotation.x = -Math.PI / 2;
soil.position.set(0, 1.11, -0.2);
interior.add(soil);
const seed = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), matSeed);
seed.position.set(0, 1.13, -0.2);
interior.add(seed);

const canGroup = new THREE.Group();
const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.28, 16), matCan);
canBody.rotation.z = Math.PI / 2;
canGroup.add(canBody);
const canSpout = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.18, 12), matCan);
canSpout.position.set(0.2, 0.05, 0);
canSpout.rotation.z = -Math.PI / 3;
canGroup.add(canSpout);
const canHandle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 8, 16, Math.PI), matCan);
canHandle.position.set(-0.05, 0.12, 0);
canHandle.rotation.x = Math.PI / 2;
canGroup.add(canHandle);
canGroup.position.set(0.85, 1.0, -0.2);
interior.add(canGroup);

scene.add(interior);

let zoomT = 0;
const zoomDuration = 4;
const startCam = new THREE.Vector3(0, 2.8, 9);
const endCam = new THREE.Vector3(0, 1.6, 0.9);
const lookStart = new THREE.Vector3(0, 1.5, 0);
const lookEnd = new THREE.Vector3(0, 0.9, -0.2);

function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

let zooming = true;
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  if (zooming) {
    zoomT = Math.min(1, zoomT + dt / zoomDuration);
    const e = ease(zoomT);
    camera.position.lerpVectors(startCam, endCam, e);
    const look = new THREE.Vector3().lerpVectors(lookStart, lookEnd, e);
    camera.lookAt(look);
    if (zoomT >= 1) {
      zooming = false;
      hint.textContent = 'Kéo bình nước để tưới mầm cây';
    }
  }
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

loading.style.display = 'none';
closeModal.addEventListener('click', () => { modal.style.display = 'none'; });
modalText.textContent = 'Chúc em 20/10 thật hạnh phúc, luôn xinh đẹp và rạng rỡ. Anh yêu em nhiều lắm! 💐';
