const db = require("../db");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");

// =========================
// Multer File Storage
// =========================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

// Accept ANY file (PDF, PPT, DOC…)
const upload = multer({ storage });

// Upload handlers (DO NOT DUPLICATE ANYWHERE ELSE)
exports.uploadMaterial = upload.single("file");
exports.uploadAssignment = upload.single("file");

// =========================
// GET PROFILE
// =========================
exports.getProfile = (req, res) => {
    const userId = req.query.userId;

    const sql = `
        SELECT u.username, t.full_name, t.email 
        FROM users u
        JOIN teachers t ON t.user_id = u.id
        WHERE u.id = ?
    `;

    db.query(sql, [userId], (err, result) => {
        if (err) return res.json({ status: "error", message: "DB error" });
        res.json(result[0] || {});
    });
};

// =========================
// GET TEACHER COURSES
// =========================
exports.getMyCourses = (req, res) => {
    const userId = req.query.userId;

    const sql = `
        SELECT c.course_id, c.course_name, c.status
        FROM courses c
        JOIN teacher_courses tc ON tc.course_id = c.course_id
        JOIN teachers t ON t.teacher_id = tc.teacher_id
        WHERE t.user_id = ?
    `;

    db.query(sql, [userId], (err, rows) => {
        if (err) return res.json({ status: "error", message: "DB error" });
        res.json(rows);
    });
};

// =========================
// ADD MATERIAL
// =========================
exports.addMaterial = (req, res) => {
    if (!req.file) {
        return res.json({ status: "fail", message: "File missing" });
    }

    const { course_id, title, file_type } = req.body;

    const sql = `
        INSERT INTO materials (course_id, title, file_type, file_path)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [course_id, title, file_type, req.file.path], (err) => {
        if (err) {
            console.error("DB ERROR:", err);
            return res.json({ status: "error", message: "Insert failed" });
        }
        res.json({ status: "success", message: "Material uploaded" });
    });
};


// =========================
// LOAD MATERIALS
// =========================
exports.getCourseMaterials = (req, res) => {
    const cid = req.params.courseId;

    db.query(
        `SELECT * FROM materials WHERE course_id = ? ORDER BY uploaded_at DESC`,
        [cid],
        (err, rows) => {
            if (err) return res.json({ status: "error" });
            res.json(rows);
        }
    );
};

// =========================
// ADD ASSIGNMENT
// =========================
exports.addAssignment = (req, res) => {
    const { course_id, title, description, due_date } = req.body;
    const filePath = req.file ? req.file.path : null;

    const sql = `
    INSERT INTO assignments (course_id, title, description, due_date, file_path, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
`;
const userId = req.body.userId;

    db.query(sql,
    [course_id, title, description, due_date, filePath, userId],
    (err) => {
        if (err) {
            console.error(err);
            return res.json({ status: "error", message: "Insert failed" });
        }
        res.json({ status: "success", message: "Assignment created" });
    }
);
};

// =========================
// LOAD ASSIGNMENTS
// =========================
exports.getCourseAssignments = (req, res) => {
    const cid = req.params.courseId;

    db.query(
        "SELECT * FROM assignments WHERE course_id = ? ORDER BY created_at DESC",
        [cid],
        (err, rows) => {
            if (err) return res.json({ status: "error" });
            res.json(rows);
        }
    );
};
const fs = require("fs");

exports.deleteMaterial = (req, res) => {
    const id = req.params.id;

    db.query("SELECT file_path FROM materials WHERE material_id = ?", [id], (err, rows) => {
        if (err || rows.length === 0)
            return res.json({ status: "error", message: "Material not found" });

        const filePath = rows[0].file_path.replace(/\\/g, "/");

        // Delete DB row
        db.query("DELETE FROM materials WHERE material_id = ?", [id], err2 => {
            if (err2) return res.json({ status: "error", message: "DB delete failed" });

            // Delete file from uploads folder
            fs.unlink(filePath, () => {});

            res.json({ status: "success", message: "Material deleted" });
        });
    });
};
// =========================
// DELETE ASSIGNMENT
// =========================
exports.deleteAssignment = (req, res) => {
    const id = req.params.id;

    // 1: Get file path
    db.query("SELECT file_path FROM assignments WHERE assignment_id = ?", [id], (err, result) => {
        if (err || result.length === 0) {
            return res.json({ status: "error", message: "Assignment not found" });
        }

        const filePath = result[0].file_path;

        // 2: Delete DB row
        db.query("DELETE FROM assignments WHERE assignment_id = ?", [id], (err2) => {
            if (err2) {
                return res.json({ status: "error", message: "DB delete failed" });
            }

            // 3: Delete file
            if (filePath) {
                fs.unlink(filePath, (err3) => {
                    console.log(err3 ? "File delete failed" : "File deleted");
                });
            }

            res.json({ status: "success", message: "Assignment deleted" });
        });
    });
};






















// ====================== ENROLLMENTS ======================

// List all students for dropdown
exports.getStudentsList = (req, res) => {
    const sql = `
        SELECT s.student_id, s.full_name, s.email, u.username
        FROM students s
        JOIN users u ON u.id = s.user_id
        ORDER BY s.full_name
    `;

    db.query(sql, (err, rows) => {
        if (err) return res.json({ status: "error" });
        res.json(rows);
    });
};


// Load enrolled students (teacher can only see their own course)
exports.getCourseEnrollments = (req, res) => {
    const courseId = req.params.courseId;
    const userId   = req.query.userId;

    const sql = `
        SELECT sc.id, sc.course_id, s.full_name, s.email
        FROM student_courses sc
        JOIN students s ON s.student_id = sc.student_id
        JOIN courses c ON c.course_id = sc.course_id
        JOIN teachers t ON t.teacher_id = c.teacher_id
        WHERE sc.course_id = ? AND t.user_id = ?
    `;

    db.query(sql, [courseId, userId], (err, rows) => {
        if (err) return res.json({ status: "error" });
        res.json(rows);
    });
};

// Enroll a student
exports.enrollStudent = (req, res) => {
    const { userId, course_id, student_id } = req.body;

    const sqlCheck = `
        SELECT c.course_id FROM courses c
        JOIN teachers t ON t.teacher_id = c.teacher_id
        WHERE c.course_id = ? AND t.user_id = ?
    `;

    db.query(sqlCheck, [course_id, userId], (err, rows) => {
        if (err || rows.length === 0)
            return res.json({ status: "fail", message: "Unauthorized" });

        const sqlAdd = `
            INSERT INTO student_courses (course_id, student_id)
            VALUES (?, ?)
        `;

        db.query(sqlAdd, [course_id, student_id], (err2) => {
            if (err2)
                return res.json({ status: "fail", message: "Already enrolled" });

            res.json({ status: "success", message: "Student enrolled" });
        });
    });
};

// Remove enrollment
exports.deleteEnrollment = (req, res) => {
    const id = req.params.id;
    const userId = req.query.userId;

    const sql = `
        SELECT sc.course_id FROM student_courses sc
        JOIN courses c ON c.course_id = sc.course_id
        JOIN teachers t ON t.teacher_id = c.teacher_id
        WHERE sc.id = ? AND t.user_id = ?
    `;

    db.query(sql, [id, userId], (err, rows) => {
        if (err || rows.length === 0)
            return res.json({ status: "fail", message: "Unauthorized" });

        db.query("DELETE FROM student_courses WHERE id = ?", [id], () => {
            res.json({ status: "success", message: "Enrollment removed" });
        });
    });
};



exports.getSubmissions = (req, res) => {
    const assignmentId = req.params.assignmentId;
    const userId = req.query.userId;

    const sql = `
        SELECT 
            sub.submission_id,
            sub.file_path AS submission_file,
            sub.submitted_at,
            sub.marks,
            st.full_name,
            st.email
        FROM submissions sub
        JOIN students st ON st.student_id = sub.student_id
        JOIN assignments a ON a.assignment_id = sub.assignment_id
        JOIN teachers t ON t.user_id = a.created_by   -- FIXED
        WHERE sub.assignment_id = ? AND t.user_id = ?
        ORDER BY sub.submitted_at DESC
    `;

    db.query(sql, [assignmentId, userId], (err, rows) => {
        if (err) return res.json({ status: "error", message: "DB error" });
        res.json(rows);
    });
};


exports.updateMarks = (req, res) => {
    const { submission_id, marks } = req.body;

    if (!submission_id) {
        return res.json({ status: "error", message: "Missing submission_id" });
    }

    const sql = `UPDATE submissions SET marks = ? WHERE submission_id = ?`;

    db.query(sql, [marks, submission_id], (err) => {
        if (err) return res.json({ status: "error", message: "Update failed" });
        res.json({ status: "success", message: "Marks updated" });
    });
};


function saveMarks(submissionId, marks) {
    fetch(`${API_BASE}/teacher/submissions/update-marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId, marks })
    })
    .then(r => r.json())
    .then(res => {
        showToast(res.message || "Marks updated");
    });
}


exports.changePassword = (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;

    const sql = `SELECT password FROM users WHERE id = ?`;

    db.query(sql, [userId], async (err, rows) => {
        if (err || rows.length === 0)
            return res.json({ status: "error", message: "User not found" });

        const valid = await bcrypt.compare(oldPassword, rows[0].password);
        if (!valid)
            return res.json({ status: "fail", message: "Old password incorrect" });

        const hashed = await bcrypt.hash(newPassword, 10);

        db.query(`UPDATE users SET password = ? WHERE id = ?`, [hashed, userId], (err2) => {
            if (err2) return res.json({ status: "error", message: "Update failed" });

            res.json({ status: "success", message: "Password updated successfully" });
        });
    });
};
