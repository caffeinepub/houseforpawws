# HouseForPawws

## Current State

- Full-stack pet adoption platform with Motoko backend and React frontend
- UserProfile type has: displayName, bio, location, profilePhoto
- Registration page collects display name only (optional email/phone missing)
- ProfileSetupModal (auto-shown after login) collects display name, bio, location
- ProfilePage allows editing display name, bio, location, photo
- getUserProfile is restricted: only the owner or admin can view a profile
- No Settings page
- InboxPage exists with sidebar conversation list + chat panel, but visually compact
- No admin-facing view of user email/phone

## Requested Changes (Diff)

### Add
- `email` (Text) and `phone` (Text) fields to UserProfile backend type
- New backend query `adminGetAllUsersWithDetails()` that returns full profiles including email and phone (admin only)
- Settings page at `/settings` with sections: Account (edit display name, email, phone, bio, location, photo), Privacy (info that email/phone are private), Notifications (placeholder)
- Route `/settings` added to App.tsx
- Settings link in navbar profile dropdown and mobile menu

### Modify
- RegisterPage: add required email and phone fields before the CAPTCHA/login step; validate non-empty
- ProfileSetupModal: add required email and phone fields; validate non-empty
- ProfilePage edit form: add email and phone fields (admin-only visible note)
- `getUserProfile` in backend: return public-safe view (displayName, bio, location, profilePhoto only -- NO email/phone) for non-admin callers viewing other users
- `saveCallerUserProfile` and `getCallerUserProfile` continue to work with full profile including email/phone
- Admin dashboard user table: show email and phone columns from `adminGetAllUsers`
- InboxPage: make the sidebar wider, conversation items taller, message bubbles larger font, chat panel header more prominent, overall more spacious and visible layout

### Remove
- Nothing removed

## Implementation Plan

1. Update Motoko backend:
   - Add `email: Text` and `phone: Text` to UserProfile type
   - Update `getUserProfile` to return a sanitized view without email/phone for non-admin callers
   - Keep `getCallerUserProfile` returning full profile (including email/phone) only for the owner
   - `adminGetAllUsers` already returns `[(Principal, UserProfile)]` -- now includes email/phone naturally

2. Update frontend types and hooks:
   - UserProfile interface in backend.d.ts: add email and phone fields
   - useSaveCallerUserProfile and related queries remain the same (backend auto-handles)

3. Update RegisterPage:
   - Add email (type=email, required) and phone (type=tel, required) fields
   - Pass email and phone into saveProfile call

4. Update ProfileSetupModal:
   - Add email and phone required fields
   - Pass to saveProfile

5. Update ProfilePage:
   - Add email and phone to edit form
   - Show "(private)" note next to email and phone labels
   - Do not display email/phone in the public view section

6. Create SettingsPage (`/settings`):
   - Tabs: Account, Privacy, Notifications
   - Account tab: edit all profile fields including email and phone
   - Privacy tab: explanatory text that display name is public, email/phone only visible to admin
   - Notifications tab: placeholder for future settings
   - Redirect to login if not authenticated

7. Add `/settings` route to App.tsx

8. Add Settings link to Navbar dropdown and mobile menu

9. Update InboxPage for better visibility:
   - Increase sidebar width on desktop (from w-72/w-80 to w-80/w-96)
   - Make conversation items taller with larger text and avatar
   - Message bubbles: larger font, more padding, wider max-width
   - Chat panel header: taller, more padding, show online indicator
   - Input bar: larger input, more padding
   - Full viewport height layout improvements

10. Update AdminDashboardPage to show email and phone in user table
