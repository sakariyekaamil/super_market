# Alraxma Supermarket Management System

Full-stack supermarket management application with React, Node.js, Express, Prisma, and Neon PostgreSQL.

## Tech Stack

**Frontend:** React, TypeScript, Tailwind CSS, React Router, Axios, React Hook Form, Zod, React Query, Zustand, Recharts

**Backend:** Node.js, Express, TypeScript, Prisma ORM, JWT Auth, bcrypt

## Getting Started

### Prerequisites

- Node.js 18+
- Neon PostgreSQL database (configured in `backend/.env`)

### Backend Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

API runs at `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`

## Default Login

- **Username:** admin
- **Password:** admin123

## Features

- JWT authentication with role-based access (Admin, Manager, Cashier)
- Products, Categories, Suppliers, Customers management
- Purchase & Sales invoicing with automatic stock updates
- Payment processing (Cash, Zaad, Edahab, Card)
- Employee & Payroll management
- Dashboard with charts and analytics
- Reports with PDF/Excel export
- Dark mode, responsive sidebar, toast notifications

## API Endpoints

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register user (Admin only)
- `GET /api/auth/profile` - Get profile
- CRUD endpoints for all modules under `/api/*`

## Project Structure

```
backend/src/     - Express API (controllers, routes, middleware, services)
frontend/src/    - React app (pages, components, layouts, api, store)
```
