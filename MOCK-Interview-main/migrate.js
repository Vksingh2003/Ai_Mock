require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function migrate() {
  try {
    const connectionString = process.env.NEXT_PUBLIC_DRIZZLE_DB_URL;
    console.log('Connecting to database...');
    
    const sql = neon(connectionString);
    
    // Check if tables exist
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('mockInterview', 'userAnswer', 'resumeAnalysis')
    `;
    
    console.log('Existing tables:', result);
    
    if (result.length < 3) {
      console.log('Creating tables...');
      
      // Create mockInterview table
      await sql`
        CREATE TABLE IF NOT EXISTS "mockInterview" (
          "id" serial PRIMARY KEY NOT NULL,
          "jsonMockResp" text NOT NULL,
          "jobPosition" varchar NOT NULL,
          "jobDesc" varchar NOT NULL,
          "jobExperience" varchar NOT NULL,
          "createdBy" varchar NOT NULL,
          "createdAt" varchar,
          "mockId" varchar NOT NULL
        )
      `;
      
      // Create userAnswer table
      await sql`
        CREATE TABLE IF NOT EXISTS "userAnswer" (
          "id" serial PRIMARY KEY NOT NULL,
          "mockIdRef" varchar NOT NULL,
          "question" varchar NOT NULL,
          "correctAns" text,
          "userAns" text,
          "feedback" text,
          "rating" varchar,
          "createdAt" varchar
        )
      `;

      // Create resumeAnalysis table
      await sql`
        CREATE TABLE IF NOT EXISTS "resumeAnalysis" (
          "id" serial PRIMARY KEY NOT NULL,
          "report_id" varchar(255) NOT NULL UNIQUE,
          "user_id" varchar(255) NOT NULL,
          "user_email" varchar(255) NOT NULL,
          "resume_file_name" varchar(255),
          "resume_text" text,
          "job_title" varchar(255),
          "job_description" text,
          "ats_score" integer,
          "analysis_result" text,
          "created_at" varchar(50),
          "updated_at" varchar(50)
        )
      `;
      
      console.log('✅ Tables created successfully!');
    } else {
      console.log('✅ Tables already exist!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

migrate();
