import { Router } from "express";
import { certificateGeneration, createAssessment, getAllAssessmentQuestions, getUserData, submitAssessment, downloadCertificate } from "../controllers/assessmentController.js";
// import { seedAssessmentData } from "../controllers/assessmentController.js";

const router = Router();

router.post("/", createAssessment);
router.get("/", getAllAssessmentQuestions);
router.get("/user-data", getUserData);
router.post("/submit", submitAssessment);
router.post("/certificate", certificateGeneration);
router.get("/certificate/:certificateId", downloadCertificate);
// router.post("/seed", seedAssessmentData);

export default router;
