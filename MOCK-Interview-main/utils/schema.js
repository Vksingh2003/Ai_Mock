import { pgTable, serial, text, varchar, integer } from 'drizzle-orm/pg-core';

export const MockInterview = pgTable('mockInterview', {
  id: serial('id').primaryKey(),
  jsonMockResp: text('jsonMockResp').notNull(),
  jobPosition: varchar('jobPosition').notNull(),
  jobDesc: varchar('jobDesc').notNull(),
  jobExperience: varchar('jobExperience').notNull(),
  createdBy: varchar('createdBy').notNull(),
  createdAt: varchar('createdAt'),
  mockId: varchar('mockId').notNull()
});

export const UserAnswer = pgTable('userAnswer', {
  id: serial('id').primaryKey(),
  mockIdRef: varchar('mockIdRef').notNull(), // Fixed field name
  question: varchar('question').notNull(),
  correctAns: text('correctAns'),
  userAns: text('userAns'), // Fixed field name
  feedback: text('feedback'),
  rating: varchar('rating'), // Corrected type
  createdAt: varchar('createdAt'),
});

export const schema = { MockInterview, UserAnswer };

// Resume Analysis Schema


// NEW: Add Resume Analysis table
export const ResumeAnalysis = pgTable('resumeAnalysis', {
    id: serial('id').primaryKey(),
    reportId: varchar('report_id', { length: 255 }).notNull().unique(),
    userId: varchar('user_id', { length: 255 }).notNull(),
    userEmail: varchar('user_email', { length: 255 }).notNull(),
    
    // Resume data
    resumeFileName: varchar('resume_file_name', { length: 255 }),
    resumeText: text('resume_text'),
    
    // Job data
    jobTitle: varchar('job_title', { length: 255 }),
    jobDescription: text('job_description'),
    
    // Analysis results
    atsScore: integer('ats_score'),
    analysisResult: text('analysis_result'),
    
    // Metadata
    createdAt: varchar('created_at', { length: 50 }),
    updatedAt: varchar('updated_at', { length: 50 }),
});