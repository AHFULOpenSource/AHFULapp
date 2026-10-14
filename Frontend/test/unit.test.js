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
});
