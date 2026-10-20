import { createRenderProbe } from './watering-view-harness';
import { createWateringInteraction } from '../src/experience/watering-interaction';

export async function createInteractionProbe() {
  await import('../src/styles.css');
  const p = await createRenderProbe(); p.view.dispose();
  const ui=document.createElement('main');ui.id='ui';
  ui.innerHTML='<h1>A Little Garden for You</h1><p id="status" role="status" tabindex="-1">Một chiếc bình tưới đang chờ cạnh chậu cây.</p>';
  document.body.append(ui);
  let completions=0;
  const interaction=createWateringInteraction({canvas:p.runtime.renderer.domElement,
    camera:p.runtime.camera,bedroom:p.bedroom,reducedMotion:true,onComplete:()=>completions++});
  interaction.setAvailable(true);
  let running=true;
  const frame=(now:number)=>{if(!running)return;interaction.update(now);p.draw();requestAnimationFrame(frame)};
  requestAnimationFrame(frame);
  const project=(which:'can'|'soil')=>{
    p.bedroom.group.updateWorldMatrix(true,true);
    const point=which==='can'?new p.THREE.Box3().setFromObject(p.rig.can).getCenter(new p.THREE.Vector3()):
      p.rig.soilTarget.getWorldPosition(new p.THREE.Vector3());
    point.project(p.runtime.camera);const r=p.runtime.renderer.domElement.getBoundingClientRect();
    return {x:r.left+(point.x+1)*r.width/2,y:r.top+(1-point.y)*r.height/2};
  };
  return {...p,interaction,project,completions:()=>completions,
    dispose:()=>{running=false;interaction.dispose();p.runtime.dispose()}};
}
