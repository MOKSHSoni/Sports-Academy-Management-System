const express = require("express");
const router = express.Router();
const db = require("../db/connection");

router.get("/", async (req, res) => {
  const [rows] = await db.query(`
    SELECT s.*, p.name as program_name, p.sport, c.name as coach_name
    FROM schedule s
    JOIN programs p ON s.program_id = p.program_id
    JOIN coaches c ON s.coach_id = c.coach_id
    ORDER BY FIELD(s.day_of_week,'Mon','Tue','Wed','Thu','Fri','Sat','Sun'), s.start_time
  `);
  res.json(rows);
});

module.exports = router;
