import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

const drawerJsx = fs.readFileSync(new URL('../src/WokoutLogger/AddExerciseDrawer.jsx', import.meta.url), 'utf8');
const filterBody = drawerJsx.match(/const filteredExercises = useMemo\(\(\) => \{([\s\S]*?)\n  \}, \[cachedExercises/)[1];
const filter = new Function('cachedExercises', 'activeTab', 'selectedMuscle', 'selectedEquipment', 'searchTerm', filterBody);

test('Exercise search matches each metadata field independently and excludes nonmatches', () => {
  // Each fixture isolates one OR limb; deleting that limb loses only its matching fixtures.
  const exercises = [
    { name: 'UPPER curl' },
    { targetMuscles: ['Upper trapezius'] },
    { targetMuscles: 'Upper pectoral' },
    { equipments: ['Upper pulley'] },
    { equipment: ['Upper cable'] },
    { equipments: 'Upper machine' },
    { equipment: 'Upper bar' },
    { bodyParts: ['UPPER arms'] },
    { bodyParts: 'Upper legs' },
    { name: 'Squat', targetMuscles: ['quads'], equipments: ['barbell'], bodyParts: ['legs'] },
    { bodyParts: null },
    {},
  ];
  assert.deepStrictEqual(filter(exercises, 'all', '', '', 'uPpEr'), exercises.slice(0, 9));
  // These catch unconditional matches and accidental filtering with an empty query.
  assert.deepStrictEqual(filter(exercises, 'all', '', '', 'no such exercise'), []);
  assert.deepStrictEqual(filter(exercises, 'all', '', '', ''), exercises);
  assert.deepStrictEqual(filter(exercises, 'all', '', '', '   '), exercises);
  assert.deepStrictEqual(filter(exercises, 'muscle', 'quads', '', 'upper'), []);
  assert.deepStrictEqual(filter(exercises, 'equipment', '', 'barbell', 'legs'), [exercises[9]]);
});
