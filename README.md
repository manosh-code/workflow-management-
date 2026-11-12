# Workflow

A small Trello-style Kanban app for teams: organizations, boards, ordered lists, and cards. The browser talks to an Express API, and the API stores data in MongoDB through Mongoose.

The requirements baseline is in [docs/SRS.pdf](docs/SRS.pdf).

## Run it locally

MongoDB should be listening on `127.0.0.1:27017`.

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173. Register an account, create an organization, then open the board. A new board starts with To Do, In Progress, and Done.

The API is at http://localhost:4000. The Vite dev server proxies `/api` to that port.

## Tests

```bash
cd server
npm test
```

Tests use the database `trello_workflow_test` and cover the acceptance cases AT-01 through AT-08.

## Access

| Role | What they can do |
| --- | --- |
| Admin | Manage members and roles, plus everything a member can do |
| Member | Create and edit boards, lists, cards, comments, and labels |
| Viewer | Read boards and cards only |

Board access follows organization membership. Every protected request checks the current membership, so a removed member cannot keep using an old token.

Passwords are stored as bcrypt hashes. The JWT is sent as a Bearer token, expires after 7 days, and is kept in `localStorage`. Sign-out increments a token version on the user, which invalidates previously issued tokens. Production traffic should use HTTPS. Change `JWT_SECRET` before deploying.

## Layout

`server/` holds the Express app: models, auth and role middleware, Zod validation, controllers, and ordering/activity services.

`client/` is a React app with sign-in, organizations, members, boards, the Kanban board, card details, and profile.
