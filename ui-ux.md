# Cursor Directive — Modern Clinic SaaS UI/UX Refresh

Improve the React client UI/UX to look more modern, clean, professional, and suitable for a clinic SaaS platform.

## Main Goal

Modernize the interface without breaking any existing functionality, routing, API calls, authentication, forms, state logic, or business workflows.

## Rules

- Do not remove or change existing functionality.
- Do not change API endpoints, request payloads, auth logic, or route paths.
- Keep all existing user flows working.
- Improve only UI structure, spacing, colors, typography, responsiveness, and user experience.
- Make changes gradually and safely.
- Reuse existing components where possible.
- Avoid large rewrites unless absolutely necessary.
- Keep the project architecture and folder structure unchanged.

## Design Direction

The UI should feel like a modern clinic SaaS dashboard:

- Clean medical/professional style
- Light background
- Soft cards
- Rounded corners
- Better spacing
- Clear hierarchy
- Simple navigation
- Modern dashboard layout
- Calm colors such as blue, teal, green, white, and soft gray
- Better buttons, inputs, tables, modals, and forms
- Mobile responsive layout
- Easy to use for clinic admins, doctors, nurses, and staff

## What To Improve

Focus on:

- Sidebar and top navbar
- Dashboard cards and statistics
- Patient lists and tables
- Appointment or case cards
- Forms and input fields
- Buttons and action states
- Empty states
- Loading states
- Error messages
- Modals and dialogs
- Responsive behavior
- Visual consistency across pages

## UX Requirements

- Make important actions easy to find.
- Use clear labels and readable text.
- Reduce visual clutter.
- Improve spacing between sections.
- Keep forms simple and aligned.
- Make tables easier to scan.
- Add helpful empty states where data is missing.
- Add loading indicators where data is being fetched.
- Keep destructive actions visually clear but not aggressive.

## Safety Checklist

Before finishing, verify:

- App builds successfully.
- No broken imports.
- No broken routes.
- Login/logout still works.
- Protected pages still work.
- API calls still work.
- Forms still submit correctly.
- Existing data still displays correctly.
- Mobile and desktop layouts still work.

## Final Response Format

After changes, summarize:

```md
## UI/UX Update Summary

### Improved Areas
- List updated pages/components.

### Functionality Preserved
- Mention that routes, API calls, auth, forms, and workflows were not changed.

### Verification
- Mention build/runtime checks.
```

## Final Instruction

Act like a senior frontend engineer and product designer. Make the UI feel modern, trustworthy, and clinic-focused, but do not break the existing application.
