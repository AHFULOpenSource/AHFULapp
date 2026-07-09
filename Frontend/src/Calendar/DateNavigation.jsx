import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { setSelectedDate } from './CalendarSlicer';
import { toLocalDateString, parseLocalDate } from './UseCalendar';
import './DateNavigation.css';

export default function DateNavigation() {
  const selectedDate = useSelector((state) => state.calendar.selectedDate);
  const dispatch = useDispatch();

  const today = toLocalDateString(new Date());
  const dateValue = selectedDate || today;

  useEffect(() => {
    if (!selectedDate) {
      dispatch(setSelectedDate(today));
    }
  }, []);

  const shiftDay = (offset) => {
    const d = parseLocalDate(dateValue);
    d.setDate(d.getDate() + offset);
    dispatch(setSelectedDate(toLocalDateString(d)));
  };

  const handleDateChange = (e) => {
    dispatch(setSelectedDate(e.target.value));
  };

  return (
    <div className="date-navigation">
      <button
        className="period-btn"
        type="button"
        onClick={() => shiftDay(-1)}
        aria-label="Previous day"
      >
        Prev Day
      </button>
      <input
        type="date"
        className="date-input"
        value={dateValue}
        onChange={handleDateChange}
      />
      <button
        className="period-btn"
        type="button"
        onClick={() => shiftDay(1)}
        aria-label="Next day"
      >
        Next Day
      </button>
    </div>
  );
}
