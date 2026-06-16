const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const adminCheck = require("../middleware/adminCheck");
const { validateEnum } = require("../utils/validation");

router.get("/stats", adminCheck, async (req, res) => {
  try {
    const [[{ students }]] = await db.query(
      'SELECT COUNT(*) as students FROM users WHERE role="student"',
    );
    const [[{ programs }]] = await db.query(
      "SELECT COUNT(*) as programs FROM programs",
    );
    const [[{ events }]] = await db.query(
      "SELECT COUNT(*) as events FROM events",
    );
    const [[{ pending_trials }]] = await db.query(
      'SELECT COUNT(*) as pending_trials FROM trial_bookings WHERE status="pending"',
    );
    const [[{ unread_msgs }]] = await db.query(
      "SELECT COUNT(*) as unread_msgs FROM contact_messages WHERE is_read=0",
    );
    res.json({ students, programs, events, pending_trials, unread_msgs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// All non-admin users (students + coaches) for admin management
router.get("/users", adminCheck, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT user_id, name, email, role, age_group, fitness_goal, preferred_sport, created_at FROM users WHERE role != 'admin' ORDER BY created_at DESC",
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Legacy: kept for backwards compat with existing admin-students page
router.get("/students", adminCheck, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id, name, email, age_group, fitness_goal, preferred_sport, created_at FROM users WHERE role="student"',
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/trials", adminCheck, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM trial_bookings ORDER BY created_at DESC",
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/trials/:id", adminCheck, async (req, res) => {
  try {
    const { status } = req.body;
    const trialId = req.params.id;

    // Validate ID
    if (!trialId || isNaN(trialId)) {
      return res.status(400).json({ error: "Invalid trial ID" });
    }

    // Validate status
    const validStatuses = ["pending", "approved", "rejected", "completed"];
    const validation = validateEnum(status, validStatuses);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    await db.query("UPDATE trial_bookings SET status=? WHERE booking_id=?", [
      status,
      trialId,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/messages", adminCheck, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM contact_messages ORDER BY submitted_at DESC",
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/messages/:id/read", adminCheck, async (req, res) => {
  try {
    const messageId = req.params.id;

    // Validate ID
    if (!messageId || isNaN(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    // Verify message exists before updating
    const [[msg]] = await db.query("SELECT message_id FROM contact_messages WHERE message_id=?", [messageId]);
    if (!msg) {
      return res.status(404).json({ error: "Message not found" });
    }

    await db.query("UPDATE contact_messages SET is_read=1 WHERE message_id=?", [
      messageId,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/messages/:id", adminCheck, async (req, res) => {
  try {
    const messageId = req.params.id;

    // Validate ID
    if (!messageId || isNaN(messageId)) {
      return res.status(400).json({ error: "Invalid message ID" });
    }

    // Verify message exists before deleting
    const [[msg]] = await db.query("SELECT message_id FROM contact_messages WHERE message_id=?", [messageId]);
    if (!msg) {
      return res.status(404).json({ error: "Message not found" });
    }

    await db.query("DELETE FROM contact_messages WHERE message_id=?", [
      messageId,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete user
router.delete("/users/:id", adminCheck, async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate ID
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    // Prevent deleting self
    if (userId == req.session.user.user_id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Verify user exists and is not admin before deleting
    const [[user]] = await db.query("SELECT user_id, role FROM users WHERE user_id=?", [userId]);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ error: "Cannot delete admin accounts" });
    }
    
    // Delete user (cascade will handle related records)
    await db.query("DELETE FROM users WHERE user_id = ? AND role != 'admin'", [userId]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
