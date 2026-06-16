const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const authCheck = require("../middleware/authCheck");
const adminCheck = require("../middleware/adminCheck");
const { validateEventForm, sanitizeString, validateDate, validateNumberRange } = require("../utils/validation");

router.get("/", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM events ORDER BY event_date ASC");
  res.json(rows);
});

router.post("/register", authCheck, async (req, res) => {
  try {
    const { event_id } = req.body;
    const user_id = req.session.user.user_id;
    
    if (!event_id) {
      return res.status(400).json({ error: "Event ID required" });
    }

    const [existing] = await db.query(
      'SELECT * FROM event_registrations WHERE event_id=? AND user_id=? AND status="registered"',
      [event_id, user_id],
    );
    if (existing.length > 0)
      return res.status(409).json({ error: "Already registered" });
    await db.query(
      "INSERT INTO event_registrations (event_id, user_id) VALUES (?,?)",
      [event_id, user_id],
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", adminCheck, async (req, res) => {
  try {
    const {
      title,
      description,
      sport,
      event_date,
      event_time,
      location,
      capacity,
      fee,
    } = req.body;

    // Validate form data
    const validation = validateEventForm({ title, sport, event_date, capacity, fee, description });
    if (!validation.isValid) {
      return res.status(400).json({ error: "Validation failed", errors: validation.errors });
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeString(title, 200);
    const sanitizedDescription = sanitizeString(description || "", 2000);
    const sanitizedSport = sanitizeString(sport || "general", 50);
    const sanitizedLocation = sanitizeString(location || "", 150);

    const created_by = req.session.user.user_id;
    await db.query(
      "INSERT INTO events (title,description,sport,event_date,event_time,location,capacity,fee,created_by) VALUES (?,?,?,?,?,?,?,?,?)",
      [
        sanitizedTitle,
        sanitizedDescription,
        sanitizedSport,
        event_date,
        event_time || null,
        sanitizedLocation,
        capacity || 0,
        fee || 0,
        created_by,
      ],
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", adminCheck, async (req, res) => {
  try {
    const {
      title,
      description,
      sport,
      event_date,
      event_time,
      location,
      capacity,
      fee,
    } = req.body;

    // Validate form data
    const validation = validateEventForm({ title, sport, event_date, capacity, fee, description });
    if (!validation.isValid) {
      return res.status(400).json({ error: "Validation failed", errors: validation.errors });
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeString(title, 200);
    const sanitizedDescription = sanitizeString(description || "", 2000);
    const sanitizedSport = sanitizeString(sport || "general", 50);
    const sanitizedLocation = sanitizeString(location || "", 150);

    await db.query(
      "UPDATE events SET title=?,description=?,sport=?,event_date=?,event_time=?,location=?,capacity=?,fee=? WHERE event_id=?",
      [
        sanitizedTitle,
        sanitizedDescription,
        sanitizedSport,
        event_date,
        event_time || null,
        sanitizedLocation,
        capacity || 0,
        fee || 0,
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
      return res.status(400).json({ error: "Event ID required" });
    }
    await db.query("DELETE FROM events WHERE event_id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
