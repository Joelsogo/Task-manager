# Apex — Tasks + Health & Safety Guide

Personal accounts, empty boards, health guidance, and **daily motivation** from live quote APIs.

## Daily Motivation

Dashboard loads today’s quote from:

1. [ZenQuotes](https://zenquotes.io/) `/api/today` (primary)
2. [DummyJSON](https://dummyjson.com/) `/quotes/random` (fallback)
3. Offline built-in quotes if the network fails

Quotes are cached once per day. **Refresh** fetches a new random quote.

## Accounts

- Create account / Sign in (email + password, hashed on-device)
- Private tasks per user — **no sample tasks**
- Sign out from Profile

## Hosting

Static site. Enable GitHub Pages: **Settings → Pages → master / root**

`https://joelsogo.github.io/Task-manager/`

```bash
npx serve .
```

Vanilla JS is enough for auth, tasks, and the motivation API. No build step required.
