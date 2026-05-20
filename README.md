# Backend Ledger

Express REST API with MongoDB authentication (register / login), JWT in HTTP-only-style flow via cookies and JSON body.

## Stack

- Node.js
- Express 5
- MongoDB (Mongoose)
- JWT (`jsonwebtoken`), password hashing (`bcryptjs`), `cookie-parser`

## Prerequisites

- Node.js
- A MongoDB instance (connection string)

## Environment variables

Create a `.env` file in the project root (do not commit secrets):

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — secret used to sign tokens

## Install & run

```bash
npm install
npm run dev    # development with nodemon
npm start      # production: node server.js