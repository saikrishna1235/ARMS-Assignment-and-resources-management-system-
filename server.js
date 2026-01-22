const express = require("express");
const cors = require("cors");

require("./db"); // 🔥 MySQL connection


const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const teacherRoutes = require("./routes/teacher");
const studentRoutes = require("./routes/student");
const adminEnroll = require("./routes/adminEnroll");

const app = express();

// Disable caching
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Middleware
app.use(cors({
  origin: [
    "https://arms-assignment-and-resources-manag.vercel.app",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));






app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// Routes
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/teacher", teacherRoutes);
app.use("/student", studentRoutes);
app.use("/admin/enroll", adminEnroll);
app.use("/uploads", express.static("uploads"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
