# Athletica

Athletica is a sports academy management platform that supports role-based access control for athletes, coaches, and administrators. The system provides authentication, user management, training workflows, and community engagement features.

## Features

- Secure user authentication
- Role-based access control
- Athlete dashboard
- Coach dashboard
- Admin dashboard
- User management
- Coach management
- Community forum
- Database integration

## Tech Stack

**Frontend:**
- HTML
- CSS
- JavaScript

**Backend:**
- Node.js
- Express.js

**Database:**
- MySQL

**Authentication:**
- JWT
- Sessions (express-session)
- bcrypt (password hashing)

## Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd athletica
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your database credentials and secrets in `.env`.

4. Run the app:
   ```bash
   # Production
   npm start

   # Development (with auto-reload)
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
SESSION_SECRET=
```
