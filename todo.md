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
