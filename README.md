# Chat Application Backend

A real-time, room-based chat server built with Strapi 3 and Socket.IO, using MongoDB for storage.

![Node.js](https://img.shields.io/badge/Node.js-16.x-339933?logo=nodedotjs&logoColor=white)
![Strapi](https://img.shields.io/badge/Strapi-3.6-2F2E8B?logo=strapi&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?logo=socketdotio&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)

> This is the server half of the project. The React client is at **[chat-application-frontend](https://github.com/VamsiKrishnaThota03/chat-application-frontend)**.

## Overview

The Strapi app attaches a Socket.IO server to Strapi's HTTP server in `config/functions/bootstrap.js`. When a client joins, the server creates a record in the `users` collection (Mongoose connector) with the username, room, status and socket ID. It then broadcasts messages and the room's member list to everyone in that room. When a client disconnects, its record is deleted, and any records left over from a previous run are cleared on startup.

## Features

- **Join a room** with a username and room name (trimmed, max 30 characters; `bot` is reserved). Duplicate usernames in the same room are rejected.
- **Bot messages**: a welcome message for the user who joins, plus join and leave announcements for the rest of the room
- **Room broadcast**: messages (max 1000 characters) are sent only to sockets in the sender's room. The sender is identified by its socket connection, so a client cannot post as someone else
- **Live member list**: a `roomInfo` event is emitted whenever someone joins or leaves
- **Presence cleanup**: the user record is removed on socket disconnect
- **Strapi admin panel and REST API** for the `users` collection (username, room, status, socketId)

## Tech stack

- Node.js 12 to 16 (per `engines`; Strapi 3 does not support newer Node)
- Strapi 3.6.11 with `strapi-connector-mongoose`
- Socket.IO 4
- MongoDB (local or Atlas)

## Project structure

```
.
├── api/users/                 # "users" collection type: model, routes, controller, service
├── config/
│   ├── database.js            # Mongoose connection (DATABASE_URI)
│   ├── server.js              # Host, port, admin JWT secret (required)
│   └── functions/
│       ├── bootstrap.js       # Attaches Socket.IO to Strapi, CORS origins
│       ├── socket.js          # Chat event handlers (join, sendMessage, disconnect)
│       └── utils/database.js  # Member lookup, create and delete helpers
├── extensions/users-permissions/config/jwt.js   # JWT_SECRET (required)
├── test/socket.test.js        # Socket.IO tests with an in-memory store
├── public/
└── package.json
```

## Getting started

### Prerequisites

- Node.js 16.x (or 14.x) and npm. Strapi 3 does not run on Node 18+; use a version manager such as `nvm use 16` or `mise exec node@16 -- npm ...`.
- MongoDB, local or MongoDB Atlas

### Install

```bash
git clone https://github.com/VamsiKrishnaThota03/realtime-chat-server.git
cd chat-application-backend
npm install
```

### Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable           | Required | Description | Example |
|--------------------|----------|-------------|---------|
| `DATABASE_URI`     | yes | MongoDB connection string | `mongodb://127.0.0.1:27017/chat` |
| `ADMIN_JWT_SECRET` | yes | Secret for Strapi admin panel tokens. The server refuses to start without it | `openssl rand -hex 32` |
| `JWT_SECRET`       | yes | Secret for the users-permissions plugin. The server refuses to start without it | `openssl rand -hex 32` |
| `CORS_ORIGINS`     | no  | Comma-separated frontend origins allowed by Socket.IO (default `http://localhost:3000`). `CUSTOM_DOMAIN` and `REACT_APP_URL` are still read too | `https://your-frontend.example.com` |
| `HOST`             | no  | Bind address. Defaults to `127.0.0.1`, or `0.0.0.0` when `RENDER`/`DYNO` is set. Set `HOST=0.0.0.0` on other hosts or in containers | `0.0.0.0` |
| `PORT`             | no  | HTTP and Socket.IO port | `1337` |
| `PUBLIC_URL`       | no  | Public URL when behind a proxy | `https://chat-api.example.com` |
| `DATABASE_SSL`     | no  | `true` to force TLS to MongoDB (Atlas `mongodb+srv://` URIs negotiate TLS on their own) | `false` |

### Run

```bash
# Development (auto-reload, admin panel editing enabled)
npm run develop

# Production
npm run build
npm start
```

The server runs at `http://localhost:1337`. The Strapi admin panel is at `/admin`.

### Tests and lint

```bash
npm test      # Socket.IO event tests with an in-memory store (no MongoDB needed)
npm run lint  # ESLint
```

## Socket.IO events

| Direction       | Event         | Payload                               | Purpose                                                 |
|-----------------|---------------|---------------------------------------|---------------------------------------------------------|
| client → server | `join`        | `{ username, room }`, ack callback    | Join a room. The ack receives an error string if the name is taken |
| client → server | `sendMessage` | `{ message }`, ack callback           | Send a message to the sender's room (a `userId` field is accepted but ignored) |
| server → client | `welcome`     | `{ user: 'bot', text, userData }`     | Sent to the user who joined, with `{ id, username, room, status }` |
| server → client | `message`     | `{ user, text }`                      | Chat message or bot announcement                        |
| server → client | `roomInfo`    | `{ room, users }`                     | Current members of the room (socket IDs are not exposed) |

Ack callbacks are optional and are called exactly once: with nothing on success or with an error message.

## REST API

These routes come from `api/users/config/routes.json` and use Strapi's default controllers. Access is controlled by Strapi's Roles & Permissions settings: keep them disabled for the **Public** role unless you need them, otherwise anyone can list or delete chat members.

| Method | Path           | Purpose                 |
|--------|----------------|-------------------------|
| GET    | `/users`       | List users              |
| GET    | `/users/count` | Count users             |
| GET    | `/users/:id`   | Get one user            |
| POST   | `/users`       | Create a user           |
| PUT    | `/users/:id`   | Update a user           |
| DELETE | `/users/:id`   | Delete a user           |

## Known limitations

- Strapi 3 is end-of-life and needs Node 16 or older (also end-of-life). Moving to Strapi 4/5 is a rewrite of the project structure and was not done.
- There is no authentication for chat: anyone who can reach the server can join any room under any free name.
- Messages are not stored; only the current members are.
- The `users` collection name overlaps with the users-permissions plugin's `/users` routes.
- `npm audit` reports advisories in Strapi 3's dependency tree that can only be fixed by upgrading Strapi's major version.

## Contact

Questions or suggestions: **vamsikrishnathota483@gmail.com**
