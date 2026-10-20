import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeObjectResources } from '../dispose-object-resources';

export interface ImportedExterior {
  group: THREE.Group;
  windowTarget: THREE.Object3D;
  swayTargets: THREE.Object3D[];
}

export async function loadExteriorModel(url: string, signal: AbortSignal): Promise<ImportedExterior> {
  const address = new URL(url, window.location.href);
  if (address.origin !== window.location.origin) throw new Error('Exterior must be a local asset.');
  const response = await fetch(address, { signal });
  if (!response.ok) throw new Error(`Exterior asset returned HTTP ${response.status}.`);
  const buffer = await response.arrayBuffer();
  signal.throwIfAborted();

  // The production GLB is packed. Any external URI indicates an invalid export.
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((resource) => {
    if (!resource.startsWith('blob:') && !resource.startsWith('data:')) {
      throw new Error('Exterior GLB contains an unpacked resource.');
    }
    return resource;
  });
  const parsing = new GLTFLoader(manager).parseAsync(buffer, '');
  const group = await new Promise<THREE.Group>((resolve, reject) => {
    let settled = false;
    const abort = () => {
      if (settled) return;
      settled = true;
      reject(signal.reason ?? new DOMException('Exterior load aborted.', 'AbortError'));
    };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    parsing.then((gltf) => {
      signal.removeEventListener('abort', abort);
      if (settled) {
        disposeObjectResources([gltf.scene]);
        return;
      }
      settled = true;
      resolve(gltf.scene);
    }, (error: unknown) => {
      signal.removeEventListener('abort', abort);
      if (settled) return;
      settled = true;
      reject(error);
    });
  });
  try {
    signal.throwIfAborted();
    const required = ['house', 'roof', 'upper_window', 'tree_structure', 'tree_sway', 'window_target'];
    const nodes = new Map<string, THREE.Object3D[]>();
    let meshes = 0;
    group.traverse((object) => {
      const entries = nodes.get(object.name) ?? [];
      entries.push(object);
      nodes.set(object.name, entries);
      if (![...object.position, ...object.quaternion, ...object.scale].every(Number.isFinite)) {
        throw new Error(`Invalid exterior transform: ${object.name}`);
      }
      if (object instanceof THREE.Mesh) {
        if (!object.geometry.getAttribute('position')?.count) throw new Error('Exterior contains an empty mesh.');
        meshes++;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        object.castShadow = !materials.some((material) => material.transparent);
        object.receiveShadow = true;
      }
    });
    for (const name of required) {
      if (nodes.get(name)?.length !== 1) throw new Error(`Exterior requires one ${name} node.`);
      if (name !== 'window_target') {
        let geometryCount = 0;
        nodes.get(name)![0].traverse((child) => {
          if (child instanceof THREE.Mesh) geometryCount++;
        });
        if (!geometryCount) throw new Error(`Exterior ${name} node has no geometry.`);
      }
    }
    if (!meshes) throw new Error('Exterior has no renderable geometry.');
    const windowTarget = nodes.get('window_target')![0];
    const sway = nodes.get('tree_sway')![0];
    for (let ancestor: THREE.Object3D | null = windowTarget; ancestor; ancestor = ancestor.parent) {
      if (ancestor === sway) throw new Error('Window target cannot move with foliage.');
    }
    return { group, windowTarget, swayTargets: [sway] };
  } catch (error) {
    disposeObjectResources([group]);
    throw error;
  }
}
