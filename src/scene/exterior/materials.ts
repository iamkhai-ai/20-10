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
  foliageLight: THREE.MeshStandardMaterial;
  foliageDeep: THREE.MeshStandardMaterial;
  flowerBed: THREE.MeshStandardMaterial;
  shutter: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  flowerRose: THREE.MeshStandardMaterial;
  flowerTulip: THREE.MeshStandardMaterial;
  flowerSunflower: THREE.MeshStandardMaterial;
  flowerCenter: THREE.MeshStandardMaterial;
}

export function createExteriorMaterials(): ExteriorMaterials {
  return {
    plaster: new THREE.MeshStandardMaterial({ color: 0xf6ead9, map: createPlasterMap(), roughness: 0.9 }),
    roof: new THREE.MeshStandardMaterial({ color: 0xa85f48, map: createRoofMap(), roughness: 0.84 }),
    trim: new THREE.MeshStandardMaterial({ color: 0xd5bfa4, roughness: 0.72, metalness: 0.02 }),
    wood: new THREE.MeshStandardMaterial({ color: 0xb8926a, roughness: 0.76, metalness: 0.02 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xf1e8d8,
      roughness: 0.22,
      transmission: 0.28,
      thickness: 0.025,
      transparent: true,
      opacity: 0.45,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
    curtain: new THREE.MeshStandardMaterial({ color: 0xf1dfc5, roughness: 0.94, side: THREE.DoubleSide }),
    interiorGlow: new THREE.MeshStandardMaterial({
      color: 0x81583f,
      emissive: 0xad6842,
      emissiveIntensity: 0.22,
      roughness: 1,
    }),
    ground: new THREE.MeshStandardMaterial({ color: 0x8b9a75, map: createGroundMap(), roughness: 0.97 }),
    stone: new THREE.MeshStandardMaterial({ color: 0xd5bfa4, roughness: 0.86 }),
    foliage: new THREE.MeshStandardMaterial({ color: 0x71865c, roughness: 0.88 }),
    foliageLight: new THREE.MeshStandardMaterial({ color: 0x9eaa77, roughness: 0.9 }),
    foliageDeep: new THREE.MeshStandardMaterial({ color: 0x4c6445, roughness: 0.92 }),
    flowerBed: new THREE.MeshStandardMaterial({ color: 0x5d513d, roughness: 1 }),
    shutter: new THREE.MeshStandardMaterial({ color: 0x758766, roughness: 0.88 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc69855, roughness: 0.38, metalness: 0.36 }),
    flowerRose: new THREE.MeshStandardMaterial({ color: 0xd98591, roughness: 0.72 }),
    flowerTulip: new THREE.MeshStandardMaterial({ color: 0xd98591, roughness: 0.7, side: THREE.DoubleSide }),
    flowerSunflower: new THREE.MeshStandardMaterial({ color: 0xe9b969, roughness: 0.74, side: THREE.DoubleSide }),
    flowerCenter: new THREE.MeshStandardMaterial({ color: 0x76553a, roughness: 0.9 }),
  };
}

function createPlasterMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);
  const image = context.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const grain = 246 + ((x * 17 + y * 31 + x * y * 7) % 10);
      image.data[i] = grain;
      image.data[i + 1] = grain;
      image.data[i + 2] = grain;
      image.data[i + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

function createRoofMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let row = 0; row < 8; row++) {
    const y = row * 32;
    const offset = row % 2 ? -32 : 0;
    context.strokeStyle = 'rgba(72, 34, 24, 0.16)';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, y + 30);
    context.lineTo(256, y + 30);
    context.stroke();
    for (let col = -1; col < 5; col++) {
      const x = col * 64 + offset;
      context.strokeStyle = 'rgba(255, 241, 213, 0.13)';
      context.lineWidth = 1.5;
      context.beginPath();
      context.moveTo(x + 2, y + 3);
      context.quadraticCurveTo(x + 32, y - 2, x + 62, y + 3);
      context.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 3);
  return texture;
}

function createGroundMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 1800; i++) {
    const x = (i * 73) % canvas.width;
    const y = (i * 127) % canvas.height;
    const radius = 0.5 + (i % 4) * 0.45;
    context.fillStyle = i % 3 === 0 ? 'rgba(75, 91, 57, 0.035)' : 'rgba(245, 230, 196, 0.045)';
    context.beginPath();
    context.ellipse(x, y, radius, radius * 0.55, (i % 7) * 0.3, 0, Math.PI * 2);
    context.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(90, 90);
  return texture;
}
