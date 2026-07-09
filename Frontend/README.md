## AHFUL Application -- Frontend Technical Documentation

This directory holds all information required for the Frontend UI Setup and Configuration.   

## Setup Instructions
1. **Install Dependencies**:
    - In vscode, open a terminal (ctrl + ~) 
        Navigate to the Frontend folder then run the following: 
        
        ```bash
        npm install
        npm run dev
        #Use Ctrl+C to terminate development process.
        ```

1(a). **Use ESLint to Check Imports**:
    - In vscode, open a terminal (ctrl + ~) 
        Navigate to the Frontend folder then run the following: 
        
        ```bash
        npx eslint "src/**/*.{js,jsx,ts,tsx}"
        ```

2. **Access the Application**:
    - Open your browser and navigate to the local development IP address provided by Vite.

### CSS Contribution Information
  -Start with theme pages under Stylesheets/Themes/
  -Use design tokens (var(--...)) for all colors, text, borders, spacing, etc.
  -Never hardcode colors or font sizes
  -Structure layouts using flexbox or grid
  -Keep components consistent (background, border, radius, shadow)
  -Use padding for internal spacing, margin for separation
  -Avoid stacking large vertical padding (prevents “extra lines”)
  -Let .dark handle dark mode automatically (don’t duplicate styles)
  -Reuse existing classes before creating new ones
  -Keep styles modular (component-specific CSS files)
  -Follow consistent naming (.component-name, .component-element)
  -Test styles in both different color modes before finalizing

### Muscle Map Library Information
react-muscle-highlighter
Credit to: soroojshehryar
Website: https://github.com/soroojshehryar/react-muscle-highlighter?tab=readme-ov-file

