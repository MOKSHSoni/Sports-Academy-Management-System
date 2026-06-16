const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const authCheck = require("../middleware/authCheck");
const adminCheck = require("../middleware/adminCheck");
const { sanitizeString, validateStringLength, isValidEmail } = require("../utils/validation");

// ── POST /api/applications/apply ──────────────────────────────
// Public: Anyone can submit coach application (with or without login)
// If logged in: links to user account
// If not logged in: stores applicant info for admin to review
router.post("/apply", async (req, res) => {
  try {
    const { specialization, bio, experience_years, applicant_name, applicant_email, applicant_phone } = req.body;
    
    // Validate required fields
    let validation = validateStringLength(specialization, 3, 150);
    if (!validation.isValid) {
      return res.status(400).json({ error: `Specialization: ${validation.error}` });
    }

    validation = validateStringLength(bio, 10, 2000);
    if (!validation.isValid) {
      return res.status(400).json({ error: `Bio: ${validation.error}` });
    }

    const user = req.session.user;
    let userId = null;
    let storedName = null;
    let storedEmail = null;

    // If user is logged in
    if (user) {
      // Students can apply directly
      // Others (coaches, admins) cannot apply
      if (user.role === "coach" || user.role === "admin") {
        return res.status(403).json({ error: "Only students can apply for coach role" });
      }

      // Check if user already has a pending/approved application
      const [[existing]] = await db.query(
        "SELECT application_id FROM coach_applications WHERE user_id = ? AND status IN ('pending', 'approved')",
        [user.user_id]
      );
      if (existing) {
        return res.status(409).json({ error: "You already have a pending or active coach application" });
      }

      userId = user.user_id;
    } else {
      // Public user - require name and email
      validation = validateStringLength(applicant_name, 2, 100);
      if (!validation.isValid) {
        return res.status(400).json({ error: `Name: ${validation.error}` });
      }

      if (!isValidEmail(applicant_email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      storedName = applicant_name;
      storedEmail = applicant_email;

      // Check if this email already has a pending application
      const [[existing]] = await db.query(
        "SELECT application_id FROM coach_applications WHERE applicant_email = ? AND status IN ('pending', 'approved')",
        [applicant_email]
      );
      if (existing) {
        return res.status(409).json({ error: "An application for this email is already pending or approved" });
      }
    }

    // Sanitize inputs
    const sanitizedSpecialization = sanitizeString(specialization, 150);
    const sanitizedBio = sanitizeString(bio, 2000);
    const sanitizedPhone = applicant_phone ? sanitizeString(applicant_phone, 20) : null;
    const sanitizedName = storedName ? sanitizeString(storedName, 100) : null;
    const sanitizedEmail = storedEmail ? sanitizeString(storedEmail, 100) : null;

    const [result] = await db.query(
      "INSERT INTO coach_applications (user_id, applicant_name, applicant_email, applicant_phone, specialization, bio, experience_years) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, sanitizedName, sanitizedEmail, sanitizedPhone, sanitizedSpecialization, sanitizedBio, experience_years || 0]
    );

    res.json({ success: true, application_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/applications/my ─────────────────────────────────
// Student checks their application status
router.get("/my", authCheck, async (req, res) => {
  try {
    const user = req.session.user;
    const [[application]] = await db.query(
      `SELECT application_id, specialization, bio, experience_years, status, applied_at, reviewed_at
       FROM coach_applications WHERE user_id = ?`,
      [user.user_id]
    );
    res.json(application || { status: "none" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/admin/applications ──────────────────────────────
// Admin views all applications (both from registered students and public)
router.get("/admin/applications", adminCheck, async (req, res) => {
  try {
    const status = req.query.status || "pending";

    // Validate status parameter
    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const [applications] = await db.query(
      `SELECT ca.application_id, ca.user_id, 
              COALESCE(u.name, ca.applicant_name) as name, 
              COALESCE(u.email, ca.applicant_email) as email,
              ca.applicant_phone as phone,
              u.preferred_sport,
              ca.specialization, ca.bio, ca.experience_years, ca.status, ca.applied_at, ca.reviewed_at,
              admin.name as reviewed_by_name
       FROM coach_applications ca
       LEFT JOIN users u ON ca.user_id = u.user_id
       LEFT JOIN users admin ON ca.reviewed_by = admin.user_id
       WHERE ca.status = ?
       ORDER BY ca.applied_at DESC`,
      [status]
    );
    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── PUT /api/admin/applications/:id/approve ──────────────────
// Admin approves application
// If applicant is not a user yet (public applicant), creates a user account
router.put("/admin/applications/:id/approve", adminCheck, async (req, res) => {
  try {
    const bcrypt = require("bcrypt");
    const applicationId = req.params.id;

    // Validate ID
    if (!applicationId || isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }

    const adminUser = req.session.user;

    const [[app]] = await db.query(
      "SELECT user_id, applicant_name, applicant_email, specialization, bio, experience_years, status FROM coach_applications WHERE application_id = ?",
      [applicationId]
    );
    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.status !== "pending") return res.status(400).json({ error: "Only pending applications can be approved" });

    let userId = app.user_id;
    let isNewAccount = false;

    // If no user_id, create a new user account for the applicant
    if (!userId) {
      isNewAccount = true;
      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Default values for new user
      const ageGroup = "adult";
      const fitnessGoal = "fun";
      const preferredSport = "parkour";

      const [result] = await db.query(
        "INSERT INTO users (name, email, password, age_group, fitness_goal, preferred_sport, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [app.applicant_name, app.applicant_email, hashedPassword, ageGroup, fitnessGoal, preferredSport, "coach"]
      );
      userId = result.insertId;

      // Update application with new user_id
      await db.query(
        "UPDATE coach_applications SET user_id = ? WHERE application_id = ?",
        [userId, applicationId]
      );
    } else {
      // Existing user - just update role to coach
      await db.query("UPDATE users SET role = ? WHERE user_id = ?", ["coach", userId]);
    }

    // Get user details for coaches entry
    const [[user]] = await db.query(
      "SELECT name, preferred_sport FROM users WHERE user_id = ?",
      [userId]
    );

    // Create coaches entry
    const [[existingCoach]] = await db.query(
      "SELECT coach_id FROM coaches WHERE user_id = ?",
      [userId]
    );
    if (!existingCoach) {
      await db.query(
        "INSERT INTO coaches (user_id, name, sport, specialization, experience_years, bio) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, user.name, user.preferred_sport || "parkour", app.specialization, app.experience_years, app.bio]
      );
    }

    // Update application status
    await db.query(
      "UPDATE coach_applications SET status = ?, reviewed_at = NOW(), reviewed_by = ? WHERE application_id = ?",
      ["approved", adminUser.user_id, applicationId]
    );

    let responseMessage = "Application approved";
    let setupUrl = null;

    if (isNewAccount) {
      responseMessage = "Application approved! New account created.";
      setupUrl = `/setup-password`;
    }

    res.json({ 
      success: true, 
      message: responseMessage,
      isNewAccount,
      setupUrl: isNewAccount ? setupUrl : null,
      applicantEmail: app.applicant_email,
      note: isNewAccount ? `Share this link with the applicant: ${setupUrl}` : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── PUT /api/admin/applications/:id/reject ───────────────────
// Admin rejects application
router.put("/admin/applications/:id/reject", adminCheck, async (req, res) => {
  try {
    const applicationId = req.params.id;

    // Validate ID
    if (!applicationId || isNaN(applicationId)) {
      return res.status(400).json({ error: "Invalid application ID" });
    }

    const adminUser = req.session.user;

    const [[app]] = await db.query(
      "SELECT status FROM coach_applications WHERE application_id = ?",
      [applicationId]
    );
    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.status !== "pending") return res.status(400).json({ error: "Only pending applications can be rejected" });

    await db.query(
      "UPDATE coach_applications SET status = ?, reviewed_at = NOW(), reviewed_by = ? WHERE application_id = ?",
      ["rejected", adminUser.user_id, applicationId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
