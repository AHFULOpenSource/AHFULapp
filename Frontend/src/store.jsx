import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import {
  createTransform,
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

import calendarReducer from "./Calendar/CalendarSlicer";
import { normalizeSelectedDate, toLocalDateString } from "./Calendar/UseCalendar";
import settingsReducer from "./Auth/SettingsSlice";
import pullExerciseReducer from "./ExercisesCard/PullExerciseSlice";
import pullTemplateReducer from "./Templates/PullTemplateSlice.js";
import pullWorkoutReducer from "./WokoutLogger/PullWorkoutSlice.js";
import pullPersonalExerciseReducer from "./HistoryPRs/PullPersonalExerciseSlice.js";
import pullUserFoodReducer from "./Food/PullUserFoodSlice.js";

// Native localStorage adapter for redux-persist (avoids CJS/ESM bundling quirks)
const storage = {
  getItem: (key) =>
    Promise.resolve(typeof window !== "undefined" ? window.localStorage.getItem(key) : null),
  setItem: (key, item) =>
    Promise.resolve(typeof window !== "undefined" ? window.localStorage.setItem(key, item) : undefined),
  removeItem: (key) =>
    Promise.resolve(typeof window !== "undefined" ? window.localStorage.removeItem(key) : undefined),
};

const calendarTransform = createTransform(
  (inboundState) => inboundState,
  (outboundState) => ({
    ...outboundState,
    selectedDate:
      normalizeSelectedDate(outboundState?.selectedDate) || toLocalDateString(new Date()),
  }),
  { whitelist: ["calendar"] },
);

export const store = configureStore({
  reducer: {
    calendar: persistReducer(
      { key: "calendar", storage, transforms: [calendarTransform] },
      calendarReducer
    ),
    setting: persistReducer({ key: "settings", storage }, settingsReducer),
    pullExercise: persistReducer({ key: "pullExercise", storage }, pullExerciseReducer),
    pullTemplate: persistReducer({ key: "pullTemplate", storage }, pullTemplateReducer),
    pullWorkout: persistReducer({ key: "pullWorkout", storage }, pullWorkoutReducer),
    pullPersonalExercise: persistReducer(
      { key: "pullPersonalExercise", storage },
      pullPersonalExerciseReducer
    ),
    pullUserFood: persistReducer({ key: "pullUserFood", storage }, pullUserFoodReducer),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export function StoreProvider({ children }) {
  return <Provider store={store}>{children}</Provider>;
}