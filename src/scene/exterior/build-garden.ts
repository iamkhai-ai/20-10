import * as THREE from 'three';
import type { ExteriorMaterials } from './materials';

export function buildGarden(materials: ExteriorMaterials): THREE.Group {
  const group = new THREE.Group();

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(22, 22), materials.ground);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  const stoneGeometry = new THREE.BoxGeometry(0.75, 0.12, 0.55);
  const pathPositions = [
    [0, 0.06, 1.1],
    [-0.18, 0.06, 0.35],
    [0.15, 0.06, -0.4],
    [-0.1, 0.06, -1.15],
    [0.08, 0.06, -1.9],
    [-0.12, 0.06, -2.65],
  ];
  for (const [x, y, z] of pathPositions) {
    const stone = new THREE.Mesh(stoneGeometry, materials.stone);
    stone.position.set(x, y, z);
    stone.rotation.y = (Math.random() - 0.5) * 0.35;
    stone.receiveShadow = true;
    stone.castShadow = true;
    group.add(stone);
  }

  const roseCluster = createRoseCluster(materials);
  roseCluster.position.set(-1.9, 0, -0.4);
  group.add(roseCluster);

  const tulipCluster = createTulipCluster(materials);
  tulipCluster.position.set(2.0, 0, -0.8);
  group.add(tulipCluster);

  const sunflowerCluster = createSunflowerCluster(materials);
  sunflowerCluster.position.set(-1.2, 0, -2.1);
  group.add(sunflowerCluster);

  return group;
}

function createRoseCluster(materials: ExteriorMaterials): THREE.Group {
  const cluster = new THREE.Group();
  const petalGeometry = new THREE.SphereGeometry(0.18, 12, 8);
  const stemGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.55, 8);
  for (let i = 0; i < 5; i++) {
    const stem = new THREE.Mesh(stemGeometry, materials.foliage);
    stem.position.set(i * 0.28 - 0.56, 0.275, (i % 2) * 0.18 - 0.09);
    cluster.add(stem);
    for (let j = 0; j < 4; j++) {
      const petal = new THREE.Mesh(petalGeometry, materials.flowerRose);
      petal.position.set(i * 0.28 - 0.56, 0.62 + j * 0.05, (i % 2) * 0.18 - 0.09);
      petal.scale.set(0.85, 0.65, 0.85);
      cluster.add(petal);
    }
  }
  return cluster;
}

function createTulipCluster(materials: ExteriorMaterials): THREE.Group {
  const cluster = new THREE.Group();
  const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.62, 8);
  const cupGeometry = new THREE.ConeGeometry(0.16, 0.34, 8);
  for (let i = 0; i < 4; i++) {
    const stem = new THREE.Mesh(stemGeometry, materials.foliage);
    stem.position.set(i * 0.3 - 0.45, 0.31, (i % 2) * 0.22 - 0.11);
    cluster.add(stem);
    const cup = new THREE.Mesh(cupGeometry, materials.flowerTulip);
    cup.position.set(i * 0.3 - 0.45, 0.78, (i % 2) * 0.22 - 0.11);
    cluster.add(cup);
  }
  return cluster;
}

function createSunflowerCluster(materials: ExteriorMaterials): THREE.Group {
  const cluster = new THREE.Group();
  const stemGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.75, 8);
  const discGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.08, 16);
  const petalGeometry = new THREE.BoxGeometry(0.08, 0.03, 0.34);
  for (let i = 0; i < 3; i++) {
    const stem = new THREE.Mesh(stemGeometry, materials.foliage);
    stem.position.set(i * 0.45 - 0.45, 0.375, i * 0.15 - 0.15);
    cluster.add(stem);
    const disc = new THREE.Mesh(discGeometry, materials.flowerCenter);
    disc.position.set(i * 0.45 - 0.45, 0.82, i * 0.15 - 0.15);
    disc.rotation.x = Math.PI / 2;
    cluster.add(disc);
    for (let j = 0; j < 10; j++) {
      const angle = (j / 10) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeometry, materials.flowerSunflower);
      petal.position.set(i * 0.45 - 0.45 + Math.cos(angle) * 0.28, 0.82, i * 0.15 - 0.15 + Math.sin(angle) * 0.28);
      petal.rotation.y = -angle;
      cluster.add(petal);
    }
  }
  return cluster;
}
