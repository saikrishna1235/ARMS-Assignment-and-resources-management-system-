const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/adminEnrollController");

router.get("/students", ctrl.getStudents);
router.get("/teachers", ctrl.getTeachers);
router.get("/courses", ctrl.getCourses);

router.post("/enroll-student", ctrl.enrollStudent);
router.post("/enroll-teacher", ctrl.enrollTeacher);

module.exports = router;
