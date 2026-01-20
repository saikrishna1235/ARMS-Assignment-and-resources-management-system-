const db = require("../db");

exports.getStudents = (req, res) => {
    db.query(`
        SELECT s.student_id, u.username, s.full_name 
        FROM students s 
        JOIN users u ON u.id=s.user_id
    `, (err, rows)=> res.json(rows || []));
};

exports.getTeachers = (req, res) => {
    db.query(`
        SELECT t.teacher_id, u.username, t.full_name 
        FROM teachers t 
        JOIN users u ON u.id=t.user_id
    `, (err, rows)=> res.json(rows || []));
};

exports.getCourses = (req, res) => {
    db.query(`SELECT course_id, course_name FROM courses`, 
        (err, rows)=> res.json(rows || []));
};

exports.enrollStudent = (req, res) => {
    const { student_id, course_id } = req.body;

    db.query(`
        INSERT INTO student_courses(student_id, course_id)
        VALUES (?, ?)
    `, [student_id, course_id], err => {
        if (err) return res.json({ status: "error", message: "Already enrolled" });
        res.json({ status: "success", message: "Student enrolled" });
    });
};

exports.enrollTeacher = (req, res) => {
    const { teacher_id, course_id } = req.body;

    db.query(`
        INSERT INTO teacher_courses(teacher_id, course_id)
        VALUES (?, ?)
    `, [teacher_id, course_id], err => {
        if (err) return res.json({ status: "error", message: "Already assigned" });
        res.json({ status: "success", message: "Teacher assigned" });
    });
};
