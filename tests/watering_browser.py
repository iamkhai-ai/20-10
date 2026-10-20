"""Focused M3 regressions using the existing Python Playwright/Chrome setup.
Module checks need Vite; WateringExperienceChecks also run on compiled preview.
"""
import unittest
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


if __name__=='__main__':
    unittest.main(verbosity=2)
