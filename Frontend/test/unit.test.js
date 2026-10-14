const test = require('node:test');
const assert = require('node:assert');
const { formatTime } = require('../src/QueryFunctions.js');

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
  const fs = require('fs');
  const path = require('path');

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
});
