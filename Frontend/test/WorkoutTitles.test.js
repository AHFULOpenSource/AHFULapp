import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

const landingJsx = fs.readFileSync(new URL('../src/WokoutLogger/WorkoutLandingView.jsx', import.meta.url), 'utf8');
const loggerJsx = fs.readFileSync(new URL('../src/WokoutLogger/WorkoutLogger.jsx', import.meta.url), 'utf8');

test('Workout creation accepts blank names, trims names, and guards in-flight submissions', async () => {
  const submitBody = landingJsx.match(/const handleCreateSubmit = async \(e\) => \{([\s\S]*?)\n  \};/)[1];
  const disabled = landingJsx.match(/id="create-new-workout-button"[\s\S]*?disabled=\{([^}]+)\}/)[1];
  const fallback = loggerJsx.match(/title: (title \|\| `Workout \$\{selectedDate\}`)/)[1];

  // Blank/whitespace cases catch either title gate; the named case catches lost trimming.
  for (const [newTitle, expected] of [['', 'Workout 2026-10-23'], ['   ', 'Workout 2026-10-23'], ['  Leg day  ', 'Leg day']]) {
    assert.strictEqual(new Function('newTitle', 'isCreating', `return ${disabled}`)(newTitle, false), false);
    const submitted = [];
    const creatingStates = [];
    const submit = new Function('newTitle', 'isCreating', 'selectedGymId', 'onCreateWorkout', 'setIsCreating', 'setNewTitle', 'setSelectedGymId', `return async (e) => {${submitBody}}`)(
      newTitle, false, 'home', async (payload) => submitted.push(payload),
      (value) => creatingStates.push(value), () => {}, () => {}
    );
    let prevented = false;
    await submit({ preventDefault: () => { prevented = true; } });
    assert.strictEqual(prevented, true);
    assert.deepStrictEqual(submitted, [{ title: newTitle.trim(), gym_id: 'home' }]);
    assert.deepStrictEqual(creatingStates, [true, false]);
    assert.strictEqual(new Function('title', 'selectedDate', `return ${fallback}`)(submitted[0].title, '2026-10-23'), expected);
  }

  // Busy cases catch removal of either the disabled state or the handler guard.
  assert.strictEqual(new Function('newTitle', 'isCreating', `return ${disabled}`)('', true), true);
  let duplicates = 0;
  const busySubmit = new Function('newTitle', 'isCreating', 'selectedGymId', 'onCreateWorkout', 'setIsCreating', 'setNewTitle', 'setSelectedGymId', `return async (e) => {${submitBody}}`)(
    'Leg day', true, 'home', () => { duplicates++; }, () => {}, () => {}, () => {}
  );
  await busySubmit();
  assert.strictEqual(duplicates, 0);
});
