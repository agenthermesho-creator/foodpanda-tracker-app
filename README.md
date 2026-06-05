# foodpanda-tracker-app

A React web app with iOS-native feel, built with Vite + Framework7 + PWA.

## Features

- **Native iOS feel** — Framework7 renders iOS chrome (nav bars, tab bars, lists)
- **PWA** — Install on home screen, works offline
- **HashRouter** — No 404 issues on GitHub Pages
- **Framer Motion** — Smooth spring animations
- **Mobile-first** — Optimised for iOS Safari

## Quick Start

```bash
npm install
npm run dev      # Dev server with hot reload
npm run build    # Production build → dist/
npm run preview  # Preview the build locally
```

## Deploy to GitHub Pages

```bash
npm install --save-dev gh-pages
```

Add to `package.json`:
```json
"homepage": "https://agenthermesho-creator.github.io/foodpanda-tracker-app",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

Then:
```bash
npm run deploy
```

## Structure

```
src/
├── main.jsx      — Entry point (Framework7 + HashRouter)
├── App.jsx       — Root component (pages + tab bar)
├── index.css     — Global styles + iOS safe areas
public/
├── favicon.svg
├── pwa-192x192.svg
└── pwa-512x512.svg
```

## Customise

Edit `src/App.jsx`:
- Add pages as new route components
- Add routes in the `<Routes>` block
- Extend the tab bar with new tabs
- Replace placeholder PWA icons with real ones
