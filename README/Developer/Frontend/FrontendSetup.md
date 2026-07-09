## Frontend Setup

### Install Dependencies and Run

In VSCode, open a terminal (`Ctrl + ~`) and navigate to the Frontend folder:

```bash
npm install
npm run dev
# Use Ctrl+C to terminate
```

### ESLint

Check imports and naming conventions:

```bash
npx eslint "src/**/*.{js,jsx,ts,tsx}"
```

### Access the Application

Open your browser and navigate to the local development IP address provided by Vite.

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
