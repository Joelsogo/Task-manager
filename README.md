# Apex — Tasks + Health & Safety Guide

Executive task manager with **personal accounts**, empty boards, and health/safety guidance.

## Accounts

- **Create account** / **Sign in** with email and password
- Each user has a **private** task list, habits, and notifications on this device
- New accounts start with **zero tasks** (no demo data)
- Sign out from **Profile**

Accounts are stored in the browser on this device (not a central server). For cloud accounts across devices, a backend would be required.

## Hosting

Static site — no build step.

### GitHub Pages

1. **Settings → Pages**
2. Branch: **master** / folder: **/ (root)**
3. Live at: `https://joelsogo.github.io/Task-manager/`

```bash
npx serve .
```

## Features

- Multi-user sign in / register
- Tasks, dashboard, habits, Apex AI
- Health & safety guide (driving, walking, riding, gaming, videos)
- Session and daily wellbeing reminders
