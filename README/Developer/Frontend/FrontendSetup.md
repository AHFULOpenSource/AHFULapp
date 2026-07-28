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
  - Open your browser to the URL shown in the terminal (typically `https://ahful.app`)
  - Press `Ctrl+C` in the terminal to stop the server

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

### ESLint

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

You may need a `.env` file in the `Frontend/` root with API keys for Firebase, Google OAuth, etc. Ask your team for the required values.

### CSS Contribution Information

- Start with theme pages under `Stylesheets/Themes/`
- Use design tokens (`var(--...)`) for all colors, text, borders, spacing, etc.
- Never hardcode colors or font sizes
- Structure layouts using flexbox or grid
- Keep components consistent (background, border, radius, shadow)
- Use padding for internal spacing, margin for separation
- Avoid stacking large vertical padding (prevents extra lines)
- Let `.dark` handle dark mode automatically (don't duplicate styles)
- Reuse existing classes before creating new ones
- Keep styles modular (component-specific CSS files)
- Follow consistent naming (`.component-name`, `.component-element`)
- Test styles in both color modes before finalizing

### Muscle Map Library

We use `react-muscle-highlighter` for the muscle map feature.  
Credit to: [soroojshehryar](https://github.com/soroojshehryar/react-muscle-highlighter?tab=readme-ov-file)
