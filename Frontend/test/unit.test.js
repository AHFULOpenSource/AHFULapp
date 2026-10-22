import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatTime } from '../src/QueryFunctions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('QueryFunctions - formatTime utility', async (t) => {
  await t.test('formats zero seconds correctly', () => {
    assert.strictEqual(formatTime(0), '00:00:00');
  });

  await t.test('formats minutes and seconds correctly', () => {
    assert.strictEqual(formatTime(65), '00:01:05');
  });

  await t.test('formats hours, minutes, and seconds correctly', () => {
    assert.strictEqual(formatTime(3665), '01:01:05');
  });
});

test('Theme Tokens & CSS Verification', async (t) => {

  await t.test('Lightmode.css defines essential root CSS variables', () => {
    const lightCss = fs.readFileSync(
      path.join(__dirname, '../src/Stylesheets/Themes/Lightmode.css'),
      'utf8'
    );
    assert.ok(lightCss.includes('--color-bg:'));
    assert.ok(lightCss.includes('--text-primary:'));
    assert.ok(lightCss.includes('--input-bg:'));
    assert.ok(lightCss.includes('--accent-blue:'));
  });

  await t.test('Darkmode.css defines matching dark-mode CSS variables', () => {
    const darkCss = fs.readFileSync(
      path.join(__dirname, '../src/Stylesheets/Themes/Darkmode.css'),
      'utf8'
    );
    assert.ok(darkCss.includes('.dark'));
    assert.ok(darkCss.includes('--color-bg:'));
    assert.ok(darkCss.includes('--text-primary:'));
    assert.ok(darkCss.includes('--input-bg:'));
  });

  await t.test('siteStyles.css defines dual-page layout classes', () => {
    const siteCss = fs.readFileSync(
      path.join(__dirname, '../src/siteStyles.css'),
      'utf8'
    );
    assert.ok(siteCss.includes('.dual-page-container'));
    assert.ok(siteCss.includes('.dual-page-sub-left'));
    assert.ok(siteCss.includes('.dual-page-sub-right'));
    assert.ok(siteCss.includes('.solo-page-container'));
  });

  await t.test('Auth.css provides styles for login card and buttons', () => {
    const authCss = fs.readFileSync(
      path.join(__dirname, '../src/Auth/Auth.css'),
      'utf8'
    );
    assert.ok(authCss.includes('.login-content .solo-page-container'));
    assert.ok(authCss.includes('.login-google-button'));
    assert.ok(authCss.includes('.login-button'));
    assert.ok(authCss.includes('.login-button:disabled'));
    assert.ok(!authCss.includes('.google-login-centered'));
    assert.ok(!authCss.includes('.google-button-fixed'));
  });

  await t.test('Dashboard.css defines 3-tier responsive layout and prunes dead classes', () => {
    const dashCss = fs.readFileSync(
      path.join(__dirname, '../src/Dashboard/Dashboard.css'),
      'utf8'
    );
    // Desktop 12-column grid
    assert.ok(dashCss.includes('repeat(12, 1fr)'));
    assert.ok(dashCss.includes('.dashboard-widget-streaks'));
    assert.ok(dashCss.includes('.dashboard-widget-food-chart'));

    // Tablet dual-column unified scroll
    assert.ok(dashCss.includes('minmax(0, 1.15fr) minmax(0, 0.85fr)'));

    // Mobile single continuous scroll
    assert.ok(dashCss.includes('@media (max-width: 767px)'));
  });

  await t.test('Dashboard.jsx renders all modular widget sections', () => {
    const dashJsx = fs.readFileSync(
      path.join(__dirname, '../src/Dashboard/Dashboard.jsx'),
      'utf8'
    );
    assert.ok(dashJsx.includes('dashboard-widget-streaks'));
    assert.ok(dashJsx.includes('dashboard-widget-calendar'));
    assert.ok(dashJsx.includes('dashboard-widget-food-todo'));
    assert.ok(dashJsx.includes('dashboard-widget-workout-todo'));
    assert.ok(dashJsx.includes('dashboard-widget-tasks'));
    assert.ok(dashJsx.includes('dashboard-widget-food-chart'));
    assert.ok(dashJsx.includes('dashboard-widget-workout-chart'));
  });

  await t.test('Navbar.jsx includes Explore Friends link', () => {
    const navbarJsx = fs.readFileSync(
      path.join(__dirname, '../src/navbar.jsx'),
      'utf8'
    );
    assert.ok(navbarJsx.includes('to="/ExploreFriends"'));
    assert.ok(navbarJsx.includes('Explore Friends'));
  });

  await t.test('Header.jsx includes Logout button and Profile link', () => {
    const headerJsx = fs.readFileSync(
      path.join(__dirname, '../src/Header.jsx'),
      'utf8'
    );
    assert.ok(headerJsx.includes('to="/Profile"'));
    assert.ok(headerJsx.includes('header-logout-btn'));
    assert.ok(headerJsx.includes('HandleAHFULSignOut'));
  });

  await t.test('siteStyles.css defines header-logout-btn styles', () => {
    const siteCss = fs.readFileSync(
      path.join(__dirname, '../src/siteStyles.css'),
      'utf8'
    );
    assert.ok(siteCss.includes('.header-logout-btn'));
    assert.ok(siteCss.includes('.header-logout-btn:hover'));
  });

  await t.test('Profile.jsx integrates settings and removes obsolete buttons', () => {
    const profileJsx = fs.readFileSync(
      path.join(__dirname, '../src/Auth/Profile.jsx'),
      'utf8'
    );
    // Combined settings sections
    assert.ok(profileJsx.includes('Personal Settings'));
    assert.ok(profileJsx.includes('Workout Settings'));
    assert.ok(profileJsx.includes('Account Settings'));
    assert.ok(profileJsx.includes('getBackendSettingsPayload'));
    assert.ok(profileJsx.includes('handleEnableNotifications'));
    assert.ok(profileJsx.includes('HandleAHFULPasswordReset'));

    // Obsolete items and manual save feature removed from Profile.jsx
    assert.ok(!profileJsx.includes('handleSaveSettings'));
    assert.ok(!profileJsx.includes('settings-save-section'));
    assert.ok(!profileJsx.includes('profile-settings-wrapper'));
    assert.ok(!profileJsx.includes('profile-logout-section'));
    assert.ok(!profileJsx.includes('navigate("/ExploreFriends")'));
  });

  await t.test('Profile.css defines centered card and pruned dead classes', () => {
    const profileCss = fs.readFileSync(
      path.join(__dirname, '../src/Auth/Profile.css'),
      'utf8'
    );
    assert.ok(profileCss.includes('.profile-container'));
    assert.ok(profileCss.includes('.profile-card'));
    assert.ok(profileCss.includes('.setting-row'));
    assert.ok(profileCss.includes('.dropdown-menu'));

    // Pruned dead classes
    assert.ok(!profileCss.includes('.settings-save-section'));
    assert.ok(!profileCss.includes('.settings-save-button'));
    assert.ok(!profileCss.includes('.profile-settings-wrapper'));
    assert.ok(!profileCss.includes('.profile-settings-trigger'));
    assert.ok(!profileCss.includes('.profile-logout-section'));
    assert.ok(!profileCss.includes('.profile-logout-btn'));
    assert.ok(!profileCss.includes('.page-layout'));
  });

  await t.test('AHFULApp.jsx eliminates Settings route and obsolete Settings files are removed', () => {
    const appJsx = fs.readFileSync(
      path.join(__dirname, '../src/AHFULApp.jsx'),
      'utf8'
    );
    assert.ok(!appJsx.includes('import { Settings }'));
    assert.ok(!appJsx.includes('path="Settings"'));

    assert.strictEqual(
      fs.existsSync(path.join(__dirname, '../src/Auth/Settings.jsx')),
      false
    );
    assert.strictEqual(
      fs.existsSync(path.join(__dirname, '../src/Auth/Settings.css')),
      false
    );
  });
});

test('Workout Logger Rework - Two-Screen Architecture & Components', async (t) => {
  await t.test('WorkoutLandingView.jsx defines calendar, workout list, quick add, and templates', () => {
    const landingJsx = fs.readFileSync(
      path.join(__dirname, '../src/WokoutLogger/WorkoutLandingView.jsx'),
      'utf8'
    );
    assert.ok(landingJsx.includes('workout-landing-container'));
    assert.ok(landingJsx.includes('calendar-card-wrapper'));
    assert.ok(landingJsx.includes('selectedDate'));
    assert.ok(landingJsx.includes('workouts-list-card'));
    assert.ok(landingJsx.includes('quick-create-card'));
    assert.ok(landingJsx.includes('onStartFromTemplate'));
    assert.ok(landingJsx.includes('templates-chip-list'));
    assert.ok(landingJsx.includes('WorkoutChart'));
  });

  await t.test('ActiveWorkoutView.jsx defines header controls, HeatMap, exercise cards, and drawer trigger', () => {
    const activeJsx = fs.readFileSync(
      path.join(__dirname, '../src/WokoutLogger/ActiveWorkoutView.jsx'),
      'utf8'
    );
    assert.ok(activeJsx.includes('active-workout-container'));
    assert.ok(activeJsx.includes('back-btn'));
    assert.ok(activeJsx.includes('workout-timer-pill'));
    assert.ok(activeJsx.includes('HeatMap'));
    assert.ok(activeJsx.includes('ShareWorkoutModal'));
    assert.ok(activeJsx.includes('AddExerciseDrawer'));
    assert.ok(activeJsx.includes('ExerciseSetTable'));
    assert.ok(activeJsx.includes('template-btn'));
    assert.ok(activeJsx.includes('share-btn'));
    assert.ok(activeJsx.includes('summary-stats-grid'));
  });

  await t.test('ExerciseSetTable.jsx supports set types, BW toggle, lock-in done button, and reordering', () => {
    const tableJsx = fs.readFileSync(
      path.join(__dirname, '../src/WokoutLogger/ExerciseSetTable.jsx'),
      'utf8'
    );
    assert.ok(tableJsx.includes('set-type-select'));
    assert.ok(tableJsx.includes('bw-toggle-btn'));
    assert.ok(tableJsx.includes('set-done-btn'));
    assert.ok(tableJsx.includes('set-row-completed'));
    assert.ok(tableJsx.includes('add-set-btn'));
    assert.ok(tableJsx.includes('onMoveUp'));
    assert.ok(tableJsx.includes('onMoveDown'));
  });

  await t.test('AddExerciseDrawer.jsx supports search and category tabs', () => {
    const drawerJsx = fs.readFileSync(
      path.join(__dirname, '../src/WokoutLogger/AddExerciseDrawer.jsx'),
      'utf8'
    );
    assert.ok(drawerJsx.includes('drawer-backdrop'));
    assert.ok(drawerJsx.includes('drawer-container'));
    assert.ok(drawerJsx.includes('All Exercises'));
    assert.ok(drawerJsx.includes('By Muscle Group'));
    assert.ok(drawerJsx.includes('By Equipment'));
    assert.ok(drawerJsx.includes('drawer-search-input'));
    assert.ok(drawerJsx.includes('CreateExerciseModal'));
    assert.ok(drawerJsx.includes('drawer-create-btn'));
    assert.ok(drawerJsx.includes('drawer-empty-create-btn'));
  });

  await t.test('CreateExerciseModal.jsx allows creating and saving custom exercises', () => {
    const createModalJsx = fs.readFileSync(
      path.join(__dirname, '../src/WokoutLogger/CreateExerciseModal.jsx'),
      'utf8'
    );
    assert.ok(createModalJsx.includes('create-exercise-modal-content'));
    assert.ok(createModalJsx.includes('createExercise'));
    assert.ok(createModalJsx.includes('pullExercises'));
    assert.ok(createModalJsx.includes('new-exercise-name-input'));
    assert.ok(createModalJsx.includes('chips-selection-box'));
    assert.ok(createModalJsx.includes('create-exercise-submit-btn'));
  });

  await t.test('ShareWorkoutModal.jsx allows sharing workout with friends via email', () => {
    const shareJsx = fs.readFileSync(
      path.join(__dirname, '../src/WokoutLogger/ShareWorkoutModal.jsx'),
      'utf8'
    );
    assert.ok(shareJsx.includes('share-modal-content'));
    assert.ok(shareJsx.includes('/AHFULsocial/shared-workouts'));
    assert.ok(shareJsx.includes('to_user_email'));
    assert.ok(shareJsx.includes('share-email-input'));
  });

  await t.test('WorkoutLogger.jsx coordinates view switching and autosave', () => {
    const loggerJsx = fs.readFileSync(
      path.join(__dirname, '../src/WokoutLogger/WorkoutLogger.jsx'),
      'utf8'
    );
    assert.ok(loggerJsx.includes('activeView'));
    assert.ok(loggerJsx.includes('WorkoutLandingView'));
    assert.ok(loggerJsx.includes('ActiveWorkoutView'));
    assert.ok(loggerJsx.includes('useAutosave'));
    assert.ok(loggerJsx.includes('handleSelectWorkout'));
    assert.ok(loggerJsx.includes('handleBackToLanding'));
  });

  await t.test('WorkoutLogger.css provides comprehensive responsive styles for both screens', () => {
    const loggerCss = fs.readFileSync(
      path.join(__dirname, '../src/WokoutLogger/WorkoutLogger.css'),
      'utf8'
    );
    assert.ok(loggerCss.includes('.workout-landing-container'));
    assert.ok(loggerCss.includes('.active-workout-container'));
    assert.ok(loggerCss.includes('.workout-row-item'));
    assert.ok(loggerCss.includes('.set-table'));
    assert.ok(loggerCss.includes('.set-row-completed'));
    assert.ok(loggerCss.includes('.drawer-container'));
    assert.ok(loggerCss.includes('.drawer-create-btn'));
    assert.ok(loggerCss.includes('.create-exercise-modal-content'));
    assert.ok(loggerCss.includes('.share-modal-content'));
    assert.ok(loggerCss.includes('@media (max-width: 768px)'));
  });
});


