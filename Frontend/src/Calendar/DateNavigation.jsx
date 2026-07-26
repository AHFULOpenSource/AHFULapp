import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { selectSelectedDate, selectSelectedDateOrToday, setSelectedDate, shiftSelectedDateAction } from './CalendarSlicer';
import { isLocalDateString, toLocalDateString } from './UseCalendar';
import './DateNavigation.css';

export default function DateNavigation() {
  const selectedDate = useSelector(selectSelectedDate);
  const dateValue = useSelector(selectSelectedDateOrToday);
  const dispatch = useDispatch();

  const today = toLocalDateString(new Date());

  useEffect(() => {
    if (selectedDate && !isLocalDateString(selectedDate)) {
      console.warn('[calendar] invalid selectedDate detected, resetting to today:', selectedDate);
      dispatch(setSelectedDate(today));
      return;
    }

    if (!selectedDate) {
      dispatch(setSelectedDate(today));
    }
  }, [dispatch, selectedDate, today]);

  const shiftDay = (offset) => {
    dispatch(shiftSelectedDateAction(offset));
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
