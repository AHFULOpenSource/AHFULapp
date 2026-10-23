import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

const loggerJsx = fs.readFileSync(new URL('../src/WokoutLogger/WorkoutLogger.jsx', import.meta.url), 'utf8');
const autosaveJs = fs.readFileSync(new URL('../src/WokoutLogger/useAutosave.js', import.meta.url), 'utf8');

test('Workout timer queues autosave on running ticks only and keeps duration accrual', () => {
  // The effect must observe both elapsed time and running state: a toggle-only save goes stale.
  const effect = loggerJsx.match(/useEffect\(\(\) => \{\s*if \(isRunning\) \{?\s*queueAutosave\(\);\s*\}?\s*\}, \[time, isRunning, queueAutosave\]\);/);
  assert.ok(effect, 'running timer ticks must queue autosave');
  const body = effect[0].match(/useEffect\(\(\) => \{([\s\S]*)\}, \[/)[1];
  let queued = 0;
  const tick = new Function('isRunning', 'queueAutosave', body);
  tick(false, () => queued++);
  assert.strictEqual(queued, 0); // Paused state must not dirty another workout.
  tick(true, () => queued++);
  tick(true, () => queued++);
  assert.strictEqual(queued, 2); // Repeated running ticks must each queue a save.
  assert.match(loggerJsx, /setTime\(\(prev\) => prev \+ 1\);[\s\S]*?\}, 1000\);/);
  assert.match(loggerJsx, /endTime: \(activeWorkout.startTime \|\| 0\) \+ timeRef.current/);
});

test('Workout autosave retains a failed duration save for retry', async () => {
  const timers = new Map();
  const factory = new Function('useRef', 'useCallback', 'useEffect', 'setTimeout', 'clearTimeout',
    `${autosaveJs.replace(/^import[^\n]*\n/, '').replace('export function', 'function')}; return useAutosave;`);
  const useAutosave = factory((current) => ({ current }), (fn) => fn, () => {},
    (fn) => { const id = timers.size + 1; timers.set(id, fn); return id; }, (id) => timers.delete(id));
  let result = { ok: false };
  let calls = 0;
  const autosave = useAutosave(async () => { calls++; return result; });
  assert.strictEqual(await autosave.flush(), false);
  assert.strictEqual(calls, 0); // No pending edit must not cause a write.
  autosave.trigger();
  assert.strictEqual(autosave.isPending(), true);
  await autosave.flush();
  assert.strictEqual(autosave.isPending(), true, 'failed duration save must remain pending');
  result = { ok: true };
  assert.strictEqual(await autosave.flush(), true);
  assert.strictEqual(autosave.isPending(), false); // Successful retry must clear pending.
  assert.strictEqual(calls, 2);
  assert.strictEqual(timers.size, 0);
  result = undefined;
  autosave.trigger();
  assert.strictEqual(await autosave.flush(), true);
  assert.strictEqual(autosave.isPending(), false); // A save without a result remains a success.
});

test('Workout finish reports completion only after a successful flush', async () => {
  const body = loggerJsx.match(/const handleFinishWorkout = async \(\) => \{([\s\S]*?)\n  \};/)[1];
  for (const pending of [false, true]) {
    let completed = 0;
    const finish = new Function('setExercisesInProgressTable', 'setIsRunning', 'flushWorkoutAutosave', 'isWorkoutAutosavePending', 'alert', `return async () => {${body}}`)(
      () => {}, () => {}, async () => {}, () => pending, () => completed++
    );
    await finish();
    assert.strictEqual(completed, pending ? 0 : 1); // Failed saves must not announce success.
  }
});

test('Workout navigation stops the timer, flushes before switching, and stays on failed saves', async () => {
  const body = loggerJsx.match(/const handleBackToLanding = async \(\) => \{([\s\S]*?)\n  \};/)[1];
  for (const pending of [false, true]) {
    const events = [];
    const back = new Function('setIsRunning', 'flushWorkoutAutosave', 'isWorkoutAutosavePending', 'setSelectedWorkout', 'setExercisesInProgressTable', 'setActiveView', `return async () => {${body}}`)(
      (value) => events.push(['running', value]), async () => events.push(['flush']), () => pending,
      (value) => events.push(['workout', value]), (value) => events.push(['exercises', value]), (value) => events.push(['view', value])
    );
    await back();
    // Failure must preserve the active workout; success must leave only after flushing.
    assert.deepStrictEqual(events, pending ? [['running', false], ['flush']] :
      [['running', false], ['flush'], ['workout', null], ['exercises', []], ['view', 'landing']]);
  }
});
