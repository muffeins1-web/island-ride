# IslandRide MVP — Design Specification

## Overview

IslandRide MVP is a Nassau-first rider experience. The app launches with a single island (Nassau / Paradise Island), rider mode only, and two ride tiers (Standard and Premium). The goal is a tight, polished core loop that feels like a real product — not a feature demo.

## Design System

Inherited from the full prototype. No changes to the visual language.

| Token | Dark Value | Usage |
|-------|-----------|-------|
| Background | `#0B1120` | Screen backgrounds |
| Surface | `#131D2F` | Cards, elevated panels |
| Foreground | `#F0F4F8` | Primary text |
| Muted | `#7B8FA3` | Secondary text, labels |
| Border | `#1E2D42` | Dividers, card borders |
| Primary (Turquoise) | `#00D4E4` | CTA buttons, active states, accents |
| Gold | `#D4A853` | Premium tier, destination pins, highlights |
| Success | `#34D399` | Online indicators, confirmations |
| Error | `#F87171` | Cancel, destructive actions |

## Screen List

### 1. Onboarding (2 steps)
- **Step 1 — Welcome**: App logo, tagline "Nassau's ride-hailing app", Next button
- **Step 2 — Your Name**: Name input field, "Get Started" button
- No role selection (rider-only), no island selection (Nassau locked)

### 2. Home (Rider)
- Premium dark map showing Nassau road network
- Nearby driver count badge
- "Nassau / Paradise Island" location chip (static, not selectable)
- Bottom card: greeting, "Where to?" search bar, saved places (Home, Work, Airport)
- Tapping "Where to?" or saved place enters booking flow

### 3. Destination Search
- Route input card (Current Location → destination)
- Saved places chips (Home, Work, Airport)
- Recent rides section
- Suggested destinations carousel (Nassau only)
- Popular destinations list (Nassau only, ~16 places)
- Search filtering as user types
- Each result shows name, address, ETA, estimated fare

### 4. Ride Options
- Two ride type cards: Island Standard, Island Premium
- Each card: vehicle illustration area, name, description, ETA, fare range
- Payment method indicator (Cash — BSD)
- "Request Ride" CTA button
- Back button to search

### 5. Ride Matching
- Animated searching state with pulse effect
- Progress indicator (25% → 55% → 85% → 100%)
- "Finding your driver..." text
- Cancel button
- Auto-transitions to Driver Found after ~3.5s

### 6. Driver Found
- Driver name, rating, vehicle info (make/model/color/plate)
- Arrival ETA badge
- "Track Ride" CTA button

### 7. Ride Tracking
- Map with driver marker approaching pickup
- Driver info card (name, vehicle, plate)
- ETA countdown
- Status phases: Driver en route → Arrived → Trip in progress
- Live fare meter during trip
- Contact driver buttons (call, message — simulated)

### 8. Ride Complete
- Fare breakdown (base, distance, time, service fee, total)
- Route summary (pickup → dropoff, distance, duration)
- Star rating selector (1-5)
- Tip options ($0, $2, $5, $10, custom)
- "Done" button returns to home

### 9. Activity (Ride History)
- List of past rides with date, route, fare, status
- Tap ride → detail view with full breakdown
- "Rebook" button on each ride → enters booking flow for same destination
- Empty state for new users

### 10. Profile
- User avatar circle with initials
- Name (editable)
- Rating display
- Total rides count
- Menu items: Help & Support, About IslandRide
- "Nassau / Paradise Island" shown as current location (not editable in MVP)
- App version footer

## Key User Flows

### Primary Flow: Book a Ride
1. User opens app → Home screen with map
2. Taps "Where to?" → Search screen
3. Types or selects destination → Ride Options screen
4. Selects Standard or Premium → Taps "Request Ride"
5. Matching animation → Driver Found
6. Taps "Track Ride" → Tracking screen
7. Driver arrives → Trip starts → Trip completes
8. Fare breakdown → Rate driver → Tip → Done → Home

### Secondary Flow: Rebook from History
1. User taps Activity tab → Ride History
2. Taps a past ride → Detail view
3. Taps "Rebook" → Ride Options (pre-filled destination)
4. Continues normal booking flow

### Quick Book: Saved Places
1. User taps "Home" / "Work" / "Airport" chip on home screen
2. Jumps directly to Ride Options for that destination
3. Continues normal booking flow

## Color Choices

- **Primary actions**: Turquoise `#00D4E4` — all CTA buttons, active tab, search accents
- **Premium tier**: Gold `#D4A853` — Premium ride card accent, destination pins
- **Status indicators**: Green `#34D399` for online/success, Red `#F87171` for cancel
- **Text hierarchy**: White `#F0F4F8` for primary, Slate `#7B8FA3` for secondary
- **Backgrounds**: Deep navy `#0B1120` for screens, Darker navy `#131D2F` for cards
