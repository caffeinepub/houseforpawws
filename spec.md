# HouseForPawws

## Current State
Users can register and create pet listings without agreeing to any Terms of Service. The RegisterPage has CAPTCHA but no TOS checkbox. PetFormPage has no TOS agreement.

## Requested Changes (Diff)

### Add
- TOS checkbox on RegisterPage -- must be checked before account creation is allowed.
- TOS checkbox on PetFormPage -- must be checked before submitting a new listing (create mode only, not edit).
- A simple inline Terms of Service modal/link that shows the TOS text when clicked.

### Modify
- RegisterPage: disable the Create Account button if TOS not agreed.
- PetFormPage: disable the submit button if TOS not agreed (create mode only).

### Remove
- Nothing.

## Implementation Plan
1. Add a `TOSModal` component with basic Terms of Service text.
2. Add TOS checkbox + "View Terms" link to RegisterPage below the CAPTCHA.
3. Add TOS checkbox + "View Terms" link to PetFormPage above the submit button (create mode only).
4. Enforce: buttons disabled unless TOS accepted.
