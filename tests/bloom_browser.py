"""Focused M4 checks, using the existing Python/Chrome tooling."""
import unittest
from playwright.sync_api import expect
from bedroom_browser import BrowserCase, BASE
import watering_browser


class CardChecks(BrowserCase):
    def setUp(self):
        super().setUp();self.isolated()
        self.page.evaluate("""async()=>{
          document.body.innerHTML='<div id="ui"></div><p id="status" role="status"></p>';
          const {createCardControls}=await import('/src/ui/card-controls.ts');
          window.card=createCardControls();
        }""")

    def test_native_dialog_focus_close_and_dispose(self):
        expect(self.page.get_by_role('button',name='Mở thiệp')).not_to_be_visible()
        self.page.evaluate('card.setReady(true)')
        button=self.page.get_by_role('button',name='Mở thiệp');button.focus();button.press('Enter')
        dialog=self.page.get_by_role('dialog',name='Chúc mừng 20/10')
        expect(dialog).to_be_visible()
        self.assertTrue(dialog.evaluate('(e)=>e.contains(document.activeElement)'))
        self.page.keyboard.press('Escape');expect(dialog).not_to_be_visible();expect(button).to_be_focused()
        button.press('Space');expect(dialog).to_be_visible()
        self.page.get_by_role('button',name='Đóng thiệp').click();expect(button).to_be_focused()
        self.page.evaluate('card.dispose();card.dispose()')
        self.assertEqual(self.page.locator('#card-panel, #gift-dialog').count(),0)


class BloomChecks(BrowserCase):
    def setUp(self):
        super().setUp();self.isolated()
        self.page.evaluate("""async()=>{window.probe=await(await import('/tests/bloom-harness.ts')).createBloomProbe()}""")

    def test_stems_petals_card_and_owned_disposal(self):
        result=self.page.evaluate("""()=>{
          const {view,rig}=probe;const rest=rig.plant.scale.toArray();
          view.setProgress(0);const first=view.card.visible;
          view.setProgress(1700);const middle=view.card.visible;
          view.setProgress(4700);const final=view.card.visible;
          const petals=[];view.group.traverse(o=>{if(o.name==='tulip-petal')petals.push(o.rotation.x)});
          const geometries=new Set();const materials=new Set();view.group.traverse(o=>{
            if(o.isMesh){geometries.add(o.geometry);for(const m of(Array.isArray(o.material)?o.material:[o.material]))materials.add(m)}
          });let released=0;for(const g of geometries)g.addEventListener('dispose',()=>released++);
          const flowerCount=view.group.children.filter(o=>o.name.startsWith('bloom-tulip')).length;
          view.dispose();view.dispose();
          return {first,middle,final,petals,flowerCount,released,total:geometries.size,
            restored:rig.plant.scale.toArray(),rest,attached:!!rig.plant.parent,effects:!!rig.room.getObjectByName('bloom-bouquet')};
        }""")
        self.assertFalse(result['first']);self.assertFalse(result['middle']);self.assertTrue(result['final'])
        self.assertEqual(result['flowerCount'],5);self.assertGreaterEqual(len(result['petals']),30)
        self.assertGreater(max(result['petals']),.25)
        self.assertEqual(result['released'],result['total']);self.assertEqual(result['restored'],result['rest'])
        self.assertTrue(result['attached']);self.assertFalse(result['effects'])

    def test_one_shot_hidden_time_motion_and_teardown(self):
        result=self.page.evaluate("""async()=>{
          probe.view.dispose();const {createBloomInteraction}=await import('/src/experience/bloom-interaction.ts');
          const bloom=createBloomInteraction({canvas:probe.canvas,camera:probe.camera,bedroom:probe.bedroom,reducedMotion:false});
          bloom.setAvailable(true);bloom.start();bloom.update(0);bloom.update(300);
          const before=document.querySelector('#card-panel').hidden;
          bloom.setAvailable(false);bloom.update(20000);bloom.setAvailable(true);bloom.update(21000);
          const paused=document.querySelector('#card-panel').hidden;
          bloom.setReducedMotion(true);bloom.update(21001);
          const ready=!document.querySelector('#card-panel').hidden;
          bloom.start();bloom.update(22000);const count=document.querySelectorAll('#card-panel').length;
          bloom.dispose();bloom.dispose();return{before,paused,ready,count,left:document.querySelectorAll('#card-panel,#gift-dialog').length};
        }""")
        self.assertTrue(result['before']);self.assertTrue(result['paused']);self.assertTrue(result['ready'])
        self.assertEqual(result['count'],1);self.assertEqual(result['left'],0);self.assertEqual(self.errors,[])

    def test_growth_tracks_water_progress_and_freezes_between_actions(self):
        result=self.page.evaluate("""async()=>{
          probe.view.dispose();const {createBloomInteraction}=await import('/src/experience/bloom-interaction.ts');
          const bloom=createBloomInteraction({canvas:probe.canvas,camera:probe.camera,bedroom:probe.bedroom,reducedMotion:false});
          bloom.setAvailable(true);bloom.setWateringProgress(.2);bloom.update(0);
          const bouquet=probe.rig.room.getObjectByName('bloom-bouquet');
          const stem=bouquet.getObjectByName('bloom-tulip-0').children[0];
          const first=stem.scale.y;bloom.update(4000);const paused=stem.scale.y;
          bloom.setWateringProgress(.55);bloom.update(4100);const next=stem.scale.y;
          const cardBefore=bouquet.getObjectByName('bloom-card').visible;
          bloom.setReducedMotion(true);bloom.update(5000);const afterMotion=stem.scale.y;
          bloom.setWateringProgress(.1);bloom.update(5100);const noBackwards=stem.scale.y;
          bloom.setWateringProgress(1);bloom.start();bloom.update(5200);
          const ready=!document.querySelector('#card-panel').hidden;
          bloom.dispose();return{first,paused,next,cardBefore,afterMotion,noBackwards,ready};
        }""")
        self.assertGreater(result['first'],.001);self.assertLess(result['first'],1)
        self.assertEqual(result['paused'],result['first']);self.assertGreater(result['next'],result['first'])
        self.assertFalse(result['cardBefore']);self.assertEqual(result['afterMotion'],result['next'])
        self.assertEqual(result['noBackwards'],result['next']);self.assertTrue(result['ready'])


class BloomExperienceChecks(BrowserCase):
    def ready(self,reduce=True):
        self.page.emulate_media(reduced_motion='reduce' if reduce else 'no-preference')
        self.page.goto(BASE)
        if not reduce:self.page.get_by_role('button',name='Bỏ qua phần mở đầu').click()
        expect(self.page.get_by_role('button',name='Tưới cây',exact=True)).to_be_visible(timeout=20000)

    def finish(self):
        self.page.get_by_role('button',name='Tưới cây',exact=True).click()
        expect(self.page.get_by_role('button',name='Mở thiệp',exact=True)).to_be_visible(timeout=14000)

    def test_real_scene_grows_during_watering_and_freezes_on_pause(self):
        self.ready()
        crop={'x':575,'y':310,'width':150,'height':150}
        before=self.page.screenshot(clip=crop)
        self.page.get_by_role('button',name='Tưới cây',exact=True).click()
        self.page.wait_for_function("document.querySelector('#watering-progress').value >= 1.2")
        self.page.get_by_role('button',name='Tạm dừng',exact=True).click()
        paused=self.page.screenshot(clip=crop);self.assertNotEqual(before,paused)
        value=self.page.locator('#watering-progress').evaluate('(e)=>e.value')
        self.page.wait_for_timeout(450)
        self.assertEqual(paused,self.page.screenshot(clip=crop))
        self.assertEqual(value,self.page.locator('#watering-progress').evaluate('(e)=>e.value'))
        expect(self.page.get_by_role('button',name='Mở thiệp')).not_to_be_visible()
        self.page.emulate_media(reduced_motion='no-preference')
        self.page.emulate_media(reduced_motion='reduce')
        expect(self.page.get_by_role('button',name='Mở thiệp')).not_to_be_visible()
        self.finish();self.assertEqual(self.errors,[])

    def test_reduced_keyboard_dialog_focus_and_resize(self):
        self.ready();expect(self.page.get_by_role('button',name='Mở thiệp')).not_to_be_visible()
        self.finish();expect(self.page.locator('#watering-panel')).not_to_be_visible()
        button=self.page.get_by_role('button',name='Mở thiệp');button.focus();button.press('Enter')
        expect(self.page.get_by_role('dialog')).to_be_visible()
        self.page.set_viewport_size({'width':390,'height':844})
        box=self.page.get_by_role('dialog').bounding_box();self.assertLessEqual(box['width'],390)
        self.page.keyboard.press('Escape');expect(button).to_be_focused()
        self.page.evaluate("window.dispatchEvent(new Event('beforeunload'))")
        self.assertEqual(self.page.locator('#gift-dialog,#card-panel,canvas').count(),0);self.assertEqual(self.errors,[])

    def test_portrait_canvas_card_and_touch_dialog(self):
        self.page.set_viewport_size({'width':390,'height':844});self.ready();self.finish()
        xy=watering_browser.WateringExperienceChecks.point(self,(1.10,1.755,-.78))
        cdp=self.context.new_cdp_session(self.page)
        cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':xy[0],'y':xy[1],'id':0}]})
        cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        expect(self.page.get_by_role('dialog')).to_be_visible()
        self.page.get_by_role('button',name='Đóng thiệp').click()
        expect(self.page.get_by_role('button',name='Mở thiệp')).to_be_focused();self.assertEqual(self.errors,[])

    def test_normal_bloom_motion_change_does_not_replay(self):
        self.ready(False);self.page.get_by_role('button',name='Tưới cây',exact=True).click()
        expect(self.page.locator('#watering-panel')).not_to_be_visible(timeout=8000)
        # Flowers now grow during watering; only the short card reveal follows it.
        self.page.set_viewport_size({'width':390,'height':844});self.page.emulate_media(reduced_motion='reduce')
        expect(self.page.get_by_role('button',name='Mở thiệp')).to_be_visible(timeout=3000)
        self.page.emulate_media(reduced_motion='no-preference')
        expect(self.page.get_by_role('button',name='Mở thiệp')).to_be_visible();self.assertEqual(self.errors,[])


if __name__=='__main__':unittest.main(verbosity=2)
