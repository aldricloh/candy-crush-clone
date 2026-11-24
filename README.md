# Orchard Pop 🍓🍊🍋🍏🍇🫐

A fruit-matching puzzle game inspired by Candy Crush, built as an installable **Progressive Web App**. No framework and no build step: plain HTML, CSS and JavaScript.

## Features

- 8×8 board with swipe **or** tap-tap controls, tuned for phones
- Special fruits: striped (match 4), wrapped (L/T shape, explodes twice), rainbow orb (match 5), plus combos when two specials are swapped together
- Jelly and ice obstacles
- Endless levels, generated from a seed: score, collect, jelly and ice goals, with 1–3 stars
- Leftover moves become an **Orchard Bonus**; one free +5 moves rescue per level
- Hints after 5 seconds idle, synthesized sound effects with mute, progress saved on the device
- Light and dark (night orchard) themes
- Installs to the Home Screen and plays offline

## Project layout

```
public/                 # everything that gets deployed
  index.html
  css/style.css
  js/game.js            # game engine, UI, install flow
  sw.js                 # service worker (offline cache)
  manifest.webmanifest  # PWA manifest
  favicon.svg
  icons/                # app icons (any + maskable + Apple touch)
  screenshots/          # used by the install dialog on Android/Chrome
assets/icon.svg         # source artwork for the app icon
scripts/build-icons.mjs # regenerates public/icons from assets/icon.svg
vercel.json             # static hosting config + headers
```

## Run locally

```bash
npm run dev        # serves public/ on http://localhost:3000
```

The service worker only registers over `http://localhost` or HTTPS. Opening the file directly still lets you play, but without install/offline support.

## Deploy to Vercel

1. In Vercel, choose **Add New → Project** and import this GitHub repo.
2. Leave the defaults; `vercel.json` already sets the framework to *Other* and the output directory to `public`, so no build runs.
3. Deploy. Every push to `main` redeploys automatically.

Or from the CLI: `npx vercel --prod`.

## Install on your phone

- **Android (Chrome):** open the site and tap **Install app** on the title screen, or use *Add to Home screen* in the browser menu.
- **iPhone/iPad (Safari):** tap **Install app** for instructions, or tap Share → **Add to Home Screen**.

## Releasing updates

The app launches from its offline cache and fetches updates in the background, so installed copies show changes on their next launch. When you change files, bump `VERSION` in `public/sw.js` so old caches are cleared.

To change the icon, edit `assets/icon.svg`, then run `npm i -D sharp && npm run icons`.
