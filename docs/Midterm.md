CS 3800 — Midterm Project

Backend Implementation (Based on Lab 01)

Overview

For the midterm project, you will implement the backend API for the system you designed in
Lab 01.

Your Lab 01 focused on:

-  Client discovery
-  Business rules
-  Data modeling
-  Defining features

Now you will build the backend that supports those requirements.

This project focuses strictly on:

-  Express server structure
-  RESTful routing
-  Controllers
-  Service layer
-  Database integration (using ORM)
-  Error handling

No frontend is required for the midterm.

Learning Objective

This midterm evaluates your ability to:

Implement REST APIs properly

-  Translate business requirements into backend architecture
-
-  Structure scalable Express applications
-  Use ORM effectively
-  Think like a backend engineer

Project Requirements

1. Project Structure

Your project must follow this structure:

project-root/
│
├── server.js
├── app.js
├── routes/
├── controllers/
├── services/
├── models/
├── config/
├── middleware/
└── .env

You must use:

-  ES Modules ("type": "module" in package.json)
-  Environment variables
-  Proper separation of concerns (no business logic inside routes)

2. Database Integration

You must use:

-  Sequelize (ORM)
-  MariaDB (database)

Your database must:

Include at least 3 related entities

-  Reflect your Lab 01 data model
-
-  Use proper relationships (1:M or M:N where applicable)
-

Include constraints (NOT NULL, UNIQUE where appropriate)

Preference should be given for ORM methods over raw SQL queries.

3. Required API Features

CRUD Operations (At Least One Primary Resource)

You must implement:

-  GET /resource
-  GET /resource/:id
-  POST /resource
-  PATCH /resource/:id
-  DELETE /resource/:id

Additional Requirements

-  At least one relational query (include associated models)
-  Proper HTTP status codes
-  Validation handling
-  Centralized error middleware

4. Service Layer Requirement

All business logic must live in the service layer.

Controllers:

-  Handle request and response
-  Call service functions
-  Do NOT contain business logic

Services:

-
Interact with ORM
-  Contain validation logic
-  Handle relational operations

5. Middleware

You must implement at least one custom middleware:

-  Logging middleware

OR

-  Request validation middleware

OR

-  Error handling middleware

Technical Expectations

You will be evaluated on:

-  Proper REST design
-  Clean separation of concerns
-  Async/await usage
-  Error handling quality
-  Code readability
-  Database relationship implementation
-  Meaningful commit history

Deliverables

Submit:

1.  GitHub repository link
2.  ERD (updated if needed)
3.  README file including:

-  Project description
-  API route list
-  Setup instructions
-  Environment variable requirements

Grading Rubric (100 Points)

Category

Points

Project Structure & Organization

Database Model Implementation

CRUD Functionality

ORM Usage & Relationships

Service Layer Implementation

Middleware & Error Handling

Code Quality & Readability

Documentation & README

15

20

20

15

10

10

5

5

Constraints

-  No frontend required.
-  No business logic inside routes.
-  Must use async/await (no .then() chains).

Academic Integrity

You may:

-  Use documentation
-  Reference examples

You may NOT:

-  Copy another student’s code
-  Share repositories
-  Submit work you cannot explain


