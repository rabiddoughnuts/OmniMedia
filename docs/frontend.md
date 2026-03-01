# Frontend Architecture and UI Parity

This document describes the web UI structure and the parity checklist against the original static design.

## Architecture

- Next.js App Router
- Page routes: `/`, `/catalog`, `/list`, `/auth/register`, `/auth/login`, `/auth/logout`
- Shared layout: header, nav, sidebar, main content

## Core UI modules

- Catalog table (filters, columns, sorting, search)
- List table (status, rating, notes, remove)
- Sidebar media type filters
- Controls bar (filter dropdowns, column picker, search)

## State and data flow

- Query params map to filters
- Table state drives visible columns and sorting
- List mutations update UI state locally after API responses

## Parity checklist

- Theme toggle and logo swap
- Nav active state parity
- Home page intro/welcome/donate layout
- Register page field layout parity
- Body data attributes parity

## Next UI work

- Wire sidebar filters to catalog/list queries
- Add list status editing controls
- Enable full column and filter controls
