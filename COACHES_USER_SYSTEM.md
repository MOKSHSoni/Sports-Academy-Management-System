# Coach User System Implementation Complete ✅

## Overview
Coaches are now **real users** with login capability. They can post in the forum, comment, and be identified distinctly as "Coach" in all posts and comments.

---

## Changes Made

### 1. Database Schema (`db/schema.sql`)

**Users Table:**
- Added `'coach'` to role ENUM: `('student','coach','admin')`
- Default role remains `'student'`

**Coaches Table:**
- Added `user_id INT` column (FK to users.user_id)
- Added `ON DELETE SET NULL` cascade rule
- All existing coach fields preserved (name, specialization, sport, experience_years, bio, photo_url)

### 2. Authentication (`routes/auth.js`)

**Login Flow:**
- Admin login → redirects to `/admin`
- Coach login → redirects to `/forum`
- Student login → redirects to `/student/dashboard`
- Role stored in session: `req.session.user.role`

### 3. Admin Management (`routes/admin.js`)

**Existing Endpoint:** `PUT /api/admin/update-role`
- Input: `{ user_id, new_role }` (new_role: 'student' or 'coach')
- Admin-only protected
- **Promoting to coach:**
  - Updates user role to 'coach'
  - Creates coaches table entry with user_id
- **Demoting to student:**
  - Updates user role to 'student'
  - Unlinks from coaches (sets user_id = NULL)

### 4. Forum System (`routes/forum.js`)

**Post Display:**
- Uses `userLabel()` function: shows `"Name (Coach)"`, `"Name (Student)"`, `"Name (Admin)"`
- JOINs users table to fetch role for all posts and comments
- Announcements tab shows coach/admin-marked posts

**Post Creation:** `POST /api/forum/posts`
- Protected with `authCheck` middleware
- Only coaches/admins can mark `is_announcement = true`
- User ID from session (not frontend)

**Comments:** `POST /api/forum/posts/:id/comments`
- Protected with `authCheck` middleware
- User ID from session (not frontend)
- Displays commenter as "(Coach)" or "(Student)"

**Deletion:** `DELETE /api/forum/posts/:id`
- Protected with `authCheck`
- Only post author or admin can delete

### 5. Authorization Middleware

**`authCheck`** (`middleware/authCheck.js`)
- Checks `req.session.user` exists
- Used on all POST/DELETE forum routes
- Returns 401 if not authenticated

**`adminCheck`** (`middleware/adminCheck.js`)
- Checks admin role
- Used on admin management routes

---

## Setup Instructions

### Step 1: Update Database Schema

Run this simple SQL to update existing database:

```sql
-- Update role enum in users table
ALTER TABLE users 
MODIFY COLUMN role ENUM('student','coach','admin') DEFAULT 'student';

-- Add user_id column to coaches
ALTER TABLE coaches 
ADD COLUMN user_id INT DEFAULT NULL,
ADD FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL;
```

### Step 2: Create Coach User Accounts (Optional)

If you have existing coaches in the coaches table and want them to be able to login, run:

```sql
-- File: db/migrate_coaches_to_users.sql
-- This creates user accounts for all existing coaches
-- See the migration file for details
```

Or manually create coach accounts:
```sql
INSERT INTO users (name, email, password, role, age_group, fitness_goal, preferred_sport)
VALUES ('Coach Name', 'coach@email.com', '[bcrypt_hash]', 'coach', 'adult', 'strength', 'parkour');

-- Then link: UPDATE coaches SET user_id = [new_user_id] WHERE name = 'Coach Name';
```

### Step 3: Restart Server

```bash
npm restart
# or
node server.js
```

---

## User Flows

### New Signup Flow
1. Student registers → role = 'student' (automatic)
2. Admin promotes them to coach via `/api/admin/update-role`
3. Coach now has entry in both users and coaches tables
4. Coach can login and access forum to post/comment

### Coach Permissions
- ✅ Login
- ✅ Create forum posts
- ✅ Comment on posts
- ✅ Mark posts as announcements
- ✅ Delete own posts (author can delete)
- ✅ Appear in forum as "(Coach)"
- ❌ Cannot change own role (admin only)
- ❌ Cannot access student dashboard
- ❌ Cannot access admin panel

### Student Permissions
- ✅ Login
- ✅ Create forum posts
- ✅ Comment on posts
- ❌ Cannot mark announcements
- ✅ Delete own posts (author can delete)
- ✅ Appear in forum as "(Student)"
- ✅ Access student dashboard

### Admin Permissions
- ✅ All above
- ✅ Update user roles (student ↔ coach)
- ✅ Mark posts as announcements
- ✅ Delete any post
- ✅ Access admin panel

---

## Forum Display Format

**All Posts Dashboard:**
```
Post Title
Marcus Reid (Coach) | 2 hours ago | 5 comments
[Post content...]

---
John Doe (Student) | 3 hours ago | 1 comment
[Post content...]

---
[ANNOUNCEMENT] ⭐ System Notice
Admin Staff (Admin) | yesterday | 0 comments
[Important announcement...]
```

**Comments Section:**
```
Marcus Reid (Coach) | 1 hour ago
This is an excellent question! Here's what I think...

John Doe (Student) | 45 minutes ago
Thanks for the advice! Really helpful.
```

---

## API Endpoints Quick Reference

| Method | Endpoint | Protected | Role | Purpose |
|--------|----------|-----------|------|---------|
| POST | `/api/auth/login` | ❌ | Any | Login |
| POST | `/api/auth/register` | ❌ | Public | Register (as student) |
| GET | `/api/auth/me` | ❌ | Any | Check session |
| PUT | `/api/admin/update-role` | ✅ Admin | Admin | Promote/demote users |
| GET | `/api/forum/posts` | ❌ | Any | View all posts |
| POST | `/api/forum/posts` | ✅ Auth | Any | Create post |
| POST | `/api/forum/posts/:id/comments` | ✅ Auth | Any | Comment |
| GET | `/api/forum/posts/:id` | ❌ | Any | View post + comments |

---

## No Breaking Changes ✅

- ✅ Existing coaches table structure preserved
- ✅ Programs still reference coach_id
- ✅ Schedule still references coach_id
- ✅ Student dashboard unaffected
- ✅ Admin dashboard unaffected
- ✅ All existing features work as before
- ✅ Forum tables (forum_posts, forum_comments) already exist

---

## Security Notes

1. **Password Storage:** Uses bcrypt (10 rounds)
2. **Session Management:** Express sessions with authentication checks
3. **Authorization:** Middleware-based role checking
4. **SQL Injection Prevention:** Parameterized queries throughout
5. **User Identity:** Always from session (never from frontend)

---

## Testing Checklist

- [ ] Create new student account → redirects to dashboard
- [ ] Login as admin → redirects to admin panel
- [ ] Admin promotes student to coach
- [ ] Coach login → redirects to forum
- [ ] Coach creates post with announcement checkbox → can mark as announcement
- [ ] Student creates post → announcement checkbox unchecked/disabled
- [ ] Post shows "(Coach)" or "(Student)" badge based on author role
- [ ] Coach can comment on posts
- [ ] Student can comment on posts
- [ ] Delete own post (author) → works
- [ ] Delete other's post (non-author) → fails with 403
- [ ] Admin delete any post → works
- [ ] Admin demotes coach to student → coach can still login but role changes
