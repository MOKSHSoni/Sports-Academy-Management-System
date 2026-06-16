const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const authCheck = require("../middleware/authCheck");
const adminCheck = require("../middleware/adminCheck");
const { validateProgramForm, sanitizeString, validateNumberRange } = require("../utils/validation");

router.get("/", async (req, res) => {
  const [rows] = await db.query(`
    SELECT p.*, c.name as coach_name, c.photo_url as coach_photo
    FROM programs p LEFT JOIN coaches c ON p.coach_id = c.coach_id
  `);
  res.json(rows);
});

router.get("/:id", async (req, res) => {
  if (!req.params.id) {
    return res.status(400).json({ error: "Program ID required" });
  }
  const [rows] = await db.query(
    `
    SELECT p.*, c.name as coach_name, c.specialization, c.bio as coach_bio,
    c.photo_url as coach_photo, c.experience_years
    FROM programs p LEFT JOIN coaches c ON p.coach_id = c.coach_id
    WHERE p.program_id = ?
  `,
    [req.params.id],
  );
  if (rows.length === 0) return res.status(404).json({ error: "Not found" });
  const [schedule] = await db.query(
    `
    SELECT * FROM schedule WHERE program_id = ? ORDER BY FIELD(day_of_week,'Mon','Tue','Wed','Thu','Fri','Sat','Sun')
  `,
    [req.params.id],
  );
  res.json({ ...rows[0], schedule });
});

router.post("/enroll", authCheck, async (req, res) => {
  try {
    const { program_id } = req.body;
    const user_id = req.session.user.user_id;

    if (!program_id) {
      return res.status(400).json({ error: "Program ID required" });
    }

    const [programRows] = await db.query(
      "SELECT max_capacity, current_enrolled FROM programs WHERE program_id = ?",
      [program_id],
    );
    if (programRows.length === 0)
      return res.status(404).json({ error: "Program not found" });

    const program = programRows[0];
    if ((program.current_enrolled || 0) >= (program.max_capacity || 0)) {
      return res.status(409).json({ error: "Program is full" });
    }

    const [existing] = await db.query(
      'SELECT * FROM enrollments WHERE user_id=? AND program_id=? AND status="active"',
      [user_id, program_id],
    );
    if (existing.length > 0)
      return res.status(409).json({ error: "Already enrolled" });
    
    await db.query("INSERT INTO enrollments (user_id, program_id) VALUES (?,?)", [
      user_id,
      program_id,
    ]);
    await db.query(
      "UPDATE programs SET current_enrolled = current_enrolled + 1 WHERE program_id = ?",
      [program_id],
    );

    const [updatedRows] = await db.query(
      "SELECT current_enrolled, max_capacity FROM programs WHERE program_id = ?",
      [program_id],
    );
    const updated = updatedRows[0] || { current_enrolled: 0, max_capacity: 0 };
    const spots_left = Math.max(
      0,
      (updated.max_capacity || 0) - (updated.current_enrolled || 0),
    );

    res.json({
      success: true,
      program_id,
      current_enrolled: updated.current_enrolled,
      max_capacity: updated.max_capacity,
      spots_left,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", adminCheck, async (req, res) => {
  try {
    const {
      name,
      sport,
      description,
      skill_level,
      age_group,
      fees,
      coach_id,
      max_capacity,
    } = req.body;

    // Validate form data
    const validation = validateProgramForm({
      name,
      sport,
      level: skill_level,
      age_group,
      fees,
      max_capacity,
      description,
    });
    if (!validation.isValid) {
      return res.status(400).json({ error: "Validation failed", errors: validation.errors });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(name, 200);
    const sanitizedDescription = sanitizeString(description || "", 2000);
    const sanitizedSport = sanitizeString(sport || "general", 50);
    const sanitizedLevel = sanitizeString(skill_level || "beginner", 50);
    const sanitizedAgeGroup = sanitizeString(age_group || "", 50);

    const [result] = await db.query(
      "INSERT INTO programs (name,sport,description,skill_level,age_group,fees,coach_id,max_capacity) VALUES (?,?,?,?,?,?,?,?)",
      [
        sanitizedName,
        sanitizedSport,
        sanitizedDescription,
        sanitizedLevel,
        sanitizedAgeGroup,
        fees || 0,
        coach_id || null,
        max_capacity || 20,
      ],
    );
    res.json({ success: true, program_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", adminCheck, async (req, res) => {
  try {
    const {
      name,
      sport,
      description,
      skill_level,
      age_group,
      fees,
      coach_id,
      max_capacity,
    } = req.body;

    if (!req.params.id) {
      return res.status(400).json({ error: "Program ID required" });
    }

    // Validate form data
    const validation = validateProgramForm({
      name,
      sport,
      level: skill_level,
      age_group,
      fees,
      max_capacity,
      description,
    });
    if (!validation.isValid) {
      return res.status(400).json({ error: "Validation failed", errors: validation.errors });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(name, 200);
    const sanitizedDescription = sanitizeString(description || "", 2000);
    const sanitizedSport = sanitizeString(sport || "general", 50);
    const sanitizedLevel = sanitizeString(skill_level || "beginner", 50);
    const sanitizedAgeGroup = sanitizeString(age_group || "", 50);

    await db.query(
      "UPDATE programs SET name=?,sport=?,description=?,skill_level=?,age_group=?,fees=?,coach_id=?,max_capacity=? WHERE program_id=?",
      [
        sanitizedName,
        sanitizedSport,
        sanitizedDescription,
        sanitizedLevel,
        sanitizedAgeGroup,
        fees || 0,
        coach_id || null,
        max_capacity || 20,
        req.params.id,
      ],
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", adminCheck, async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ error: "Program ID required" });
    }
    await db.query("DELETE FROM programs WHERE program_id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
