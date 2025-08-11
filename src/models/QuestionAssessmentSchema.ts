import mongoose, { Document, Schema } from "mongoose";

interface IOption {
  text: string;
  isCorrect: boolean;
}

interface IQuestion {
  statement: string;
  options: IOption[];
}

export interface IAssessmentQuestion extends Document {
  step1: { A1: IQuestion[]; A2: IQuestion[] };
  step2: { B1: IQuestion[]; B2: IQuestion[] };
  step3: { C1: IQuestion[]; C2: IQuestion[] };
}

const optionSchema = new Schema<IOption>({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false }
});

const questionSchema = new Schema<IQuestion>({
  statement: { type: String, required: true },
  options: { type: [optionSchema], required: true }
});

const assessmentSchema = new Schema<IAssessmentQuestion>(
  {
    step1: {
      A1: { type: [questionSchema], default: [] },
      A2: { type: [questionSchema], default: [] }
    },
    step2: {
      B1: { type: [questionSchema], default: [] },
      B2: { type: [questionSchema], default: [] }
    },
    step3: {
      C1: { type: [questionSchema], default: [] },
      C2: { type: [questionSchema], default: [] }
    }
  },
  { timestamps: true }
);

export default mongoose.model<IAssessmentQuestion>(
  "AssessmentQuestion",
  assessmentSchema
);
