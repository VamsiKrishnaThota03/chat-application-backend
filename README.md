# Chat Application Backend

A real-time, room-based chat server built with Strapi 3 and Socket.IO, using MongoDB for storage.

![Node.js](https://img.shields.io/badge/Node.js-14.x-339933?logo=nodedotjs&logoColor=white)
![Strapi](https://img.shields.io/badge/Strapi-3.4-2F2E8B?logo=strapi&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-3-010101?logo=socketdotio&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)

> This is the server half of the project. The React client is at **[chat-application-frontend](https://github.com/VamsiKrishnaThota03/chat-application-frontend)**.

## Overview

The Strapi app attaches a Socket.IO server to Strapi's HTTP server in `config/functions/bootstrap.js`. When a client joins, the server creates a record in the `users` collection (Mongoose connector) with the username, room, status and socket ID. It then broadcasts messages and the room's member list to everyone in that room. When a client disconnects, its record is deleted.

## Features

- **Join a room** with a username and room name. Duplicate usernames in the same room are rejected.
- **Bot messages**: a welcome message for the user who joins, plus join and leave announcements for the rest of the room
- **Room broadcast**: messages are sent only to sockets in the sender's room
- **Live member list**: a `roomInfo` event is emitted whenever someone joins or leaves
- **Presence cleanup**: the user record is removed on socket disconnect
- **Strapi admin panel and REST API** for the `users` collection (username, room, status, socketId)

## Tech stack

- Node.js (10.16 to 14.x, per `engines`)
- Strapi 3.4 with `strapi-connector-mongoose`
- Socket.IO 3
- MongoDB (local or Atlas)

## Project structure

```
.
├── api/users/                 # "users" collection type: model, routes, controller, service
├── config/
│   ├── database.js            # Mongoose connection (DATABASE_URI)
│   ├── server.js              # Host, port, admin JWT secret
│   └── functions/
│       ├── bootstrap.js       # Socket.IO server and chat events
│       └── utils/database.js  # User lookup, create and delete helpers
├── extensions/users-permissions/config/jwt.js
├── public/
└── package.json
```

## Getting started

### Prerequisites

- Node.js 14.x and npm 6+. Strapi 3.4 does not support newer Node versions.
- MongoDB, local or MongoDB Atlas

### Install

```bash
git clone https://github.com/VamsiKrishnaThota03/chat-application-backend.git
cd chat-application-backend
npm install
```

### Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable           | Description                                                     | Example                                          |
|--------------------|-----------------------------------------------------------------|--------------------------------------------------|
| `HOST`             | Bind address                                                    | `0.0.0.0`                                        |
| `PORT`             | HTTP and Socket.IO port                                         | `1337`                                           |
| `DATABASE_URI`     | MongoDB connection string                                       | `mongodb://localhost:27017/<db-name>`            |
| `ADMIN_JWT_SECRET` | Secret for Strapi admin panel tokens                            | `<random-secret>`                                |
| `JWT_SECRET`       | Secret for the users-permissions plugin                         | `<random-secret>`                                |
| `CUSTOM_DOMAIN`    | Allowed CORS origin for Socket.IO (for example, your deployed frontend) | `<https://your-frontend.example.com>`     |
| `REACT_APP_URL`    | Another allowed CORS origin for Socket.IO                       | `http://localhost:3000`                          |

**MongoDB Atlas:** use the connection string Atlas gives you as `DATABASE_URI`, and set `ssl: true` in `config/database.js`. Leave it `false` for a local MongoDB.

### Run

```bash
# Development (auto-reload, admin panel editing enabled)
npm run develop

# Production
npm run build
npm start
```

The server runs at `http://localhost:1337`. The Strapi admin panel is at `/admin`.

## Socket.IO events

| Direction       | Event         | Payload                               | Purpose                                                 |
|-----------------|---------------|---------------------------------------|---------------------------------------------------------|
| client → server | `join`        | `{ username, room }`, ack callback    | Join a room. The ack receives an error string if the name is taken |
| client → server | `sendMessage` | `{ userId, message }`, ack callback   | Send a message to the sender's room                     |
| server → client | `welcome`     | `{ user: 'bot', text, userData }`     | Sent to the user who joined, with their stored record   |
| server → client | `message`     | `{ user, text }`                      | Chat message or bot announcement                        |
| server → client | `roomInfo`    | `{ room, users }`                     | Current members of the room                             |

## REST API

These routes come from `api/users/config/routes.json` and use Strapi's default controllers. Access is controlled by Strapi's Roles & Permissions settings.

| Method | Path           | Purpose                 |
|--------|----------------|-------------------------|
| GET    | `/users`       | List users              |
| GET    | `/users/count` | Count users             |
| GET    | `/users/:id`   | Get one user            |
| POST   | `/users`       | Create a user           |
| PUT    | `/users/:id`   | Update a user           |
| DELETE | `/users/:id`   | Delete a user           |

## Contact

Questions or suggestions: **vamsikrishnathota483@gmail.com**
