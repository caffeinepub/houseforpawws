# HouseForPawws

## Current State
The app has an Admin Dashboard at `/admin` (token-gated) that shows stats and a read-only user table. The admin can see users' display names, emails, phones, and locations. There are no moderation actions -- no way to remove posts or ban users from the dashboard.

The backend has:
- `deletePet(petId)` -- owner-only delete
- `assignCallerUserRole(user, role)` -- role assignment
- `getAllPets()` -- fetch all pets
- `adminGetAllUsers()` -- fetch all users with full profiles

## Requested Changes (Diff)

### Add
- `adminDeletePet(petId: string)` backend function -- admin can delete any pet regardless of owner
- `adminBanUser(user: Principal)` backend function -- sets user to banned state (stored in a separate banned set)
- `adminUnbanUser(user: Principal)` backend function -- removes ban
- `adminGetBannedUsers()` backend function -- returns list of banned principals
- Moderation tabs in Admin Dashboard: "Posts" and "Users"
- Posts tab: table of all pet listings with owner display name, pet name, species, location, date, and a "Remove Post" button
- Users tab: existing user table enhanced with a "Ban" / "Unban" button per user and a banned badge
- Banned users should see a "Your account has been banned" message when they try to use the app

### Modify
- Rename "Admin Dashboard" heading to "Moderation Panel" throughout
- Users table: add Ban/Unban action column

### Remove
- Nothing removed

## Implementation Plan
1. Generate new Motoko backend with `adminDeletePet`, `adminBanUser`, `adminUnbanUser`, `adminGetBannedUsers` functions
2. Update AdminDashboardPage to have Posts and Users tabs with moderation actions
3. Add banned user check in App/Navbar to show banned message
