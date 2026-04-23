"use client";
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { desc, eq } from "drizzle-orm";
import InterviewItemCard from "./interviewItemCard";
import { Skeleton } from "@mui/material";

const InterviewList = () => {
  const { user } = useUser();
  const [interviewList, setInterviewList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      GetInterviewList();
    }
  }, [user]);

  const GetInterviewList = async () => {
    setLoading(true);
    setError('');
    try {
      if (!user?.primaryEmailAddress?.emailAddress) {
        setError('User email not available. Please sign in again.');
        setLoading(false);
        return;
      }

      console.log('📝 Fetching interviews for user:', user.primaryEmailAddress.emailAddress);

      const result = await db
        .select()
        .from(MockInterview)
        .where(eq(MockInterview.createdBy, user.primaryEmailAddress.emailAddress))
        .orderBy(desc(MockInterview.id));

      console.log('✅ Interviews fetched:', result.length);
      setInterviewList(result);
    } catch (err) {
      console.error('❌ Error fetching interviews:', err);
      
      if (err.message?.includes('relation') || err.message?.includes('mockInterview')) {
        setError('Database error: Interview table not found. Please refresh the page or contact support.');
      } else if (err.message?.includes('connection') || err.message?.includes('ECONNREFUSED')) {
        setError('Database connection error. Please check your internet connection.');
      } else {
        setError('Failed to load interviews. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-semibold text-xl text-gray-800">Previous Interviews</h2>
        <button 
          onClick={GetInterviewList}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        >
          {loading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className='p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded'>
          <p className='font-semibold'>⚠️ Error</p>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : interviewList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {interviewList.map((interview, index) => (
            <InterviewItemCard key={interview.id || index} interview={interview} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-600 text-lg font-semibold mb-2">📚 No interviews found</p>
          <p className="text-gray-500">Create your first interview to get started!</p>
        </div>
      )}
    </div>
  );
};

export default InterviewList;