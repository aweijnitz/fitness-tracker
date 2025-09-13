# FitTrack PWA

Offline-first fitness tracker with a self-hosted backend. Client implemented as a progressive web application (PWA).

Target: Android smartphones 

Stack: React, Vite, Tailwind CSS, VitePWA (Workbox), OpenAuth, self‑hosted backend • Mode: Offline‑first

## Setup

```sh
npm install
```

## Development

```sh
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

## Testing

```sh
npm test
```

## PWA

The app is configured with `vite-plugin-pwa` using an injected Workbox service worker. Run `npm run dev` and open the site in your browser. After the first load, reload the page to activate the service worker. You can then switch to offline mode and navigate to the app; the `/offline` page will be shown when network requests fail.
