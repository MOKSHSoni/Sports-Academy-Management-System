const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const { validateContactForm, sanitizeString } = require("../utils/validation");

router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate form data
    const validation = validateContactForm({ name, email, subject, message });
    if (!validation.isValid) {
      return res.status(400).json({ error: "Validation failed", errors: validation.errors });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(name, 100);
    const sanitizedEmail = sanitizeString(email, 100);
    const sanitizedSubject = sanitizeString(subject, 100);
    const sanitizedMessage = sanitizeString(message, 5000);

    await db.query(
      "INSERT INTO contact_messages (name,email,subject,message) VALUES (?,?,?,?)",
      [sanitizedName, sanitizedEmail, sanitizedSubject, sanitizedMessage],
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
