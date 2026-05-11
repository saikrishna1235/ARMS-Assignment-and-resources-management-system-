const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacherController");

router.get("/profile", teacherController.getProfile);
router.get("/courses", teacherController.getMyCourses);
router.get("/course/:courseId/materials", teacherController.getCourseMaterials);
router.get("/course/:courseId/assignments", teacherController.getCourseAssignments);

router.delete("/materials/:id", teacherController.deleteMaterial);
router.delete("/assignments/:id", teacherController.deleteAssignment);

router.post("/materials", teacherController.uploadMaterial, teacherController.addMaterial);
router.post("/assignments", teacherController.uploadAssignment, teacherController.addAssignment);

// ====== ENROLLMENTS ======
router.get("/students", teacherController.getStudentsList);
router.get("/course/:courseId/enrollments", teacherController.getCourseEnrollments);
router.post("/enroll", teacherController.enrollStudent);
router.delete("/enrollments/:id", teacherController.deleteEnrollment);
router.post("/submissions/update-marks", teacherController.updateMarks);
router.get("/submissions/:assignmentId", teacherController.getSubmissions);
router.post("/change-password", teacherController.changePassword);

module.exports = router;
