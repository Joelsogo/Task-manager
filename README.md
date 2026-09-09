# Apex — Tasks + Health & Safety Guide

Executive task manager with real-time wellbeing and phone-safety guidance.

## Live / hosting

This is a **static site** (HTML, CSS, JS). No build step.

### GitHub Pages

1. Repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **master** / folder: **/ (root)**
4. Save — site URL will be:
   `https://joelsogo.github.io/Task-manager/`

### Any static host

Upload these files to the web root:

- `index.html`
- `script.js`
- `style.css`
- `manifest.json`
- `.nojekyll` (GitHub Pages only)

Examples: Netlify, Vercel, Cloudflare Pages, or any static server.

```bash
npx serve .
```

## Features

- Tasks, dashboard, habits, notifications, Apex AI
- Health & safety guide: driving, walking, riding, long gaming, long videos
- Session screen-time alerts and daily check-ins
- PWA-ready (`manifest.json`)

## Limits

Apex tracks time **inside this app** and teaches safe habits. It cannot fully monitor other apps or confirm driving. Use your phone’s Do Not Disturb While Driving and Screen Time / Digital Wellbeing as well.

Language: English (clear safety wording).
