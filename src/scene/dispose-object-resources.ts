import * as THREE from 'three';

function collect(roots: readonly THREE.Object3D[]) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  for (const root of roots) {
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        materials.add(material);
        for (const value of Object.values(material)) {
          if (value instanceof THREE.Texture) textures.add(value);
        }
      }
    });
  }
  return { geometries, materials, textures };
}

/** Retire a subtree without releasing resources that the remaining scene shares. */
export function disposeObjectResources(
  roots: readonly THREE.Object3D[],
  retainedRoots: readonly THREE.Object3D[] = [],
): void {
  const retired = collect(roots);
  const retained = collect(retainedRoots);
  const retainedImages = new Set([...retained.textures].map((texture) => texture.source.data));
  const closedImages = new Set<ImageBitmap>();
  for (const geometry of retired.geometries) {
    if (!retained.geometries.has(geometry)) geometry.dispose();
  }
  for (const texture of retired.textures) {
    if (retained.textures.has(texture)) continue;
    const data: unknown = texture.source.data;
    texture.dispose();
    if (typeof ImageBitmap !== 'undefined' && data instanceof ImageBitmap &&
        !retainedImages.has(data) && !closedImages.has(data)) {
      data.close();
      closedImages.add(data);
    }
  }
  for (const material of retired.materials) {
    if (!retained.materials.has(material)) material.dispose();
  }
}
