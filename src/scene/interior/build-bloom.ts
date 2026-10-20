import * as THREE from 'three';
import type { BedroomWateringRig } from './build-bedroom';
import { giftMessage } from '../../content/gift-message';

export const bloomDuration = 4400;
export interface BloomView {
  group: THREE.Group;
  card: THREE.Group;
  setProgress(elapsed: number): void;
  dispose(): void;
}

const smooth = (value: number) => { const t = THREE.MathUtils.clamp(value, 0, 1); return t * t * (3 - 2 * t); };

function petalGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [], colors: number[] = [], indices: number[] = [];
  const rows = 16, columns = 12;
  for (let j = 0; j <= rows; j++) {
    const v = j / rows;
    const width = Math.pow(Math.sin(Math.PI * v), 0.62) * 0.047 + 0.001;
    for (let i = 0; i <= columns; i++) {
      const u = i / columns * 2 - 1;
      vertices.push(u * width, v * 0.132 - u * u * 0.008 * Math.sin(Math.PI * v),
        0.008 + Math.sin(v * Math.PI * 0.85) * 0.035 + u * u * 0.012 * Math.sin(Math.PI * v));
      const vein = Math.cos(u * Math.PI * 8) * 0.015;
      const shade = 0.72 + v * 0.27 + vein;
      colors.push(shade, shade, shade);
      if (j < rows && i < columns) {
        const a = j * (columns + 1) + i, b = a + columns + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function leafGeometry(): THREE.BufferGeometry {
  const positions: number[] = [], indices: number[] = [];
  for (let j = 0; j <= 16; j++) {
    const v = j / 16, width = Math.sin(Math.PI * v) * 0.026;
    for (let i = 0; i < 3; i++) {
      const u = i - 1;
      positions.push(u * width, v * 0.27, v * v * 0.12 + Math.abs(u) * 0.009);
      if (j < 16 && i < 2) { const a = j * 3 + i; indices.push(a, a + 3, a + 1, a + 3, a + 4, a + 1); }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals(); return geometry;
}

function cardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 512;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Paper texture is unavailable.');
  ctx.fillStyle = '#fcf4e5'; ctx.fillRect(0, 0, 768, 512);
  ctx.strokeStyle = '#c8a66e'; ctx.lineWidth = 3; ctx.strokeRect(26, 26, 716, 460);
  ctx.lineWidth = 1; ctx.strokeRect(37, 37, 694, 438);
  ctx.textAlign = 'center'; ctx.fillStyle = '#925c69'; ctx.font = '104px Georgia, serif';
  ctx.fillText(giftMessage.date, 384, 250);
  ctx.fillStyle = '#4d6755'; ctx.font = 'italic 38px Georgia, serif'; ctx.fillText(giftMessage.cardCaption, 384, 328);
  // A small pressed-tulip mark, drawn into the paper rather than a new mesh.
  ctx.strokeStyle = '#6d8763'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(384, 164); ctx.lineTo(384, 112); ctx.stroke();
  ctx.fillStyle = '#d39ca6'; ctx.beginPath(); ctx.moveTo(361, 90); ctx.quadraticCurveTo(384, 148, 407, 90);
  ctx.lineTo(396, 98); ctx.lineTo(384, 82); ctx.lineTo(372, 98); ctx.closePath(); ctx.fill();
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4; return texture;
}

export function createBloomView(rig: BedroomWateringRig, camera: THREE.PerspectiveCamera): BloomView {
  const texture = cardTexture();
  const group = new THREE.Group(); group.name = 'bloom-bouquet'; group.visible = false;
  rig.soilTarget.getWorldPosition(group.position); rig.room.worldToLocal(group.position);
  const restScale = rig.plant.scale.clone(), restVisible = rig.plant.visible;
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  const ownGeometry = <T extends THREE.BufferGeometry>(value: T): T => { geometries.add(value); return value; };
  const ownMaterial = <T extends THREE.Material>(value: T): T => { materials.add(value); return value; };
  const petals = ownGeometry(petalGeometry()), leaf = ownGeometry(leafGeometry());
  const greens = ownMaterial(new THREE.MeshStandardMaterial({ color: 0x66834e, roughness: 0.68, side: THREE.DoubleSide }));
  const shades = [0xd68a9c, 0xf0d4b0, 0xc96e87].map(color => ownMaterial(new THREE.MeshPhysicalMaterial({
    color, roughness: 0.48, side: THREE.DoubleSide, vertexColors: true, sheen: 0.45, sheenRoughness: 0.7, sheenColor: 0xf8d9d5,
  })));
  const flowers: { stem: THREE.Mesh; head: THREE.Group; leaves: THREE.Mesh[]; petals: THREE.Mesh[]; height: number }[] = [];
  const layout = [[-.08,-.04,.38,-.06],[.06,-.07,.46,.055],[-.02,-.015,.51,-.01],[.09,.05,.30,.055],[-.07,.08,.29,-.07]];
  for (const [i, [x, z, height, lean]] of layout.entries()) {
    const flower = new THREE.Group(); flower.name = `bloom-tulip-${i}`; flower.position.set(x, 0, z);
    const curve = new THREE.CubicBezierCurve3(new THREE.Vector3(), new THREE.Vector3(0, height * .35, 0),
      new THREE.Vector3(lean, height * .72, -.01), new THREE.Vector3(lean, height, -.015));
    const stem = new THREE.Mesh(ownGeometry(new THREE.TubeGeometry(curve, 18, .0045, 7, false)), greens); flower.add(stem);
    const leaves: THREE.Mesh[] = [];
    for (let k = 0; k < 2; k++) {
      const blade = new THREE.Mesh(leaf, greens); blade.position.y = .03 + k * .065;
      blade.rotation.set(.1, (i * 1.8 + k * Math.PI), .1); blade.scale.setScalar(k ? .78 : 1);
      leaves.push(blade); flower.add(blade);
    }
    const head = new THREE.Group(); head.position.set(lean, height, -.015); flower.add(head);
    const flowerPetals: THREE.Mesh[] = [];
    for (let k = 0; k < 6; k++) {
      const hinge = new THREE.Group(); hinge.rotation.y = k * Math.PI / 3;
      const petal = new THREE.Mesh(petals, shades[i % 3]); petal.name = 'tulip-petal';
      if (k % 2) petal.scale.setScalar(.92);
      hinge.add(petal); head.add(hinge); flowerPetals.push(petal);
    }
    group.add(flower); flowers.push({ stem, head, leaves, petals: flowerPetals, height });
  }
  const card = new THREE.Group(); card.name = 'bloom-card'; card.position.set(0, .35, .10); card.visible = false;
  const shape = new THREE.Shape(); const w = .25, h = .18, r = .009;
  shape.moveTo(-w/2+r,-h/2); shape.lineTo(w/2-r,-h/2); shape.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);
  shape.lineTo(w/2,h/2-r); shape.quadraticCurveTo(w/2,h/2,w/2-r,h/2); shape.lineTo(-w/2+r,h/2);
  shape.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r); shape.lineTo(-w/2,-h/2+r); shape.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);
  const stock = new THREE.Mesh(ownGeometry(new THREE.ExtrudeGeometry(shape, { depth: .003, bevelEnabled: false })),
    ownMaterial(new THREE.MeshStandardMaterial({ color: 0xf8ebd4, roughness: .85 })));
  const front = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(w-.006,h-.006)),
    ownMaterial(new THREE.MeshStandardMaterial({ map: texture, roughness: .86, side: THREE.DoubleSide })));
  front.position.z = .0035; card.add(stock, front); group.add(card);
  rig.room.add(group);
  const cameraPosition = new THREE.Vector3(); let disposed = false;
  return {
    group, card,
    setProgress(elapsed) {
      if (disposed) return;
      group.visible = true;
      const seed = 1 - smooth(elapsed / 1000); rig.plant.scale.copy(restScale).multiplyScalar(Math.max(.001, seed));
      rig.plant.visible = seed > .001 && restVisible;
      for (let i = 0; i < flowers.length; i++) {
        const flower = flowers[i];
        const grow = smooth((elapsed - i * 130) / 1400);
        flower.stem.scale.y = Math.max(.001, grow);
        flower.head.position.y = flower.height * grow;
        const bud = smooth((elapsed - 700 - i * 130) / 800);
        flower.head.scale.setScalar(Math.max(.001, bud)); flower.head.visible = bud > 0;
        for (const blade of flower.leaves) blade.scale.y = Math.max(.001, grow);
        const open = smooth((elapsed - 1700 - i * 160) / 1400);
        for (let k = 0; k < flower.petals.length; k++) flower.petals[k].rotation.x = open * (k % 2 ? .32 : .54);
      }
      const reveal = smooth((elapsed - 3450) / 950); card.visible = reveal > 0;
      card.scale.setScalar(Math.max(.001, reveal)); card.position.y = .29 + reveal * .06;
      camera.getWorldPosition(cameraPosition); card.lookAt(cameraPosition); card.rotateZ((1-reveal) * -.12);
    },
    dispose() {
      if (disposed) return; disposed = true; group.removeFromParent();
      rig.plant.scale.copy(restScale); rig.plant.visible = restVisible;
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose(); texture.dispose();
    },
  };
}
