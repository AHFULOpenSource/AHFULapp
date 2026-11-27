### Frontend Directory Structure

Feature folders under `Frontend/src/` group each feature's React components (`.jsx`), feature-specific API fetch helpers (`QueryFunctions-<Feature>.js`, or `socialApi.js` in `SocialWall/`), Redux slices (`*Slice.js`/`*Slice.jsx`/`*Slicer.jsx`), and feature-specific stylesheets (`.css`).

```
Frontend/
├── .env                                            !!! You will need to create this (see README/Developer/Frontend/FrontendSetup.md)
├── .firebaserc                                     --- Firebase project alias configuration
├── biome.json                                      --- Biome configuration file (present; not currently wired into CI/scripts)
├── eslint.config.cjs                               --- ESLint rules configuration (linting setup in progress)
├── firebase.json                                   --- Firebase Hosting configuration (serves dist/ with SPA rewrite)
├── index.html                                      --- Initial Entry Point into Application (loads src/Main.jsx)
├── package-lock.json
├── package.json                                    --- Dependencies and npm scripts (dev, build, preview, test, lint)
├── vite.config.js                                  --- Vite Config (port 5173, COOP header for auth popups)
├── images/                                         ### Bundled UI/component images (imported in code; Vite hashes into dist/assets/)
│   ├── AHFULFlex.png
│   ├── char-mouth-closed.png                       --- Companion mascot asset
│   ├── char-mouth-open.png                         --- Companion mascot asset
│   └── Login/                                      ### Login Image Assets Dir
│       ├── Backgrounds/
│       └── GoogleIcons/
├── public/                                         ### Root-served static assets (copied verbatim into dist/ without hashing)
│   ├── apple-touch-icon.png                        --- iOS home screen icon (180x180)
│   ├── favicon.ico                                 --- Browser tab icon (16x16, 32x32)
│   ├── firebase-messaging-sw.js                    --- Service Worker functions for Firebase
│   ├── manifest.webmanifest                        --- Web app manifest (Android / PWA metadata & icons)
│   └── icons/                                      --- PNG favicons & PWA home screen icons (32, 192, 512, maskable)
├── test/                                           ### Frontend Tests Dir (run with `npm test` via `node --test`)
│   ├── unit.test.js                                --- Utilities, CSS/theme tokens, layout, profile, and WorkoutLogger checks
│   ├── WorkoutSearch.test.js                       --- Exercise search & filtering unit tests
│   ├── WorkoutTimer.test.js                        --- Workout autosave & timer queue unit tests
│   └── WorkoutTitles.test.js                       --- Workout title trimming & creation guard tests
└── src/                                            ### All Source Feature Folders & Root Files Dir
    ├── AHFULApp.jsx                                --- Top-level React Router routes, theme application, and WhoAmI session check
    ├── firebase.js                                 --- Initializes Firebase App, Firebase Authentication, and Firebase Messaging
    ├── Footer.jsx                                  --- Footer component
    ├── Header.jsx                                  --- Header bar with Profile link, mobile menu toggle, and Logout button
    ├── Layout.jsx                                  --- Navigation Setup and Page Shell Template
    ├── Loading.jsx                                 --- Loading fallback UI
    ├── Main.jsx                                    --- Main App Entry Point, Holds Redux StoreProvider, PersistGate, and BrowserRouter
    ├── navbar.jsx                                  --- Sidebar navigation links (gated on email verification) and TOS trigger
    ├── QueryFunctions.js                           --- Frontend Wide Accessible functions (formatTime + shared workout/PE fetches)
    ├── siteStyles.css                              --- Global stylesheet (containers, defaults, header, sidebar, loading, TOS, breakpoints)
    ├── store.jsx                                   --- Redux Toolkit Store with redux-persist
    ├── TOS.jsx                                     --- Terms of Service component
    ├── AIChat/                                     ### AI Fitness Chat Companion Dir
    │   ├── AIChat.css
    │   ├── AIChat.jsx
    │   ├── CompanionAI.css
    │   ├── CompanionAI.js
    │   └── CompanionAI.jsx
    ├── Auth/                                       ### Firebase Auth, Profile, Settings & Onboarding Dir
    │   ├── Auth.css
    │   ├── FetchUserSettings.js
    │   ├── GetFirebaseUser.js
    │   ├── HandleAHFULEmailLogin.js
    │   ├── HandleAHFULEmailSignUp.js
    │   ├── HandleAHFULGoogleLogin.js
    │   ├── HandleAHFULLogout.js
    │   ├── HandleAHFULPasswordReset.js
    │   ├── Login.jsx
    │   ├── NotVerified.jsx
    │   ├── OnLoginCache.jsx
    │   ├── Profile.css
    │   ├── Profile.jsx
    │   ├── QueryFunctions-Auth.js
    │   ├── SettingsHook.jsx
    │   ├── SettingsSlice.jsx                       --- Redux Slice for user settings & theme
    │   ├── TutorialOverlay.css
    │   ├── TutorialOverlay.jsx
    │   ├── useTutorial.js
    │   ├── ValidateAHFULPasswordPolicy.js
    │   ├── VerifyEmail.jsx
    │   ├── VerifyPhoneNumber.jsx
    │   └── WhoAmI.js
    ├── Calendar/                                   ### Calendar Widget & Date Navigation Dir
    │   ├── Calendar.css
    │   ├── Calendar.jsx
    │   ├── CalendarButton.css
    │   ├── CalendarButton.jsx
    │   ├── CalendarSlicer.jsx                      --- Redux Slice for selected date
    │   ├── DateNavigation.css
    │   ├── DateNavigation.jsx
    │   └── UseCalendar.js
    ├── Dashboard/                                  ### Home Dashboard & Streak Counter Dir
    │   ├── Dashboard.css
    │   ├── Dashboard.jsx
    │   ├── StreakCounter.css
    │   └── StreakCounter.jsx
    ├── ExercisesCard/                              ### Exercise Picker & Cache Dir (uses global styles; no feature CSS)
    │   ├── ExercisesCard.jsx
    │   ├── PullExercise.jsx
    │   ├── PullExerciseSlice.jsx                   --- Redux Slice for exercise catalog
    │   └── QueryFunctions-Exercises.js
    ├── Favorites/                                  ### Favorites Hub Dir
    │   ├── FavoritesHub.css
    │   ├── FavoritesHub.jsx
    │   └── QueryFunctions-Favorties.js
    ├── Food/                                       ### Food Logger, Charts & Dashboard Food Todo Dir
    │   ├── DashboardFoodTodoItem.jsx
    │   ├── DashboardFoodTodoList.jsx
    │   ├── FoodLog.css
    │   ├── FoodLog.jsx
    │   ├── PullUserFoodSlice.js                    --- Redux Slice for user food logs
    │   ├── QueryFunctions-Food.js
    │   ├── TodayFoodChart.css
    │   └── TodayFoodChart.jsx
    ├── Gyms/                                       ### Gym Map & Nominatim Geocoding Dir
    │   ├── Map.css
    │   ├── Map.jsx
    │   └── QueryFunctions-Gym.js
    ├── HistoryPRs/                                 ### Workout History, PR Charts & Recent Workouts Dir
    │   ├── DashboardWorkoutTodoItem.jsx
    │   ├── DashboardWorkoutTodoList.jsx
    │   ├── ExploreWorkouts.css
    │   ├── HistoryPRs.jsx
    │   ├── PullPersonalExerciseSlice.js            --- Redux Slice for personal exercises
    │   └── WorkoutChart.jsx
    ├── MeasurementLogger/                          ### Body Measurement Logger Dir
    │   ├── MeasurementLogger.css
    │   └── MeasurementLogger.jsx
    ├── SocialWall/                                 ### Friends & Shared Workouts Dir (uses global styles; no feature CSS)
    │   ├── ExploreFriends.jsx
    │   ├── socialApi.js
    │   └── SocialWorkouts.jsx
    ├── Stylesheets/                                ### Global Theme Tokens Dir
    │   └── Themes/
    │       ├── Darkmode.css                        --- `.dark` CSS variable overrides
    │       └── Lightmode.css                       --- `:root` CSS design tokens
    ├── Tasks/                                      ### Tasks & Dashboard Task Todo Dir
    │   ├── DashboardTaskTodoItem.jsx
    │   ├── DashboardTaskTodoList.jsx
    │   ├── ExploreTasks.css
    │   ├── ExploreTasks.jsx
    │   └── QueryFunctions-Tasks.js
    ├── Templates/                                  ### Workout Templates Dir (uses global styles; no feature CSS)
    │   ├── PullTemplateSlice.js                    --- Redux Slice for workout templates
    │   ├── QueryFunctions-Templates.js
    │   └── Templates.jsx
    └── WorkoutLogger/                              ### Two-Screen Workout Logger, HeatMap & Autosave Dir
        ├── ActiveWorkoutView.jsx
        ├── AddExerciseDrawer.jsx
        ├── CreateExerciseModal.jsx
        ├── ExerciseList.jsx
        ├── ExerciseSetTable.jsx
        ├── HeatMap.css
        ├── HeatMap.jsx
        ├── PullWorkoutSlice.js                     --- Redux Slice for workouts
        ├── QueryFunctions-WorkoutLogger.js
        ├── ShareWorkoutModal.jsx
        ├── useAutosave.js
        ├── WorkoutLandingView.jsx
        ├── WorkoutLogger.css
        └── WorkoutLogger.jsx
```

### CSS Structure Summary

- **Theme Tokens (`Frontend/src/Stylesheets/Themes/`)**: `Lightmode.css` (`:root`) and `Darkmode.css` (`.dark`) define shared CSS custom properties (`--color-*`, `--gradient-*`, `--text-*`, `--border-*`, `--radius-*`, `--shadow-*`, `--accent-*`, `--calendar-*`, `--input-*`, `--button-*`, `--error-bg`, `--warning-bg`, `--success-bg`, `--highlight-*`).
- **Global Styles (`Frontend/src/siteStyles.css`)**: Shared containers (`.solo-page-container`, `.dual-page-container`, `.dual-page-sub-left`, `.dual-page-sub-right`), footer, global input/button/table defaults, header, sidebar navbar, loading/TOS overlays, task favorite/recurring badges, and responsive breakpoints (`1024px`, `768px`, `480px`).
- **Feature Styles (`Frontend/src/<Feature>/*.css`)**: Co-located feature stylesheets inside each feature folder (`ExercisesCard/`, `SocialWall/`, and `Templates/` currently rely on global styles without a dedicated `.css` file).

### Static Assets & Images (`images/` vs. `public/`)

To avoid duplicate images and broken production paths, place assets based on how they are referenced:

- **`Frontend/images/` (Bundled component & UI assets)**
  - Use for images imported in React/JS/CSS (such as login backgrounds and Companion AI sprites) or linked in `index.html`.
  - Vite validates imported paths at build time, omits unimported files from `dist/`, and outputs content-hashed filenames under `dist/assets/` for safe long-term caching.
- **`Frontend/public/` (Root-served, unhashed static assets — lowercase `public/`)**
  - Use for files that browsers, mobile OSes, manifests, or service workers fetch at fixed root-relative URLs (such as `firebase-messaging-sw.js`, `manifest.webmanifest`, iOS `apple-touch-icon.png`, Android/PWA icons, and notification icons).
  - Vite copies everything in `Frontend/public/` verbatim into the root of `Frontend/dist/` without hashing (and cannot be `import`ed from JS). Always reference them with root-relative paths (e.g. `/apple-touch-icon.png`).
  - **Firebase Hosting behavior (`Frontend/firebase.json`)**: Firebase serves `dist/` and checks exact static files on disk before applying the `"**" -> "/index.html"` SPA rewrite. Any root-URL asset must exist in `Frontend/public/` (so it lands in `dist/`), otherwise Firebase serves `index.html` instead of the asset.
