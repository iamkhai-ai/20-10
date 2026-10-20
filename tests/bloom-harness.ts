import * as THREE from 'three';
import { loadBedroomModel } from '../src/scene/assets/load-bedroom-model';
import { buildBedroom } from '../src/scene/interior/build-bedroom';
import { createBloomView } from '../src/scene/interior/build-bloom';

export async function createBloomProbe() {
  document.body.innerHTML = '<div id="ui"></div><p id="status" role="status"></p><canvas width="1440" height="900"></canvas>';
  const canvas = document.querySelector('canvas')!;
  const model = await loadBedroomModel('/models/bedroom.glb', new AbortController().signal);
  const bedroom = buildBedroom(model), camera = new THREE.PerspectiveCamera(48,1440/900,.1,100);
  camera.position.set(2.75,2.45,3.15); camera.lookAt(1.4,1.55,-.9);camera.updateMatrixWorld();
  return { bedroom, rig: bedroom.watering, canvas, camera, view: createBloomView(bedroom.watering,camera) };
}
