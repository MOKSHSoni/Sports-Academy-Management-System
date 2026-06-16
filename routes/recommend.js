const express = require("express");
const router = express.Router();
const db = require("../db/connection");
const authCheck = require("../middleware/authCheck");

router.get("/", authCheck, async (req, res) => {
  const { fitness_goal, age_group, preferred_sport } = req.session.user;

  const goalSportMap = {
    agility: { parkour: 3, calisthenics: 2, rock_climbing: 1, acrobatics: 2 },
    strength: { parkour: 1, calisthenics: 3, rock_climbing: 2, acrobatics: 1 },
    flexibility: {
      parkour: 1,
      calisthenics: 2,
      rock_climbing: 1,
      acrobatics: 3,
    },
    endurance: { parkour: 2, calisthenics: 2, rock_climbing: 3, acrobatics: 1 },
    fun: { parkour: 2, calisthenics: 1, rock_climbing: 2, acrobatics: 3 },
  };

  const weights = goalSportMap[fitness_goal] || goalSportMap["fun"];
  weights[preferred_sport] = (weights[preferred_sport] || 0) + 2;

  const [programs] = await db.query(
    `
    SELECT p.*, c.name as coach_name FROM programs p
    LEFT JOIN coaches c ON p.coach_id = c.coach_id
    WHERE p.age_group = ? AND p.current_enrolled < p.max_capacity
  `,
    [age_group],
  );

  const scored = programs
    .map((p) => ({
      ...p,
      score: weights[p.sport] || 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  res.json(scored);
});

module.exports = router;
