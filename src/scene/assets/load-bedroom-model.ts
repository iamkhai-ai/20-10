import * as THREE from 'three';
import { loadPackedGlb } from './load-packed-glb';
import { disposeObjectResources } from '../dispose-object-resources';

const roots = ['bedroom', 'room_shell', 'desk', 'plant_pot', 'plant_rest',
  'watering_can', 'curtain_left', 'curtain_right'] as const;
const anchors = ['window_anchor', 'room_target', 'desk_target', 'pot_target'] as const;
export type BedroomNodeName = typeof roots[number] | typeof anchors[number];
export interface ImportedBedroom {
  group: THREE.Group;
  nodes: Record<BedroomNodeName, THREE.Object3D>;
}

export async function loadBedroomModel(url: string, signal: AbortSignal): Promise<ImportedBedroom> {
  const group = await loadPackedGlb(url, signal, 'Bedroom');
  try {
    signal.throwIfAborted();
    const names = new Map<string, THREE.Object3D[]>();
    group.traverse((object) => {
      // GLTFLoader uniquifies Object3D.name; userData.name preserves the authored name.
      const authoredName = typeof object.userData.name === 'string' ? object.userData.name : object.name;
      const matches = names.get(authoredName) ?? [];
      matches.push(object);
      names.set(authoredName, matches);
      if (![...object.position, ...object.quaternion, ...object.scale].every(Number.isFinite) ||
          [...object.scale].some((scale) => Math.abs(scale) < 1e-8)) {
        throw new Error(`Invalid bedroom transform: ${object.name}`);
      }
      if (object instanceof THREE.Mesh) {
        if (!object.geometry.getAttribute('position')?.count) throw new Error('Bedroom contains an empty mesh.');
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        object.castShadow = !materials.some((material) => material.transparent);
        object.receiveShadow = true;
      }
    });
    const nodes = {} as Record<BedroomNodeName, THREE.Object3D>;
    for (const name of [...roots, ...anchors]) {
      if (names.get(name)?.length !== 1) throw new Error(`Bedroom requires one ${name} node.`);
      nodes[name] = names.get(name)![0];
    }
    const within = (node: THREE.Object3D, root: THREE.Object3D) => {
      for (let p: THREE.Object3D | null = node; p; p = p.parent) if (p === root) return true;
      return false;
    };
    for (const name of roots) {
      const node = nodes[name];
      let meshes = 0;
      node.traverse((child) => { if (child instanceof THREE.Mesh) meshes++; });
      if (!meshes || node instanceof THREE.Mesh || !within(node, nodes.bedroom)) {
        throw new Error(`Invalid bedroom geometry root: ${name}`);
      }
    }
    for (const name of anchors) {
      const node = nodes[name];
      if (node instanceof THREE.Mesh || node.children.length || !within(node, nodes.bedroom) ||
          [nodes.curtain_left, nodes.curtain_right, nodes.watering_can, nodes.plant_rest]
            .some((moving) => within(node, moving))) throw new Error(`Invalid bedroom anchor: ${name}`);
    }
    return { group, nodes };
  } catch (error) {
    disposeObjectResources([group]);
    throw error;
  }
}
