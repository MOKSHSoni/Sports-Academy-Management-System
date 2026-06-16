const express = require("express");
const router = express.Router();
const path = require("path");
const authCheck = require("../middleware/authCheck");

const send = (file) => (req, res) =>
  res.sendFile(path.join(__dirname, "../views", file));

router.get("/", send("index.html"));
router.get("/about", send("about.html"));
router.get("/programs", send("programs.html"));
router.get("/programs/:id", send("program-detail.html"));
router.get("/coaches", send("coaches.html"));
router.get("/schedule", send("schedule.html"));
router.get("/events", send("events.html"));
router.get("/contact", send("contact.html"));
router.get("/login", send("login.html"));
router.get("/register", send("register.html"));
router.get("/apply-for-coach", send("apply-for-coach.html"));
router.get("/setup-password", send("setup-password.html"));
router.get("/student/dashboard", authCheck, send("student-dashboard.html"));
router.get("/student/bookings", authCheck, send("student-bookings.html"));
router.get("/student/payment", authCheck, send("payment.html"));
router.get("/coach/dashboard", authCheck, send("coach-dashboard.html"));
router.get("/admin", authCheck, send("admin-dashboard.html"));
router.get("/admin/programs", authCheck, send("admin-programs.html"));
router.get("/admin/students", authCheck, send("admin-students.html"));
router.get("/admin/users", authCheck, send("admin-users.html"));
router.get("/admin/applications", authCheck, send("admin-applications.html"));
router.get("/forum", send("forum.html"));

module.exports = router;
