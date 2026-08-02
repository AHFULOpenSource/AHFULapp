import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { createTransform, persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage";
import calendarReducer from "./Calendar/CalendarSlicer";
import { normalizeSelectedDate, toLocalDateString } from "./Calendar/UseCalendar";
import settingsReducer from "./Auth/SettingsSlice";
import pullExerciseReducer from "./ExercisesCard/PullExerciseSlice";
import pullTemplateReducer from "./Templates/PullTemplateSlice.js";
import pullWorkoutReducer from "./WokoutLogger/PullWorkoutSlice.js";
import pullPersonalExerciseReducer from "./HistoryPRs/PullPersonalExerciseSlice.js";
import pullUserFoodReducer from "./Food/PullUserFoodSlice";
import pullFoodReducer from "./Food/PullFoodSlice";

const persistExerciseConfig = {
  key: "pullExercise",
  storage,
};

const persistTemplateConfig = {
  key: "pullTemplate",
  storage,
};

const persistWorkoutConfig = {
  key: "pullWorkout",
  storage,
};
const persistCalendarConfig = {
  key: "calendar",
  storage,
};

const calendarTransform = createTransform(
  (inboundState) => inboundState,
  (outboundState) => ({
    ...outboundState,
    selectedDate: normalizeSelectedDate(outboundState?.selectedDate) || toLocalDateString(new Date()),
  }),
  { whitelist: ["calendar"] },
);
const persistPersonalExerciseConfig = {
  key: "pullPersonalExercise",
  storage,
};

const persistUserFoodConfig = {
  key: "pullUserFood",
  storage,
}

const persistFoodConfig = {
  key: "food",
  storage,
}

const persistSettingsConfig = {
  key: "settings",
  storage,
};

const persistedPullExerciseReducer = persistReducer(persistExerciseConfig, pullExerciseReducer);
const persistedPullTemplateReducer = persistReducer(persistTemplateConfig, pullTemplateReducer);
const persistedPullWorkoutReducer = persistReducer(persistWorkoutConfig, pullWorkoutReducer);
const persistedCalendarReducer = persistReducer(
  { ...persistCalendarConfig, transforms: [calendarTransform] },
  calendarReducer,
);
const persistedPersonalExerciseReducer = persistReducer(persistPersonalExerciseConfig, pullPersonalExerciseReducer);
const persistedUserFoodReducer = persistReducer(persistUserFoodConfig, pullUserFoodReducer);
const persistedFoodReducer = persistReducer(persistFoodConfig, pullFoodReducer);
const persistedSettingsReducer = persistReducer(persistSettingsConfig, settingsReducer);

export const store = configureStore({
  reducer: {
    calendar: persistedCalendarReducer,
    setting: persistedSettingsReducer,
    pullExercise: persistedPullExerciseReducer,
    pullTemplate: persistedPullTemplateReducer,
    pullWorkout: persistedPullWorkoutReducer,
    pullPersonalExercise: persistedPersonalExerciseReducer,
    pullUserFood: persistedUserFoodReducer,
    pullAllFood: persistedFoodReducer
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