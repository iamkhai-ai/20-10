"""Focused M3 regressions using the existing Python Playwright/Chrome setup.
Module checks need Vite; WateringExperienceChecks also run on compiled preview.
"""
import unittest
import math
from bedroom_browser import BrowserCase, BASE
from playwright.sync_api import expect


class StateChecks(BrowserCase):
    def setUp(self):
        super().setUp()
        self.isolated()
        self.page.evaluate("""async () => {
          const {createWateringState} = await import('/tests/watering-harness.ts');
          window.count=0;window.state=createWateringState(()=>window.count++);
        }""")

    def test_five_valid_seconds_accumulate_across_invalid_aim(self):
        result=self.page.evaluate("""() => {
          state.setAvailable(true,0);state.setAction('drag',0);state.setAim(true,0);
          const first={...state.advance(2200)};state.setAim(false,2200);
          const paused={...state.advance(4200)};state.setAim(true,4200);
          const before={...state.advance(6999)};const final={...state.advance(7000)};
          state.setAction('button',8000);state.setAim(true,8000);state.advance(20000);
          return {first,paused,before,final,count};
        }""")
        self.assertEqual(result['first']['elapsedMs'],2200)
        self.assertEqual(result['paused']['elapsedMs'],2200)
        self.assertFalse(result['before']['complete'])
        self.assertEqual(result['before']['elapsedMs'],4999)
        self.assertEqual(result['final']['elapsedMs'],5000)
        self.assertEqual(result['final']['phase'],'complete')
        self.assertEqual(result['count'],1)

    def test_unavailable_aiming_paused_have_no_credit(self):
        r=self.page.evaluate("""() => {
          state.setAction('drag',0);state.setAim(true,0);state.advance(10000);
          const disabled={...state.snapshot()};state.setAvailable(true,10000);
          state.setAction('button',10000);state.advance(12000);
          const aiming={...state.snapshot()};state.setAim(true,12000);state.pause(13500);
          state.advance(30000);const paused={...state.snapshot()};
          state.setAvailable(true,30000);state.setAction('drag',30000);state.setAim(true,30000);
          return {disabled,aiming,paused,resume:{...state.advance(31000)}};
        }""")
        self.assertEqual(r['disabled']['elapsedMs'],0)
        self.assertEqual(r['aiming']['elapsedMs'],0)
        self.assertEqual(r['paused']['elapsedMs'],1500)
        self.assertEqual(r['paused']['mode'],'none')
        self.assertEqual(r['resume']['elapsedMs'],2500)

    def test_mode_takeover_requires_fresh_aim(self):
        r=self.page.evaluate("""() => {
          state.setAvailable(true,0);state.setAction('button',0);state.setAim(true,0);
          state.setAction('drag',1000);const aiming={...state.advance(2000)};
          state.setAim(true,2000);return {aiming,final:{...state.advance(2500)}};
        }""")
        self.assertEqual(r['aiming']['elapsedMs'],1000)
        self.assertEqual(r['aiming']['phase'],'aiming')
        self.assertEqual(r['final']['elapsedMs'],1500)

    def test_cadence_does_not_change_duration_and_snapshot_is_stable(self):
        r=self.page.evaluate("""async () => {
          const {createWateringState}=await import('/tests/watering-harness.ts');
          return [7,16.6667,100,500].map(step=>{
            const s=createWateringState();s.setAvailable(true,0);s.setAction('drag',0);s.setAim(true,0);
            const stable=s.snapshot();for(let t=step;t<4999;t+=step)s.advance(t);
            s.advance(4999);const before=s.snapshot().complete;s.advance(5000);
            return {elapsed:s.snapshot().elapsedMs,before,stable:stable===s.snapshot()};
          });
        }""")
        for item in r:
            self.assertAlmostEqual(item['elapsed'],5000)
            self.assertFalse(item['before']);self.assertTrue(item['stable'])

    def test_deactivation_and_disposal_stop_late_callbacks(self):
        r=self.page.evaluate("""() => {
          state.setAvailable(true,0);state.setAction('button',0);state.setAim(true,0);
          state.setAvailable(false,1000);state.advance(20000);const paused={...state.snapshot()};
          state.setAvailable(true,20000);state.setAction('button',20000);state.setAim(true,20000);
          state.dispose();state.advance(50000);state.setAvailable(true,50000);
          state.setAction('button',50000);state.setAim(true,50000);state.advance(80000);
          return {paused,final:{...state.snapshot()},count};
        }""")
        self.assertEqual(r['paused']['elapsedMs'],1000)
        self.assertEqual(r['final']['elapsedMs'],1000)
        self.assertFalse(r['final']['available']);self.assertEqual(r['count'],0)

    def test_clock_never_credits_backwards_or_nonfinite_time(self):
        r=self.page.evaluate("""() => {
          state.setAvailable(true,100);state.setAction('drag',100);state.setAim(true,100);
          state.advance(1100);state.advance(200);state.advance(NaN);state.advance(Infinity);
          return {...state.advance(1200)};
        }""")
        self.assertEqual(r['elapsedMs'],1100)


class WateringExperienceChecks(BrowserCase):
    def ready(self, reduce=True):
        if reduce:self.page.emulate_media(reduced_motion='reduce')
        self.page.goto(BASE)
        expect(self.page.get_by_role('button',name='Tưới cây',exact=True)).to_be_visible(timeout=20000)

    def amount(self):
        return self.page.get_by_role('progressbar').evaluate('(e)=>e.value')

    def point(self, point):
        w=self.page.viewport_size['width'];h=self.page.viewport_size['height'];a=w/h
        eye=(2.15,2.35,2.75) if a<.85 else (2.75,2.45,3.15)
        target=(1.4,1.55,-.9)
        def norm(v):
            length=math.sqrt(sum(x*x for x in v));return tuple(x/length for x in v)
        f=norm(tuple(target[i]-eye[i] for i in range(3)));r=norm((-f[2],0,f[0]))
        u=(r[1]*f[2]-r[2]*f[1],r[2]*f[0]-r[0]*f[2],r[0]*f[1]-r[1]*f[0])
        d=tuple(point[i]-eye[i] for i in range(3));depth=sum(d[i]*f[i] for i in range(3))
        scale=math.tan(math.radians(65 if a<.85 else 48)/2)
        return ((1+sum(d[i]*r[i] for i in range(3))/(depth*scale*a))*w/2,
                (1-sum(d[i]*u[i] for i in range(3))/(depth*scale))*h/2)

    def test_normal_and_early_skip_only_enable_after_desk(self):
        self.page.goto(BASE)
        expect(self.page.get_by_role('button',name='Tưới cây',exact=True)).to_have_count(0)
        self.page.get_by_role('button',name='Bỏ qua phần mở đầu').click()
        expect(self.page.get_by_role('button',name='Tưới cây',exact=True)).to_be_visible(timeout=20000)
        self.assertEqual(self.page.locator('#watering-panel').count(),1)
        self.assertEqual(self.amount(),0);self.assertEqual(self.errors,[])

    def test_keyboard_five_seconds_pause_and_resume(self):
        self.ready()
        button=self.page.get_by_role('button',name='Tưới cây',exact=True);button.focus();button.press('Enter')
        self.page.wait_for_timeout(1200)
        self.page.get_by_role('button',name='Tạm dừng',exact=True).press('Space')
        saved=self.amount();self.assertGreater(saved,.8);self.assertLess(saved,3)
        self.page.wait_for_timeout(400);self.assertEqual(saved,self.amount())
        self.page.get_by_role('button',name='Tưới cây',exact=True).press('Enter')
        expect(self.page.get_by_role('status')).to_have_text('Cây đã đủ nước rồi.',timeout=7000)
        self.assertEqual(self.amount(),5);self.assertEqual(self.page.evaluate('document.activeElement.id'),'status')
        self.assertEqual(self.errors,[])

    def test_real_touch_drag_in_portrait(self):
        self.page.set_viewport_size({'width':390,'height':844});self.ready()
        cdp=self.context.new_cdp_session(self.page)
        def touch(kind,xy=None):cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[] if xy is None else [{'x':xy[0],'y':xy[1],'id':0}]})
        can=self.point((1.91,1.22,-.85));soil=self.point((1.1,1.405,-.88))
        touch('touchStart',can);touch('touchMove',soil);self.page.wait_for_timeout(400)
        self.assertGreater(self.amount(),.1)
        touch('touchCancel');saved=self.amount();self.page.wait_for_timeout(180);self.assertEqual(saved,self.amount())
        touch('touchStart',can);touch('touchMove',soil)
        expect(self.page.get_by_role('status')).to_have_text('Cây đã đủ nước rồi.',timeout=7000)
        touch('touchEnd');self.assertEqual(self.amount(),5);self.assertEqual(self.errors,[])

    def test_resize_motion_visibility_and_teardown(self):
        self.ready();self.page.get_by_role('button',name='Tưới cây',exact=True).click();self.page.wait_for_timeout(250)
        self.page.set_viewport_size({'width':390,'height':844})
        expect(self.page.get_by_role('button',name='Tưới cây',exact=True)).to_be_visible()
        saved=self.amount();self.page.wait_for_timeout(180);self.assertEqual(saved,self.amount())
        self.page.get_by_role('button',name='Tưới cây',exact=True).click();self.page.emulate_media(reduced_motion='no-preference')
        expect(self.page.get_by_role('button',name='Tưới cây',exact=True)).to_be_visible()
        self.page.get_by_role('button',name='Tưới cây',exact=True).click()
        self.page.evaluate("window.dispatchEvent(new Event('blur'))")
        saved=self.amount();self.page.wait_for_timeout(180);self.assertEqual(saved,self.amount())
        self.page.get_by_role('button',name='Tưới cây',exact=True).click()
        self.page.evaluate("window.dispatchEvent(new Event('beforeunload'))")
        self.assertEqual(self.page.locator('#watering-panel').count(),0)
        self.assertEqual(self.page.locator('canvas').count(),0);self.assertEqual(self.errors,[])

    def test_room_failure_retry_and_water_controls(self):
        count=[0]
        def route(r):
            count[0]+=1
            if count[0]==1:r.fulfill(status=404,body='missing')
            else:r.continue_()
        self.page.route('**/models/bedroom.glb',route)
        self.page.emulate_media(reduced_motion='reduce');self.page.goto(BASE)
        expect(self.page.get_by_role('button',name='Thử mở căn phòng lại')).to_be_visible(timeout=12000)
        expect(self.page.locator('#watering-panel')).to_have_count(0)
        self.page.get_by_role('button',name='Thử mở căn phòng lại').click()
        expect(self.page.get_by_role('button',name='Tưới cây',exact=True)).to_be_visible(timeout=12000)
        self.assertEqual(self.page.locator('#watering-panel').count(),1)


class InteractionChecks(BrowserCase):
    def setUp(self):
        super().setUp();self.isolated()
        self.page.evaluate("""async()=>{window.probe=await(await import('/tests/watering-interaction-harness.ts')).createInteractionProbe()}""")

    def amount(self):
        return self.page.get_by_role('progressbar').evaluate('(e)=>e.value')

    def test_setup_failure_removes_only_owned_effects(self):
        r=self.page.evaluate("""async()=>{
          probe.interaction.dispose();document.querySelector('#ui').remove();
          const {createWateringInteraction}=await import('/src/experience/watering-interaction.ts');
          let failed=false;try{createWateringInteraction({canvas:probe.runtime.renderer.domElement,
            camera:probe.runtime.camera,bedroom:probe.bedroom,reducedMotion:true})}catch{failed=true}
          return {failed,effects:!!probe.bedroom.group.getObjectByName('watering-effects'),can:!!probe.rig.can.parent};
        }""")
        self.assertTrue(r['failed']);self.assertFalse(r['effects']);self.assertTrue(r['can'])

    def test_button_pause_resume_and_complete_once(self):
        self.page.get_by_role('button',name='Tưới cây',exact=True).click()
        self.page.wait_for_timeout(450)
        self.assertGreater(self.amount(),.2)
        self.page.get_by_role('button',name='Tạm dừng',exact=True).click()
        amount=self.amount();self.page.wait_for_timeout(250);self.assertEqual(self.amount(),amount)
        self.page.get_by_role('button',name='Tưới cây',exact=True).click()
        self.page.evaluate('()=>probe.interaction.update(performance.now()+5001)')
        expect(self.page.get_by_role('status')).to_have_text('Cây đã đủ nước rồi.')
        self.assertEqual(self.page.evaluate('probe.completions()'),1)
        self.assertFalse(self.page.evaluate("probe.bedroom.group.getObjectByName('watering-effects').visible"))

    def test_drag_valid_off_target_and_release(self):
        can=self.page.evaluate("probe.project('can')");soil=self.page.evaluate("probe.project('soil')")
        self.page.mouse.move(can['x'],can['y']);self.page.mouse.down()
        self.page.mouse.move(soil['x'],soil['y'],steps=8);self.page.wait_for_timeout(350)
        self.assertGreater(self.amount(),.1)
        self.page.mouse.move(50,700);self.page.wait_for_timeout(100)
        amount=self.amount();self.page.wait_for_timeout(150);self.assertEqual(amount,self.amount())
        self.page.mouse.up();self.assertFalse(self.page.evaluate("probe.bedroom.group.getObjectByName('watering-effects').visible"))

    def test_blur_hidden_escape_and_focus_loss_pause(self):
        for event in ('blur','hidden','escape','focus'):
            self.page.get_by_role('button',name='Tưới cây',exact=True).click();self.page.wait_for_timeout(90)
            if event=='hidden':
                self.page.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))}")
            elif event=='escape':self.page.keyboard.press('Escape')
            elif event=='focus':self.page.locator('#status').focus()
            else:self.page.evaluate("window.dispatchEvent(new Event('blur'))")
            value=self.amount();self.page.wait_for_timeout(120);self.assertEqual(value,self.amount())
            self.page.evaluate("()=>Object.defineProperty(document,'hidden',{configurable:true,value:false})")
        self.assertEqual(self.errors,[])

    def test_pointer_arbitration_offset_resize_and_dispose(self):
        self.page.evaluate("()=>{const c=probe.runtime.renderer.domElement;c.style.width='900px';c.style.height='600px';c.style.marginLeft='90px'}")
        can=self.page.evaluate("probe.project('can')");soil=self.page.evaluate("probe.project('soil')")
        self.page.mouse.move(can['x'],can['y']);self.page.mouse.down()
        self.page.mouse.move(soil['x'],soil['y'],steps=5);self.page.wait_for_timeout(90)
        self.assertGreater(self.amount(),0)
        self.page.locator('canvas').dispatch_event('pointerdown',{'pointerId':99,'isPrimary':False,'button':0,'clientX':5,'clientY':5})
        self.page.locator('canvas').dispatch_event('pointerup',{'pointerId':99})
        self.page.wait_for_timeout(90);self.assertGreater(self.amount(),.1)
        self.page.locator('canvas').dispatch_event('pointercancel',{'pointerId':1})
        self.page.mouse.up();self.page.evaluate('()=>probe.interaction.pause()')
        value=self.amount();self.page.wait_for_timeout(90);self.assertEqual(value,self.amount())
        self.page.get_by_role('button',name='Tưới cây',exact=True).click()
        self.page.evaluate('()=>{probe.interaction.setReducedMotion(false);probe.interaction.dispose();probe.interaction.dispose()}')
        self.assertEqual(self.page.locator('#watering-panel').count(),0)
        self.assertFalse(self.page.evaluate("!!probe.bedroom.group.getObjectByName('watering-effects')"))


class ControlChecks(BrowserCase):
    def setUp(self):
        super().setUp();self.isolated()
        self.page.evaluate("""async()=>{
          document.body.innerHTML='<main id="ui"><h1>A Little Garden for You</h1><p id="status" role="status" tabindex="-1">Một chiếc bình tưới đang chờ cạnh chậu cây.</p></main><button id="outside">Outside</button>';
          await import('/src/styles.css');
          const {createWateringControls}=await import('/src/ui/watering-controls.ts');
          window.toggles=0;window.pauses=0;
          window.controls=createWateringControls({onToggle:()=>toggles++,onPause:()=>pauses++});
          window.snap={phase:'ready',mode:'none',available:true,elapsedMs:0,progress:0,complete:false};
          controls.setVisible(true);controls.render(snap);
        }""")

    def test_semantic_progress_and_keyboard_repeat(self):
        btn=self.page.get_by_role('button',name='Tưới cây',exact=True)
        expect(btn).to_have_attribute('aria-pressed','false')
        self.assertGreaterEqual(btn.bounding_box()['height'],44)
        btn.focus();btn.press('Enter');btn.press('Space')
        btn.dispatch_event('keydown',{'key':'Enter','repeat':True})
        btn.dispatch_event('click')
        self.assertEqual(self.page.evaluate('toggles'),3)
        self.page.get_by_role('button',name='Outside').focus()
        self.assertGreaterEqual(self.page.evaluate('pauses'),1)
        expect(self.page.get_by_role('progressbar')).to_have_attribute('max','5')

    def test_active_pause_complete_and_focus_restoration(self):
        self.page.evaluate("()=>{Object.assign(snap,{phase:'watering',mode:'button',elapsedMs:2200,progress:.44});controls.render(snap)}")
        btn=self.page.get_by_role('button',name='Tạm dừng',exact=True)
        expect(btn).to_have_attribute('aria-pressed','true');btn.focus()
        self.assertEqual(self.page.get_by_role('progressbar').evaluate('(e)=>e.value'),2.2)
        self.page.evaluate("()=>{Object.assign(snap,{phase:'complete',complete:true,mode:'none',elapsedMs:5000,progress:1});controls.render(snap)}")
        expect(self.page.get_by_role('status')).to_have_text('Cây đã đủ nước rồi.')
        self.assertEqual(self.page.evaluate('document.activeElement.id'),'status')
        expect(self.page.locator('#watering-action')).to_be_disabled()
        self.page.evaluate('()=>{controls.dispose();controls.dispose()}')
        self.assertEqual(self.page.locator('#watering-panel').count(),0)

    def test_repeated_render_is_quiet_and_hiding_preserves_focus(self):
        r=self.page.evaluate("""async()=>{
          let mutations=0;const observer=new MutationObserver(e=>mutations+=e.length);
          observer.observe(document.querySelector('#status'),{childList:true});
          for(let i=0;i<20;i++)controls.render(snap);
          await Promise.resolve();observer.disconnect();return mutations;
        }""")
        self.assertEqual(r,0)
        self.page.locator('#watering-action').focus()
        self.page.evaluate('()=>controls.setVisible(false)')
        expect(self.page.locator('#watering-panel')).to_be_hidden()
        self.assertEqual(self.page.evaluate('document.activeElement.id'),'status')


class ViewChecks(BrowserCase):
    def setUp(self):
        super().setUp();self.isolated()
        self.page.evaluate("""async () => {
          window.probe=await (await import('/tests/watering-view-harness.ts')).createViewProbe();
        }""")

    def test_calibration_validity_and_exact_restore(self):
        r=self.page.evaluate("""() => {
          const {view,rig}=probe;const rest=rig.can.position.toArray();
          const restQ=rig.can.quaternion.toArray();const invalid=view.isValidAim();
          view.aimAutomatically();view.render(100,true,.4);
          const valid=view.isValidAim(),out=rig.outlet.getWorldPosition(new probe.THREE.Vector3()).toArray();
          const emitting=probe.effects().visible;
          rig.can.position.x+=1;const outside=view.isValidAim();rig.can.position.x-=1;
          rig.can.position.y-=2;const below=view.isValidAim();
          view.cancel(true);return {invalid,valid,out,emitting,outside,below,
            restored:rest.every((v,i)=>v===rig.can.position.toArray()[i])&&restQ.every((v,i)=>v===rig.can.quaternion.toArray()[i]),off:!probe.effects().visible};
        }""")
        self.assertFalse(r['invalid']);self.assertTrue(r['valid']);self.assertTrue(r['emitting'])
        self.assertGreater(r['out'][1],1.405)
        self.assertFalse(r['outside']);self.assertFalse(r['below']);self.assertTrue(r['restored']);self.assertTrue(r['off'])

    def test_wrong_direction_and_bounded_owned_resources(self):
        r=self.page.evaluate("""() => {
          const {view,rig,THREE}=probe;view.aimAutomatically();
          rig.can.quaternion.identity();const upward=view.isValidAim();
          view.cancel(true);view.aimAutomatically();view.beginDrag();view.cancel(true);
          const effects=probe.effects();const drop=effects.getObjectByName('watering-drops');
          let disposed=0;rig.can.traverse(o=>{if(o.isMesh)o.geometry.addEventListener('dispose',()=>disposed++)});
          view.dispose();view.dispose();return {upward,drops:drop.count,disposed,removed:!effects.parent};
        }""")
        self.assertFalse(r['upward']);self.assertLessEqual(r['drops'],24)
        self.assertEqual(r['disposed'],0);self.assertTrue(r['removed'])

    def test_live_motion_cancels_and_no_feedback_when_paused(self):
        r=self.page.evaluate("""() => {
          const {view,rig}=probe;const q=rig.plant.quaternion.toArray();
          view.setReducedMotion(false);view.aimAutomatically();probe.finish();view.render(500,true,.5);
          view.setReducedMotion(true);view.render(700,false,.5);
          return {off:!probe.effects().visible,rest:q.every((v,i)=>v===rig.plant.quaternion.toArray()[i]),aim:view.isValidAim()};
        }""")
        self.assertTrue(r['off']);self.assertTrue(r['rest']);self.assertFalse(r['aim'])

    def test_far_drag_stays_within_the_desktop_envelope(self):
        r=self.page.evaluate("""()=>{
          const {view,rig,THREE}=probe;view.beginDrag();
          const origin=new THREE.Vector3(5,5,5);
          const ray=new THREE.Ray(origin,new THREE.Vector3(-100,1.8,100).sub(origin).normalize());
          view.drag(ray);return rig.can.position.toArray();
        }""")
        self.assertGreaterEqual(r[0],1.25);self.assertLessEqual(r[0],2)
        self.assertGreaterEqual(r[2],-1.0);self.assertLessEqual(r[2],-.65)


if __name__=='__main__':
    unittest.main(verbosity=2)
