import { THREE, gsap } from './bedroom-harness';
import { loadBedroomModel } from '../src/scene/assets/load-bedroom-model';
import { buildBedroom } from '../src/scene/interior/build-bedroom';
import { createWateringView } from '../src/scene/interior/build-watering';
import { createScene } from '../src/scene/create-scene';

export async function createViewProbe() {
  const bedroom = buildBedroom(await loadBedroomModel('/models/bedroom.glb', new AbortController().signal));
  const view = createWateringView(bedroom.watering, { reducedMotion: true });
  return { THREE, bedroom, rig: bedroom.watering, view,
    effects: () => bedroom.group.getObjectByName('watering-effects')!,
    finish: () => { for(const t of gsap.globalTimeline.getChildren(false,true,true)) t.totalProgress(1,false); },
  };
}

export async function createRenderProbe() {
  document.body.style.margin='0';
  const host=document.createElement('div');host.style.cssText='position:fixed;inset:0';document.body.append(host);
  const runtime=createScene(host);const p=await createViewProbe();runtime.scene.add(p.bedroom.group);
  runtime.setLocation('bedroom');p.bedroom.group.visible=true;
  const pose=p.bedroom.cameraPoses(runtime.camera.aspect).desk;
  runtime.camera.position.copy(pose.position);runtime.camera.lookAt(pose.target);
  return {...p,runtime,draw:()=>runtime.renderer.render(runtime.scene,runtime.camera)};
}
