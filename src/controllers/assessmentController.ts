import { Request, Response } from "express";
import AssessmentQuestion from "../models/QuestionAssessmentSchema.js";
import User from "../models/UserSchema.js";
// import data from "../data.js";

export const createAssessment = async (req: Request, res: Response) => {
  try {
    const { step1, step2, step3 } = req.body;
    if (!step1 || !step2 || !step3) return res.status(400).json({ error: "Please provide all the steps." });
    
    const doc = new AssessmentQuestion({ step1, step2, step3 });
    const saved = await doc.save();
    res.status(201).json({ message: "Questions saved successfully", data: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllAssessmentQuestions = async (_req: Request, res: Response) => {
  try {
    const questions = await AssessmentQuestion.find();
    res.json(questions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserData = async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    console.log('req.user:', req.user)
    // @ts-ignore
    const user = await User.findOne({ _id: req.user.userId });
    if (!user) return res.status(404).json({ error: "User not found" });
    const assessmentResults = user.assessmentResults;
    const certificate = user.certificate;
    const userData = { assessmentResults, certificate };
    res.json(userData);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getQuestionsByLevel = async (req: Request, res: Response) => {
  try {
    const { step, level } = req.params;
    if (!step || !level) return res.status(400).json({ error: "Please provide all the details." });
    const questionDoc = await AssessmentQuestion.findOne({}, `${step}.${level}`);

    if (!questionDoc) {
      return res.status(404).json({ message: "No Question Found" });
    }
    res.json((questionDoc as any)[step][level]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const submitAssessment = async (req: Request, res: Response) => {
  try {
    const { step, level, score } = req.body;
    if (!step || !level || !score) return res.status(400).json({ error: "Please provide all the details." });
    // @ts-ignore
    const user = await User.findOne({ _id: req.user.userId });
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const currentResults = user.assessmentResults || {};
    // @ts-ignore
    const currentStepResults = currentResults[step] || {};
    const currentLevelResults = currentStepResults[level] || { score: 0, isCompleted: false };
    
    const updatedResults = {
      ...currentResults,
      isStarted: true,
      [step]: {
        ...currentStepResults,
        [level]: { 
          score: score, // Replace with new score, don't accumulate
          isCompleted: true 
        }
      },
      level
    };
    // @ts-ignore
    await User.updateOne({ _id: req.user.userId }, { assessmentResults: updatedResults });
    res.status(200).json({ message: "Assessment submitted successfully" });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const certificateGeneration = async (req: Request, res: Response) => {
  try {
    const { score, status } = req.body;
    if (!score || !status) return res.status(400).json({ error: "Please provide score and status." });
    
    // @ts-ignore
    const user = await User.findOne({ _id: req.user.userId });
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const certificateId = 'TSA-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const certificateData = {
      id: certificateId,
      score: score,
      status: status,
      issueDate: new Date(),
      certificateUrl: null
    };
    
    // @ts-ignore
    await User.updateOne({ _id: req.user.userId }, { certificate: certificateData });
    res.status(200).json({ 
      message: "Certificate generated successfully",
      certificate: certificateData
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const downloadCertificate = async (req: Request, res: Response) => {
  try {
    const { certificateId } = req.params;
    
    // @ts-ignore
    const user = await User.findOne({ _id: req.user.userId });
    if (!user) return res.status(404).json({ error: "User not found" });
    
    if (!user.certificate || user.certificate.id !== certificateId) {
      return res.status(404).json({ error: "Certificate not found" });
    }
    
    // For now, return the certificate data as JSON
    // In a real implementation, you would generate a PDF or image file
    res.status(200).json({
      certificate: user.certificate,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// export const seedAssessmentData = async (_req: Request, res: Response) => {
//   try {
//     // Check if data already exists
//     const existingData = await AssessmentQuestion.findOne();
//     if (existingData) {
//       return res.status(200).json({ message: "Assessment data already exists" });
//     }

//     // Create new assessment data
//     const assessmentData = new AssessmentQuestion(data);
//     await assessmentData.save();
    
//     res.status(201).json({ message: "Assessment data seeded successfully", data: assessmentData });
//   } catch (err: any) {
//     res.status(500).json({ error: err.message });
//   }
// };
