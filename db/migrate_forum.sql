-- ============================================================
-- Athletica Forum Migration
-- Run once against an existing athletica database.
-- Safe to run multiple times.
-- ============================================================

USE athletica;

-- STEP 1: Extend users.role to include 'coach'
ALTER TABLE users
  MODIFY COLUMN role ENUM('student','coach','admin') DEFAULT 'student';

-- STEP 2: Add user_id FK to coaches

-- 2a. Add the column safely
DROP PROCEDURE IF EXISTS add_coach_user_id;
DELIMITER $$
CREATE PROCEDURE add_coach_user_id()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME  = 'coaches'
      AND COLUMN_NAME = 'user_id'
  ) THEN
    ALTER TABLE coaches ADD COLUMN user_id INT DEFAULT NULL;
  END IF;
END$$
DELIMITER ;
CALL add_coach_user_id();
DROP PROCEDURE IF EXISTS add_coach_user_id;

-- 2b. Add the FK safely
DROP PROCEDURE IF EXISTS add_coach_fk;
DELIMITER $$
CREATE PROCEDURE add_coach_fk()
BEGIN
  -- Drop FK only if it already exists
  IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA    = DATABASE()
      AND TABLE_NAME      = 'coaches'
      AND CONSTRAINT_NAME = 'fk_coaches_user'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE coaches DROP FOREIGN KEY fk_coaches_user;
  END IF;

  -- Now add it unconditionally
  ALTER TABLE coaches
    ADD CONSTRAINT fk_coaches_user
      FOREIGN KEY (user_id) REFERENCES users(user_id)
      ON DELETE SET NULL;
END$$
DELIMITER ;
CALL add_coach_fk();
DROP PROCEDURE IF EXISTS add_coach_fk;

-- STEP 3: Forum tables

CREATE TABLE IF NOT EXISTS forum_posts (
  post_id         INT PRIMARY KEY AUTO_INCREMENT,
  user_id         INT NOT NULL,
  title           VARCHAR(200) NOT NULL,
  body            TEXT NOT NULL,
  is_announcement BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forum_comments (
  comment_id  INT PRIMARY KEY AUTO_INCREMENT,
  post_id     INT NOT NULL,
  user_id     INT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES forum_posts(post_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id)       ON DELETE CASCADE
);