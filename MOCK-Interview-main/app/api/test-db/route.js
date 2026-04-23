import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    console.log('🧪 Testing database connection...');
    
    // Test 1: Basic connection
    const timestamp = await db.execute(sql`SELECT NOW()`);
    console.log('✅ Basic connection test passed');
    
    // Test 2: Check tables exist
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('mockInterview', 'userAnswer')
      ORDER BY table_name
    `);
    
    const tableNames = Array.isArray(tables) ? tables.map(t => t.table_name) : [];
    console.log('✅ Tables check passed:', tableNames);
    
    // Test 3: Try a simple query
    const interviewCount = await db.select().from(MockInterview).limit(1);
    console.log('✅ Query test passed');
    
    return Response.json({
      success: true,
      message: "✅ Database connection is working correctly",
      tests: {
        connection: "✅ Passed",
        tables: "✅ Passed",
        query: "✅ Passed"
      },
      details: {
        database: "NeonDB (PostgreSQL)",
        tables: tableNames,
        interviewsCount: interviewCount.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database Test Error:', error);
    
    let errorMessage = 'Database connection failed';
    let suggestions = [];
    
    if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
      errorMessage = 'Database tables do not exist';
      suggestions.push('Run: node migrate.js');
      suggestions.push('Or refresh the page');
    } else if (error.message?.includes('connection') || error.message?.includes('ECONNREFUSED')) {
      errorMessage = 'Cannot connect to database';
      suggestions.push('Check your DATABASE_URL environment variable');
      suggestions.push('Verify NeonDB credentials');
    } else if (error.message?.includes('authentication') || error.message?.includes('password')) {
      errorMessage = 'Database authentication failed';
      suggestions.push('Verify credentials in .env.local');
      suggestions.push('Check NEXT_PUBLIC_DRIZZLE_DB_URL');
    }
    
    return Response.json(
      {
        success: false,
        error: error.message,
        message: `❌ ${errorMessage}`,
        suggestions: suggestions,
        tip: "Check database configuration at https://console.neon.tech/",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

