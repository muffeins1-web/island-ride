# IslandRide — Design Document

## App Concept
A professional Bahamian rideshare app that allows both licensed taxi drivers and regular people to offer rides across the islands. The app combines Uber/Lyft-level functionality with authentic Bahamian identity — tropical colors, island-aware routing, and a warm, welcoming UX.

## Color Palette
Inspired by the Bahamian flag (aquamarine, gold, black) and the tropical ocean:

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| primary | #00A6B4 | #00C9D9 | Aquamarine — main brand accent, buttons, active states |
| background | #FFFFFF | #0F1419 | Screen backgrounds |
| surface | #F0FAFB | #1A2332 | Cards, elevated surfaces |
| foreground | #0F1419 | #F0F6F7 | Primary text |
| muted | #5E7A7D | #8BA3A6 | Secondary text, labels |
| border | #D4E8EA | #2A3A4A | Dividers, card borders |
| success | #22C55E | #4ADE80 | Ride confirmed, online status |
| warning | #F5A623 | #FBBF24 | Surge pricing, gold accent (Bahamian flag gold) |
| error | #EF4444 | #F87171 | Cancellations, errors |

Secondary accent: **#F5A623** (Bahamian gold) used for premium rides, badges, earnings highlights.

## Screen List

### Shared Screens
1. **Onboarding** — 3-slide welcome carousel with Bahamian imagery
2. **Role Selection** — Choose "Rider" or "Driver" mode (can switch anytime)
3. **Profile** — Avatar, name, phone, rating, ride stats
4. **Settings** — Island preference, payment methods, notification prefs, dark mode, about

### Rider Screens
5. **Rider Home** — Map view with current location, "Where to?" search bar, nearby driver markers
6. **Destination Search** — Search bar with popular destinations (airports, resorts, docks), recent places
7. **Ride Options** — Choose ride type (Standard, Premium, Shared), fare estimate, driver ETA
8. **Ride Matching** — Animated "Finding your driver..." with expanding pulse
9. **Ride Tracking** — Live map with driver en route, driver info card, ETA, contact driver
10. **Ride In Progress** — Map tracking, destination ETA, safety features
11. **Ride Complete** — Fare summary, tip option, rate driver (1-5 stars), leave review
12. **Ride History** — List of past rides with date, route, fare, driver

### Driver Screens
13. **Driver Home** — Map with toggle online/offline, earnings summary, incoming ride requests
14. **Ride Request** — Popup card with rider info, pickup/dropoff, estimated fare, accept/decline timer
15. **Navigation to Pickup** — Map with route to rider, rider contact info
16. **Trip In Progress** — Navigation to destination, trip timer, fare meter
17. **Trip Complete** — Fare breakdown, rider rating
18. **Earnings Dashboard** — Daily/weekly/monthly earnings, trip count, charts
19. **Driver Profile/Verification** — License upload, vehicle info, verification status

## Primary Content & Functionality

### Rider Home (Screen 5)
- Full-screen map centered on user location (Nassau by default)
- Floating "Where to?" search card at bottom
- Small driver markers showing nearby available drivers
- Island selector chip at top (Nassau, Grand Bahama, Exumas, etc.)
- Quick-access buttons: Home, Work, Airport, Resort

### Ride Options (Screen 7)
- Horizontal scrollable ride type cards:
  - **Island Standard** — Regular sedan/car, affordable
  - **Island Premium** — Luxury vehicle, higher fare
  - **Island Share** — Shared ride, split fare
- Each card shows: icon, name, ETA, estimated fare
- "Request Ride" button at bottom

### Driver Home (Screen 13)
- Map view with heat zones showing demand
- Large toggle switch: "Go Online" / "Go Offline"
- Today's earnings card: total, trips, hours online
- Incoming ride request overlay

### Earnings Dashboard (Screen 18)
- Period selector: Today / This Week / This Month
- Total earnings prominently displayed
- Bar chart of daily earnings
- Trip list with individual fares
- Payout information

## Key User Flows

### Flow 1: Rider Books a Ride
1. Open app → Rider Home with map
2. Tap "Where to?" → Destination Search
3. Type or select destination → Ride Options screen
4. Select ride type → See fare estimate & ETA
5. Tap "Request Ride" → Ride Matching animation
6. Driver accepts → Ride Tracking (driver en route)
7. Driver arrives → notification, "Your driver is here"
8. Trip begins → Ride In Progress with live tracking
9. Arrive → Ride Complete with fare, tip, rating

### Flow 2: Driver Accepts a Ride
1. Open app → Driver Home
2. Toggle "Go Online" → Start receiving requests
3. Ride request popup → See rider info, pickup, fare
4. Tap "Accept" (15s timer) → Navigation to Pickup
5. Arrive at pickup → Tap "Start Trip"
6. Navigate to destination → Trip In Progress
7. Arrive → Tap "Complete Trip" → Trip Complete
8. See fare breakdown, rate rider

### Flow 3: Switch Roles
1. From any screen → Tap profile icon
2. Tap "Switch to Driver/Rider" toggle
3. App transitions to the other mode's home screen

## Layout Principles
- Bottom tab navigation for main sections
- Rider tabs: Home, Activity (history), Profile
- Driver tabs: Home, Earnings, Profile
- Maps are full-bleed with floating cards/sheets
- Bottom sheets for ride details (iOS-native feel)
- Large touch targets (48px minimum) for one-handed use
- Consistent card radius: 16px
- Spacing scale: 4, 8, 12, 16, 24, 32

## Typography
- Headings: Bold, 24-32px
- Body: Regular, 16px
- Captions: Regular, 13px
- All text uses system font (San Francisco on iOS)

## Bahamian Identity Elements
- Aquamarine + gold color scheme reflecting flag and ocean
- Island names as location context (not just city names)
- "Island Standard" / "Island Premium" ride type naming
- Warm, friendly copy ("Welcome to IslandRide", "Ride the islands")
- Conch shell or wave motifs in subtle UI decorations
