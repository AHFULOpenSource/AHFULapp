import Body from "react-muscle-highlighter";
import "./HeatMap.css";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";

const HEAT_COLORS = ["#ef4444"];

function mapTargetMuscleToSlug(targetMuscle) {
  if (!targetMuscle) return [];
  
  const key = targetMuscle.toLowerCase().trim();
  
  const exactMap = {
    abdominals: ["abs"],
    abductors: ["abductors"],
    abs: ["abs"],
    adductors: ["adductors"],
    biceps: ["biceps"],
    calves: ["calves"],
    chest: ["chest"],
    core: ["abs", "obliques"],
    forearms: ["forearm"],
    "full body": ["chest", "upper-back", "deltoids", "biceps", "triceps", "quadriceps", "hamstrings"],
    "glute medius": ["gluteal"],
    glutes: ["gluteal"],
    grip: ["forearm"],
    hamstrings: ["hamstring"],
    "inner thighs": ["adductors"],
    lats: ["upper-back"],
    legs: ["quadriceps", "hamstrings", "calves"],
    "lower abs": ["abs"],
    "lower back": ["lower-back"],
    "mid back": ["upper-back"],
    "middle back": ["upper-back"],
    neck: ["neck"],
    obliques: ["obliques"],
    quadriceps: ["quadriceps"],
    "rear delts": ["deltoids"],
    shins: ["tibialis"],
    shoulders: ["deltoids"],
    sternocleidomastoid: ["neck"],
    traps: ["trapezius"],
    triceps: ["triceps"],
    "upper chest": ["chest"],
  };
  
  if (exactMap[key]) {
    return exactMap[key];
  }
  
  if (key.includes('abs')) return ["abs"];
  if (key.includes('chest') || key.includes('pectoral')) return ["chest"];
  if (key.includes('back') && key.includes('lower')) return ["lower-back"];
  if (key.includes('back')) return ["upper-back"];
  if (key.includes('shoulder') || key.includes('deltoid')) return ["deltoids"];
  if (key.includes('bicep')) return ["biceps"];
  if (key.includes('tricep')) return ["triceps"];
  if (key.includes('forearm')) return ["forearm"];
  if (key.includes('oblique')) return ["obliques"];
  if (key.includes('quad')) return ["quadriceps"];
  if (key.includes('hamstring')) return ["hamstring"];
  if (key.includes('glute')) return ["gluteal"];
  if (key.includes('calf')) return ["calves"];
  if (key.includes('trap')) return ["trapezius"];
  if (key.includes('adductor') || key.includes('thigh')) return ["adductors"];
  if (key.includes('lat')) return ["upper-back"];
  if (key.includes('neck')) return ["neck"];
  if (key.includes('shin')) return ["tibialis"];
  
  return [];
}

function getDateStringFromTimestamp(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp * 1000);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function HeatMap({ data = {} }) {
  const selectedDate = useSelector((state) => state.calendar.selectedDate);
  const workouts = useSelector((state) => state.pullWorkout.workouts);
  const exercises = useSelector((state) => state.pullExercise.exercises);
  const personalExercises = useSelector((state) => state.pullPersonalExercise.personalExercises);

  const [highlightedMuscles, setHighlightedMuscles] = useState([]);
  //Start of logic to determine which muscles to highlight based on selectedDate and workouts/exercises data
  useEffect(() => {
    //TODO: Mute Logging. 
    // console.log('selectedDate:', selectedDate);
    // console.log('workouts:', workouts);
    // console.log('exercises:', exercises);
    // console.log('personalExercises:', personalExercises);

    if (!selectedDate) {
      setHighlightedMuscles([]);
      return;
    }
    //Trim date to just YYYY-MM-DD
    const selectedDateStr = selectedDate.slice(0, 10);
    console.log('selectedDateStr:', selectedDateStr);

    const todaysWorkout = workouts?.find(w => {
      const workoutDateStr = getDateStringFromTimestamp(w?.startTime);
      const match = workoutDateStr === selectedDateStr;
      console.log('Comparing workout:', w?.title, 'date:', workoutDateStr, '===', selectedDateStr, '=', match);
      return match;
    });

    console.log('todaysWorkout:', todaysWorkout);

    if (!todaysWorkout) {
      setHighlightedMuscles([]);
      return;
    }

    const workoutPersonalExercises = personalExercises?.filter(
      pe => pe?.workout_id === todaysWorkout._id
    ) || [];

    console.log('workoutPersonalExercises:', workoutPersonalExercises);

    if (workoutPersonalExercises.length === 0) {
      setHighlightedMuscles([]);
      return;
    }

    const targetMuscles = new Set();

    workoutPersonalExercises.forEach(pe => {
      console.log('pe.exercise_id:', pe.exercise_id, 'type:', typeof pe.exercise_id);
      
      const exercise = exercises?.find(e => {
        console.log('e._id:', e._id, 'type:', typeof e._id, 'match:', e._id === pe.exercise_id);
        return e?._id === pe?.exercise_id;
      });
      console.log('found exercise:', exercise);
      if (exercise && Array.isArray(exercise.targetMuscles)) {
        console.log('targetMuscles:', exercise.targetMuscles);
        exercise.targetMuscles.forEach(tm => {
          const slugs = mapTargetMuscleToSlug(tm);
          console.log('mapped:', tm, '->', slugs);
          slugs.forEach(s => targetMuscles.add(s));
        });
      }
    });

    console.log('final highlightedMuscles:', Array.from(targetMuscles));
    setHighlightedMuscles(Array.from(targetMuscles));
  }, [selectedDate, workouts, exercises, personalExercises]);

  const bodyData = highlightedMuscles.map((slug) => ({
    slug,
    intensity: 1,
  }));

  console.log('HeatMap bodyData:', bodyData);

  return (
    <div className="heatmap-container">
      <div className="heatmap-view">
        <h4 className="heatmap-title">Front</h4>
        <Body
          data={bodyData}
          side="front"
          gender="male"
          scale={1.4}
          colors={HEAT_COLORS}
          border="#333"
          defaultFill="#e5e5e5"
          hiddenParts={["hair", "head"]}
        />
      </div>

      <div className="heatmap-view">
        <h4 className="heatmap-title">Back</h4>
        <Body
          data={bodyData}
          side="back"
          gender="male"
          scale={1.4}
          colors={HEAT_COLORS}
          border="#333"
          defaultFill="#e5e5e5"
          hiddenParts={["hair", "head"]}
        />
      </div>
    </div>
  );
}

export default HeatMap;