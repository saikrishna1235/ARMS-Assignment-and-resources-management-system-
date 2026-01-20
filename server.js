const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const teacherRoutes = require("./routes/teacher");
const studentRoutes = require("./routes/student");
const adminEnroll = require("./routes/adminEnroll");
const multer = require("multer");

const app = express();
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});

app.use(cors());
app.use(express.json());    
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/teacher", teacherRoutes);
app.use('/uploads', express.static('uploads'));
app.use("/student", studentRoutes);
app.use("/admin/enroll", adminEnroll);

app.listen(5000, () => {
    console.log("Backend running on http://localhost:5000");
});
