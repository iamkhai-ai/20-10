// Test-only imports share Vite's dependency identity with production modules.
export * as THREE from 'three';
export { default as gsap } from 'gsap';

import * as THREE from 'three';
import gsap from 'gsap';
import { createCameraStory } from '../src/experience/camera-story';

export function createStoryProbe(reducedMotion = false) {
  const camera = new THREE.PerspectiveCamera(48, 1.6, 0.1, 100);
  const pose = (x: number, y: number, z: number) => ({position:new THREE.Vector3(x,y,z),target:new THREE.Vector3(0,1,0)});
  const exterior = () => ({intro:pose(6,5,15),arrival:pose(1,3,6)});
  const bedroom = () => ({entry:pose(3,3,5),room:pose(5,4,7),desk:pose(2,2,3)});
  let veil = 0;
  const phases: string[] = [];
  const locations: [string, number][] = [];
  const veils: number[] = [];
  const errors: string[] = [];
  const story = createCameraStory(camera, exterior, {
    reducedMotion,
    onPhase: (p) => phases.push(p),
    onVeil: (v) => {veil=v; veils.push(v);},
    onLocation: (l) => locations.push([l,veil]),
    onError: (e) => errors.push(String(e)),
  });
  const finish = () => {
    for (let i=0;i<6;i++) for (const t of gsap.globalTimeline.getChildren(false,true,true)) t.totalProgress(1,false);
  };
  const step = (seconds: number) => gsap.globalTimeline.getChildren(false,true,true).at(-1)?.totalTime(seconds,false);
  return {story,camera,bedroom,phases,locations,veils,errors,finish,step,
    snapshot:()=>({phase:phases.at(-1),veil,locations,errors,position:camera.position.toArray()})};
}
