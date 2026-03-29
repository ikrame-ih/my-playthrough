# MyPlaythrough

A web app for managing your personal video game collection. No ads, no noise, no features you don't need.

Platforms like HowLongToBeat or Backloggd are useful, but they tend to get cluttered. MyPlaythrough was built as a cleaner alternative: keep track of your library, log what you're playing, what you've finished, and what's sitting in your backlog — and optionally check out what others are playing too.

> Built as the final intermodular project for my Higher Degree in Web Application Development (DAW).

## Stack

**PERN** — PostgreSQL · Express · React · Node.js

- Frontend: React 18 + Vite + Tailwind CSS + React Router
- Backend: Node.js + Express
- Database: PostgreSQL
- Authentication: JWT *(in progress)*

## Features

- Full collection management (add, edit, delete games)
- Game states: *Playing*, *Completed*, *Backlog*
- Per-title details: platform, personal score, hours played and review
- Public profiles to browse other users' collections
- Community stats: average score per title based on all user ratings
- Three roles: Visitor · Registered user · Admin

## Project structure

```
MyPlaythrough/
├── client/     # Frontend (React + Vite)
└── server/     # Backend (Node.js + Express)
```

## Local setup

### Prerequisites

- Node.js
- PostgreSQL

### Backend

```bash
cd server
npm install
```

Create a `.env` file based on `.env.example` and fill in your PostgreSQL credentials.

```bash
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/games` | Get all games |
| GET | `/api/games/:id` | Get a game by ID |
| POST | `/api/games` | Add a new game |
| PUT | `/api/games/:id` | Update a game |
| DELETE | `/api/games/:id` | Delete a game |
| GET | `/api/test-db` | Check database connection |

## Status

Work in progress — base frontend and full CRUD backend implemented.
JWT authentication and role-based access control planned for the next phase.
