"""Focused M2 browser regressions. GARDEN_TEST_URL points at the Vite dev server.
Run: python tests/bedroom_browser.py LoaderChecks (or StoryChecks / ExperienceChecks).
Requires an existing local Python Playwright installation and Chrome.
"""
import json
import os
from pathlib import Path
import struct
import unittest
from playwright.sync_api import sync_playwright

BASE = os.environ.get('GARDEN_TEST_URL', 'http://127.0.0.1:5175').rstrip('/')
ROOT = Path(__file__).resolve().parents[1]


def room_fixture(change):
    data = (ROOT / 'public/models/bedroom.glb').read_bytes()
    size = struct.unpack_from('<I', data, 12)[0]
    doc = json.loads(data[20:20+size])
    change(doc)
    encoded = json.dumps(doc, separators=(',', ':')).encode()
    encoded += b' ' * (-len(encoded) % 4)
    tail = data[20+size:]
    return (struct.pack('<III', 0x46546C67, 2, 20+len(encoded)+len(tail)) +
            struct.pack('<II', len(encoded), 0x4E4F534A) + encoded + tail)


class BrowserCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(channel='chrome', headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width':1440, 'height':900})
        self.page = self.context.new_page()
        self.errors = []
        self.page.on('pageerror', lambda e: self.errors.append(str(e)))

    def tearDown(self):
        self.context.close()

    def isolated(self):
        self.page.route('**/__tests__', lambda r:r.fulfill(content_type='text/html',body='<!doctype html><html><body></body></html>'))
        self.page.goto(BASE+'/__tests__')


class LoaderChecks(BrowserCase):
    def load(self, data=None):
        self.isolated()
        if data is not None:
            self.page.route('**/models/fixture.glb',lambda r:r.fulfill(body=data,content_type='model/gltf-binary'))
        return self.page.evaluate('''async url => {
          const {loadBedroomModel} = await import('/src/scene/assets/load-bedroom-model.ts');
          try { const model = await loadBedroomModel(url,new AbortController().signal);
            const names=Object.keys(model.nodes);
            const {disposeObjectResources}=await import('/src/scene/dispose-object-resources.ts');
            disposeObjectResources([model.group]); return {ok:true,names};
          } catch(e) { return {ok:false,error:String(e)}; }
        }''', '/models/fixture.glb' if data is not None else '/models/bedroom.glb')

    def test_valid_room_contract(self):
        result=self.load()
        self.assertTrue(result['ok'], result)
        self.assertEqual(len(result['names']),12)
        self.assertIn('watering_can',result['names'])
        self.assertEqual(self.errors,[])

    def test_invalid_room_nodes(self):
        def missing(d):
            next(n for n in d['nodes'] if n.get('name')=='pot_target')['name']='lost_anchor'
        def duplicate(d):
            d['nodes'].append({'name':'desk'})
            d['scenes'][0]['nodes'].append(len(d['nodes'])-1)
        def empty(d):
            for mesh in d['meshes']:
                for p in mesh['primitives']:
                    d['accessors'][p['attributes']['POSITION']]['count']=0
        def invalid(d):
            next(n for n in d['nodes'] if n.get('name')=='desk')['scale']=[0,1,1]
        def wrong_hierarchy(d):
            i=next(i for i,n in enumerate(d['nodes']) if n.get('name')=='pot_target')
            for n in d['nodes']:
                if i in n.get('children',[]):n['children'].remove(i)
            next(n for n in d['nodes'] if n.get('name')=='watering_can').setdefault('children',[]).append(i)
        for change in (missing,duplicate,empty,invalid,wrong_hierarchy):
            with self.subTest(case=change.__name__):
                self.assertFalse(self.load(room_fixture(change))['ok'])

    def test_packed_local_resources(self):
        external=[]
        self.page.on('request',lambda r:external.append(r.url) if not r.url.startswith(BASE) and not r.url.startswith(('data:','blob:')) else None)
        result=self.load(room_fixture(lambda d:d['images'][0].update(uri='https://example.invalid/texture.png')))
        self.assertFalse(result['ok'])
        result=self.page.evaluate('''async () => {
          const {loadBedroomModel}=await import('/src/scene/assets/load-bedroom-model.ts');
          try { await loadBedroomModel('https://example.invalid/room.glb',new AbortController().signal);return false; }
          catch {return true;}
        }''')
        self.assertTrue(result)
        self.assertEqual(external,[])

    def test_abort_during_parse(self):
        self.isolated()
        result=self.page.evaluate('''async () => {
          const {THREE}=await import('/tests/bedroom-harness.ts');
          const {loadBedroomModel}=await import('/src/scene/assets/load-bedroom-model.ts');
          const original=window.createImageBitmap.bind(window);let release=false;const pending=[];
          window.createImageBitmap=(...args)=>original(...args).then(b=>release?b:new Promise(r=>pending.push(()=>r(b))));
          const counts=new Map();const dispose=THREE.Texture.prototype.dispose;
          THREE.Texture.prototype.dispose=function(){counts.set(this,(counts.get(this)||0)+1);return dispose.call(this);};
          const controller=new AbortController();
          const loaded=loadBedroomModel('/models/bedroom.glb',controller.signal).then(()=>false,()=>true);
          for(let i=0;i<500 && !pending.length;i++)await new Promise(r=>setTimeout(r,10));
          if(!pending.length)throw Error('Image decoding did not begin');
          const start=performance.now();controller.abort();const rejected=await loaded;const elapsed=performance.now()-start;
          release=true;pending.forEach(f=>f());
          for(let i=0;i<200 && !counts.size;i++)await new Promise(r=>setTimeout(r,10));
          return {rejected,elapsed,count:counts.size,once:[...counts.values()].every(n=>n===1)};
        }''')
        self.assertTrue(result['rejected'])
        self.assertLess(result['elapsed'],500)
        self.assertGreater(result['count'],0)
        self.assertTrue(result['once'])
        self.assertEqual(self.errors,[])

    def test_exterior_loader_regression(self):
        self.isolated()
        result=self.page.evaluate('''async () => {
          const {loadExteriorModel}=await import('/src/scene/assets/load-exterior-model.ts');
          const model=await loadExteriorModel('/models/exterior-house-tree.glb',new AbortController().signal);
          const names=['house','roof','upper_window','tree_structure','tree_sway','window_target'];
          const valid=names.every(n=>model.group.getObjectByName(n));
          const {disposeObjectResources}=await import('/src/scene/dispose-object-resources.ts');
          disposeObjectResources([model.group]);return valid;
        }''')
        self.assertTrue(result)
        self.assertEqual(self.errors,[])


class StoryChecks(BrowserCase):
    def probe(self, action):
        self.isolated()
        return self.page.evaluate('''async action => {
          const {createStoryProbe}=await import('/tests/bedroom-harness.ts');
          return new Function('createStoryProbe',action)(createStoryProbe);
        }''', action)

    def test_story_waits_for_room(self):
        result=self.probe('''const p=createStoryProbe();p.finish();const waiting=p.snapshot();
          p.story.setBedroom(p.bedroom);p.finish();const final=p.snapshot();p.story.dispose();return {waiting,final};''')
        self.assertEqual(result['waiting']['phase'],'window-arrival')
        self.assertEqual(result['final']['phase'],'desk-settled')
        self.assertEqual(result['final']['veil'],0)

    def test_handoff_is_covered(self):
        result=self.probe('''const p=createStoryProbe();p.story.setBedroom(p.bedroom);
          p.finish();const result=p.snapshot();p.story.dispose();return result;''')
        self.assertEqual(result['locations'],[['bedroom',1]])
        self.assertEqual(result['errors'],[])
        self.assertEqual(result['phase'],'desk-settled')

    def test_skip_and_motion_idempotence(self):
        result=self.probe('''const all=[];
          for(const stage of ['pending','cover','uncover','reduced','failed']){
            const p=createStoryProbe(stage==='reduced');
            if(stage==='cover'||stage==='uncover'){
              p.finish();p.story.setBedroom(p.bedroom);p.step(stage==='cover'?.6:1.5);
              p.camera.aspect=.46;p.story.reframe();p.story.setReducedMotion(true);
            }else if(stage==='failed'){p.story.setBedroomUnavailable();}
            p.story.skip();p.story.skip();
            if(stage!=='failed')p.story.setBedroom(p.bedroom);
            p.finish();all.push({stage,...p.snapshot(),maxVeil:Math.max(0,...p.veils)});p.story.dispose();
          }return all;''')
        for r in result:
            with self.subTest(stage=r['stage']):
                self.assertEqual(r['phase'],'bedroom-unavailable' if r['stage']=='failed' else 'desk-settled')
                self.assertEqual(r['veil'],0)
                self.assertLessEqual(len(r['locations']),1)
                self.assertEqual(r['errors'],[])
                if r['stage']=='reduced':self.assertEqual(r['maxVeil'],0)

    def test_story_disposal(self):
        result=self.probe('''const p=createStoryProbe();p.story.setBedroom(p.bedroom);p.step(2);
          p.story.dispose();const count=p.phases.length+p.locations.length+p.veils.length;
          p.story.skip();p.story.reframe();p.story.setReducedMotion(true);p.story.setBedroom(p.bedroom);p.finish();
          return {count,after:p.phases.length+p.locations.length+p.veils.length};''')
        self.assertEqual(result['count'],result['after'])

    def test_failed_switch_restores_exterior(self):
        self.isolated()
        result=self.page.evaluate('''async () => {
          const {THREE,gsap}=await import('/tests/bedroom-harness.ts');
          const {createCameraStory}=await import('/src/experience/camera-story.ts');
          const camera=new THREE.PerspectiveCamera();const pose={position:new THREE.Vector3(0,2,6),target:new THREE.Vector3(0,1,0)};
          const locations=[];let phase,veil,error;
          const story=createCameraStory(camera,()=>({intro:pose,arrival:pose}),{reducedMotion:false,
            onLocation:l=>{locations.push(l);if(l==='bedroom')throw Error('Switch failed after activation');},
            onPhase:p=>phase=p,onVeil:v=>veil=v,onError:e=>error=String(e)});
          story.setBedroom(()=>({entry:pose,room:pose,desk:pose}));
          for(let i=0;i<6;i++)for(const t of gsap.globalTimeline.getChildren(false,true,true))t.totalProgress(1,false);
          story.dispose();return {locations,phase,veil,error};
        }''')
        self.assertEqual(result['locations'],['bedroom','exterior'])
        self.assertEqual(result['phase'],'bedroom-unavailable')
        self.assertEqual(result['veil'],0)
        self.assertIn('Switch failed',result['error'])


if __name__=='__main__':
    unittest.main(verbosity=2)
