# API Design

This document describes the API surface, authentication model, and request/response conventions. It is intended to evolve into an OpenAPI-first contract with shared schemas.

## Goals

- Stable API contract for web and mobile
- Predictable pagination and filtering
- Consistent error model
- Admin-only media mutation

## Authentication model

- Session-based auth for users (httpOnly cookie)
- Local accounts for MVP; OIDC planned later
- Admin token for privileged media CRUD (header)

### Admin token header

- Header: `X-Admin-Token`
- Value: `MEDIA_ADMIN_TOKEN`

## Endpoint inventory (current + planned)

### Auth

- POST `/auth/register`
- POST `/auth/login`
- POST `/auth/logout`
- GET `/auth/me`

### Media

- GET `/media` (pagination, query, type)
- GET `/media/:id`
- POST `/media` (admin)
- PATCH `/media/:id` (admin)
- DELETE `/media/:id` (admin)

### Lists

- GET `/list`
- POST `/list`
- DELETE `/list/:mediaId`
- PATCH `/list/:mediaId` (status, rating, notes) (planned)

### Relationships (planned)

- GET `/media/:id/relationships`
- POST `/media/:id/relationships` (admin)
- DELETE `/media/:id/relationships/:relatedId` (admin)

## Query parameters

- `page`: 1-based page index
- `pageSize`: page size (default in API)
- `q`: search query
- `type`: media type filter

## Response shapes (target)

The API should converge on a consistent envelope for list responses:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 24,
  "total": 0
}
```

Entity responses should be plain objects with clear, stable keys (no dynamic key names).

## Error model (target)

Aim for a consistent error envelope:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Human-readable summary"
  }
}
```

Use HTTP status codes for broad category and the error envelope for detail.

## Validation

- Target: shared Zod schemas across API and web
- Runtime validation at API boundary
- Use schema versions to avoid breaking changes

## Notes

- The API already supports list add/remove and media admin CRUD.
- The OpenAPI-first contract is a planned refactor and should be implemented once the request/response shapes stabilize.
