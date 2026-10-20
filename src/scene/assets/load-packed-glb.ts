import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { disposeObjectResources } from '../dispose-object-resources';

/** Caller owns the deadline and any successfully returned scene. */
export async function loadPackedGlb(url: string, signal: AbortSignal, label: string): Promise<THREE.Group> {
  signal.throwIfAborted();
  const address = new URL(url, window.location.href);
  if (address.origin !== window.location.origin) throw new Error(`${label} must be a local asset.`);
  // A local URL must not redirect to an external resource before we can inspect it.
  const response = await fetch(address, { signal, redirect: 'error' });
  if (!response.ok) throw new Error(`${label} asset returned HTTP ${response.status}.`);
  const buffer = await response.arrayBuffer();
  signal.throwIfAborted();
  const view = new DataView(buffer);
  if (buffer.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67 ||
      view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== buffer.byteLength ||
      view.getUint32(16, true) !== 0x4e4f534a) throw new Error(`${label} is not a valid GLB.`);
  const jsonLength = view.getUint32(12, true);
  if (jsonLength > buffer.byteLength - 20) throw new Error(`${label} has an invalid JSON chunk.`);
  const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 20, jsonLength))) as {
    buffers?: { uri?: string }[]; images?: { uri?: string }[];
  };
  if ([...(json.buffers ?? []), ...(json.images ?? [])].some((item) => 'uri' in item)) {
    throw new Error(`${label} GLB contains an unpacked resource.`);
  }
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((resource) => {
    if (!resource.startsWith('blob:') && !resource.startsWith('data:')) {
      throw new Error(`${label} GLB contains an unpacked resource.`);
    }
    return resource;
  });
  const parsing = new GLTFLoader(manager).parseAsync(buffer, '');
  return new Promise<THREE.Group>((resolve, reject) => {
    let settled = false;
    const abort = () => {
      if (settled) return;
      settled = true;
      reject(signal.reason ?? new DOMException(`${label} load aborted.`, 'AbortError'));
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
}
