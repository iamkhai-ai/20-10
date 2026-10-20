import * as THREE from 'three';

export interface ExteriorMaterials {
  plaster: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  glass: THREE.MeshPhysicalMaterial;
  curtain: THREE.MeshStandardMaterial;
  interiorGlow: THREE.MeshStandardMaterial;
  ground: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  foliage: THREE.MeshStandardMaterial;
  flowerRose: THREE.MeshStandardMaterial;
  flowerTulip: THREE.MeshStandardMaterial;
  flowerSunflower: THREE.MeshStandardMaterial;
  flowerCenter: THREE.MeshStandardMaterial;
}

export function createExteriorMaterials(): ExteriorMaterials {
  return {
    plaster: new THREE.MeshStandardMaterial({ color: 0xf3e6d3, roughness: 0.88, metalness: 0.02 }),
    roof: new THREE.MeshStandardMaterial({ color: 0xa85f48, roughness: 0.78, metalness: 0.03 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xd5bfa4, roughness: 0.72, metalness: 0.02 }),
    wood: new THREE.MeshStandardMaterial({ color: 0xb8926a, roughness: 0.76, metalness: 0.02 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xaed6f1,
      roughness: 0.08,
      transmission: 0.72,
      thickness: 0.08,
      transparent: true,
      opacity: 0.55,
      envMapIntensity: 0.8,
    }),
    curtain: new THREE.MeshStandardMaterial({ color: 0x81936d, roughness: 0.9, side: THREE.DoubleSide }),
    interiorGlow: new THREE.MeshStandardMaterial({
      color: 0xe9b969,
      emissive: 0xe9b969,
      emissiveIntensity: 0.75,
      roughness: 1,
    }),
    ground: new THREE.MeshStandardMaterial({ color: 0x8fa07a, roughness: 0.95 }),
    stone: new THREE.MeshStandardMaterial({ color: 0xd5bfa4, roughness: 0.86 }),
    foliage: new THREE.MeshStandardMaterial({ color: 0x81936d, roughness: 0.84 }),
    flowerRose: new THREE.MeshStandardMaterial({ color: 0xd98591, roughness: 0.72 }),
    flowerTulip: new THREE.MeshStandardMaterial({ color: 0xe9b969, roughness: 0.72 }),
    flowerSunflower: new THREE.MeshStandardMaterial({ color: 0xf3e6d3, roughness: 0.72 }),
    flowerCenter: new THREE.MeshStandardMaterial({ color: 0x34463a, roughness: 0.8 }),
  };
}
