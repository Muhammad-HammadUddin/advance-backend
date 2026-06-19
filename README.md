# Advance Backend

A progressive, hands-on backend infrastructure repo — each level tackles a real production concern, from containerizing a single service to running a load-balanced microservices architecture behind Nginx.

Built with **Node.js (Express 5)**, **MongoDB (Mongoose)**, **Redis (ioredis + BullMQ)**, **Docker**, and **Nginx**.

## Structure

```
advance-backend/
├── level1/   # Docker basics
│   ├── phase1/   # Single Express server, Dockerized
│   └── phase2/   # Backend + React (Vite) frontend + Redis, via docker-compose
│
├── level2/   # Redis
│   └── phase1/   # Caching, OTP w/ TTL, rate limiting, BullMQ email queue
│
└── level3/   # Nginx + Microservices
    ├── phase1/   # Load balancing — 3 identical servers behind Nginx + Redis
    └── phase2/   # Real microservices — Gateway + Auth/Order/Product services
```

## Level 1 — Docker

**phase1** — A minimal Express server (`Hello World`) with a `Dockerfile` (`FROM node`, install deps, `CMD node index.js`). The starting point: get one service running in a container.

**phase2** — Multi-container setup via `docker-compose`: an Express backend, a React + Vite frontend, and Redis, each with its own `Dockerfile`, wired together and exposed on different ports (`8000`, `5173`, `6379`).

## Level 2 — Redis

A single Express API (`level2/phase1`) demonstrating four real Redis use cases on top of MongoDB:

- **Cache-aside pattern** — `/cache` checks Redis first, falls back to MongoDB, then populates the cache; cache is invalidated (`redis.del`) on writes.
- **Rate limiting** — `middleware/ratelimit.js` uses `redis.incr` + `expire` to cap a client to 5 requests per 60s window, returning `429` when exceeded.
- **OTP with auto-expiry** — `/otp` and `/verify-otp` store a 6-digit code in Redis with a 30s TTL (`EX 30`), no manual cleanup needed.
- **Background jobs with BullMQ** — `/create` enqueues an `email` job (`queue.js`) instead of blocking the request; `worker.js` runs as a separate process to send the email asynchronously.

`docker-compose.yml` here just spins up Redis for local dev against the Node app.

## Level 3 — Nginx + Microservices

**phase1 — Load Balancing.** Three identical instances of the level2 server (`server1`, `server2`, `server3`) run behind an Nginx reverse proxy. Nginx's `upstream` block round-robins requests across them — the foundational pattern before splitting into real services.

**phase2 — Microservices.** The architecture splits into purpose-built services behind an API gateway:

```
Client → Nginx (LB) → Gateway (×3) → Auth Service
                                   → Order Service
                                   → Product Service
```

- **Nginx** load-balances across 3 gateway instances (`gateway1-3`).
- **Gateway** (`express-http-proxy`) routes `/auth`, `/order`, `/product` to their respective backend services.
- **Auth / Order / Product services** are independent, separately Dockerized Express apps, each scaffolded with its own `package.json`, `Dockerfile`, and `.env`.

> Each service currently returns a stub response identifying itself (e.g. `Hello from Auth Service`) — the routing and infrastructure are fully wired; service-level business logic is the next step.

## Tech Stack

| Layer | Tech |
|---|---|
| Server | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Caching / Queues | Redis, ioredis, BullMQ |
| Reverse Proxy / LB | Nginx |
| Containerization | Docker, Docker Compose |
| Frontend (level1 demo) | React, Vite |

## Running locally

Each phase is self-contained with its own `docker-compose.yml`. Example — level3 phase2 (full microservices):

```bash
cd level3/phase2
docker-compose up --build
```

Then hit the gateway through Nginx:

```bash
curl http://localhost:8080/auth
curl http://localhost:8080/order
curl http://localhost:8080/product
```

For level2 (Redis features), you'll also need a `.env` with `MONGO_URI` and `REDIS_URL`:

```bash
cd level2
docker-compose up -d        # starts Redis
cd phase1
npm install
npm run dev                  # in one terminal
node worker.js               # in another, for the email queue
```

## Why this repo

Practicing the backend infrastructure concerns that don't show up in basic CRUD tutorials: caching strategy, rate limiting, async job processing, load balancing, and breaking a monolith into services behind a gateway.

## Author

**M. Hammad**
Computer Science, FAST-NUCES, Karachi
