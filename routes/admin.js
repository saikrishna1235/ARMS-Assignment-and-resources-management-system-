const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// ===== LISTS =====
router.get("/teachers", adminController.getTeachers);
router.get("/students", adminController.getStudents);
router.get("/courses", adminController.getCourses);

// ===== CREATE =====
router.post("/add-teacher", adminController.addTeacher);
router.post("/add-student", adminController.addStudent);
router.post("/add-course", adminController.addCourse);

// ===== UPDATE =====
router.put("/edit-teacher", adminController.editTeacher);
router.put("/edit-student", adminController.editStudent);
router.put("/edit-course", adminController.editCourse);

// ===== DELETE =====
router.delete("/delete-teacher", adminController.deleteTeacher);
router.delete("/delete-student", adminController.deleteStudent);
router.delete("/delete-course", adminController.deleteCourse);

// ===== ENROLLMENT ROUTES =====

// Get all students
router.get("/enroll/students", adminController.getAllStudents);

// Get all teachers
router.get("/enroll/teachers", adminController.getAllTeachers);

// Get all courses
router.get("/enroll/courses", adminController.getAllCourses);

// Enroll student
router.post("/enroll/student", adminController.enrollStudent);

// Assign teacher
router.post("/enroll/teacher", adminController.assignTeacher);
router.post("/change-password", adminController.changePassword);
module.exports = router;
