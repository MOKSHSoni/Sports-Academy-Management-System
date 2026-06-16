const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const authCheck = require("../middleware/authCheck");

// ── Helper: safe user label ──────────────────────────────────
function userLabel(name, role) {
  if (role === "coach") return `${name} (Coach)`;
  if (role === "admin") return `${name} (Admin)`;
  return `${name} (Student)`;
}

// ── GET /api/forum/posts?tab=all|announcements ───────────────
router.get("/posts", async (req, res) => {
  try {
    const tab = req.query.tab === "announcements" ? true : null;
    let sql = `
      SELECT fp.post_id, fp.title, fp.body, fp.is_announcement, fp.created_at,
             u.user_id, u.name, u.role,
             (SELECT COUNT(*) FROM forum_comments fc WHERE fc.post_id = fp.post_id) AS comment_count
      FROM forum_posts fp
      JOIN users u ON fp.user_id = u.user_id
    `;
    const params = [];
    if (tab === true) {
      sql += " WHERE fp.is_announcement = TRUE";
    }
    sql += " ORDER BY fp.is_announcement DESC, fp.created_at DESC";
    const [rows] = await db.query(sql, params);
    res.json(
      rows.map((r) => ({
        ...r,
        author_label: userLabel(r.name, r.role),
        is_announcement: !!r.is_announcement,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /api/forum/posts/:id ─────────────────────────────────
router.get("/posts/:id", async (req, res) => {
  try {
    const [[post]] = await db.query(
      `SELECT fp.post_id, fp.title, fp.body, fp.is_announcement, fp.created_at,
              u.user_id, u.name, u.role
       FROM forum_posts fp
       JOIN users u ON fp.user_id = u.user_id
       WHERE fp.post_id = ?`,
      [req.params.id]
    );
    if (!post) return res.status(404).json({ error: "Post not found" });

    const [comments] = await db.query(
      `SELECT fc.comment_id, fc.body, fc.created_at,
              u.user_id, u.name, u.role
       FROM forum_comments fc
       JOIN users u ON fc.user_id = u.user_id
       WHERE fc.post_id = ?
       ORDER BY fc.created_at ASC`,
      [req.params.id]
    );

    res.json({
      ...post,
      is_announcement: !!post.is_announcement,
      author_label: userLabel(post.name, post.role),
      comments: comments.map((c) => ({
        ...c,
        author_label: userLabel(c.name, c.role),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/forum/posts ────────────────────────────────────
router.post("/posts", authCheck, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body)
      return res.status(400).json({ error: "Title and body required" });

    // Only coaches/admins may mark as announcement
    const user = req.session.user;
    const isAnnouncement =
      req.body.is_announcement &&
      (user.role === "coach" || user.role === "admin")
        ? 1
        : 0;

    const [result] = await db.query(
      "INSERT INTO forum_posts (user_id, title, body, is_announcement) VALUES (?,?,?,?)",
      [user.user_id, title, body, isAnnouncement]
    );
    res.json({ success: true, post_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── DELETE /api/forum/posts/:id ──────────────────────────────
router.delete("/posts/:id", authCheck, async (req, res) => {
  try {
    const user = req.session.user;
    const [[post]] = await db.query(
      "SELECT user_id FROM forum_posts WHERE post_id = ?",
      [req.params.id]
    );
    if (!post) return res.status(404).json({ error: "Post not found" });
    // Only author or admin can delete
    if (post.user_id !== user.user_id && user.role !== "admin")
      return res.status(403).json({ error: "Not allowed" });

    await db.query("DELETE FROM forum_posts WHERE post_id = ?", [
      req.params.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── POST /api/forum/posts/:id/comments ──────────────────────
router.post("/posts/:id/comments", authCheck, async (req, res) => {
  try {
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: "Comment body required" });

    const user = req.session.user;
    const [[post]] = await db.query(
      "SELECT post_id FROM forum_posts WHERE post_id = ?",
      [req.params.id]
    );
    if (!post) return res.status(404).json({ error: "Post not found" });

    const [result] = await db.query(
      "INSERT INTO forum_comments (post_id, user_id, body) VALUES (?,?,?)",
      [req.params.id, user.user_id, body]
    );
    res.json({ success: true, comment_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── DELETE /api/forum/posts/:id/comments/:cid ───────────────
router.delete("/posts/:id/comments/:cid", authCheck, async (req, res) => {
  try {
    const user = req.session.user;
    const [[comment]] = await db.query(
      "SELECT user_id FROM forum_comments WHERE comment_id = ?",
      [req.params.cid]
    );
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (comment.user_id !== user.user_id && user.role !== "admin")
      return res.status(403).json({ error: "Not allowed" });

    await db.query("DELETE FROM forum_comments WHERE comment_id = ?", [
      req.params.cid,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
