import { configureStore, combineReducers } from "@reduxjs/toolkit";
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
import authReducer, { resetAppSession } from "./Auth/AuthSlice.js";
import settingsReducer from "./Auth/SettingsSlice";
import pullExerciseReducer from "./ExercisesCard/PullExerciseSlice";
import pullTemplateReducer from "./Templates/PullTemplateSlice.js";
import pullWorkoutReducer from "./WorkoutLogger/PullWorkoutSlice.js";
import pullPersonalExerciseReducer from "./HistoryPRs/PullPersonalExerciseSlice.js";
import pullUserFoodReducer from "./Food/PullUserFoodSlice.js";
import socialWallReducer from "./SocialWall/SocialWallSlice.js";

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

function withSessionReset(reducer) {
  return (state, action) => {
    if (action.type === resetAppSession.type) {
      return reducer(undefined, action);
    }
    return reducer(state, action);
  };
}

const rootReducer = combineReducers({
  auth: authReducer,
  calendar: persistReducer(
    { key: "calendar", storage, transforms: [calendarTransform] },
    withSessionReset(calendarReducer)
  ),
  setting: persistReducer({ key: "settings", storage }, withSessionReset(settingsReducer)),
  pullExercise: persistReducer({ key: "pullExercise", storage }, withSessionReset(pullExerciseReducer)),
  pullTemplate: persistReducer({ key: "pullTemplate", storage }, withSessionReset(pullTemplateReducer)),
  pullWorkout: persistReducer({ key: "pullWorkout", storage }, withSessionReset(pullWorkoutReducer)),
  pullPersonalExercise: persistReducer(
    { key: "pullPersonalExercise", storage },
    withSessionReset(pullPersonalExerciseReducer)
  ),
  pullUserFood: persistReducer({ key: "pullUserFood", storage }, withSessionReset(pullUserFoodReducer)),
  socialWall: persistReducer({ key: "socialWall", storage }, withSessionReset(socialWallReducer)),
});

export const store = configureStore({
  reducer: rootReducer,
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