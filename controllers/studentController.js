// backend/controllers/studentController.js
const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
// ==== Multer storage (same uploads/ as teacher) ====
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// single file
exports.uploadSubmission = upload.single("file");

// ===== PROFILE =====
exports.getProfile = (req, res) => {
    const userId = req.query.userId;

    const sql = `
        SELECT u.username, s.full_name, s.email
        FROM users u
        JOIN students s ON s.user_id = u.id
        WHERE u.id = ?
    `;

    db.query(sql, [userId], (err, rows) => {
        if (err) return res.json({ status: "error", message: "DB error" });
        res.json(rows[0] || {});
    });
};

// ===== COURSES (enrolled) =====
// assumes enrollment table student_courses(student_id, course_id)
exports.getMyCourses = (req, res) => {
    const userId = req.query.userId;

    const sql = `
        SELECT c.course_id, c.course_name, c.status
        FROM courses c
        JOIN student_courses sc ON sc.course_id = c.course_id
        JOIN students s ON s.student_id = sc.student_id
        WHERE s.user_id = ?
    `;

    db.query(sql, [userId], (err, rows) => {
        if (err) return res.json({ status: "error", message: "DB error" });
        res.json(rows);
    });
};

// ===== MATERIALS =====
exports.getCourseMaterials = (req, res) => {
    const cid = req.params.courseId;

    const sql = `
        SELECT material_id, course_id, title, file_type, file_path, uploaded_at
        FROM materials
        WHERE course_id = ?
        ORDER BY uploaded_at DESC
    `;

    db.query(sql, [cid], (err, rows) => {
        if (err) return res.json({ status: "error", message: "DB error" });
        res.json(rows);
    });
};

// ===== ASSIGNMENTS + student submission info =====
exports.getCourseAssignments = (req, res) => {
    const cid       = req.params.courseId;
    const studentId = req.query.studentId;

    const sql = `
        SELECT 
            a.assignment_id,
            a.course_id,
            a.title,
            a.description,
            a.due_date,
            a.created_at,
            a.file_path,
            sub.submission_id,
            sub.file_path AS submission_file_path,
            sub.submitted_at,
            sub.marks
        FROM assignments a
        LEFT JOIN students s 
            ON s.user_id = ?
        LEFT JOIN submissions sub
            ON sub.assignment_id = a.assignment_id
           AND sub.student_id = s.student_id
        WHERE a.course_id = ?
        ORDER BY a.created_at DESC
    `;

    db.query(sql, [studentId, cid], (err, rows) => {
        if (err) {
            console.error(err);
            return res.json({ status: "error", message: "DB error" });
        }
        res.json(rows);
    });
};

// ===== SUBMIT ASSIGNMENT =====
exports.submitAssignment = (req, res) => {
    if (!req.file) {
        return res.json({ status: "fail", message: "File missing" });
    }

    const assignmentId = req.params.assignmentId;
    const { student_id } = req.body;

    const sqlGetStudent = `SELECT student_id FROM students WHERE user_id = ?`;
    db.query(sqlGetStudent, [student_id], (err, rows) => {
        if (err || rows.length === 0) {
            return res.json({ status: "error", message: "Student not found" });
        }
        const sid = rows[0].student_id;

        // If already submitted, delete old row + file then insert new
        const sqlOld = `SELECT submission_id, file_path FROM submissions 
                        WHERE assignment_id = ? AND student_id = ?`;

        db.query(sqlOld, [assignmentId, sid], (err2, oldRows) => {
            if (err2) {
                console.error(err2);
                return res.json({ status: "error", message: "DB error" });
            }

            const insertNew = () => {
                const sqlIns = `
                    INSERT INTO submissions (assignment_id, student_id, file_path)
                    VALUES (?, ?, ?)
                `;
                db.query(sqlIns, [assignmentId, sid, req.file.path], err3 => {
                    if (err3) {
                        console.error(err3);
                        return res.json({ status: "error", message: "Insert failed" });
                    }
                    res.json({ status: "success", message: "Submission uploaded" });
                });
            };

            if (oldRows.length > 0) {
                const oldPath = oldRows[0].file_path;
                const delSql  = `DELETE FROM submissions WHERE submission_id = ?`;
                db.query(delSql, [oldRows[0].submission_id], err4 => {
                    if (err4) {
                        console.error(err4);
                        return res.json({ status: "error", message: "Old delete failed" });
                    }
                    if (oldPath) {
                        fs.unlink(oldPath, () => {});
                    }
                    insertNew();
                });
            } else {
                insertNew();
            }
        });
    });
};

// ===== DELETE SUBMISSION =====
exports.deleteSubmission = (req, res) => {
    const id = req.params.id;

    const sql = `SELECT file_path FROM submissions WHERE submission_id = ?`;
    db.query(sql, [id], (err, rows) => {
        if (err || rows.length === 0) {
            return res.json({ status: "error", message: "Submission not found" });
        }

        const filePath = rows[0].file_path;

        db.query(`DELETE FROM submissions WHERE submission_id = ?`, [id], err2 => {
            if (err2) {
                return res.json({ status: "error", message: "DB delete failed" });
            }

            if (filePath) {
                fs.unlink(filePath, () => {});
            }

            res.json({ status: "success", message: "Submission deleted" });
        });
    });
};

// ===== MARKS =====
exports.getMarks = (req, res) => {
    const studentUserId = req.query.studentId;

    const sql = `
        SELECT 
            c.course_name,
            a.title AS assignment_title,
            s.marks,
            s.submitted_at
        FROM submissions s
        JOIN assignments a ON a.assignment_id = s.assignment_id
        JOIN courses c ON c.course_id = a.course_id
        JOIN students st ON st.student_id = s.student_id
        WHERE st.user_id = ?
        ORDER BY c.course_name, a.created_at
    `;

    db.query(sql, [studentUserId], (err, rows) => {
        if (err) {
            console.error(err);
            return res.json({ status: "error", message: "DB error" });
        }
        res.json(rows);
    });
};
exports.submitAssignment = (req, res) => {
    const { student_id, assignment_id } = req.body;
    const filePath = req.file ? req.file.path : null;

    const sql = `
        INSERT INTO submissions (student_id, assignment_id, file_path)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [student_id, assignment_id, filePath], err => {
        if (err) {
            console.error(err);
            return res.json({ status: "error", message: "Submit failed" });
        }
        res.json({ status: "success", message: "Assignment submitted" });
    });
};
exports.changePassword = (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;

    const getUser = `SELECT password FROM users WHERE id = ?`;

    db.query(getUser, [userId], async (err, rows) => {
        if (err || rows.length === 0)
            return res.json({ status: "error", message: "User not found" });

        const match = await bcrypt.compare(oldPassword, rows[0].password);
        if (!match)
            return res.json({ status: "fail", message: "Old password incorrect" });

        const hashed = await bcrypt.hash(newPassword, 10);

        db.query(`UPDATE users SET password=? WHERE id=?`, [hashed, userId], () => {
            res.json({ status: "success", message: "Password updated successfully" });
        });
    });
};