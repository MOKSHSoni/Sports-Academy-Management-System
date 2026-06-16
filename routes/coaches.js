const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const adminCheck = require("../middleware/adminCheck");

router.get("/", async (req, res) => {
  const [rows] = await db.query("SELECT * FROM coaches WHERE is_active = 1");
  res.json(rows);
});

router.post("/", adminCheck, async (req, res) => {
  const { name, specialization, sport, experience_years, bio, photo_url } =
    req.body;

  if (!name || !sport) {
    return res.status(400).json({ error: "Name and sport are required" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO coaches (name,specialization,sport,experience_years,bio,photo_url,is_active) VALUES (?,?,?,?,?,?,1)",
      [name, specialization, sport, experience_years, bio, photo_url],
    );
    res.json({ success: true, coach_id: result.insertId, message: "Coach added" });
  } catch (err) {
    console.error("Coach insert error:", err);
    res.status(500).json({ error: "Failed to add coach: " + err.message });
  }
});

router.put("/:id", adminCheck, async (req, res) => {
  const { name, specialization, sport, experience_years, bio, photo_url } =
    req.body;
  const coachId = parseInt(req.params.id, 10);

  if (!coachId || isNaN(coachId)) {
    return res.status(400).json({ error: "Invalid coach ID" });
  }

  try {
    const [result] = await db.query(
      "UPDATE coaches SET name=?,specialization=?,sport=?,experience_years=?,bio=?,photo_url=? WHERE coach_id=?",
      [
        name,
        specialization,
        sport,
        experience_years,
        bio,
        photo_url,
        coachId,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Coach not found" });
    }

    res.json({ success: true, message: "Coach updated" });
  } catch (err) {
    console.error("Coach update error:", err);
    res.status(500).json({ error: "Failed to update coach: " + err.message });
  }
});

router.delete("/:id", adminCheck, async (req, res) => {
  const coachId = parseInt(req.params.id, 10);
  
  if (!coachId || isNaN(coachId)) {
    return res.status(400).json({ error: "Invalid coach ID" });
  }

  try {
    // Get the user_id for this coach
    const [[coach]] = await db.query(
      "SELECT user_id FROM coaches WHERE coach_id = ?",
      [coachId]
    );

    if (!coach) {
      return res.status(404).json({ error: "Coach not found" });
    }

    // Deactivate the coach
    await db.query("UPDATE coaches SET is_active = 0 WHERE coach_id = ?", [coachId]);

    // If coach has a linked user account, deactivate it too
    if (coach.user_id) {
      await db.query("UPDATE users SET is_active = 0 WHERE user_id = ?", [coach.user_id]);
    }

    res.json({ success: true, message: "Coach and account deactivated" });
  } catch (err) {
    console.error("Coach delete error:", err);
    res.status(500).json({ error: "Failed to delete coach: " + err.message });
  }
});

module.exports = router;
