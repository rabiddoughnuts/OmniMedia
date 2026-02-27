# CS 3800 — Lab 01: Client & Project Proposal

Student: Brandon Walker
Project: OmniMediaTrak
Date: February 10, 2026

## 1. Client Description

Client: OmniMedia Solutions

OmniMedia Solutions is a new digital startup focused on simplifying how users track and discover entertainment across multiple mediums. The company aims to unify the fragmented experience of tracking anime, manga, TV shows, movies, books, games, and other media types into a single intelligent, customizable platform.

Currently, media enthusiasts rely on multiple niche websites or mobile apps—MyAnimeList for anime, Goodreads for books, Letterboxd for movies—each with different interfaces, features, and limitations. OmniMedia Solutions seeks to provide a unified solution that serves both casual consumers and dedicated enthusiasts who want comprehensive tracking and analytics in one place.

Target Users: The primary users are media enthusiasts aged 16–40 who consume entertainment across multiple formats. These users are typically tech-savvy, organized, and value efficiency. They appreciate customization, dislike visual clutter, and want quick access to accurate information across all their media consumption.

## 2. Problem Statement

Current Inefficiencies:

- Users must maintain separate accounts and lists across 5-10 different platforms to track different media types.
- Each platform has different features, UIs, and data formats, creating cognitive overhead.
- Cross-media discovery is impossible (e.g., finding the manga source for an anime, or the book a movie was based on).
- No unified view of consumption habits across all media types.
- Exporting or migrating data between platforms is difficult or impossible.

Why Software is Needed: Media consumption is increasingly diverse and cross-platform. A person might watch an anime, read its manga source material, play the video game adaptation, and listen to the soundtrack—but no single tool helps them track and manage this holistic media experience. Current solutions force users to context-switch between multiple fragmented platforms, leading to incomplete tracking and missed connections between related works.

Who is Affected: Power users and media enthusiasts who actively track their consumption are most affected. These users spend significant time maintaining multiple accounts, manually cross-referencing information, and dealing with inconsistent data quality. They represent a passionate, engaged audience willing to invest in a better solution.

## 3. Proposed Solution

Application Overview: OmniMediaTrak is a web application that provides a unified, customizable interface for tracking and managing all forms of media consumption. It combines the depth of specialized tracking sites with the convenience of a single, integrated platform.

Core Features:

1. Unified Media Dashboard
2. Single spreadsheet-style view displaying all tracked media across types (books, manga, anime, shows, movies, games, podcasts, etc.)
3. Customizable columns showing relevant metadata (genre, year, creator, rating, episode count, etc.)
4. Real-time status updates (planned, in-progress, completed, dropped)
5. Advanced Filtering and Search
6. Filter by any combination of media type, status, genre, year, rating, creator, or custom tags
7. Full-text search across titles, descriptions, and creators
8. Sort by any field (rating, release date, completion date, progress, etc.)
9. Save custom filter combinations as "smart lists"
10. Personal List Management
11. Create custom static lists (e.g., "Summer Reading," "Anime to Rewatch")
12. Create smart lists with dynamic filters (e.g., "Short anime I haven't started")
13. Track progress with granular status updates and progress percentages
14. Add personal ratings, notes, and timestamps
15. Media Relationship Discovery
16. Automatic linking of related media (adaptations, sequels, prequels, shared universes)
17. Visual relationship graphs showing connections between works
18. "Where to Watch/Read" integration showing availability across streaming/retail platforms
19. Detailed Media Pages
20. Comprehensive metadata pulled from multiple authoritative sources
21. Synopsis, creator information, genres, tags, content ratings
22. User statistics (ratings, status distribution)
23. Related works and recommendations
24. Admin Content Management
25. Admin-only interface for adding and updating media entries in the canonical database
26. Bulk import tools from external APIs (TMDB, Google Books, Anilist, etc.)
27. Quality control workflows for verifying and merging duplicate entries
28. Relationship management between media items

## 4. Users and Roles

Registered Users (Standard Role):

- Create and manage personal media lists.
- Track status, progress, and ratings for any media item.
- Filter, search, and sort their collections.
- View detailed media pages and relationships.
- Add personal notes and timestamps.
- Create custom tags for organization.
- Export their data.

Administrators:

- All registered user permissions, plus:
- Add new media entries to the canonical database.
- Edit and update existing media metadata.
- Manage relationships between media items (sequels, adaptations, etc.).
- Merge duplicate entries.
- Import data from external sources.
- Monitor data quality and user reports.
- Access admin dashboard with system analytics.

Public/Guest Users (Optional):

- Browse the media catalog without an account.
- Search and view media details.
- See aggregate statistics (but not individual user data).
- Cannot create lists or track personal data.

## 5. Data Model

### Core Entities

1. Media
    - id (UUID, primary key)
    - external_id (text, unique convenience ID)
    - media_type (text: "book", "anime", "movie", "game", etc.)
    - media_class (hierarchical taxonomy using ltree)
    - title (text)
    - release_date (date)
    - country_of_origin (text)
    - creators (text array: authors, directors, studios, etc.)
    - cover_url (text)
    - description (text)
    - attributes (JSONB: type-specific fields like ISBN, runtime, episode count, platforms)
    - search_vector (tsvector for full-text search)
    - created_at, updated_at (timestamps)

2. User
    - id (UUID, primary key)
    - email (text, unique)
    - username (text, unique)
    - password_hash (text)
    - role (text: "user" or "admin")
    - profile_settings (JSONB: display preferences, theme, etc.)
    - created_at, updated_at (timestamps)

3. UserMedia (User's tracked items - partitioned by user_id)
    - user_id (UUID, foreign key to User)
    - media_id (UUID, foreign key to Media)
    - status (text: "planned", "in-progress", "completed", "dropped")
    - progress (integer: current episode/chapter/page)
    - rating (smallint: 1-10)
    - notes (text: personal thoughts/notes)
    - started_at, completed_at (timestamps)
    - meta_snapshot (JSONB: cached media metadata for performance)
    - created_at, updated_at (timestamps)
    - Primary key: (user_id, media_id)

4. UserList (Custom collections)
    - id (UUID, primary key)
    - user_id (UUID, foreign key to User)
    - name (text: "Summer Reading", "Top 10 Anime", etc.)
    - description (text)
    - is_public (boolean)
    - list_type (text: "static" or "smart")
    - filter_definition (JSONB: for smart lists)
    - created_at, updated_at (timestamps)

5. ListItem (Junction table for static lists)
    - list_id (UUID, foreign key to UserList)
    - media_id (UUID, foreign key to Media)
    - position (integer: order within list)
    - added_at (timestamp)
    - Primary key: (list_id, media_id)

6. MediaRelationship (Cross-media connections)
    - media_id (UUID, foreign key to Media)
    - related_media_id (UUID, foreign key to Media)
    - relation_type (enum: "sequel", "prequel", "adaptation", "spin-off", "shared-universe")
    - notes (text: relationship details)
    - weight (smallint: relationship strength/importance)
    - created_at (timestamp)
    - Primary key: (media_id, related_media_id, relation_type)

7. ExternalLink (Maps to external data sources)
    - media_id (UUID, foreign key to Media)
    - source_name (text: "anilist", "tmdb", "goodreads", etc.)
    - external_key (text: ID in external system)
    - Primary key: (source_name, external_key)

## 6. API Endpoints

### Media Resource (Public + Admin)

- GET /api/media
    - Returns paginated list of media items.
    - Query params: type, search, genre, year, limit, offset.
    - Public access for browsing.
    - Example: /api/media?type=anime&genre=action&limit=20
- GET /api/media/:id
    - Returns detailed information for a specific media item.
    - Includes basic metadata, relationships, and aggregate user statistics.
    - Public access.
- POST /api/media (Admin only)
    - Creates a new media entry in the canonical database.
    - Request body includes all required fields (title, type, release_date, etc.).
    - Validates uniqueness and data quality.
    - Returns the created media object.
- PATCH /api/media/:id (Admin only)
    - Updates metadata for an existing media entry.
    - Request body contains fields to update.
    - Maintains audit trail of changes.
    - Returns updated media object.
- DELETE /api/media/:id (Admin only)
    - Soft-deletes a media entry (or merges into another if duplicate).
    - Checks for existing user references before deletion.
    - Returns success confirmation.

### User Media Resource (Authenticated Users)

- GET /api/users/:userId/media
    - Returns all media tracked by a specific user.
    - Query params: status, type, sort, filter.
    - Requires authentication (users can only access their own data).
    - Example: /api/users/me/media?status=in-progress&type=anime
- POST /api/users/:userId/media
    - Adds a media item to user's tracking list.
    - Request body: media_id, status, optional rating, notes.
    - Creates initial UserMedia record.
    - Returns created tracking entry.
- GET /api/users/:userId/media/:mediaId
    - Returns user's tracking details for a specific media item.
    - Includes status, progress, rating, notes, timestamps.
- PATCH /api/users/:userId/media/:mediaId
    - Updates user's tracking information.
    - Request body: any of status, progress, rating, notes, started_at, completed_at.
    - Common use: marking episode progress, changing status to completed, updating rating.
    - Returns updated tracking entry.
- DELETE /api/users/:userId/media/:mediaId
    - Removes media from user's tracking list.
    - Permanent deletion of tracking data (user can re-add later).
    - Returns success confirmation.

### List Resource (Authenticated Users)

- GET /api/users/:userId/lists
    - Returns all lists created by the user.
    - Includes both static and smart lists.
    - Query params: type (static/smart), public.
- POST /api/users/:userId/lists
    - Creates a new list.
    - Request body: name, description, list_type, optional filter_definition (for smart lists).
    - Returns created list object.
- GET /api/users/:userId/lists/:listId
    - Returns list details and all media items in the list.
    - For smart lists, applies filter dynamically.
    - Returns list metadata and array of media items.
- PATCH /api/users/:userId/lists/:listId
    - Updates list metadata (name, description, filters).
    - Request body contains fields to update.
    - Returns updated list object.
- DELETE /api/users/:userId/lists/:listId
    - Deletes the list (does not affect underlying media tracking).
    - Returns success confirmation.
- POST /api/users/:userId/lists/:listId/items
    - Adds a media item to a static list.
    - Request body: media_id, optional position.
    - Returns success confirmation.
- DELETE /api/users/:userId/lists/:listId/items/:mediaId
    - Removes a media item from a static list.
    - Returns success confirmation.

### Search & Discovery

- GET /api/search
    - Global search across all media.
    - Query params: q (search term), type, limit.
    - Returns ranked results using full-text search.
    - Public access.
- GET /api/media/:id/related
    - Returns all related media for a given item.
    - Shows sequels, prequels, adaptations, spin-offs.
    - Public access.

## 7. Example User Flow

Scenario: Alex wants to find a short anime series to watch next, add it to their list, and track their progress.

### Step-by-Step Flow

1. User Login
    - Alex navigates to <https://omnimediatrak.com> and clicks "Login".
    - Frontend displays login form; Alex enters credentials and submits.
    - API Call: POST /api/auth/login with email and password.
    - Backend validates credentials and returns JWT token.
    - Frontend stores token and redirects to dashboard.

2. View Dashboard
    - Alex lands on their Lists Dashboard at /dashboard.
    - Frontend automatically loads user's media.
    - API Call: GET /api/users/me/media?status=planned.
    - Backend returns all media with status "planned" for Alex.
    - Dashboard displays items in spreadsheet-style table with columns: Title, Type, Genre, Episodes, Rating.

3. Apply Filters
    - Alex wants to find short anime series (20-26 episodes).
    - Alex clicks "Filter" and selects:
      - Media Type: Anime
      - Episodes: 20-26
      - Sort by: Rating (High to Low)
    - Frontend builds query parameters.
    - API Call: GET /api/users/me/media?status=planned&type=anime&episodes_min=20&episodes_max=26&sort=rating:desc.
    - Backend applies filters and returns matching results.
    - Table updates to show only filtered items.

4. Browse Results
    - Alex reviews the filtered list in the table view.
    - Sees 8 anime series that match the criteria.
    - Notices "Steins;Gate" at the top with a 9.2 rating.
    - Clicks on the title to see more details.

5. View Media Details
    - Frontend navigates to /media/12345 (Steins;Gate's ID).
    - API Call: GET /api/media/12345.
    - Backend returns full media details including synopsis, creators, genres, and where to watch.
    - API Call: GET /api/media/12345/related.
    - Backend returns related media (sequel movie, visual novel source).
    - Page displays all information including a "Where to Watch" section showing it's on Crunchyroll.

6. Update Status
    - Alex decides to start watching.
    - Clicks "Update Status" dropdown and selects "In Progress".
    - API Call: PATCH /api/users/me/media/12345.
    - Request body: { "status": "in-progress", "started_at": "2026-02-10T19:30:00Z" }.
    - Backend updates UserMedia record.
    - Frontend shows success message and updates local state.

7. Track Progress (Later)
    - After watching 3 episodes, Alex returns to the site.
    - Navigates to "Currently Watching" list at /dashboard?status=in-progress.
    - API Call: GET /api/users/me/media?status=in-progress.
    - Finds Steins;Gate and clicks "Update Progress".
    - Changes progress from 0 to 3.
    - API Call: PATCH /api/users/me/media/12345.
    - Request body: { "progress": 3 }.
    - Backend updates progress field.
    - Dashboard shows "3/24 episodes" in the progress column.

8. Mark Complete
    - Two weeks later, Alex finishes the series.
    - Updates status to "Completed" and adds a rating of 10.
    - API Call: PATCH /api/users/me/media/12345.
    - Request body: { "status": "completed", "progress": 24, "rating": 10, "completed_at": "2026-02-24T22:15:00Z" }.
    - Backend updates record and moves item to "Completed" list.
    - Alex adds a note: "Incredible time travel story, highly recommend".
    - API Call: PATCH /api/users/me/media/12345.
    - Request body: { "notes": "Incredible time travel story, highly recommend" }.

9. Discover Related Content
    - While viewing completed Steins;Gate entry, Alex notices the "Related Media" section.
    - Sees "Steins;Gate 0" (sequel anime) and "Steins;Gate" (visual novel source).
    - Clicks "Add to List" for Steins;Gate 0.
    - API Call: POST /api/users/me/media.
    - Request body: { "media_id": "12346", "status": "planned" }.
    - Backend creates new UserMedia entry.
    - Frontend shows confirmation and updates Alex's "Plan to Watch" count.

### Pages/Screens Involved

- Login page (/login)
- Dashboard / Lists view (/dashboard)
- Media detail page (/media/:id)
- Update status modal (overlay)
- Progress tracking modal (overlay)

### API Calls Summary

- POST /api/auth/login - Authentication
- GET /api/users/me/media (3 times with different filters) - List views
- GET /api/media/12345 - Media details
- GET /api/media/12345/related - Related content
- PATCH /api/users/me/media/12345 (3 times) - Status, progress, rating, notes updates
- POST /api/users/me/media - Add new media to list

This flow demonstrates the core functionality of the application: searching/filtering personal media, viewing details, tracking progress, and discovering related content—all within a unified, efficient interface.

## Conclusion

OmniMediaTrak addresses a real pain point for media enthusiasts by consolidating fragmented tracking experiences into a single, powerful platform. The proposed data model supports both a canonical media catalog (managed by admins) and personalized user tracking at scale. The API design follows RESTful conventions and clearly separates public, user-scoped, and admin-only operations. This design provides a solid foundation for the Midterm Project implementation.
