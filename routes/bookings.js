const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const authCheck = require("../middleware/authCheck");
const { validateTrialBooking, sanitizeString, isValidEmail } = require("../utils/validation");

router.post("/trial", async (req, res) => {
  try {
    const { name, email, phone, sport, preferred_date, message } = req.body;

    // Validate form data
    const validation = validateTrialBooking({ name, email, phone, sport, preferred_date, message });
    if (!validation.isValid) {
      return res.status(400).json({ error: "Validation failed", errors: validation.errors });
    }

    // Check for duplicate recent booking (same email within 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const [[existing]] = await db.query(
      "SELECT booking_id FROM trial_bookings WHERE email = ? AND created_at > ?",
      [email.trim().toLowerCase(), sevenDaysAgo]
    );
    
    if (existing) {
      return res.status(409).json({ error: "You already have a trial booking within the last 7 days" });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(name, 100);
    const sanitizedEmail = sanitizeString(email, 100);
    const sanitizedPhone = sanitizeString(phone || "", 20);
    const sanitizedSport = sanitizeString(sport, 50);
    const sanitizedMessage = sanitizeString(message || "", 1000);

    await db.query(
      "INSERT INTO trial_bookings (name,email,phone,sport,preferred_date,message) VALUES (?,?,?,?,?,?)",
      [sanitizedName, sanitizedEmail, sanitizedPhone, sanitizedSport, preferred_date, sanitizedMessage],
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/my", authCheck, async (req, res) => {
  const user_id = req.session.user.user_id;
  const [enrollments] = await db.query(
    `
    SELECT e.*, p.name as program_name, p.sport, p.fees
    FROM enrollments e JOIN programs p ON e.program_id = p.program_id
    WHERE e.user_id = ?
  `,
    [user_id],
  );
  const [events] = await db.query(
    `
    SELECT er.*, ev.title, ev.event_date, ev.event_time, ev.location, ev.sport
    FROM event_registrations er JOIN events ev ON er.event_id = ev.event_id
    WHERE er.user_id = ?
  `,
    [user_id],
  );
  res.json({ enrollments, events });
});

router.put("/cancel-enrollment/:id", authCheck, async (req, res) => {
  await db.query(
    'UPDATE enrollments SET status="cancelled" WHERE enrollment_id=? AND user_id=?',
    [req.params.id, req.session.user.user_id],
  );
  res.json({ success: true });
});

router.put("/cancel-event/:id", authCheck, async (req, res) => {
  await db.query(
    'UPDATE event_registrations SET status="cancelled" WHERE reg_id=? AND user_id=?',
    [req.params.id, req.session.user.user_id],
  );
  res.json({ success: true });
});

module.exports = router;
