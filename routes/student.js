// backend/routes/student.js
const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");

// profile + courses
router.get("/profile", studentController.getProfile);
router.get("/courses", studentController.getMyCourses);

// materials & assignments
router.get("/course/:courseId/materials", studentController.getCourseMaterials);
router.get("/course/:courseId/assignments", studentController.getCourseAssignments);

// submit / delete submissions
router.post("/assignments/:assignmentId/submit",
    studentController.uploadSubmission,
    studentController.submitAssignment
);

router.delete("/submissions/:id", studentController.deleteSubmission);
router.post("/change-password", studentController.changePassword);

// marks
router.get("/marks", studentController.getMarks);
router.post(
    "/submit",
    studentController.uploadSubmission,
    studentController.submitAssignment
);

module.exports = router;
