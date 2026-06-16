CREATE DATABASE IF NOT EXISTS athletica;
USE athletica;

CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR
(100) NOT NULL,
  email VARCHAR
(100) UNIQUE NOT NULL,
  password VARCHAR
(255) NOT NULL,
  role ENUM
('student','coach','admin') DEFAULT 'student',
  age_group ENUM
('kids','teen','adult','senior') NOT NULL,
  fitness_goal ENUM
('strength','agility','flexibility','endurance','fun') NOT NULL,
  preferred_sport ENUM
('parkour','calisthenics','rock_climbing','acrobatics') NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE coaches (
  coach_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  name VARCHAR
(100) NOT NULL,
  specialization VARCHAR
(100),
  sport ENUM
('parkour','calisthenics','rock_climbing','acrobatics') NOT NULL,
  experience_years INT,
  bio TEXT,
  photo_url VARCHAR
(255),
  is_active BOOLEAN DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE programs (
  program_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR
(100) NOT NULL,
  sport ENUM
('parkour','calisthenics','rock_climbing','acrobatics') NOT NULL,
  description TEXT,
  skill_level ENUM
('beginner','intermediate','advanced') NOT NULL,
  age_group ENUM
('kids','teen','adult','senior') NOT NULL,
  fees DECIMAL
(10,2),
  coach_id INT,
  max_capacity INT DEFAULT 20,
  current_enrolled INT DEFAULT 0,
  FOREIGN KEY
(coach_id) REFERENCES coaches
(coach_id)
);

CREATE TABLE schedule (
  schedule_id INT PRIMARY KEY AUTO_INCREMENT,
  program_id INT,
  coach_id INT,
  day_of_week ENUM
('Mon','Tue','Wed','Thu','Fri','Sat','Sun'),
  start_time TIME,
  end_time TIME,
  location VARCHAR
(150),
  FOREIGN KEY
(program_id) REFERENCES programs
(program_id),
  FOREIGN KEY
(coach_id) REFERENCES coaches
(coach_id)
);

CREATE TABLE enrollments (
  enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  program_id INT,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM
('active','cancelled','completed') DEFAULT 'active',
  FOREIGN KEY
(user_id) REFERENCES users
(user_id),
  FOREIGN KEY
(program_id) REFERENCES programs
(program_id)
);

CREATE TABLE trial_bookings (
  booking_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR
(100) NOT NULL,
  email VARCHAR
(100) NOT NULL,
  phone VARCHAR
(20),
  sport ENUM
('parkour','calisthenics','rock_climbing','acrobatics') NOT NULL,
  preferred_date DATE NOT NULL,
  message TEXT,
  status ENUM
('pending','confirmed','cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
  event_id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR
(150) NOT NULL,
  description TEXT,
  sport ENUM
('parkour','calisthenics','rock_climbing','acrobatics','general') DEFAULT 'general',
  event_date DATE NOT NULL,
  event_time TIME,
  location VARCHAR
(150),
  capacity INT DEFAULT 50,
  fee DECIMAL
(10,2) DEFAULT 0,
  created_by INT,
  FOREIGN KEY
(created_by) REFERENCES users
(user_id)
);

CREATE TABLE event_registrations (
  reg_id INT PRIMARY KEY AUTO_INCREMENT,
  event_id INT,
  user_id INT,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM
('registered','cancelled') DEFAULT 'registered',
  FOREIGN KEY
(event_id) REFERENCES events
(event_id),
  FOREIGN KEY
(user_id) REFERENCES users
(user_id)
);

CREATE TABLE contact_messages (
  message_id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR
(100) NOT NULL,
  email VARCHAR
(100) NOT NULL,
  subject VARCHAR
(150),
  message TEXT NOT NULL,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE
);

CREATE TABLE coach_applications (
  application_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  applicant_name VARCHAR(100),
  applicant_email VARCHAR(100),
  applicant_phone VARCHAR(20),
  specialization VARCHAR(100),
  bio TEXT,
  experience_years INT,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  reviewed_by INT,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Seed admin account (password: admin123)
INSERT INTO users
  (name, email, password, role, age_group, fitness_goal, preferred_sport)
VALUES
  ('Admin', 'admin@apex.com', '$2b$10$uDF0aVxmDFy5rwyZrYaA4eRxiRhxPex9Yvuaxm8EpwIdG6Hq4u4Xa', 'admin', 'adult', 'strength', 'parkour');

-- Seed coaches
INSERT INTO coaches
  (name, specialization, sport, experience_years, bio, photo_url)
VALUES
  ('Marcus Reid', 'Urban Parkour & Freerunning', 'parkour', 8, 'Former competitive freerunner with 8 years of coaching experience. Trained athletes for national competitions.', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400'),
  ('Sofia Chen', 'Bar & Ring Calisthenics', 'calisthenics', 6, 'Certified strength coach specializing in bodyweight mastery. Known for progressive skill-building methodology.', 'https://images.unsplash.com/photo-1594381898411-846e7d193883?w=400'),
  ('Jake Torres', 'Sport Climbing & Bouldering', 'rock_climbing', 10, 'Competitive climber and certified IFSC coach. Has trained beginners to advanced-level competition climbers.', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400'),
  ('Priya Nair', 'Acrobatics & Aerial Arts', 'acrobatics', 7, 'Trained in classical gymnastics and acrobatics. Focuses on body awareness, flexibility and dynamic movement.', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400');

-- Seed programs
INSERT INTO programs
  (name, sport, description, skill_level, age_group, fees, coach_id, max_capacity)
VALUES
  ('Parkour Foundations', 'parkour', 'Learn the fundamentals of movement — precision jumps, vaults, balance and flow through urban environments.', 'beginner', 'teen', 2700.00, 1, 15),
  ('Parkour Advanced Flow', 'parkour', 'Dynamic combinations, wall runs, gainers and creative line expression for experienced movers.', 'advanced', 'adult', 4050.00, 1, 10),
  ('Calisthenics Basics', 'calisthenics', 'Build functional strength using bodyweight. Covers push, pull, squat patterns and core fundamentals.', 'beginner', 'adult', 2250.00, 2, 20),
  ('Calisthenics Skills', 'calisthenics', 'Unlock muscle-up, handstand, L-sit and planche progressions through structured skill work.', 'intermediate', 'adult', 3375.00, 2, 12),
  ('Rock Climbing Intro', 'rock_climbing', 'Learn climbing technique, footwork, route reading and safety protocols on our indoor wall.', 'beginner', 'adult', 2925.00, 3, 18),
  ('Kids Acrobatics', 'acrobatics', 'A fun and safe introduction to tumbling, balancing and acrobatic movement for children.', 'beginner', 'kids', 2025.00, 4, 15),
  ('Acrobatics Intermediate', 'acrobatics', 'Develop aerial awareness, partner acrobatics and dynamic floor sequences.', 'intermediate', 'teen', 3150.00, 4, 12);

-- Seed schedules
INSERT INTO schedule
  (program_id, coach_id, day_of_week, start_time, end_time, location)
VALUES
  (1, 1, 'Mon', '09:00', '10:30', 'Outdoor Training Zone A'),
  (1, 1, 'Wed', '09:00', '10:30', 'Outdoor Training Zone A'),
  (2, 1, 'Sat', '10:00', '12:00', 'Urban Parkour Park'),
  (3, 2, 'Tue', '18:00', '19:30', 'Calisthenics Park'),
  (3, 2, 'Thu', '18:00', '19:30', 'Calisthenics Park'),
  (4, 2, 'Sat', '08:00', '10:00', 'Calisthenics Park'),
  (5, 3, 'Mon', '16:00', '18:00', 'Indoor Climbing Wall'),
  (5, 3, 'Wed', '16:00', '18:00', 'Indoor Climbing Wall'),
  (6, 4, 'Tue', '10:00', '11:00', 'Acrobatics Studio'),
  (6, 4, 'Thu', '10:00', '11:00', 'Acrobatics Studio'),
  (7, 4, 'Sat', '14:00', '16:00', 'Acrobatics Studio');

-- Seed events
INSERT INTO events
  (title, description, sport, event_date, event_time, location, capacity, fee)
VALUES
  ('Parkour Jam 2025', 'An open jam session for all levels. Explore the city with fellow movers, share lines and learn from each other.', 'parkour', '2025-08-15', '09:00', 'City Centre Plaza', 60, 0),
  ('Calisthenics Strength Camp', 'A weekend intensive camp focused on building raw strength and unlocking advanced bodyweight skills.', 'calisthenics', '2025-08-22', '08:00', 'Calisthenics Park', 30, 25),
  ('Climb Fest - Bouldering Competition', 'Internal bouldering competition open to all Athletica students. Prizes for top climbers in each grade.', 'rock_climbing', '2025-09-05', '10:00', 'Indoor Climbing Wall', 40, 10),
  ('Acrobatics Showcase', 'Students perform choreographed acrobatic routines. Families and friends welcome. Free entry.', 'acrobatics', '2025-09-20', '17:00', 'Main Hall', 100, 0);