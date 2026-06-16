const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../db/connection");

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, age_group, fitness_goal, preferred_sport } =
      req.body;
    if (
      !name ||
      !email ||
      !password ||
      !age_group ||
      !fitness_goal ||
      !preferred_sport
    ) {
      return res.status(400).json({ error: "All fields required" });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }
    
    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    
    const [existing] = await db.query(
      "SELECT user_id FROM users WHERE email = ?",
      [email],
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, age_group, fitness_goal, preferred_sport) VALUES (?,?,?,?,?,?)",
      [name, email, hashed, age_group, fitness_goal, preferred_sport],
    );
    req.session.user = {
      user_id: result.insertId,
      name,
      email,
      role: "student",
      age_group,
      fitness_goal,
      preferred_sport,
    };
    res.json({
      success: true,
      role: "student",
      redirect: "/student/dashboard",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }
    
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });
    const user = rows[0];

    // Check if user account is active
    if (user.is_active === 0 || user.is_active === false) {
      return res.status(403).json({ error: "Your account has been deactivated. Contact admin." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });
    req.session.user = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      age_group: user.age_group,
      fitness_goal: user.fitness_goal,
      preferred_sport: user.preferred_sport,
    };
    let redirect = "/student/dashboard";
    if (user.role === "admin") {
      redirect = "/admin";
    } else if (user.role === "coach") {
      redirect = "/coach/dashboard";
    }
    res.json({ success: true, role: user.role, redirect });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ success: true, redirect: "/login" });
  });
});

// Session check
router.get("/me", (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

// Set password for newly approved coaches (public applicants)
router.post("/setup-password", async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if user exists and is a coach
    const [rows] = await db.query(
      "SELECT user_id, role FROM users WHERE email = ? AND role = 'coach'",
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Coach account not found for this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    await db.query(
      "UPDATE users SET password = ? WHERE email = ? AND role = 'coach'",
      [hashedPassword, email]
    );

    res.json({ success: true, message: "Password set successfully. You can now login." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
