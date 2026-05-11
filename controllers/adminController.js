const bcrypt = require("bcrypt");
const db = require("../db");
// ---------- HELPERS ----------

// generate username like t.john_123 or s.jane_456
function generateUsername(role, fullName) {
    const base = fullName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const prefix = role === "teacher" ? "t." : "s.";
    const rand = Math.floor(100 + Math.random() * 900); // 100-999
    return prefix + base + rand;
}

// generate random 8-char password
function generatePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let pwd = "";
    for (let i = 0; i < 8; i++) {
        pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
}

// ---------- LIST HANDLERS ----------

exports.getTeachers = (req, res) => {
    const sql = `
        SELECT t.teacher_id,
               u.username,
               t.full_name,
               t.email,
               t.status
        FROM teachers t
        JOIN users u ON t.user_id = u.id
        ORDER BY t.teacher_id ASC
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.json({ status: "error", message: "DB error" });
        res.json(rows);
    });
};

exports.getStudents = (req, res) => {
    const sql = `
        SELECT s.student_id,
               u.username,
               s.full_name,
               s.email,
               s.status
        FROM students s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.student_id ASC
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.json({ status: "error", message: "DB error" });
        res.json(rows);
    });
};

exports.getCourses = (req, res) => {
    const sql = `
        SELECT c.course_id,
               c.course_name,
               COALESCE(t.full_name, '-') AS teacher_name,
               c.status
        FROM courses c
        LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
        ORDER BY c.course_id ASC
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.json({ status: "error", message: "DB error" });
        res.json(rows);
    });
};

// ---------- CREATE HANDLERS ----------

// 1) ADD TEACHER
exports.addTeacher = async (req, res) => {
    try {
        const { fullname, email } = req.body;
        if (!fullname || !email) {
            return res.json({ status: "fail", message: "Full name and email required" });
        }

        const username = generateUsername("teacher", fullname);
        const plainPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        // insert into users
        const userSql = "INSERT INTO users (role, username, password) VALUES ('teacher', ?, ?)";
        db.query(userSql, [username, hashedPassword], (err, userResult) => {
            if (err) {
                console.error(err);
                return res.json({ status: "error", message: "Failed to create user" });
            }
            const userId = userResult.insertId;

            const tSql = "INSERT INTO teachers (user_id, full_name, email, status) VALUES (?, ?, ?, 'active')";
            db.query(tSql, [userId, fullname, email], (err2) => {
                if (err2) {
                    console.error(err2);
                    return res.json({ status: "error", message: "Failed to create teacher" });
                }

                // return generated credentials so admin can share them
                res.json({
                    status: "success",
                    message: "Teacher created",
                    username,
                    password: plainPassword
                });
            });
        });
    } catch (e) {
        console.error(e);
        res.json({ status: "error", message: "Server error" });
    }
};

// 2) ADD STUDENT
exports.addStudent = async (req, res) => {
    try {
        const { fullname, email } = req.body;
        if (!fullname || !email) {
            return res.json({ status: "fail", message: "Full name and email required" });
        }

        const username = generateUsername("student", fullname);
        const plainPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const userSql = "INSERT INTO users (role, username, password) VALUES ('student', ?, ?)";
        db.query(userSql, [username, hashedPassword], (err, userResult) => {
            if (err) {
                console.error(err);
                return res.json({ status: "error", message: "Failed to create user" });
            }
            const userId = userResult.insertId;

            const sSql = "INSERT INTO students (user_id, full_name, email, status) VALUES (?, ?, ?, 'active')";
            db.query(sSql, [userId, fullname, email], (err2) => {
                if (err2) {
                    console.error(err2);
                    return res.json({ status: "error", message: "Failed to create student" });
                }

                res.json({
                    status: "success",
                    message: "Student created",
                    username,
                    password: plainPassword
                });
            });
        });
    } catch (e) {
        console.error(e);
        res.json({ status: "error", message: "Server error" });
    }
};

// 3) ADD COURSE
exports.addCourse = (req, res) => {
    const { name, teacher_id } = req.body;

    if (!name || !teacher_id) {
        return res.json({ status: "fail", message: "Course name and teacher required" });
    }

    const sql = "INSERT INTO courses (course_name, teacher_id, status) VALUES (?, ?, 'active')";
    db.query(sql, [name, teacher_id], (err) => {
        if (err) {
            console.error(err);
            return res.json({ status: "error", message: "Failed to create course" });
        }
        res.json({ status: "success", message: "Course created" });
    });
};
// ==========================
//         EDIT TEACHER
// ==========================
exports.editTeacher = (req, res) => {
    const { id, fullname, email } = req.body;

    const sql = "UPDATE teachers SET full_name=?, email=? WHERE teacher_id=?";
    db.query(sql, [fullname, email, id], (err) => {
        if (err) return res.json({ status: "error", message: "Error updating teacher" });
        res.json({ status: "success", message: "Teacher updated" });
    });
};

// ==========================
//         DELETE TEACHER
// ==========================
exports.deleteTeacher = (req, res) => {
    const id = req.query.id;

    db.query("DELETE FROM teachers WHERE teacher_id=?", [id], (err) => {
        if (err) return res.json({ status: "error", message: "Error deleting teacher" });
        res.json({ status: "success", message: "Teacher deleted" });
    });
};
exports.editStudent = (req, res) => {
    const { id, fullname, email } = req.body;

    const sql = "UPDATE students SET full_name=?, email=? WHERE student_id=?";
    db.query(sql, [fullname, email, id], (err) => {
        if (err) return res.json({ status: "error", message: "Error updating student" });
        res.json({ status: "success", message: "Student updated" });
    });
};
exports.deleteStudent = (req, res) => {
    const id = req.query.id;

    const sql = "DELETE FROM students WHERE student_id=?";
    db.query(sql, [id], (err) => {
        if (err) return res.json({ status: "error", message: "Error deleting student" });
        res.json({ status: "success", message: "Student deleted" });
    });
};
exports.deleteCourse = (req, res) => {
    const id = req.query.id;

    db.query("DELETE FROM courses WHERE course_id=?", [id], (err) => {
        if (err) return res.json({ status: "error", message: "Error deleting course" });
        res.json({ status: "success", message: "Course deleted" });
    });
};
// ==========================
//         EDIT COURSE
// ==========================
exports.editCourse = (req, res) => {
    const { id, name, teacher_id } = req.body;

    if (!id || !name || !teacher_id) {
        return res.json({
            status: "fail",
            message: "Missing fields"
        });
    }

    const sql = `
        UPDATE courses
        SET course_name = ?, teacher_id = ?
        WHERE course_id = ?
    `;

    db.query(sql, [name, teacher_id, id], (err) => {
        if (err) {
            console.error(err);
            return res.json({
                status: "error",
                message: "Failed to update course"
            });
        }

        return res.json({
            status: "success",
            message: "Course updated"
        });
    });
};


// ===== GET ALL STUDENTS =====
exports.getAllStudents = (req, res) => {
    const sql = `
        SELECT s.student_id,
               s.full_name,
               u.username
        FROM students s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.full_name ASC
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.json({ status: "error" });
        res.json(rows);
    });
};

// ===== GET ALL TEACHERS =====
exports.getAllTeachers = (req, res) => {
    const sql = `
        SELECT t.teacher_id, t.full_name, u.username
        FROM teachers t
        JOIN users u ON t.user_id = u.id
    `;

    db.query(sql, (err, rows) => {
        if (err) return res.json({ status: "error" });
        res.json(rows);
    });
};




// ===== GET ALL COURSES =====
exports.getAllCourses = (req, res) => {
    db.query(`SELECT course_id, course_name FROM courses`, (err, rows) => {
        if (err) return res.json({ status: "error" });
        res.json(rows);
    });
};

// ===== ENROLL STUDENT TO COURSE =====
exports.enrollStudent = (req, res) => {
    const { student_id, course_id } = req.body;

    if (!student_id || !course_id)
        return res.json({ status: "fail", message: "Missing fields" });

    const sql =
        `INSERT INTO student_courses (student_id, course_id) VALUES (?, ?)`;

    db.query(sql, [student_id, course_id], err => {
        if (err) return res.json({ status: "error", message: "Already enrolled?" });
        res.json({ status: "success", message: "Student Enrolled" });
    });
};

// ===== ASSIGN TEACHER TO COURSE =====
exports.assignTeacher = (req, res) => {
    const { teacher_id, course_id } = req.body;

    if (!teacher_id || !course_id)
        return res.json({ status: "fail", message: "Missing fields" });

    const sql =
        `UPDATE courses SET teacher_id = ? WHERE course_id = ?`;

    db.query(sql, [teacher_id, course_id], err => {
        if (err) return res.json({ status: "error" });
        res.json({ status: "success", message: "Teacher Assigned" });
    });
};
// ===========================
// CHANGE ADMIN PASSWORD
// ===========================
exports.changePassword = (req, res) => {
    const { adminId, oldPassword, newPassword } = req.body;

    // Fetch admin from USERS table
    db.query(
        "SELECT password FROM users WHERE id = ? AND role = 'admin'",
        [adminId],
        async (err, rows) => {
            // if (err) return res.status(500).json({ message: "Database error" });
            if (rows.length === 0) return res.status(404).json({ message: "Admin not found" });

            // Compare old password
            const match = await bcrypt.compare(oldPassword, rows[0].password);
            if (!match) {
                return res.status(400).json({ message: "Old password is incorrect" });
            }

            // Hash new password
            const hashed = await bcrypt.hash(newPassword, 10);

            // Update password in USERS table
            db.query(
                "UPDATE users SET password = ? WHERE id = ? AND role = 'admin'",
                [hashed, adminId],
                (err2) => {
                    if (err2) return res.status(500).json({ message: "Failed to update password" });
                    return res.json({ message: "Password updated successfully" });
                }
            );
        }
    );
};
