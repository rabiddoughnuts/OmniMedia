# OmniMediaTrak Proposal (Synopsis)

**Last updated:** 2026-02-07

This document is a high-level synopsis of the OmniMediaTrak architecture, roadmap, and technology choices. Each topic links to a deeper plan for implementation details, optimization, and runbooks.

## Executive summary

OmniMediaTrak is a global media tracking platform covering books, manga, anime, games, podcasts, live events, and more. The platform starts with a single-region, managed-first stack and evolves into multi-region compute with a single logical database that scales via partitioning, indexing, and replicas.

**Primary goals:**
&Q
- Fast catalog browsing and personal list tracking
- Low operational burden (managed services)
- Clear path to scale and add features without redesign

## Scope by phase (summary)

- **Phase 0 (MVP):** catalog browsing, auth, personal lists, local/manual ingestion
- **Phase 1:** multi-region compute failover
- **Phase 2-3:** EU/APAC compute for latency
- **Phase 4:** database scaling hardening (partitions, indexes, replicas)
- **Phase 5:** social features via derived read models

## Architecture summary

- **Web:** Next.js App Router + TypeScript
- **API:** Fastify + TypeScript (OpenAPI-first target)
- **Auth:** in-app sessions; OIDC later
- **Data:** single PostgreSQL DB with schema isolation
- **Edge:** Cloudflare caching and WAF
- **Ingestion:** local/manual batch job (queue later)

## Topic synopsis with deep links

### Database and data model

- Single Postgres database with schema isolation (`media`, `users`, `interaction`, `auth`)
- `media.media` holds canonical metadata; type-specific fields in JSONB
- `interaction.user_media` hash-partitioned by `user_id`
- Relationships modeled as explicit graph edges

Deep plan: [database.md](database.md)

### API design

- REST API for media, lists, relationships, and auth
- OpenAPI-first contract with shared schemas (planned)
- Admin token for privileged media CRUD

Deep plan: [api.md](api.md)

### Ingestion

- Local-first ingestion that is idempotent and transactional
- Import pipeline uses external IDs and attributes JSONB
- Future option: queue-backed ingestion

Deep plan: [ingestion.md](ingestion.md)

### Frontend

- Catalog browsing and personal lists
- Table-first UI with filters, columns, and list actions
- Parity checklist for the original UI layout

Deep plan: [frontend.md](frontend.md)

### Config and environments

- Environment variables for API, web, and ingestion
- Local vs production defaults

Deep plan: [config.md](config.md)

### Runbook

- Migrations, seed imports, validation queries
- Rollback guidance and verification steps

Deep plan: [runbook.md](runbook.md)

### AWS deployment

- ECS Fargate + ALB + RDS Postgres + S3
- Cloudflare for edge caching and WAF
- Multi-region compute failover plan

Deep plan: [deployment-aws.md](deployment-aws.md)

## Working plans

- MVP execution plan: [mvp-plan.md](mvp-plan.md)
- Backlog and priorities: [backlog.md](backlog.md)
