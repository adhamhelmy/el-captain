# El Captain — mobile app

Expo (SDK 57) + React Native app for members and coaches. It talks to the web app's API (`apps/web`) and shares its messages and rules through `packages/messages` and `packages/rules`.

Not an npm workspace (its React version differs from the web's): install it on its own.

## Run it

1. Start the web app: `cd apps/web && npm run dev` (port 3000).
2. `cd apps/mobile && npm install`
3. Copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_API_URL=http://<your-mac-lan-ip>:3000`.
4. `npx expo start --clear`, then scan the QR code with the iPhone Camera app (opens Expo Go).

- The phone and the Mac must be on the same network. If Wi-Fi blocks it, join the Mac to the iPhone's hotspot and update the IP in `.env.local`.
- Expo Go needs the CLI signed in: run `npx expo login` in your own Terminal.
- Press `w` in Expo for a browser preview (the web app allows `localhost:8081` in dev).

## Checks

`npm test` · `npm run typecheck` · `npm run lint`
