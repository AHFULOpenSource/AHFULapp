## Frontend Setup

### External Requirements

- **Node.js** (version 18+ required for Vite 8)
  - Download from: https://nodejs.org/ (choose the LTS version)
  - Verify installation:
    ```bash
    node --version
    npm --version
    ```
- **npm** (ships with Node.js, no separate install needed)
- **Git** (for cloning the repository)
  - Download from: https://git-scm.com/downloads
  - Verify installation:
    ```bash
    git --version
    ```
- A modern web browser (Chrome, Firefox, Edge, etc.)
- Internet connection (for npm packages and API connections)

### Install Dependencies and Run

- **Navigate to the Frontend folder**
  ```bash
  cd Frontend
  ```

- **Install dependencies** (downloads all packages listed in `package.json`)
  ```bash
  npm install
  ```

- **Start the development server** (Vite with hot module replacement)
  ```bash
  npm run dev
  ```

- **Access the application**
  - Open your browser to the URL shown in the terminal (typically `http://localhost:5173`)
  - Press `Ctrl+C` in the terminal to stop the server

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

### Testing

Run the Frontend test suite from `Frontend/`:

```bash
npm test
```

This runs Node's built-in test runner (`node --test 'test/**/*.test.js'`) against the test files in `Frontend/test/` (`unit.test.js`, `WorkoutSearch.test.js`, `WorkoutTimer.test.js`, and `WorkoutTitles.test.js`).

### Linting & Formatting (Work in Progress)

- Follow the naming and code style conventions in [Coding Style & Linting](../CodingStyle.md) when creating new files or features.
- `Frontend/eslint.config.cjs` defines the target ESLint rules (PascalCase filenames and camelCase variables), and `Frontend/biome.json` is also present in the repository; the linting setup is currently in progress.

Current ES Lint Setup:
- **Check imports and naming conventions**
  ```bash
  npx eslint "src/**/*.{js,jsx,ts,tsx}"
  ```
- **Or use the package script**
  ```bash
  npm run lint
  ```
- **Auto-fix issues**
  ```bash
  npm run lint:fix
  ```

### Environment Variables

Create a `.env` file in `Frontend/` with the Firebase configuration keys used by `Frontend/src/firebase.js` (ask your team for the project values — never commit `.env`):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### CSS & Styling Structure

- **Theme tokens**: Defined in `Frontend/src/Stylesheets/Themes/Lightmode.css` (`:root`) and `Frontend/src/Stylesheets/Themes/Darkmode.css` (`.dark`), covering `--color-*`, `--gradient-*`, `--text-*`, `--border-*`, `--radius-*`, `--shadow-*`, and component-specific variables.
- **Global stylesheet**: `Frontend/src/siteStyles.css` contains shared layout containers (`.solo-page-container`, `.dual-page-container`, `.dual-page-sub-left`, `.dual-page-sub-right`), footer, global input/button/table defaults, header, sidebar navbar, loading/TOS styles, and responsive media queries (`1024px`, `768px`, `480px`).
- **Feature stylesheets**: Feature-specific styles live alongside each feature under `Frontend/src/<Feature>/` (for example `WorkoutLogger.css`, `Dashboard.css`, `Auth.css`, `Calendar.css`).
- **Guidelines for changes**:
  - Use design tokens (`var(--...)`) from `Frontend/src/Stylesheets/Themes/` rather than hardcoding colors or font sizes
  - Structure layouts using flexbox or grid
  - Keep components consistent (background, border, radius, shadow)
  - Use padding for internal spacing, margin for separation
  - Avoid stacking large vertical padding (prevents extra lines)
  - Let `.dark` in `Darkmode.css` handle dark mode overrides automatically (don't duplicate theme logic)
  - Reuse existing classes in `siteStyles.css` before creating new ones
  - Keep new feature styles modular in feature-specific CSS files using consistent naming (`.component-name`, `.component-element`)
  - Test styles in both light and dark modes before finalizing

### Muscle Map Library

We use `react-muscle-highlighter` for the muscle map feature.  
Credit to: [soroojshehryar](https://github.com/soroojshehryar/react-muscle-highlighter?tab=readme-ov-file)
