import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const loading = document.getElementById('loading');
const hint = document.getElementById('hint');
const modal = document.getElementById('modal');
const modalText = document.getElementById('modalText');
const closeModal = document.getElementById('closeModal');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

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
const hemi = new THREE.HemisphereLight(0xffe4ec, 0x4a3a5a, 0.5);
scene.add(hemi);
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 40;
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 12;
sun.shadow.camera.bottom = -12;

function makeTexture(draw, size = 256, repeat = [4, 4]) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  return t;
}
const brickTex = makeTexture((ctx, s) => {
  ctx.fillStyle = '#8a5a3b'; ctx.fillRect(0, 0, s, s);
  const bw = s / 4, bh = s / 8;
  for (let y = 0; y < s; y += bh) {
    const off = (Math.floor(y / bh) % 2) * (bw / 2);
    for (let x = -bw; x < s + bw; x += bw) {
      ctx.fillStyle = `rgb(${120 + Math.random() * 40},${70 + Math.random() * 30},${45 + Math.random() * 25})`;
      ctx.fillRect(x + off + 2, y + 2, bw - 4, bh - 4);
    }
  }
}, 256, [2, 2]);
const woodTex = makeTexture((ctx, s) => {
  ctx.fillStyle = '#8b6f47'; ctx.fillRect(0, 0, s, s);
  for (let i = 0; i < 18; i++) {
    ctx.strokeStyle = `rgba(60,40,20,${0.15 + Math.random() * 0.25})`;
    ctx.lineWidth = 1 + Math.random() * 3;
    ctx.beginPath();
    const y = Math.random() * s;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(s * 0.3, y + Math.random() * 30 - 15, s * 0.7, y + Math.random() * 30 - 15, s, y + Math.random() * 20 - 10);
    ctx.stroke();
  }
}, 256, [3, 3]);
const matWall = new THREE.MeshStandardMaterial({ map: brickTex, roughness: 0.9, envMapIntensity: 0.6 });
const matRoof = new THREE.MeshStandardMaterial({ color: 0x7a2f2f, roughness: 0.85, envMapIntensity: 0.5 });
const matFrame = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.7 });
const matGlass = new THREE.MeshPhysicalMaterial({ color: 0xaed6f1, transmission: 0.9, roughness: 0.05, thickness: 0.1, transparent: true, envMapIntensity: 1 });
const matFloor = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85, envMapIntensity: 0.5 });
const matTable = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.75, envMapIntensity: 0.6 });
const matPot = new THREE.MeshStandardMaterial({ color: 0xb5651d, roughness: 0.85, envMapIntensity: 0.4 });
const matSoil = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 1 });
const matSeed = new THREE.MeshStandardMaterial({ color: 0x6d4c41, roughness: 0.9 });
const matCan = new THREE.MeshStandardMaterial({ color: 0x4a90d9, roughness: 0.4, metalness: 0.35, envMapIntensity: 1 });
const matWater = new THREE.MeshStandardMaterial({ color: 0x4fc3f7, transparent: true, opacity: 0.75 });
const matGreen = new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.8 });
const matPetal = new THREE.MeshStandardMaterial({ color: 0xff6b9d, roughness: 0.6 });
const matCard = new THREE.MeshBasicMaterial({ color: 0xfff7e6, side: THREE.DoubleSide });

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
const canInitial = new THREE.Vector3(0.85, 1.0, -0.2);
canGroup.position.copy(canInitial);
interior.add(canGroup);

const plant = new THREE.Group();
plant.position.set(0, 1.1, -0.2);
plant.scale.set(0.001, 0.001, 0.001);
const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.6, 8), matGreen);
stem.position.set(0, 0.3, 0);
plant.add(stem);
for (const [x, z] of [[0.08, 0.05], [-0.08, -0.04]]) {
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), matGreen);
  leaf.scale.set(1.4, 0.4, 1);
  leaf.position.set(x, 0.25, z);
  plant.add(leaf);
}
const flowerCluster = new THREE.Group();
flowerCluster.position.set(0, 0.62, 0);
plant.add(flowerCluster);
for (let i = 0; i < 7; i++) {
  const a = (i / 7) * Math.PI * 2;
  const petal = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), matPetal);
  petal.position.set(Math.cos(a) * 0.09, 0, Math.sin(a) * 0.09);
  flowerCluster.add(petal);
}
const flowerCenter = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), new THREE.MeshStandardMaterial({ color: 0xffeb3b }));
flowerCluster.add(flowerCenter);
interior.add(plant);

const cardCanvas = document.createElement('canvas');
cardCanvas.width = 512;
cardCanvas.height = 320;
const cardCtx = cardCanvas.getContext('2d');
cardCtx.fillStyle = '#fff7e6';
cardCtx.fillRect(0, 0, 512, 320);
cardCtx.fillStyle = '#c44569';
cardCtx.font = 'bold 48px sans-serif';
cardCtx.textAlign = 'center';
cardCtx.fillText('💌 Thiệp 20/10', 256, 130);
cardCtx.font = '24px sans-serif';
cardCtx.fillStyle = '#5c3a21';
cardCtx.fillText('Bấm để mở', 256, 200);
const cardTex = new THREE.CanvasTexture(cardCanvas);
const cardMatTex = new THREE.MeshBasicMaterial({ map: cardTex, side: THREE.DoubleSide });
const card = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.22), cardMatTex);
card.position.set(0, 1.85, -0.2);
card.visible = false;
interior.add(card);

const interiorLight = new THREE.PointLight(0xffd6a5, 1.2, 8);
interiorLight.position.set(0, 2.2, 0);
interior.add(interiorLight);
scene.add(interior);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1.0);
let dragging = false;
let dragOffset = new THREE.Vector3();
let pouring = false;
let pourT = 0;
let pourStart = new THREE.Vector3();
let waterCount = 0;
const waterTarget = 5;
let bloomed = false;
let bloomT = 0;
let bloomDone = false;
let focusingCard = false;
let focusT = 0;
const focusStart = new THREE.Vector3();
const focusEnd = new THREE.Vector3(0, 1.85, 0.7);const focusLookStart = new THREE.Vector3();
const focusLookEnd = new THREE.Vector3(0, 1.85, -0.2);
const waterDrops = [];

function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

let zooming = true;
const zoomDuration = 4;
const startCam = new THREE.Vector3(0, 2.8, 9);
const endCam = new THREE.Vector3(0, 1.6, 0.9);
const lookStart = new THREE.Vector3(0, 1.5, 0);
const lookEnd = new THREE.Vector3(0, 0.9, -0.2);
let zoomT = 0;

let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playWater() {
  ensureAudio();
  const ctx = audioCtx;
  const dur = 0.5;
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start();
}
function playBloom() {
  ensureAudio();
  const ctx = audioCtx;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + i * 0.12 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.4);
  });
}
function playCard() {
  ensureAudio();
  const ctx = audioCtx;
  [880, 1174.66].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + i * 0.1 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.1 + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + i * 0.1);
    osc.stop(ctx.currentTime + i * 0.1 + 0.45);
  });
}

function setPointer(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  const c = e.touches ? e.touches[0] : e;
  pointer.x = ((c.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((c.clientY - rect.top) / rect.height) * 2 + 1;
}

function onDown(e) {
  ensureAudio();
  if (zooming || focusingCard) return;
  setPointer(e);
  raycaster.setFromCamera(pointer, camera);
  if (bloomDone) {
    const hits = raycaster.intersectObject(card, false);
    if (hits.length) { openCard(); return; }
  }
  const hits = raycaster.intersectObject(canGroup, true);
  if (hits.length) {
    dragging = true;
    const pt = hits[0].point;
    dragOffset.copy(pt).sub(canGroup.position);
    renderer.domElement.style.cursor = 'grabbing';
  }
}

function onMove(e) {
  if (!dragging) return;
  e.preventDefault();
  setPointer(e);
  raycaster.setFromCamera(pointer, camera);
  const target = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(dragPlane, target)) {
    canGroup.position.copy(target.sub(dragOffset));
  }
}

function onUp() {
  if (!dragging) return;
  dragging = false;
  renderer.domElement.style.cursor = 'default';
  const dx = canGroup.position.x;
  const dz = canGroup.position.z + 0.2;
  if (Math.hypot(dx, dz) < 0.35 && !pouring) {
    pour();
  } else {
    snapCan();
  }
}

function snapCan() {
  canGroup.position.copy(canInitial);
  canGroup.rotation.z = 0;
}

function pour() {
  pouring = true;
  pourT = 0;
  pourStart.copy(canGroup.position);
  playWater();
}

function spawnWater() {
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), matWater);
  const spoutPos = new THREE.Vector3();
  canSpout.getWorldPosition(spoutPos);
  drop.position.copy(spoutPos);
  drop.userData.vel = new THREE.Vector3((Math.random() - 0.5) * 0.03, -0.15, (Math.random() - 0.5) * 0.03);
  scene.add(drop);
  waterDrops.push(drop);
}

function updateProgress() {
  hint.textContent = `Tưới: ${waterCount}/${waterTarget} — ${waterCount >= waterTarget ? 'Hoa đang nở...' : 'Tiếp tục tưới nhé'}`;
  const s = 1 + waterCount * 0.15;
  seed.scale.set(s, s, s);
  seed.material.color.setHSL(0.28 - waterCount * 0.02, 0.5, 0.35);
}

function bloomPlant() {
  bloomed = true;
  bloomT = 0;
  playBloom();
  hint.textContent = 'Hoa đang nở rộ...';
}

function openCard() {
  if (focusingCard) return;
  focusingCard = true;
  focusT = 0;
  focusStart.copy(camera.position);
  focusLookStart.copy(focusLookEnd).sub(new THREE.Vector3(0, 0, 0)); // placeholder
  // set look start from current look target approx
  focusLookStart.set(0, 0.9, -0.2);
  playCard();
  card.scale.set(1, 1, 1);
}

renderer.domElement.addEventListener('pointerdown', onDown);
renderer.domElement.addEventListener('pointermove', onMove);
renderer.domElement.addEventListener('pointerup', onUp);
renderer.domElement.addEventListener('pointerleave', onUp);
renderer.domElement.addEventListener('touchstart', (e) => { e.preventDefault(); onDown(e); }, { passive: false });
renderer.domElement.addEventListener('touchmove', (e) => { e.preventDefault(); onMove(e); }, { passive: false });
renderer.domElement.addEventListener('touchend', (e) => { e.preventDefault(); onUp(); }, { passive: false });

closeModal.addEventListener('click', () => { modal.style.display = 'none'; });

const clock = new THREE.Clock();
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.35, 0.4, 0.85);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

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
  } else if (focusingCard) {
    focusT = Math.min(1, focusT + dt / 1.2);
    const e = ease(focusT);
    camera.position.lerpVectors(focusStart, focusEnd, e);
    const look = new THREE.Vector3().lerpVectors(focusLookStart, focusLookEnd, e);
    camera.lookAt(look);
    if (focusT >= 1) {
      focusingCard = false;
      modal.style.display = 'flex';
    }
  }

  if (pouring) {
    pourT = Math.min(1, pourT + dt / 1.0);
    const e = ease(pourT);
    const targetPos = new THREE.Vector3(0, 1.35, -0.2);
    canGroup.position.lerpVectors(pourStart, targetPos, e);
    canGroup.rotation.z = -1.2 * e;
    if (Math.random() < 0.35) spawnWater();
    if (pourT >= 1) {
      pouring = false;
      canGroup.rotation.z = 0;
      snapCan();
      waterCount++;
      updateProgress();
      if (waterCount >= waterTarget) bloomPlant();
    }
  }

  if (bloomed && !bloomDone) {
    bloomT = Math.min(1, bloomT + dt / 2.0);
    const e = ease(bloomT);
    const s = 0.001 + e * 0.999;
    plant.scale.set(s, s, s);
    if (bloomT >= 1) {
      bloomDone = true;
      card.visible = true;
      hint.textContent = 'Bấm vào tấm thiệp giữa khóm hoa 💌';
    }
  }

  if (card.visible) {
    card.position.y = 1.85 + Math.sin(clock.elapsedTime * 2) * 0.05;
    card.rotation.y = Math.sin(clock.elapsedTime * 1.2) * 0.15;
  }

  for (let i = waterDrops.length - 1; i >= 0; i--) {
    const d = waterDrops[i];
    d.position.add(d.userData.vel);
    d.userData.vel.y -= 0.004;
    if (d.position.y < 1.12) {
      scene.remove(d);
      waterDrops.splice(i, 1);
    }
  }

  composer.render();
}
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

loading.style.display = 'none';
modalText.textContent = 'Chúc em 20/10 thật hạnh phúc, luôn xinh đẹp và rạng rỡ. Anh yêu em nhiều lắm! 💐';
