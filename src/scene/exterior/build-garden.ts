import * as THREE from 'three';
import type { ExteriorMaterials } from './materials';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { buildBoundary } from './build-boundary';

const leafGeometry = new THREE.SphereGeometry(1, 10, 7);
const petalGeometry = new THREE.SphereGeometry(1, 12, 9);
const stemGeometry = new THREE.CylinderGeometry(0.014, 0.021, 0.7, 7);
const seedGeometry = new THREE.SphereGeometry(0.012, 6, 5);
const stoneShape = new THREE.Shape();
stoneShape.moveTo(-0.4, -0.22);
stoneShape.lineTo(-0.22, -0.31);
stoneShape.lineTo(0.27, -0.28);
stoneShape.lineTo(0.4, -0.08);
stoneShape.lineTo(0.34, 0.22);
stoneShape.lineTo(0.12, 0.31);
stoneShape.lineTo(-0.29, 0.26);
stoneShape.lineTo(-0.41, 0.04);
stoneShape.closePath();
const stoneGeometry = new THREE.ExtrudeGeometry(stoneShape, {
  depth: 0.12,
  bevelEnabled: true,
  bevelSegments: 2,
  steps: 1,
  bevelSize: 0.035,
  bevelThickness: 0.035,
});
stoneGeometry.translate(0, 0, -0.06);

export function buildGarden(materials: ExteriorMaterials): THREE.Group {
  const group = new THREE.Group();

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), materials.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  ground.position.y = -0.035;
  group.add(ground);

  // The stepping stones begin at the front door and travel toward the viewer.
  // This keeps the route in front of the facade instead of hidden inside the house.
  const path = [
    [-0.9, 1.98], [-0.66, 2.78], [-0.98, 3.58], [-0.74, 4.38], [-1.03, 5.2], [-0.78, 6.02],
  ] as const;
  path.forEach(([x, z], index) => {
    const stone = new THREE.Mesh(stoneGeometry, materials.stone);
    stone.rotation.x = -Math.PI / 2;
    stone.position.set(x, 0.035, z);
    stone.rotation.y = [-0.12, 0.08, -0.04, 0.14, -0.09, 0.1][index];
    stone.scale.set(1 + (index % 2) * 0.08, 1, 0.94 + (index % 3) * 0.04);
    stone.castShadow = true;
    stone.receiveShadow = true;
    group.add(stone);
  });

  // Matching long planters are mirrored about the path centre x = -0.87.
  for (const x of [-2.37, 0.63]) {
    const planter = createFlowerPlanter(materials);
    planter.position.set(x, 0, 3.14);
    group.add(planter);
  }

  addGardenContext(group, materials);
  batchStaticMeshes(group);

  return group;
}

function createFlowerPlanter(materials: ExteriorMaterials): THREE.Group {
  const planter = new THREE.Group();
  const ceramic = materials.roof;
  const wallGeometry = new RoundedBoxGeometry(2.10, 0.42, 0.09, 2, 0.035);
  for (const z of [-0.40, 0.40]) {
    const wall = new THREE.Mesh(wallGeometry, ceramic);
    wall.position.set(0, 0.24, z);
    wall.castShadow = wall.receiveShadow = true;
    planter.add(wall);
  }
  const endGeometry = new RoundedBoxGeometry(0.09, 0.42, 0.80, 2, 0.035);
  for (const x of [-1.0, 1.0]) {
    const end = new THREE.Mesh(endGeometry, ceramic);
    end.position.set(x, 0.24, 0);
    end.castShadow = end.receiveShadow = true;
    planter.add(end);
  }
  const soil = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.06, 0.70), materials.flowerBed);
  soil.position.y = 0.37;
  soil.receiveShadow = true;
  planter.add(soil);
  const rimGeometry = new RoundedBoxGeometry(2.18, 0.075, 0.12, 2, 0.025);
  for (const z of [-0.40, 0.40]) {
    const rim = new THREE.Mesh(rimGeometry, ceramic);
    rim.position.set(0, 0.46, z);
    rim.castShadow = rim.receiveShadow = true;
    planter.add(rim);
  }
  const rimEndGeometry = new RoundedBoxGeometry(0.12, 0.075, 0.78, 2, 0.025);
  for (const x of [-1.03, 1.03]) {
    const rim = new THREE.Mesh(rimEndGeometry, ceramic);
    rim.position.set(x, 0.46, 0);
    planter.add(rim);
  }
  const roses = createRoseCluster(materials);
  roses.scale.setScalar(0.70);
  roses.position.set(-0.30, 0.40, 0.18);
  planter.add(roses);
  const tulips = createTulipCluster(materials);
  tulips.scale.setScalar(0.76);
  tulips.position.set(0.32, 0.40, 0.15);
  planter.add(tulips);
  const sunflowers = createSunflowerCluster(materials);
  sunflowers.scale.setScalar(0.66);
  sunflowers.position.set(-0.23, 0.40, -0.19);
  planter.add(sunflowers);
  return planter;
}

function createRoseCluster(materials: ExteriorMaterials): THREE.Group {
  const cluster = new THREE.Group();
  const positions = [[-0.42, 0.08], [0, 0], [0.4, 0.12], [0.78, -0.03]] as const;
  for (let i = 0; i < positions.length; i++) {
    const [x, z] = positions[i];
    const height = 0.54 + (i % 2) * 0.08;
    const stem = new THREE.Mesh(stemGeometry, materials.foliageDeep);
    stem.position.set(x, height * 0.5, z);
    stem.scale.y = height / 0.7;
    cluster.add(stem);
    addLeaves(cluster, materials, x, height * 0.42, z, 0.22);
    addRoseHead(cluster, materials, x, height, z, i % 2 ? materials.flowerRose : materials.flowerTulip);
  }
  return cluster;
}

function addRoseHead(
  group: THREE.Group,
  materials: ExteriorMaterials,
  x: number,
  y: number,
  z: number,
  color: THREE.Material,
): void {
  const head = new THREE.Group();
  head.position.set(x, y, z);
  for (let ring = 0; ring < 2; ring++) {
    const count = ring === 0 ? 5 : 4;
    const radius = ring === 0 ? 0.105 : 0.055;
    for (let i = 0; i < count; i++) {
      const petal = new THREE.Mesh(petalGeometry, color);
      const angle = (i / count) * Math.PI * 2 + ring * 0.38;
      petal.position.set(Math.cos(angle) * radius, ring === 0 ? 0 : 0.035, Math.sin(angle) * radius + 0.025);
      petal.rotation.z = -angle * 0.35;
      petal.rotation.y = Math.sin(angle) * 0.3;
      petal.scale.set(ring === 0 ? 0.12 : 0.09, ring === 0 ? 0.105 : 0.08, 0.055);
      petal.castShadow = true;
      head.add(petal);
    }
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), materials.flowerRose);
  center.position.set(0, 0.04, 0.085);
  head.add(center);
  group.add(head);
}

function createTulipCluster(materials: ExteriorMaterials): THREE.Group {
  const cluster = new THREE.Group();
  const flowerPositions = [[-0.5, 0.06], [-0.16, -0.1], [0.18, 0.1], [0.52, -0.04]] as const;
  for (let i = 0; i < flowerPositions.length; i++) {
    const [x, z] = flowerPositions[i];
    const height = 0.62 + (i % 3) * 0.09;
    const stem = new THREE.Mesh(stemGeometry, materials.foliageDeep);
    stem.position.set(x, height * 0.5, z);
    stem.scale.y = height / 0.7;
    cluster.add(stem);
    addLeaves(cluster, materials, x, height * 0.42, z, 0.28);
    addTulipHead(cluster, materials, x, height, z, i % 3 === 0 ? materials.flowerRose : materials.flowerTulip);
  }
  return cluster;
}

function addTulipHead(
  group: THREE.Group,
  materials: ExteriorMaterials,
  x: number,
  y: number,
  z: number,
  color: THREE.Material,
): void {
  const head = new THREE.Group();
  head.position.set(x, y, z);
  const petals = 5;
  for (let i = 0; i < petals; i++) {
    const angle = (i / petals) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeometry, color);
    petal.position.set(Math.sin(angle) * 0.065, 0.085, Math.cos(angle) * 0.065);
    petal.rotation.y = angle;
    petal.rotation.z = -Math.cos(angle) * 0.18;
    petal.rotation.x = Math.sin(angle) * 0.18;
    petal.scale.set(0.078, 0.15, 0.065);
    petal.castShadow = true;
    head.add(petal);
  }
  for (let i = 0; i < 3; i++) {
    const sepal = new THREE.Mesh(petalGeometry, materials.foliageDeep);
    sepal.position.set(Math.sin(i * Math.PI * 2 / 3) * 0.04, -0.025, Math.cos(i * Math.PI * 2 / 3) * 0.04);
    sepal.rotation.y = i * Math.PI * 2 / 3;
    sepal.rotation.z = (i - 1) * 0.25;
    sepal.scale.set(0.045, 0.09, 0.035);
    head.add(sepal);
  }
  group.add(head);
}

function createSunflowerCluster(materials: ExteriorMaterials): THREE.Group {
  const cluster = new THREE.Group();
  const flowerPositions = [[-0.32, 0], [0.26, 0.18], [0.74, -0.06]] as const;
  for (let flower = 0; flower < flowerPositions.length; flower++) {
    const [x, z] = flowerPositions[flower];
    const height = flower === 1 ? 1.02 : 0.84;
    const stem = new THREE.Mesh(stemGeometry, materials.foliageDeep);
    stem.position.set(x, height * 0.5, z);
    stem.scale.y = height / 0.7;
    cluster.add(stem);
    addLeaves(cluster, materials, x, height * 0.43, z, 0.3);

    const head = new THREE.Group();
    head.position.set(x, height, z);
    for (let petal = 0; petal < 12; petal++) {
      const angle = (petal / 12) * Math.PI * 2;
      const ray = new THREE.Mesh(petalGeometry, materials.flowerSunflower);
      ray.position.set(Math.sin(angle) * 0.18, Math.cos(angle) * 0.18, 0);
      ray.rotation.z = -angle;
      ray.scale.set(0.045, 0.135, 0.024);
      ray.castShadow = true;
      head.add(ray);
    }
    const center = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.15, 0.055, 20), materials.flowerCenter);
    center.rotation.x = Math.PI / 2;
    center.position.z = 0.03;
    center.castShadow = true;
    head.add(center);
    for (let seed = 0; seed < 9; seed++) {
      const angle = seed * 2.4;
      const radius = 0.035 + (seed % 3) * 0.035;
      const dot = new THREE.Mesh(seedGeometry, materials.wood);
      dot.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.062);
      head.add(dot);
    }
    cluster.add(head);
  }
  return cluster;
}

function addGardenContext(group: THREE.Group, materials: ExteriorMaterials): void {
  let state = 2010;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const dummy = new THREE.Object3D();
  group.add(buildBoundary(materials));

  const shrubGeometry = new THREE.IcosahedronGeometry(1, 2);
  const vertices = shrubGeometry.getAttribute('position');
  for (let i = 0; i < vertices.count; i++) {
    const factor = 0.9 + random() * 0.19;
    vertices.setXYZ(i, vertices.getX(i) * factor, vertices.getY(i) * factor, vertices.getZ(i) * factor);
  }
  shrubGeometry.computeVertexNormals();
  const shrubs = new THREE.InstancedMesh(shrubGeometry, materials.foliage, 28);
  for (let i = 0; i < 28; i++) {
    dummy.position.set(-4.6 + i * 0.35, 0.29 + random() * 0.1, -3.1 + random() * 0.15);
    dummy.rotation.set(random(), random() * Math.PI, random() * 0.2);
    dummy.scale.set(0.38 + random() * 0.1, 0.30 + random() * 0.16, 0.38);
    dummy.updateMatrix();
    shrubs.setMatrixAt(i, dummy.matrix);
  }
  shrubs.castShadow = true;
  shrubs.receiveShadow = true;
  group.add(shrubs);

  const blade = new THREE.BufferGeometry();
  blade.setAttribute('position', new THREE.Float32BufferAttribute([
    -0.018, 0, 0, 0.018, 0, 0, -0.014, 0.14, 0.015,
    0.014, 0.14, 0.015, 0.035, 0.30, 0.035,
  ], 3));
  blade.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]);
  blade.computeVertexNormals();
  const grassMaterial = materials.foliageLight.clone();
  grassMaterial.side = THREE.DoubleSide;
  const grass = new THREE.InstancedMesh(blade, grassMaterial, 2700);
  let count = 0;
  for (let i = 0; i < 900; i++) {
    const x = -4.5 + random() * 9.0;
    const z = -3.0 + random() * 9.5;
    if ((x > -3.05 && x < 1.85 && z > -1.95 && z < 1.96) ||
        (Math.abs(x + 0.85) < 0.57 && z > 1.8)) continue;
    for (let j = 0; j < 3; j++) {
      dummy.position.set(x + j * 0.024, -0.025, z);
      dummy.rotation.set(0, random() * Math.PI * 2, (random() - 0.5) * 0.3);
      const size = 0.23 + random() * 0.47;
      dummy.scale.set(size, size, size);
      dummy.updateMatrix();
      grass.setMatrixAt(count++, dummy.matrix);
    }
  }
  grass.count = count;
  grass.receiveShadow = true;
  group.add(grass);
}

/** Bake static flower/stone transforms and batch by material and shadow behavior. */
function batchStaticMeshes(group: THREE.Group): void {
  group.updateWorldMatrix(true, true);
  const batches = new Map<string, { material: THREE.Material; cast: boolean; receive: boolean; geometries: THREE.BufferGeometry[] }>();
  const sources: THREE.Mesh[] = [];
  const originalGeometries = new Set<THREE.BufferGeometry>();
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || object instanceof THREE.InstancedMesh || Array.isArray(object.material)) return;
    const key = `${object.material.uuid}:${object.castShadow}:${object.receiveShadow}`;
    const entry = batches.get(key) ?? { material: object.material, cast: object.castShadow, receive: object.receiveShadow, geometries: [] as THREE.BufferGeometry[] };
    const transformed = object.geometry.clone().applyMatrix4(object.matrixWorld);
    const geometry = transformed.index ? transformed.toNonIndexed() : transformed;
    if (geometry !== transformed) transformed.dispose();
    // Every garden primitive has these attributes; grass stays instanced above.
    for (const name of Object.keys(geometry.attributes)) {
      if (!['position', 'normal', 'uv'].includes(name)) geometry.deleteAttribute(name);
    }
    entry.geometries.push(geometry);
    batches.set(key, entry);
    sources.push(object);
    originalGeometries.add(object.geometry);
  });
  for (const source of sources) source.removeFromParent();
  for (const entry of batches.values()) {
    const merged = mergeGeometries(entry.geometries);
    if (merged) {
      const mesh = new THREE.Mesh(merged, entry.material);
      mesh.castShadow = entry.cast;
      mesh.receiveShadow = entry.receive;
      group.add(mesh);
    }
    for (const geometry of entry.geometries) geometry.dispose();
  }
  for (const geometry of originalGeometries) geometry.dispose();
}

function addLeaves(group: THREE.Group, materials: ExteriorMaterials, x: number, y: number, z: number, spread: number): void {
  for (let side = -1; side <= 1; side += 2) {
    const leaf = new THREE.Mesh(leafGeometry, side === 1 ? materials.foliage : materials.foliageLight);
    leaf.position.set(x + side * spread * 0.34, y, z + side * spread * 0.2);
    leaf.scale.set(spread * 0.2, spread * 0.72, spread * 0.13);
    leaf.rotation.z = side * -0.52;
    group.add(leaf);
  }
}
