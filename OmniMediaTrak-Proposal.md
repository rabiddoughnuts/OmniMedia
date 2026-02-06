# OmniMediaTrak — Implementation Plan

**Last updated:** 2026-01-28

This document outlines the technical architecture, hosting strategy, and rollout plan for OmniMediaTrak—a global media tracking platform covering all major media types (books, manga, anime, games, podcasts, live events, and more). It serves as the authoritative reference for technology choices, scaling triggers, and future monetization approaches.

## Index

1. [Executive summary](#1-executive-summary)
2. [Goals and constraints](#2-goals-and-constraints)
3. [Scope by phase (what ships when)](#3-scope-by-phase-what-ships-when)
4. [High-level architecture](#4-high-level-architecture)
5. [Technology stack](#5-technology-stack)
6. [Data model and taxonomy](#6-data-model-and-taxonomy)
7. [Database architecture and disaster recovery](#7-database-architecture-and-disaster-recovery)
8. [Ingestion strategy (local-first)](#8-ingestion-strategy-local-first)
9. [Search and caching strategy](#9-search-and-caching-strategy)
10. [Hosting and global expansion plan](#10-hosting-and-global-expansion-plan)
11. [Measurements and phase triggers](#11-measurements-and-phase-triggers)
12. [Future extensions (monetization, social, subscriptions)](#12-future-extensions-monetization-social-subscriptions)
13. [Key decisions and rationale](#13-key-decisions-and-rationale)
14. [Glossary](#14-glossary)

## 1 Executive summary

I propose a managed-first, global-ready architecture that starts in **AWS us-east-1** and expands to additional regions without a redesign.

- **Web:** Next.js (App Router) + TypeScript + Tailwind + TanStack Query/Table + Zod
- **Mobile:** Expo (React Native) + TypeScript
- **API:** Fastify + TypeScript + OpenAPI-first
- **Auth:** in-app sessions + OIDC (Google + Apple) + optional email/password + account linking; 2FA is a planned upgrade
- **Taxonomy:** Postgres `ltree` for fast “everything under this node” queries
- **Catalog DB:** Aurora PostgreSQL (single writer); enable Aurora Global Database once I deploy multiple regions
- **User DB:** geo-sharded per region when user write latency demands it; each shard has a warm standby (“neighbor backup”)
- **Ingestion:** local/manual on-demand batch job writing to Postgres; queues are optional later
- **Edge + failover:** Cloudflare (CDN/WAF + Load Balancing)
- **Regions:** launch in us-east-1; add us-west-2 first for outage hardening

## 2 Goals and constraints

### 2.1 Media scope

OmniMediaTrak will support the following media types organized into a tiered taxonomy:

- **Read Works**
    - Books: books, light novels, web novels, audiobooks
    - Graphic Stories: manga, comics, webtoons
- **Video Series**
    - anime, shows, web series, movies
- **Interactive Media**
    - games, visual novels
- **Audio Media**
    - podcasts, music, audiobooks
- **Live Events**
    - concerts, theatre, performances (circus, fairs, etc.)
    - *(additional categories to be defined)*

### 2.2 Goals

- Stability and predictable latency
- High discoverability (SEO-friendly public pages)
- Low operational burden (managed services; no self-managed servers)
- Global expansion path with minimal structural changes
- Isolation between ingestion workloads and user traffic

### 2.3 Constraints

- I will not host or store payment card data (payments are offloaded)
- I am willing to accept phased sophistication (I will add complexity only when metrics justify it)

## 3 Scope by phase (what ships when)

The following phases describe the rollout timeline. Each phase includes explicit triggers that determine when to proceed.

### Phase 0 — MVP (single region)

Included:

- Public catalog pages (SEO)
- User accounts (Google/Apple OIDC + optional email/password)
- Personal lists and reviews
- Local/manual ingestion pipeline that updates the catalog DB

Deferred (not in Phase 0):

- Multi-region deployments
- Geo-sharded user DBs
- Dedicated search engine (Meilisearch/Typesense)
- Social features (friends feeds, global leaderboards)
- Subscriptions/billing (design hook only)

### Phase 1 — Outage hardening (multi-region compute)

Included:

- Add **us-west-2** compute and Cloudflare Load Balancing failover

Still acceptable to defer:

- Multi-region database (catalog DB remains single-region)

Trigger:

- Desire to reduce blast radius of a single-region compute outage, or after experiencing a meaningful regional incident

Note:

- This phase primarily improves reachability during a *compute-region* outage. A full database-region outage can still degrade write functionality until database DR is added.

### Phase 2 — International latency (EU compute)

Included:

- Add EU compute region (recommended default: eu-west-1)
- Cloudflare geo steering for read-heavy traffic

Trigger:

- Sustained EU traffic with elevated p95 latency, or user feedback indicates noticeable slowness

### Phase 3 — International latency (APAC compute)

Included:

- Add APAC compute region (recommended default: ap-southeast-1)

Trigger:

- Sustained APAC traffic with elevated p95 latency, or user feedback indicates noticeable slowness

### Phase 4 — Database multi-region features

Included:

- Enable **Aurora Global Database** for the catalog DB once I have 2+ regions

Triggers:

- I have 2+ compute regions and want stronger regional outage recovery for catalog reads/DR
- Meaningful cross-region dependency risk from a single catalog DB region

### Phase 5 — Localized user writes (geo-sharded user DBs)

Included:

- Introduce regional user DB shards when non-US write latency becomes a product problem
- Pair each shard with a warm standby in a neighboring region

Triggers:

- Non-US p95 user-write latency is consistently above UX target
- User complaints indicate "saving changes" feels slow
- Single-region user DB becomes a scaling bottleneck (write throughput or connection limits)

Additional triggers for shard-level decisions:

- **Neighbor-region DR (read replica):** add when shard has meaningful active usage, or when adding subscriptions/paid tiers, or when restore/failover drills show unacceptable recovery time
- **Aurora consideration:** switch to Aurora when shard becomes IO/throughput bound and RDS scaling is no longer cost-effective, or when needing turnkey cross-region DR automation (Aurora Global) with justifiable cost

### Phase 6 — Social and global features

Included:

- Friends lists and leaderboards via derived read models (not cross-shard joins)

Trigger:

- User engagement metrics indicate demand for social features, and the geo-sharded user DB design is proven stable

## 4 High-level architecture

The architecture separates concerns to enable independent scaling and resilience.

*[Diagram placeholder: Overall architecture showing Cloudflare → ECS Fargate → Aurora/RDS, with S3 storage and regional distribution]*

At a high level, I will operate:

- A public, cacheable catalog surface (web pages and API endpoints)
- A correctness-focused user data surface (lists, reviews)
- A separate ingestion pipeline that updates the catalog

Core components:

- Cloudflare (CDN, WAF, Load Balancing)
- Next.js web app (SSR/ISR for SEO)
- Fastify API (OpenAPI contract)
- Aurora PostgreSQL catalog DB
- RDS PostgreSQL user DB (Multi-AZ; later geo-sharded)
- S3 for cover images and exports

## 5 Technology stack

### 5.1 Web

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- TanStack Query + TanStack Table
- Zod for validation (shared with API)

### 5.2 Mobile

- Expo (React Native)
- TypeScript
- Typed API client generated from OpenAPI

### 5.3 API

- Fastify + TypeScript
- OpenAPI-first design (stable contract across web and mobile)
- Request/response validation (JSON Schema and/or Zod)

### 5.4 Authentication

I will implement auth inside the application (no auth SaaS).

- OIDC providers: Google + Apple
- Local accounts: email + password (optional but supported)
- Account linking: users can attach/merge identities
- Web sessions: httpOnly secure cookies
- Planned 2FA: passkeys (WebAuthn) first; TOTP if needed

### 5.5 Observability and safety

- Structured logs (Pino)
- Error reporting (Sentry or equivalent)
- Rate limiting at the edge and in the API
- CSRF protection for cookie-based sessions

## 6 Data model and taxonomy

The taxonomy underpins all content organization and must support fast "show me everything under X" queries.

*[Diagram placeholder: Taxonomy tree structure showing Read Works → Books/Graphic Stories, Video Series, Interactive Media, Audio Media, Live Events]*

The taxonomy is a strict tree (e.g., “Read Works” → “Books” → “Light Novels”).

I will model this with Postgres `ltree`:

- Each taxonomy node has a path (e.g., `read.books.light_novels`).
- Descendant queries become fast indexed prefix operations.
- This matches the workload because taxonomy changes rarely, while reads (“show everything under Books”) are frequent.

Implementation note:

- This requires enabling the Postgres `ltree` extension and indexing the path column.

If I ever need multiple-parent categories (a DAG), I will switch taxonomy relationships to a closure table; I will not assume that requirement today.

## 7 Database architecture and disaster recovery

Database topology is split by domain: catalog (global, eventually multi-region) and user data (geo-sharded for local writes).

*[Diagram placeholder: DB architecture showing Aurora catalog DB with Aurora Global later, and RDS user DB shards by region with read replicas]*

### 7.1 Catalog DB

- Engine: Aurora PostgreSQL
- Writer region: us-east-1 initially
- When I expand beyond one region: enable Aurora Global Database
    - single writer region
    - one or more read regions (only if needed)
    - DR promotion path if the writer region fails

### 7.2 User DB

Phase 0–3:

- Engine: **RDS PostgreSQL (Multi-AZ)** in `us-east-1`.
- User data lives in a separate database from the catalog to keep scaling and DR decisions independent.

Phase 4 (localized writes):

- User data becomes geo-sharded: **one RDS PostgreSQL (Multi-AZ) shard per region**.
- Routing is based on a user’s `home_region`.

Neighbor-region DR (recommended “loose cutoff”):

- For each regional user shard, I will add a **cross-region read replica** in a neighboring region (warm standby) once the shard is “meaningful”.
- “Meaningful” can be treated as any of:
    - the region has sustained active usage (enough that a multi-day outage would be unacceptable)
    - I introduce subscriptions or any paid tier
    - I see real-world incidents and want a faster, practiced recovery path
    - database restore testing indicates my RTO/RPO are worse than I’m comfortable with

Failover approach:

- Keep one writer per shard.
- Promote the neighbor-region replica only during disasters (planned runbook).

When I would consider switching a user shard to Aurora / Aurora Global:

- The shard becomes throughput/IO constrained on RDS and scaling up is no longer cost-effective.
- I want more turnkey cross-region DR automation (Global) and can justify the always-on cost.
- I need additional read scaling characteristics that are easier to operationalize on Aurora.

Cross-user features will not rely on cross-shard joins.

## 8 Ingestion strategy (local-first)

In Phase 0, I will run ingestion locally/manual:

- It will query external APIs “since last sync” and upsert changes.
- It will be idempotent (safe to retry) and transactional.
- It will not run on the web/API request path.

I will keep a clean “plugin hook” so I can later run the same ingestion command as:

- a scheduled managed job in AWS
- or an admin-triggered job behind authentication

If I later need concurrency/retries/backoff at scale, I will add a queue:

- Default: Celery + Redis (best fit if ingestion stays Python)
- Alternative: BullMQ + Redis (if jobs move into TypeScript)

## 9 Search and caching strategy

### 9.1 Caching

- Primary global scaling lever: Cloudflare caching + Next.js ISR for public catalog pages
- Client caching: TanStack Query

Redis is optional and will only be introduced when it provides clear value (shared rate limiting, job queues, or expensive computed caches).

### 9.2 Search

Phase 0–1:

- Postgres FTS + `pg_trgm` for fuzzy title search

Later (trigger-based):

- Add Meilisearch/Typesense as a derived index when Postgres search becomes a bottleneck or UX demands faceting/typo tolerance at scale

## 10 Hosting and global expansion plan

Hosting decisions prioritize managed services and phased regional expansion.

*[Diagram placeholder: Global hosting map showing us-east-1 (launch) → us-west-2 (Phase 1) → eu-west-1 (Phase 2) → ap-southeast-1 (Phase 3)]*

### 10.1 Hosting choices

- Edge, routing, and failover: Cloudflare Load Balancing + WAF
- Compute: ECS Fargate (stateless services per region)
- Databases: Aurora PostgreSQL (catalog; Global Database when multi-region) + RDS PostgreSQL Multi-AZ (user; geo-sharded later)
- Storage: S3

### 10.2 Region plan

- Launch: us-east-1
- First hardening step: add us-west-2 compute (active/active or active/passive)
- Next: add EU compute (recommended default: eu-west-1)
- Next: add APAC compute (recommended default: ap-southeast-1)

I will only add DB multi-region features when the measurements in Section 11 justify it.

## 11 Measurements and phase triggers

Measurements drive all expansion decisions described in the hosting plan. Each phase in Section 3 includes explicit triggers based on observed metrics.

### 11.1 Core measurements

- Availability (uptime) and incident rate
- API p95/p99 latency by geography
- User write latency (p95) for list updates and reviews
- Error rate (5xx) and authentication failure rate
- Cache hit rate (Cloudflare) for public catalog pages
- Database load: CPU/IO, slow query count, connection saturation

Explicit SLOs (service-level objectives) will be set for the above metrics to drive expansion decisions.

### 11.2 Example SLO targets (Phase 0)

These are initial targets; they will be refined based on real-world usage:

- **Uptime:** ≥99.5% (measured monthly)
- **API p95 latency:**
    - US: <200ms
    - EU/APAC: <500ms (acceptable until regional compute is added)
- **User write p95 latency:** <300ms
- **Error rate (5xx):** <0.5%
- **Cache hit rate (catalog pages):** ≥70%
- **Database CPU:** <70% sustained
- **Slow queries:** <10 per hour

### 11.3 Optional technology adoption triggers

Beyond phased regional expansion, these technology upgrades are triggered by specific needs:

**Search engine adoption (Meilisearch / Typesense):**

- Postgres search becomes a top contributor to latency/cost
- Need for faceting/typo tolerance beyond what Postgres provides

**Queue adoption (Redis + Celery / BullMQ):**

- Ingestion needs reliable retries/backoff and parallelism
- Desire to run ingestion unattended on a schedule

**Redis adoption (caching/rate limiting):**

- Shared rate limiting state needed across multiple compute instances
- Expensive computed caches justify centralized in-memory storage

---

*Phase-specific triggers are documented inline in Section 3.*

## 12 Future extensions (monetization, social, subscriptions)

### 12.1 Ads (minimal, selective)

Ads will be low-ops, low-compute on my infrastructure, and strictly limited to **1–2 placements per page** (or none).

#### 12.1.1 Phase 0 approach (start with AdSense + Zaraz)

- Demand: **Google AdSense**
- Tag delivery: **Cloudflare Zaraz** (managed tag execution/config at the edge)
- Page policy: ads only on selected public pages (e.g., catalog/listing/detail), never on sensitive/account pages

Why this fits Phase 0:

- No need to sell ads individually
- Backend does not perform ad decisioning; compute remains minimal
- Zaraz provides a single control plane to inject/disable tags and keep the app code clean

#### 12.1.2 Non-personalized by default, explicit consent to personalization

Default posture is conservative:

- Serve **non-personalized ads by default**
- Provide an explicit setting to **opt in to personalized ads** ("consent to personalization")
- Users who do not consent (or are not logged in) receive non-personalized ads

Notes:

- Will not depend solely on "Google account ad settings" because not all users are signed in and coverage is not guaranteed
- If the site later formally targets the EU/UK, will add a CMP and region-appropriate consent flow; until then, EU/UK visitors (who arrive organically) remain on the non-personalized default

#### 12.1.3 Placement and performance rules

- Hard cap: **max 2 ad slots per page**
- Reserve space for ad slots to avoid layout shift (CLS)
- Load ads only where they are allowed (route-based gating), and lazy-load where practical
- Prefer showing ads on cacheable/SEO pages rather than authenticated dashboards

#### 12.1.4 When to switch from AdSense to Google Ad Manager (GAM)

AdSense will be the "simple" starting point. Switch to **Google Ad Manager** when needing more control or when monetization becomes meaningful.

Triggers that justify the switch:

- Need tighter control over which pages/placements show which ads, with more robust reporting
- Want to add a small number of direct sponsors or house campaigns without redesigning the site
- Need better inventory management (multiple ad units, device-specific sizes, pacing)
- Want more sophisticated rules (frequency caps, exclusions, per-section policies) while still keeping the ad stack managed
- AdSense reporting/fill is insufficient to make decisions

#### 12.1.5 Phase 1+ approach (GAM + Zaraz)

- Demand/control: **Google Ad Manager** becomes the primary inventory/placement system
- Tag delivery continues via **Zaraz**
- Can optionally run AdSense demand through GAM (as allowed) while adding other demand sources later if needed

Will avoid running a full self-hosted header bidding stack early. If ever adding header bidding, will prefer a managed solution and only after traffic justifies the added complexity.

#### 12.1.6 Tying ads to insights (privacy-safe)

Ad performance connects to the broader insights system **only at an aggregated level**.

**What can be measured safely:**

- **Interest proxy:** ad clicks (and optionally conversions) for broad ad categories
- **Audience proxy:** the taxonomy context of the page (e.g., "Anime", "Manga", "Light Novels") and broad region

**Implementation approach:**

- Record **ad slot events** as structured signals (impression and click) with only coarse attributes:
    - time bucket (week/month)
    - broad region bucket
    - page taxonomy bucket (coarse)
    - placement ID (topbar/sidebar)
    - ad category (only if known)
- Store these events as **aggregated counters**, not raw per-user logs
- Join "ads" and "content interest" only through shared buckets and only when cohort thresholds are met

**Constraints (especially with AdSense):**

With **AdSense**, exact product category of a third-party ad creative generally won't be known. Can still learn useful things like "pages under Anime have a higher CTR on the sidebar slot," but cannot say "Anime fans like plush toys" unless controlling or labeling the ad category.

**Ways to get category-specific insights without identifying users:**

- **House ads / house placements:** run a small number of my own categorized promos (e.g., "Plushies", "Figurines", "Merch"), and track clicks by taxonomy bucket; yields clean category labels
- **Affiliate links (optional):** use a controlled outbound redirect (e.g., `/out/...`) that increments aggregate counters per bucket; if the affiliate program provides conversion reports, ingest them at an aggregate level per campaign
- **GAM labeling (recommended once moving to GAM):** label line items/creatives with a broad "ad category" and report on it without user-level tracking

**Privacy rules that apply to ad-related insights:**

- Same guardrails as Section 12.3 (minimum cohort thresholds, limited segmentation, time bucketing, suppression/rounding, optional differential privacy noise)
- No user-level ad profiles
- Will not export "taxonomy interests" as ad targeting signals unless the user explicitly opts into personalization

**Example insight formats that can be published:**

- "Users viewing Anime pages are 3.0× more likely to click a Merch/Plushies promo than baseline (North America, monthly, k≥N)."
- "Fans of X show are 1.5× more likely to click Figurines promos (global, 6‑month bucket, k≥higher N)."

### 12.2 Social features

Friends lists and leaderboards will be added using derived read models so the geo-sharded user DB design remains intact.

### 12.3 Privacy-preserving aggregated insights (optional)

If later monetizing the platform via data products, only **aggregated, privacy-preserving insights** will be published (never raw user-level data, never review text, never identifiers).

#### 12.3.1 Opt-out model (default included)

- Aggregated analytics are **enabled by default**, with a clear **opt-out** setting
- Opt-out removes the user's future events from insight generation and triggers deletion of their historical contribution from future aggregates where practical
- Will not sell, expose, or export user-level events

#### 12.3.2 Data collection scope (signals)

Signals are restricted to structured activity that supports "interest" inference:

- Add-to-list / remove-from-list
- Status changes (planned / in-progress / completed / dropped)
- Ratings (if present)
- "Follow/track" actions

Explicitly excluded:

- Review text and free-form notes
- Emails, IP addresses, precise locations
- Device identifiers

#### 12.3.3 Insight products to publish

All outputs will be based on large-enough cohorts and will be released on a cadence aligned with privacy risk:

- **Similarity graphs (title → related titles):** top related items with confidence scores
- **Cross-media affinities:** e.g., manga → web novels; anime → games; books → podcasts
- **Taxonomy insights:** e.g., "Readers of Light Novels over-index on Visual Novels by 2.3×"
- **Regional trend snapshots:** weekly/monthly trends by large regions (e.g., North America, EU, APAC) and optionally by country where cohorts are large

#### 12.3.4 Privacy and anti-reidentification guardrails

The insights system will be designed so it is difficult to isolate or reconstruct individual behavior.

**Technical safeguards:**

- **Minimum cohort thresholds (k-anonymity):** metrics are published only when at least **k users** contributed
    - Conservative defaults (e.g., k=100+), increasing k for more granular slices
- **Noise / differential privacy (optional but recommended):** add calibrated noise to counts/scores, especially for smaller cohorts and more granular slices
- **Suppression and rounding:** suppress low counts and round published counts/percentages to reduce exactness
- **Time bucketing:** avoid near-real-time publishing for niche items; publish only in coarse time windows

**Access controls:**

- **No raw query access:** consumers cannot run arbitrary queries; only pre-defined, reviewed reports and endpoints are available
- **Limited segmentation:** only broad segments (region at continent/country level, major taxonomy groups); no ZIP-code, no tiny demographics
- **Query budget (if any interactive access exists):** cap how many distinct slices can be requested to prevent "difference attacks"

#### 12.3.5 Release cadence ("time gating")

To balance usefulness and privacy, insights are released on different cadences:

- **Weekly:** high-level trends at large region + major taxonomy level only
- **Monthly:** deeper cross-media affinities and taxonomy insights with stronger cohort thresholds
- **Quarterly or 6-month:** more niche/specific breakdowns (still thresholded, still noise/suppression)
- **Yearly:** long-range retrospectives and stable similarity graphs for long-tail content

The more specific the slice, the slower the cadence and the higher the minimum cohort threshold.

#### 12.3.6 Recommended computation approach

- Maintain an internal event stream (append-only) for eligible signals
- Aggregate into read-optimized tables keyed by:
    - time bucket (week/month)
    - region (broad)
    - taxonomy node (broad)
    - media IDs
- Compute affinity scores using:
    - co-occurrence counts
    - conditional probability (P(Y|X))
    - lift / over-indexing (P(Y|X) / P(Y))
- Publish only thresholded and privacy-guarded outputs

#### 12.3.7 Compliance posture

- Will clearly document this in a Privacy Policy and provide opt-out
- "Anonymous" is treated as a high bar; products that allow re-identification through overly granular slicing will be avoided
- When monetization becomes real, the data product will be reviewed for privacy risk

### 12.4 Subscriptions (if needed)

- Payments are handled by Stripe/PayPal checkout
- Only entitlements are stored locally (plan/status/renewal/provider IDs)
- Provider webhooks update entitlements

## 13 Key decisions and rationale

This section documents major architectural and technology choices, with space to record the reasoning behind each decision.

### 13.1 No auth SaaS (in-app auth instead)

**Decision:** Implement authentication inside the application using OIDC (Google + Apple) + optional email/password, rather than using an auth SaaS provider.

**Rationale:** *(to be filled in)*

### 13.2 Managed-first infrastructure

**Decision:** Use managed services (Aurora, RDS, ECS Fargate, S3) rather than self-hosted alternatives.

**Rationale:** *(to be filled in)*

### 13.3 AWS + Cloudflare (not single-cloud)

**Decision:** Host compute/databases on AWS, but use Cloudflare for CDN, WAF, and Load Balancing.

**Rationale:** *(to be filled in)*

### 13.4 Separate catalog DB and user DB

**Decision:** Split the catalog (media/taxonomy) and user data (lists, reviews) into separate databases from day one.

**Rationale:** *(to be filled in)*

### 13.5 RDS PostgreSQL Multi-AZ for user DB (not Aurora initially)

**Decision:** Start user DB on RDS PostgreSQL Multi-AZ; consider Aurora later when throughput/IO demands justify it.

**Rationale:** *(to be filled in)*

### 13.6 Geo-sharding user DB (not distributed SQL)

**Decision:** Geo-shard user data per region with a "home shard" per user, rather than using a distributed SQL database.

**Rationale:** *(to be filled in)*

### 13.7 Local/manual ingestion initially (not scheduled cloud job)

**Decision:** Run ingestion locally/manually as an on-demand batch job; add scheduled cloud execution later via plugin hook.

**Rationale:** *(to be filled in)*

### 13.8 Postgres FTS first (not dedicated search engine)

**Decision:** Use Postgres full-text search + pg_trgm initially; add Meilisearch/Typesense only when triggered by performance/UX needs.

**Rationale:** *(to be filled in)*

### 13.9 No Redis until justified

**Decision:** Defer Redis adoption until a clear need emerges (shared rate limiting, queues, or expensive computed caches).

**Rationale:** *(to be filled in)*

### 13.10 Fastify (not Express or alternatives)

**Decision:** Use Fastify as the API framework.

**Rationale:** *(to be filled in)*

### 13.11 Next.js App Router (not Pages Router or alternative frameworks)

**Decision:** Use Next.js with App Router for the web application.

**Rationale:** *(to be filled in)*

### 13.12 OpenAPI-first API design

**Decision:** Design the API contract-first using OpenAPI, generating typed clients for web/mobile.

**Rationale:** *(to be filled in)*

### 13.13 Expo for mobile (not bare React Native)

**Decision:** Use Expo managed workflow for mobile development.

**Rationale:** *(to be filled in)*

### 13.14 Postgres ltree for taxonomy (not closure table or adjacency list)

**Decision:** Model the taxonomy using Postgres ltree extension for hierarchical paths.

**Rationale:** *(to be filled in)*

### 13.15 Non-personalized ads by default (opt-in to personalization)

**Decision:** Serve non-personalized ads by default, with explicit user opt-in required for personalized ads.

**Rationale:** *(to be filled in)*

### 13.16 AdSense → GAM migration path (not direct to GAM)

**Decision:** Start with AdSense for simplicity, migrate to Google Ad Manager when triggers are met.

**Rationale:** *(to be filled in)*

### 13.17 Opt-out analytics (not opt-in)

**Decision:** Enable aggregated analytics by default with a clear opt-out, rather than requiring opt-in.

**Rationale:** *(to be filled in)*

### 13.18 Phased regional expansion (not global launch)

**Decision:** Launch in us-east-1, expand regionally based on measured triggers (us-west-2 → EU → APAC).

**Rationale:** *(to be filled in)*

## 14 Glossary

### Core Architecture Concepts

**CDN (Content Delivery Network):** A distributed network that caches and serves content closer to users to reduce latency.

**DR (Disaster Recovery):** The ability to recover service after major failures (region outage, data corruption, etc.).

**Event stream:** An append-only log of user/system events used for downstream processing and aggregation.

**Geo-sharding:** Splitting user data into separate regional databases (shards), routing each user to a "home" shard to keep writes local.

**Geo steering:** Routing users to the closest/appropriate region based on geography.

**Multi-AZ:** AWS high-availability configuration where a database is deployed across multiple Availability Zones, allowing automated failover if an AZ fails.

**Read replica:** A database replica that is typically read-only and kept in sync with a primary; often used for read scaling or as a warm standby for disaster recovery.

**SLO (Service-Level Objective):** A target level for a metric (e.g., p95 latency under X ms, uptime above Y%).

**Stateless service:** A service that doesn't rely on local machine state between requests; enables easy horizontal scaling.

### AWS Infrastructure

**ALB (Application Load Balancer):** AWS load balancer that routes HTTP(S) traffic to services (commonly used in front of ECS services).

**Aurora PostgreSQL:** AWS-managed database engine compatible with PostgreSQL, optimized for availability and performance.

**Aurora Global Database:** Aurora feature for cross-region replication with one writer region and multiple read-only secondary regions, plus a promotion path during regional failures.

**ECS Fargate:** AWS managed container runtime where you deploy containers without managing servers; scales tasks up/down.

**RDS (Relational Database Service):** AWS managed database service that runs engines like PostgreSQL with automated backups, patching, and managed failover options.

**S3:** AWS object storage service used for files like images and exports.

### Cloudflare Services

**Cloudflare Load Balancing:** Cloudflare service that routes traffic across multiple origins/regions using health checks, failover, and optional geo steering.

**Cloudflare Zaraz:** Cloudflare product for managing and executing third-party tags with a centralized configuration, often reducing app code changes and improving control over performance.

**WAF (Web Application Firewall):** Layer that blocks common attacks (bots, SQLi patterns, abuse) at the edge.

### Frontend Technologies

**Expo:** A toolkit and runtime for building React Native apps with a managed workflow. Use in this project: speeds up mobile development (build, testing, device deployment); works well with a TypeScript codebase and a typed API client.

**ISR (Incremental Static Regeneration):** Next.js feature that rebuilds static pages in the background on a schedule or on-demand, combining speed with freshness.

**Next.js (App Router):** React framework for web apps; App Router is the modern routing/rendering system supporting SSR/ISR and server components.

**SSR (Server-Side Rendering):** Rendering HTML on the server for faster first load and better SEO.

**Tailwind CSS:** A utility-first CSS framework. Use in this project: enables a consistent, fast UI iteration loop without a large custom CSS codebase; helps keep bundle size and styling complexity under control when used with a design system.

**TanStack (TanStack Query / TanStack Table):** A set of frontend libraries for data fetching/caching (Query) and building powerful tables (Table). Use in this project: TanStack Query manages server state on web/mobile (caching, retries, pagination, background refresh); TanStack Table powers dense list views with sorting/filtering that match "media tracking" UX.

### Backend Technologies

**API:** Application Programming Interface; the backend endpoints web/mobile call.

**BullMQ:** A Node.js job queue library built on Redis.

**Celery:** A popular Python distributed task/job queue framework; commonly paired with Redis.

**Fastify:** A high-performance Node.js web framework for building APIs. Use in this project: hosts the API with a predictable plugin-based architecture; fits an OpenAPI-first approach and strict request/response validation.

**JSON Schema:** A standard for describing and validating JSON data structures.

**OpenAPI:** A standard format for describing APIs; can be used to generate typed clients and documentation.

**Pino:** A fast structured logging library commonly used with Node.js.

**Redis:** In-memory datastore often used for caching, rate limiting state, and job queues.

**TypeScript:** A typed superset of JavaScript. Use in this project: reduces runtime bugs by catching type errors at build time; enables a shared contract between API and clients (OpenAPI-generated types, schema-driven validation).

**Zod:** A TypeScript-first schema and validation library used to validate data at runtime and share types between API and clients. Use in this project: validates request/response payloads at runtime (defense-in-depth beyond TypeScript); defines reusable schemas that can be shared across API, web, and mobile to prevent drift.

### Database and Data Modeling

**Closure table:** A relational modeling pattern for trees/graphs where every ancestor/descendant relationship is stored explicitly (useful for complex hierarchies).

**FTS (Full-Text Search):** Database search feature optimized for searching text; PostgreSQL includes built-in FTS.

**GIN/GiST index:** PostgreSQL index types; GiST is commonly used with `ltree` for fast path queries.

**Idempotent:** An operation that can be safely retried without changing the outcome beyond the first successful application.

**ltree:** A PostgreSQL extension and data type for storing and querying hierarchical label paths (ideal for tree-like taxonomies).

**Meilisearch / Typesense:** Dedicated search engines optimized for fast, typo-tolerant search and faceted filtering; typically used as derived indexes.

**pg_trgm:** PostgreSQL extension providing trigram-based indexes and similarity operators; useful for fast fuzzy text matching.

**Transactional:** Executed within a database transaction so changes are applied atomically.

**Upsert:** "Insert or update"; a write that inserts a row if it doesn't exist or updates it if it does.

### Authentication and Security

**Apple / Google OIDC:** Using Apple/Google as identity providers via OpenID Connect; the app still owns sessions and authorization.

**Argon2id:** A modern password hashing algorithm recommended for storing password hashes securely.

**CSRF (Cross-Site Request Forgery):** A class of web attack where a malicious site causes a user's browser to perform unintended actions; mitigated with CSRF tokens and cookie settings.

**httpOnly cookie:** Cookie flag that prevents JavaScript from reading the cookie, reducing impact of XSS on session theft.

**OAuth2:** Authorization framework used by many providers; OIDC builds on it for identity.

**OIDC (OpenID Connect):** Identity layer on top of OAuth2; standard way to implement "Login with X" while receiving verified identity claims.

**Passkeys (WebAuthn):** Passwordless authentication using public-key cryptography, typically backed by device biometrics or hardware keys.

**sameSite cookie:** Cookie attribute that helps reduce CSRF risk by controlling when cookies are sent in cross-site requests.

**TOTP:** Time-based one-time password (authenticator app codes) used for 2FA.

### Ads and Monetization

**AdSense:** Google's publisher ad network product; a fast way to start monetizing without selling ads directly.

**Affiliate link:** A trackable outbound link that can generate revenue when purchases occur; best used with aggregate reporting and coarse campaign/category labels.

**Attribution:** The process of crediting a click/impression with a later action (e.g., purchase). In this project, attribution is only used in aggregated form.

**CMP (Consent Management Platform):** A tool/workflow to collect, store, and apply user consent choices for cookies/personalization (often required in certain jurisdictions).

**Conversion:** A desired outcome after an ad interaction (e.g., purchase, signup). In this project, conversions are measured only in coarse time/region/category buckets.

**Google Ad Manager (GAM):** Google's ad serving and inventory management platform that provides more control than AdSense (placements, rules, reporting, and direct campaigns).

**House ad:** A first-party promo/placement controlled by the site owner (e.g., links to sponsors, affiliate collections, or internal promotions). Useful because the "category" is known.

**Non-personalized ads (NPA):** Ads served without behavioral personalization based on a user's identity/activity; typically more privacy-conservative than personalized ads.

### Privacy and Analytics

**Cohort threshold (minimum k):** A minimum number of users required before publishing a statistic for a slice; used to reduce re-identification risk.

**Differential privacy:** A privacy technique that adds controlled noise so published statistics do not meaningfully reveal whether any single individual contributed.

**k-anonymity:** A privacy property where each released record/metric corresponds to at least k individuals, reducing the chance of singling someone out.

**Lift / over-indexing:** A measure of association, commonly computed as P(Y|X) / P(Y). Values > 1 mean Y is more likely among users who have X.

**Query budget:** A restriction on the number/shape of queries a consumer can run to prevent reconstruction ("difference") attacks.

### Performance Metrics

**Cache hit rate:** Percentage of requests served from cache (e.g., Cloudflare) rather than hitting the origin server.

**p95/p99 latency:** The 95th/99th percentile request latency. p95 reflects "most users"; p99 reflects "tail latency" affecting the slowest requests.

### Observability

**Sentry:** Error monitoring tool that captures exceptions, performance traces, and alerting.
