# HouseForPawws

## Current State
App has a Stats & Demographics page at `/stats` visible only to admin users, controlled by `useIsCallerAdmin()` query in the Navbar. Login glitching is caused by the admin check query running in Navbar on every render, causing unnecessary re-renders during authentication.

## Requested Changes (Diff)

### Add
- Nothing

### Modify
- Navbar: remove `useIsCallerAdmin` call and all stats/admin nav links
- App.tsx: remove statsRoute
- useQueries.ts: remove `useIsCallerAdmin`, `useAdminGetStats`, `useAdminGetAllUsers` hooks

### Remove
- Stats route and nav links
- All admin query hooks from Navbar

## Implementation Plan
1. Update Navbar.tsx - remove isAdmin state, stats links, BarChart2 icon import
2. Update App.tsx - remove statsRoute and StatsDashboardPage import
3. Update useQueries.ts - remove admin hooks section
