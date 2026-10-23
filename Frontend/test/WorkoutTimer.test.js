import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

const loggerJsx = fs.readFileSync(new URL('../src/WokoutLogger/WorkoutLogger.jsx', import.meta.url), 'utf8');
const autosaveJs = fs.readFileSync(new URL('../src/WokoutLogger/useAutosave.js', import.meta.url), 'utf8');

function createAutosave(saveFn, options) {
  const timers = new Map();
  let nextId = 0;
  let now = 0;
  const factory = new Function('useRef', 'useCallback', 'useEffect', 'setTimeout', 'clearTimeout',
    `${autosaveJs.replace(/^import[^\n]*\n/, '').replace('export function', 'function')}; return useAutosave;`);
  const useAutosave = factory((current) => ({ current }), (fn) => fn, () => {},
    (fn, delay) => {
      const id = ++nextId;
      timers.set(id, { fn, delay, at: now + delay });
      return id;
    }, (id) => timers.delete(id));
  return {
    ...useAutosave(saveFn, options),
    timers,
    runTimers: () => {
      for (const [id, timer] of [...timers]) {
        if (timers.delete(id)) timer.fn();
      }
    },
    advance: async (ms) => {
      const end = now + ms;
      for (let fired = 0; ; fired++) {
        const next = [...timers].filter(([, timer]) => timer.at <= end)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        assert.ok(fired < 1000, 'timer callbacks must make progress');
        now = next[1].at;
        timers.delete(next[0]);
        next[1].fn();
        await settleMicrotasks();
      }
      now = end;
    },
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const settleMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

test('Workout timer reaches the autosave hook through its queue wrapper on running ticks', async () => {
  // The effect must observe both elapsed time and running state: a toggle-only save goes stale.
  const effect = loggerJsx.match(/useEffect\(\(\) => \{\s*if \(isRunning\) \{?\s*queueAutosave\(\);\s*\}?\s*\}, \[time, isRunning, queueAutosave\]\);/);
  assert.ok(effect, 'running timer ticks must queue autosave');
  const body = effect[0].match(/useEffect\(\(\) => \{([\s\S]*)\}, \[/)[1];
  const queueBody = loggerJsx.match(/const queueAutosave = useCallback\(\(\) => \{([\s\S]*?)\n  \}, \[triggerWorkoutAutosave\]\);/)[1];
  let saved = 0;
  const autosave = createAutosave(async () => { saved++; return { ok: true }; });
  let status = 'idle';
  const queueAutosave = new Function('setSaveStatus', 'triggerWorkoutAutosave', queueBody).bind(
    null, (update) => { status = update(status); }, autosave.trigger
  );
  const tick = new Function('isRunning', 'queueAutosave', body);
  tick(false, queueAutosave);
  assert.strictEqual(autosave.isPending(), false); // A paused tick must not queue a save.
  tick(true, queueAutosave);
  assert.strictEqual(autosave.isPending(), true); // Catches a disconnected queue-to-hook call.
  assert.strictEqual(status, 'pending');
  assert.strictEqual(await autosave.flush(), true);
  status = 'saving';
  tick(true, queueAutosave);
  assert.strictEqual(status, 'saving');
  assert.strictEqual(autosave.isPending(), true); // A tick after a flush must queue again.
  assert.strictEqual(await autosave.flush(), true);
  assert.strictEqual(saved, 2);
  assert.match(loggerJsx, /setTime\(\(prev\) => prev \+ 1\);[\s\S]*?\}, 1000\);/);
  assert.match(loggerJsx, /endTime: \(activeWorkout.startTime \|\| 0\) \+ timeRef.current/);
});

test('Workout autosave clears old deadlines when joining an active request', async () => {
  const request = deferred();
  const autosave = createAutosave(() => request.promise);
  autosave.trigger();
  const saving = autosave.flush();
  autosave.trigger();
  const joined = autosave.flush();
  try {
    // A join must release both timer handles, even when no new request starts.
    assert.strictEqual(autosave.timers.size, 0, 'joining must clear earlier deadlines');
  } finally {
    request.resolve({ ok: true });
    await Promise.all([saving, joined]);
  }
});

test('Workout autosave retries a slow failed request while running ticks continue', async () => {
  const request = deferred();
  let saves = 0;
  const options = { debounceMs: 2300, maxWaitMs: 11000 };
  const autosave = createAutosave(() => ++saves === 1 ? request.promise : { ok: true }, options);
  autosave.trigger();
  const saving = autosave.flush();
  await settleMicrotasks();
  for (let tick = 0; tick < 12; tick++) {
    autosave.trigger();
    await autosave.advance(1000);
  }
  assert.strictEqual(saves, 1);
  request.resolve({ ok: false });
  assert.strictEqual(await saving, false);
  // Ticks reset debounce, so retry needs a deadline they cannot postpone.
  for (let tick = 0; tick < 3; tick++) {
    autosave.trigger();
    await autosave.advance(1000);
  }
  assert.ok(saves >= 2, 'continued ticks must retry within the debounce deadline');
});

test('Workout persistence reconciles saved identities and sends current edits in the follow-up payload', async () => {
  const request = deferred();
  const exercise = (id, weight, isNew = false) => ({
    ...(isNew ? {} : { _id: id }), id, exercise_id: 'shared-catalog',
    setDetails: [{ weight, reps: 5, completed: false }],
  });
  const tableRef = { current: [exercise('personal-a', 10), exercise('temp-b', 30, true), exercise('personal-c', 60)] };
  const persistBody = loggerJsx.match(/const persistWorkout = useCallback\(async \(\) => \{([\s\S]*?)\n  \}, \[dispatch, userId\]\);/)[1];
  let batch = 0;
  const writes = [];
  const bindings = {
    workoutRef: { current: { _id: 'workout', title: 'Workout', startTime: 100 } },
    workoutTitleRef: { current: 'Workout' }, selectedGymIdRef: { current: 'home' },
    exercisesInProgressTableRef: tableRef, personalExToRemoveRef: { current: {} }, timeRef: { current: 20 },
    userId: 'user', setSaveStatus: () => {},
    createPersonalExercise: async (payload) => {
      writes.push({ batch, method: 'create', payload });
      if (batch === 1) await request.promise;
      return { personal_ex_id: batch === 1 ? 'saved-b' : 'saved-d' };
    },
    updatePersonalExercise: async (id, payload) => {
      writes.push({ batch, method: 'update', id, payload });
      if (batch === 1) await request.promise;
    },
    deletePersonalExercise: async () => {}, updateWorkout: async () => {},
    setExercisesInProgressTable: (value) => {
      tableRef.current = typeof value === 'function' ? value(tableRef.current) : value;
    },
    setPersonalExToRemove: () => {}, dispatch: () => {}, pullWorkouts: () => {}, pullPersonalExercises: () => {},
  };
  const persist = new Function(...Object.keys(bindings), `return async () => {${persistBody}}`)(...Object.values(bindings));
  const autosave = createAutosave(() => { batch++; return persist(); });
  autosave.trigger();
  const saving = autosave.flush();
  await settleMicrotasks();
  tableRef.current = [exercise('temp-b', 40, true), exercise('temp-d', 50, true), exercise('personal-a', 20)];
  autosave.trigger();
  request.resolve();
  assert.strictEqual(await saving, true);
  await autosave.advance(2000);
  // Distinct personal identities share a catalog ID; reordering must not swap their saved IDs.
  assert.deepStrictEqual(writes.filter((write) => write.batch === 2).map(({ method, id, payload }) => ({
    method, id, weight: payload.weight, order: payload.order, setDetails: payload.setDetails,
  })), [
    { method: 'update', id: 'saved-b', weight: 40, order: 0, setDetails: [{ weight: 40, reps: 5, completed: false }] },
    { method: 'create', id: undefined, weight: 50, order: 1, setDetails: [{ weight: 50, reps: 5, completed: false }] },
    { method: 'update', id: 'personal-a', weight: 20, order: 2, setDetails: [{ weight: 20, reps: 5, completed: false }] },
  ]);
  assert.deepStrictEqual(tableRef.current.map((ex) => ex.id), ['saved-b', 'saved-d', 'personal-a']);
});

test('Workout autosave retains a failed duration save for retry', async () => {
  let result = { ok: false };
  let calls = 0;
  const autosave = createAutosave(async () => { calls++; return result; });
  assert.strictEqual(await autosave.flush(), false);
  assert.strictEqual(calls, 0); // No pending edit must not cause a write.
  autosave.trigger();
  assert.strictEqual(autosave.isPending(), true);
  assert.strictEqual(await autosave.flush(), false); // Catches reporting failure as success.
  assert.strictEqual(autosave.isPending(), true, 'failed duration save must remain pending');
  result = { ok: true };
  assert.strictEqual(await autosave.flush(), true);
  assert.strictEqual(autosave.isPending(), false); // Successful retry must clear pending.
  assert.strictEqual(calls, 2);
  assert.strictEqual(autosave.timers.size, 0);
  result = undefined;
  autosave.trigger();
  assert.strictEqual(await autosave.flush(), true);
  assert.strictEqual(autosave.isPending(), false); // A save without a result remains a success.

  for (const outcome of ['success', 'failure', 'rejection']) {
    const request = deferred();
    let saves = 0;
    let joinedSettled = false;
    const shared = createAutosave(() => { saves++; return request.promise; });
    shared.trigger();
    const first = shared.flush().catch(() => 'rejected');
    const joined = shared.flush().then((value) => { joinedSettled = true; return value; }, () => 'rejected');
    await settleMicrotasks();
    try {
      assert.strictEqual(joinedSettled, false, 'joined flush must wait for settlement');
      if (outcome === 'rejection') request.reject(new Error('Save failed'));
      else request.resolve({ ok: outcome === 'success' });
      const expected = outcome === 'success';
      assert.deepStrictEqual(await Promise.all([first, joined]), [expected, expected]);
      assert.strictEqual(shared.isPending(), !expected);
      shared.trigger();
      await shared.flush().catch(() => 'rejected');
      assert.strictEqual(saves, 2, 'settlement must release the active request for another save');
    } finally {
      request.resolve({ ok: true });
      await Promise.all([first, joined]);
    }
  }
});

for (const [actionName, handlerName] of [['Back', 'handleBackToLanding'], ['Finish', 'handleFinishWorkout']]) {
  test(`${actionName} joins an unresolved save and proceeds only on clean settlement`, async () => {
    const body = loggerJsx.match(new RegExp(`const ${handlerName} = async \\(\\) => \\{([\\s\\S]*?)\\n  \\};`))[1];
    for (const outcome of ['success', 'failure', 'rejection', 'queued']) {
      const request = deferred();
      let saves = 0;
      const autosave = createAutosave(() => { saves++; return request.promise; });
      autosave.trigger();
      autosave.runTimers(); // Start an automatic save before the user's action.
      await settleMicrotasks();
      const events = [];
      let running = true;
      let activeWorkout = 'original';
      let flushes = 0;
      let actionSettled = false;
      const action = new Function('setIsRunning', 'flushWorkoutAutosave', 'isWorkoutAutosavePending', 'setSelectedWorkout', 'setExercisesInProgressTable', 'setActiveView', 'alert', `return async () => {${body}}`)(
        (value) => { running = value; }, () => { flushes++; return autosave.flush(); }, autosave.isPending,
        (value) => { activeWorkout = value; }, () => {}, (value) => events.push(value), () => events.push('completed')
      );
      const acting = action().then(() => { actionSettled = true; });
      await settleMicrotasks();
      try {
        assert.strictEqual(running, false, `${actionName} must stop the timer`);
        assert.strictEqual(flushes, 1, `${actionName} must flush`);
        // These assertions catch removed awaits and a flush that fails to join an active save.
        assert.deepStrictEqual(events, [], `${actionName} must wait before visible action`);
        assert.strictEqual(activeWorkout, 'original');
        assert.strictEqual(actionSettled, false, `${actionName} must await settlement`);
        if (outcome === 'queued') autosave.trigger();
        if (outcome === 'rejection') request.reject(new Error('Save failed'));
        else request.resolve({ ok: outcome !== 'failure' });
        await acting;
        assert.strictEqual(saves, 1, 'joining must not start a second request');
        const clean = outcome === 'success';
        assert.strictEqual(autosave.isPending(), !clean);
        assert.deepStrictEqual(events, clean ? [actionName === 'Back' ? 'landing' : 'completed'] : []);
        assert.strictEqual(activeWorkout, clean && actionName === 'Back' ? null : 'original');
      } finally {
        request.resolve({ ok: true });
        await acting;
      }
    }
  });
}

test('Workout autosave preserves queued edits and schedules a follow-up after an active save', async () => {
  const request = deferred();
  let saves = 0;
  const autosave = createAutosave(() => ++saves === 1 ? request.promise : { ok: true });
  autosave.trigger();
  const saving = autosave.flush();
  await settleMicrotasks();
  autosave.trigger();
  autosave.runTimers(); // Both edit deadlines can elapse before the first request settles.
  await settleMicrotasks();
  try {
    assert.strictEqual(saves, 1, 'queued edits must not overlap the active request');
    request.resolve({ ok: true });
    assert.strictEqual(await saving, true);
    assert.strictEqual(autosave.isPending(), true, 'queued edits must survive success');
    assert.ok(autosave.timers.size > 0, 'queued edits must get another save deadline');
    autosave.runTimers();
    await settleMicrotasks();
    assert.strictEqual(saves, 2, 'queued edits must reach a follow-up save');
    assert.strictEqual(autosave.isPending(), false);
    assert.strictEqual(autosave.timers.size, 0);
  } finally {
    request.resolve({ ok: true });
    await saving;
  }
});
