const bcrypt = require("bcrypt");
const db = require("../db");

exports.login = (req, res) => {
    const { role, username, password } = req.body;

    const sql = "SELECT * FROM users WHERE username = ? AND role = ?";
    db.query(sql, [username, role], async (err, result) => {
        if (err) {
            return res.json({ status: "error", message: "Database error" });
        }

        if (result.length === 0) {
            return res.json({ status: "fail", message: "Invalid username or role" });
        }

        const user = result[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.json({ status: "fail", message: "Wrong password" });
        }

        // ⭐ If student, fetch student_id from students table
        if (user.role === "student") {
            const sqlStudent = "SELECT student_id FROM students WHERE user_id = ?";
            db.query(sqlStudent, [user.id], (err2, rows2) => {
                if (err2) {
                    return res.json({ status: "error", message: "Database error" });
                }

                const studentId = rows2.length > 0 ? rows2[0].student_id : null;

                return res.json({
                    status: "success",
                    role: user.role,
                    userId: user.id,
                    studentId: studentId      // 👈 NOW WE SEND THIS
                });
            });
        } else {
            // teacher / admin
            return res.json({
                status: "success",
                role: user.role,
                userId: user.id
            });
        }
    });
};
