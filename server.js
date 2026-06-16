const express = require("express");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  }),
);

// Serve HTML files
app.use("/", require("./routes/pages"));

// API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/programs", require("./routes/programs"));
app.use("/api/coaches", require("./routes/coaches"));
app.use("/api/coaches", require("./routes/coaches-api"));
app.use("/api/schedule", require("./routes/schedule"));
app.use("/api/events", require("./routes/events"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/applications", require("./routes/applications"));
app.use("/api/recommend", require("./routes/recommend"));
app.use("/api/forum", require("./routes/forum"));

// Ensure API failures always return JSON, not HTML error pages.
app.use((err, req, res, next) => {
  console.error(err);
  if (req.originalUrl.startsWith("/api/")) {
    return res.status(500).json({
      error: "Internal server error",
      message: err.message || "Unknown error",
    });
  }
  return next(err);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Athletica running on http://localhost:${PORT}`),
);
