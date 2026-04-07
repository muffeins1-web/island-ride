# IslandRide — TODO

## Baseline (inherited from full prototype)
- [x] All rider screens built (home, search, options, matching, tracking, complete)
- [x] Premium dark design system with navy/turquoise/gold palette
- [x] Island map component with animated markers and routes
- [x] 35+ Bahamian destinations across 8 islands
- [x] Ride history with detail view and rebook
- [x] Profile with sub-screens
- [x] Onboarding flow
- [x] 59 tests passing

## MVP Scope Reduction (previous pass)
- [x] Simplify onboarding to 2 steps (welcome + name), remove role/island selection
- [x] Lock app to rider mode only, remove driver mode from home screen
- [x] Remove driver-conditional tab icons and labels
- [x] Strip Island Share ride type from ride options (keep Standard + Premium only)
- [x] Remove multi-island search from destination search (Nassau only)
- [x] Simplify profile: remove driver sections, favorite drivers, payment, notifications, safety
- [x] Simplify activity tab: ride history only, remove earnings dashboard
- [x] Remove favorite drivers feature from ride complete and tracking screens
- [x] Remove role switching from profile
- [x] Hardcode Nassau location badge on profile and home map
- [x] Verify all flows work end-to-end after changes (0 TS errors, 59 tests pass)

## Full App Restoration & Refinement
- [x] Restore rider + driver mode with role switching
- [x] Restore driver home/dashboard screen
- [x] Restore driver trip flow
- [x] Restore earnings dashboard for driver
- [x] Restore driver onboarding/profile with vehicle setup and document upload
- [x] Restore multi-island selection (Nassau, Freeport, Exuma, Abaco, Eleuthera, Andros, Bimini, Long Island)
- [x] Restore multi-island destination search
- [x] Restore favorite drivers feature
- [x] Fix all dead buttons and placeholder taps across rider screens
- [x] Fix all dead buttons and placeholder taps across driver screens
- [x] Fix all dead buttons and placeholder taps in profile/settings
- [x] Ensure every visible card, tab, menu item, button, and CTA navigates or acts
- [x] Reduce Uber/Lyft clone patterns in wording and layout
- [x] Add island-aware language and local Bahamian context
- [x] Keep premium dark design system consistent across rider and driver
- [x] Verify all rider flows end-to-end
- [x] Verify all driver flows end-to-end
- [x] Run TypeScript check and all tests
- [x] Save clean checkpoint
- [ ] Push to GitHub

## UI Visual Redesign (No Functionality Changes)
- [x] Restore welcome/sign-up screen as the opening/front screen
- [x] Redesign welcome screen: lighter, warmer, island-themed with Bahamas imagery
- [x] Generate welcome background image: palm trees, ocean, modern car, Bahamian lifestyle
- [x] Redesign home/map screen: premium Bahamas palette (deep ocean blue, turquoise, sand/beige, tropical green)
- [x] Replace cartoonish map styling with cleaner, more natural, elegant look
- [x] Update car markers/icons to look more official and professional
- [x] Update theme colors to Bahamas-inspired palette
- [x] Verify all existing functionality unchanged after visual updates (0 TS errors, 76 tests pass)

## Onboarding Restoration with Island Backgrounds
- [x] Generate 3 island-themed background images (island road + happy person in car + Bahamas vibes)
- [x] Restore original 3-page onboarding structure: Welcome, Ride or Drive, Island to Island
- [x] Keep dark navy background with icon rings from original design
- [x] Add background images behind text on each onboarding page
- [x] Make colors more island-like (turquoise, ocean blue, tropical tones)
- [x] Keep setup page (name, role, island selection) as-is
- [x] Verify all functionality unchanged (0 TS errors, 76 tests pass)

## Bug Fix: Onboarding Not Showing First
- [x] Fix onboarding gating so it shows before map for new/returning users
- [x] Ensure onboarding state resets properly or shows on first launch (added Sign Out button in profile)
