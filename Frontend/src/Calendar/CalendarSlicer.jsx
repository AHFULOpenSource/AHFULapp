import { createSlice } from '@reduxjs/toolkit';
import { getSelectedDateOrToday, normalizeSelectedDate, shiftSelectedDate, toLocalDateString } from './UseCalendar';

export const selectSelectedDate = (state) => state.calendar.selectedDate;
export const selectSelectedDateOrToday = (state) => getSelectedDateOrToday(state.calendar.selectedDate);

const initialState = {
  selectedDate: toLocalDateString(new Date()),
};

const calendarSlice = createSlice({
    name: 'calendar',
    initialState,
    reducers: {
        setSelectedDate: (state, action) => {
            state.selectedDate = normalizeSelectedDate(action.payload) || toLocalDateString(new Date());
        },
        shiftSelectedDate: (state, action) => {
            state.selectedDate = shiftSelectedDate(state.selectedDate, Number(action.payload) || 0);
        },
        clearSelectedDate: (state) => {
            state.selectedDate = null;
        },
    },
});

export const { setSelectedDate, shiftSelectedDate: shiftSelectedDateAction, clearSelectedDate } = calendarSlice.actions;
export default calendarSlice.reducer;