# IslandRide

## iPhone Expo Go Smoke Test

This repo now supports a separate native smoke-test workflow for a physical iPhone running Expo Go, while keeping the existing web preview workflow intact.

### Run It

1. Install dependencies with `pnpm install`.
   If `pnpm` is not already on your PATH, use `corepack pnpm install` instead.
2. Start the API server and native Expo dev server with `pnpm dev:expo`.
   If needed, the Corepack equivalent is `corepack pnpm dev:expo`.
3. Make sure your iPhone and this Windows machine are on the same Wi-Fi network.
4. Allow Node.js through Windows Firewall if prompted so the phone can reach Metro on `8081` and the local API server on `3000`.
5. Open Expo Go on the iPhone and scan the QR code shown in the terminal.

### What To Smoke Test

- App boot to the tab shell
- Rider home and destination search
- Ride request, matching, tracking, and completion flows
- Profile screens
- Rider/driver mode switching

### API Access In Expo Go

- `EXPO_PUBLIC_API_BASE_URL` remains the highest-priority override if you want to point the app at a specific backend URL.
- If that env var is not set, the native app derives the Expo LAN host from Expo Go and rewrites it to `http://<your-computer-lan-ip>:3000`.
- If the app cannot derive a LAN-safe API URL, API-backed behavior is treated as unavailable and a clear warning is logged instead of silently falling back to web-style relative URLs.
- You can verify backend reachability from the phone by opening `http://<your-computer-lan-ip>:3000/api/health` in Safari on the iPhone.

### Limitations

- This is intentionally an Expo Go smoke-test path, not a full production-parity iPhone auth flow.
- OAuth sign-in and deep-link callback behavior are not supported in this workflow and should be tested later with an Expo development build.
- Tunnel mode is out of scope for this setup; the default expectation is Expo LAN mode on the same Wi-Fi network.

### Web Preview

- `pnpm dev` and `pnpm dev:web` continue to run the existing web preview workflow.
- If `pnpm` is not on PATH in PowerShell, use `corepack pnpm dev` or `corepack pnpm dev:web`.
