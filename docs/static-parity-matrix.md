# Static Parity Matrix (CS2800 -> OmniMedia)

This matrix compares the CS2800 static HTML/CSS/JS to the current OmniMedia app.

Excluded as intentional divergences:
- Auth flow (email/password API, header login dropdown, user menu)
- Theme handling (system-based when logged out, html[data-theme])
- Database-driven changes

## Header + nav

| Feature | Static source | Current app | Status | Notes |
| --- | --- | --- | --- | --- |
| Header layout (logo, title, auth area) | ../CS2800/final-project-rabiddoughnuts/index.html | web/src/components/AppHeader.tsx | Implemented | Auth behavior excluded from parity. |
| Login dropdown UI shell | ../CS2800/final-project-rabiddoughnuts/index.html | web/src/components/AppHeader.tsx | Implemented | Behavior differs by design. |
| Nav active state markup (li.active) | ../CS2800/final-project-rabiddoughnuts/Pages/media.html | web/src/components/AppNav.tsx | Partial | Active class is on link, not li. |

## Layout + sidebars

| Feature | Static source | Current app | Status | Notes |
| --- | --- | --- | --- | --- |
| Shared layout (header, nav, main, footer) | ../CS2800/final-project-rabiddoughnuts/index.html | web/src/app/layout.tsx | Implemented | Matches overall structure. |
| Left sidebar media types on media/list pages | ../CS2800/final-project-rabiddoughnuts/Pages/media.html | web/src/components/LeftSidebar.tsx | Implemented | Uses query param filtering. |
| Ad placeholders left/right | ../CS2800/final-project-rabiddoughnuts/index.html | web/src/app/layout.tsx | Implemented | Uses placeholder images. |

## Home page

| Feature | Static source | Current app | Status | Notes |
| --- | --- | --- | --- | --- |
| Intro content (What is OmniMediaTrak + paragraph) | ../CS2800/final-project-rabiddoughnuts/index.html | web/src/app/page.tsx | Implemented | Uses hero section structure. |
| Donate button present | ../CS2800/final-project-rabiddoughnuts/index.html | web/src/app/page.tsx | Implemented | Functionality not wired yet. |
| Home tiles (tracking summary cards) | ../CS2800/final-project-rabiddoughnuts/index.html | web/src/app/page.tsx | Implemented | Tracking hook pending. |

## Media + lists pages

| Feature | Static source | Current app | Status | Notes |
| --- | --- | --- | --- | --- |
| Controls bar layout (filters/columns/search) | ../CS2800/final-project-rabiddoughnuts/Pages/media.html | web/src/components/CatalogTable.tsx, web/src/app/list/page.tsx | Implemented | Layout parity matches. |
| Filter column/value selection | ../CS2800/final-project-rabiddoughnuts/script.js | web/src/components/CatalogTable.tsx, web/src/app/list/page.tsx | Partial | Single column/value filter in app. |
| Max 4 visible columns | ../CS2800/final-project-rabiddoughnuts/script.js | web/src/components/CatalogTable.tsx, web/src/app/list/page.tsx | Missing | No column cap enforced. |
| Search input | ../CS2800/final-project-rabiddoughnuts/Pages/media.html | web/src/components/CatalogTable.tsx, web/src/app/list/page.tsx | Implemented | Client-side filtering. |
| Sortable headers | ../CS2800/final-project-rabiddoughnuts/script.js | web/src/components/CatalogTable.tsx, web/src/app/list/page.tsx | Implemented | Click headers to sort. |
| Add/remove from list | ../CS2800/final-project-rabiddoughnuts/script.js | web/src/components/CatalogTable.tsx, web/src/app/list/page.tsx | Implemented | Uses API. |
| List status edits (status/rating/notes) | ../CS2800/final-project-rabiddoughnuts/script.js | web/src/app/list/page.tsx | Missing | UI not implemented. |

## Register page

| Feature | Static source | Current app | Status | Notes |
| --- | --- | --- | --- | --- |
| Multi-row register form | ../CS2800/final-project-rabiddoughnuts/Pages/register.html | web/src/app/auth/register/page.tsx | Missing | Simplified to email/password. |
| Username availability check | ../CS2800/final-project-rabiddoughnuts/script.js | web/src/app/auth/register/page.tsx | Missing | Not implemented. |
| Back/cancel behavior | ../CS2800/final-project-rabiddoughnuts/Pages/register.html | web/src/app/auth/register/page.tsx | Missing | Register page is simplified. |

## Media detail page

| Feature | Static source | Current app | Status | Notes |
| --- | --- | --- | --- | --- |
| Dedicated media page layout | ../CS2800/final-project-rabiddoughnuts/Pages/item.html | (none) | Missing | Planned as specific media detail page. |
