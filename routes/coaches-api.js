const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const authCheck = require("../middleware/authCheck");
const { validateCoachProfileUpdate, sanitizeString } = require("../utils/validation");

// Middleware: Check if user is a coach and coach account is active
const coachCheck = async (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "coach") {
    return res.status(403).json({ error: "Coach access required" });
  }

  try {
    // Verify coach record is still active
    const [[coach]] = await db.query(
      "SELECT is_active FROM coaches WHERE user_id = ?",
      [req.session.user.user_id]
    );

    if (!coach || coach.is_active === 0 || coach.is_active === false) {
      return res.status(403).json({ error: "Your coach account has been deactivated" });
    }

    next();
  } catch (err) {
    console.error("Coach validation error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── GET /api/coaches/my/profile ──────────────────────────────
// Coach gets their profile
router.get("/my/profile", authCheck, coachCheck, async (req, res) => {
  try {
    const [[coach]] = await db.query(
      "SELECT specialization, bio, experience_years, sport, photo_url FROM coaches WHERE user_id = ?",
      [req.session.user.user_id]
    );
    res.json(coach || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── PUT /api/coaches/my/profile ──────────────────────────────
// Coach updates their profile
router.put("/my/profile", authCheck, coachCheck, async (req, res) => {
  try {
    const { specialization, bio, experience_years } = req.body;
    const userId = req.session.user.user_id;

    // Validate form data
    const validation = validateCoachProfileUpdate({ specialization, bio, experience_years });
    if (!validation.isValid) {
      return res.status(400).json({ error: "Validation failed", errors: validation.errors });
    }

    // Sanitize inputs
    const sanitizedSpecialization = specialization ? sanitizeString(specialization, 150) : null;
    const sanitizedBio = bio ? sanitizeString(bio, 2000) : null;
    const yearsNum = experience_years !== undefined && experience_years !== null && experience_years !== '' 
      ? Number(experience_years) 
      : 0;

    await db.query(
      "UPDATE coaches SET specialization = ?, bio = ?, experience_years = ? WHERE user_id = ?",
      [sanitizedSpecialization, sanitizedBio, yearsNum, userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/coaches/my/students ─────────────────────────────
// Coach gets all students in their programs
router.get("/my/students", authCheck, coachCheck, async (req, res) => {
  try {
    const userId = req.session.user.user_id;
    const [students] = await db.query(
      `SELECT 
        u.user_id,
        u.name as student_name,
        p.program_id,
        p.name as program_name,
        e.enrolled_at
      FROM enrollments e
      JOIN users u ON e.user_id = u.user_id
      JOIN programs p ON e.program_id = p.program_id
      WHERE p.coach_id = (SELECT coach_id FROM coaches WHERE user_id = ?)
      AND e.status = 'active'
      ORDER BY e.enrolled_at DESC`,
      [userId]
    );
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/coaches/my/programs ─────────────────────────────
// Coach gets their programs (same as /api/programs but filtered)
router.get("/my/programs", authCheck, coachCheck, async (req, res) => {
  try {
    const userId = req.session.user.user_id;
    const [programs] = await db.query(
      `SELECT * FROM programs 
      WHERE coach_id = (SELECT coach_id FROM coaches WHERE user_id = ?)`,
      [userId]
    );
    res.json(programs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/coaches/my/schedule ─────────────────────────────
// Coach gets their schedule (same as /api/schedule but filtered)
router.get("/my/schedule", authCheck, coachCheck, async (req, res) => {
  try {
    const userId = req.session.user.user_id;
    const [schedule] = await db.query(
      `SELECT s.*, p.name as program_name FROM schedule s
      JOIN programs p ON s.program_id = p.program_id
      WHERE s.coach_id = (SELECT coach_id FROM coaches WHERE user_id = ?)`,
      [userId]
    );
    res.json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
