import { useMemo, useEffect } from "react";
import UseCalendar from "./UseCalendar";
import { useSelector, useDispatch } from "react-redux";
/*Need to look over framer motion again between sprints, hardly understand it and 
there might be a clearner way to do the calendar animations without it.*/
import { AnimatePresence, motion } from "framer-motion";
import "./Calendar.css";
import { setSelectedDate } from "./CalendarSlicer"; 

const workoutDatesSet = (workouts) => {
  const set = new Set();
  workouts.forEach((w) => {
    if (w.startTime) {
      const date = new Date(w.startTime * 1000);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      set.add(dateStr);
    }
  });
  return set;
};

const foodDatesSet = (foods) => {
  const set = new Set();
  foods.forEach((f) => {
    if (f.time) {
      const date = new Date(f.time * 1000);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      set.add(dateStr);
    }
  });
  return set;
};

export function Calendar({ locale, todoPosition, onCalendarSizeChange }) {
  locale = locale || navigator.language;

  const { 
    year, 
    month, 
    weekdays, 
    cells, 
    isToday, 
    startOfMonth, 
    goNext, 
    goPrevious 
  } = UseCalendar(new Date(), locale);

  const rows = useMemo(() => Math.ceil(cells.length / 7), [cells.length]);

  useEffect(() => {
    onCalendarSizeChange?.(rows);
  }, [rows, onCalendarSizeChange]);

  const dispatch = useDispatch();
  
  const selectedDate = useSelector((state) => state.calendar.selectedDate);
  const workouts = useSelector((state) => state.pullWorkout.workouts);
  const foods = useSelector((state) => state.pullUserFood.food);
  
  const hasWorkoutDates = useMemo(() => workoutDatesSet(workouts), [workouts]);
  const hasFoodDates = useMemo(() => foodDatesSet(foods), [foods]);
  
  const selectedDateStr = selectedDate ? new Date(selectedDate).toISOString().slice(0, 10) : null;

  const monthFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  }, [locale]);

  const handleDateClick = (date) => {
    if (!date || isNaN(date.getTime())) return;
    
    const dateStr = date.toISOString();
    dispatch(setSelectedDate(dateStr));
  };


  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button className="calendar-button" onClick={goPrevious}>
          ← Prev
        </button>
        <div className="calendar-title">
          {monthFormatter.format(new Date(year, month, 1))}
        </div>
        <button className="calendar-button" onClick={goNext}>
          Next →
        </button>
      </div>

      <div className="calendar-weekdays">
        {weekdays.map((dayName) => (
          <div key={dayName} className="calendar-weekday">
            {dayName}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${startOfMonth.getFullYear()}-${startOfMonth.getMonth()}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="calendar-grid"
        >
          {cells.map(({ date, currentMonth }, index) => {
            // Guard against invalid date objects
            if (!(date instanceof Date) || isNaN(date.getTime())) {
              return (
                <div 
                  key={`invalid-${index}`} 
                  className="calendar-cell other"
                >
                  
                </div>
              );
            }

            const todayCell = isToday(date);
            const dateStr = date.toISOString().slice(0, 10);
            const isSelected = selectedDateStr === dateStr;
            const hasWorkout = hasWorkoutDates.has(dateStr);
            const hasFood = hasFoodDates.has(dateStr);

            let cellClass = "calendar-cell";
            if (currentMonth) {
              cellClass += " current";
            } else {
              cellClass += " other";
            }
            if (todayCell) cellClass += " today";
            if (isSelected) cellClass += " selected";

            return (
              <div
                key={date.toISOString()}
                className={cellClass}
                title={date.toLocaleDateString()}
                onClick={() => handleDateClick(date)}
              >
                {hasWorkout && <span className="workout-dot" />}
                {hasFood && <span className="food-dot" />}
                <span className={todayCell ? "calendar-day-today" : ""}>
                  {date.getDate()}
                </span>
                {todayCell && <span className="calendar-today-badge">today</span>}
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}