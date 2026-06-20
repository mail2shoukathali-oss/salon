# MVP Status and Release Checklist

## Project Overview

This salon commission management app is deployed on Vercel and already covers the core day-to-day salon workflow:

- Staff create service entries from mobile devices.
- Managers review, approve, and reject service entries.
- Managers record expenses and close the day.
- Owners review dashboards, monthly payouts, settings, and reports.
- Print-friendly daily, monthly, and performance statements are available.

The app is currently in an MVP-ready state for operational use. The next phase should focus on polish, controls, and data quality improvements rather than new core workflows.

## Core Business Rules

- Daily closing does not calculate commission.
- Commission is calculated only in monthly payouts.
- Staff Today and Add Service do not show commission.
- Manager reports do not show commission.
- Staff monthly page shows estimated commission only.
- Owner is excluded from staff reports and payout rows.
- Final monthly payout remains the owner-controlled source of truth for staff payouts.
- Owner can edit business settings from `/owner/settings`.

## Completed Features

- Supabase auth and role-based routing
- Login and logout flow
- Owner dashboard with live operational data
- Manager dashboard with live operational data
- Owner staff management
- Staff service entry creation from the service catalog
- Staff pending entry edit and cancel
- Manager service entry review and approval
- Manager expense management
- Manager daily closing
- Owner monthly payouts and payout adjustments
- Staff monthly estimated commission view
- Staff profile/account view
- Manager daily and monthly staff performance reports
- Print pages for payouts, daily closing, and staff reports
- Business settings for printable document titles and company name
- AppShell navigation grouping and logout controls

## Role-Based Access Summary

### Owner

- Full access to owner dashboard, staff management, payouts, settings, reports, and operational pages.
- Can generate and update monthly payouts.
- Can edit payout deductions and mark payouts as paid.

### Manager

- Can access operational pages, reports, closing, and payout views.
- Can approve or reject service entries.
- Can manage expenses and daily closing.
- Can view payout pages but does not control payout generation or payment actions.

### Staff

- Can access today’s entries, add-service, monthly estimated commission, and profile pages.
- Can create service entries.
- Can edit or cancel only their own pending entries.
- Cannot access manager or owner management actions.

## Staff Flow Checklist

- Log in successfully.
- Open `/staff/today`.
- Review today’s work summary.
- Add a new service entry from `/staff/add-service`.
- Select an active service from the catalog.
- Confirm the entry saves as pending.
- Edit a pending entry from `/staff/entries/[id]/edit`.
- Cancel a pending entry if needed.
- Open `/staff/monthly` to view approved sales and estimated commission.
- Open `/staff/profile` to review account details.

## Manager Flow Checklist

- Log in successfully as manager.
- Open the manager dashboard.
- Review today’s operational totals.
- Review pending entries in `/manager/entries/pending`.
- Approve or reject service entries.
- Add or edit expenses in `/manager/expenses`.
- Review and save daily closing in `/manager/closing`.
- Open daily and monthly staff performance reports.
- Use print pages for daily closing and staff performance reports when needed.
- View monthly payouts without editing payout generation.

## Owner Flow Checklist

- Log in successfully as owner.
- Open `/owner/dashboard` for live operational visibility.
- Manage staff profiles in `/owner/staff`.
- Review and adjust monthly payouts in `/owner/payouts/[year]/[month]`.
- Mark payouts as paid after verification.
- Open `/owner/settings` to edit business name and printable statement titles.
- Review all operational reports and print statements.

## Print/Report Checklist

- Monthly payout print page uses saved business settings.
- Daily closing print page uses saved business settings.
- Staff daily report print page excludes owner rows.
- Staff monthly report print page excludes owner rows.
- Payout print page excludes owner rows.
- Print pages are A4-friendly and hide action controls when printing.
- Report and payout copy avoids commission language where commission is not part of that workflow.

## Deployment Notes

- GitHub push triggers Vercel auto-deploy.
- Avoid manual Vercel deploy unless auto-deploy fails.
- Production behavior should be verified after deploy for login, route protection, and print output.
- Keep `.env.local` out of version control and use environment variables for deployment settings.

## Known Production Notes

- Daily closing totals depend on approved entries and recorded expenses for the selected date.
- Monthly payout totals depend on approved entries in the selected month.
- Staff monthly commission is only an estimate; final payout may change after owner deductions or advance deductions.
- Owner rows are intentionally excluded from staff performance reports and payout rows.
- Business name and printable titles are configurable through `/owner/settings`.

## Recommended Next Features

- Add audit history for payout adjustments.
- Add a downloadable PDF export for print pages.
- Add stronger validation for service catalog and expense data entry.
- Add optional notes or tags for rejected entries.
- Add summary charts for owner and manager dashboards.
- Add a lightweight activity log for operational actions.

