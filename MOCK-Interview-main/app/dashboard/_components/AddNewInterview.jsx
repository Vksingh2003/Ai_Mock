'use client';
import React, { useState } from 'react';
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Button from '@mui/material/Button';
import { Input, TextareaAutosize } from '@mui/material';
import { sendMessage } from '../../../utils/GeminiAIModal';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
import { db } from '../../../utils/db';
import { MockInterview } from '../../../utils/schema';
import { useRouter } from 'next/navigation';

function AddNewInterview() {
    const [openDialog, setOpenDialog] = useState(false);
    const [jobPosition, setJobPosition] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [jobExperience, setJobExperience] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user } = useUser();

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validation
            if (!jobPosition?.trim() || !jobDescription?.trim() || !jobExperience) {
                setError('Please fill in all fields.');
                setLoading(false);
                return;
            }

            if (!user?.primaryEmailAddress?.emailAddress) {
                setError('User information not available. Please sign in again.');
                setLoading(false);
                return;
            }

            const questionsCount = process.env.NEXT_PUBLIC_INTERVIEW_QUESTIONS_COUNT || 5;
            const InputPrompt = `Job Role: ${jobPosition}, Job Description: ${jobDescription}, Years of experience: ${jobExperience}, based on the details give me ${questionsCount} interview questions and answers in JSON format. Return ONLY valid JSON array.`;

            console.log('🚀 Starting interview generation...');
            console.log('📝 Prompt:', InputPrompt);

            // Generate AI questions
            let result;
            try {
                result = await sendMessage(InputPrompt);
            } catch (aiError) {
                console.error('❌ AI Error:', aiError);
                if (aiError.message.includes('quota')) {
                    setError('AI service quota exceeded. Please try again in a few minutes.');
                } else if (aiError.message.includes('API key')) {
                    setError('API configuration error. Please contact support.');
                } else {
                    setError(aiError.message || 'Failed to generate interview questions. Please try again.');
                }
                setLoading(false);
                return;
            }

            if (!result) {
                setError('Empty response from AI. Please try again.');
                setLoading(false);
                return;
            }

            console.log('✅ AI Response received');

            // Parse JSON response
            let parsedResponse;
            try {
                // Clean response
                let cleanedResponse = result.trim();
                cleanedResponse = cleanedResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                cleanedResponse = cleanedResponse.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

                console.log('📦 Parsing response...');
                parsedResponse = JSON.parse(cleanedResponse);

                if (!Array.isArray(parsedResponse)) {
                    console.warn('⚠️ Response is not an array, wrapping it...');
                    parsedResponse = [parsedResponse];
                }

                console.log('✅ Response parsed successfully:', parsedResponse.length, 'questions');
            } catch (parseError) {
                console.error('❌ JSON Parse Error:', parseError);
                setError('Failed to parse AI response. The response format was invalid.');
                setLoading(false);
                return;
            }

            // Save to database
            try {
                const mockId = uuidv4();

                console.log('💾 Saving to database...');
                await db.insert(MockInterview).values({
                    mockId: mockId,
                    jsonMockResp: JSON.stringify(parsedResponse),
                    jobPosition: jobPosition,
                    jobDesc: jobDescription,
                    jobExperience: jobExperience,
                    createdBy: user.primaryEmailAddress.emailAddress,
                    createdAt: moment().format('DD-MM-YYYY')
                });

                console.log('✅ Interview saved successfully');
                setOpenDialog(false);
                
                // Reset form
                setJobPosition('');
                setJobDescription('');
                setJobExperience('');

                // Redirect to interview
                router.push(`/dashboard/interview/${mockId}`);
            } catch (dbError) {
                console.error('❌ Database Error:', dbError);
                if (dbError.message?.includes('relation')) {
                    setError('Database error: Tables not initialized. Please refresh the page.');
                } else {
                    setError('Failed to save interview. Please try again.');
                }
                setLoading(false);
                return;
            }
        } catch (error) {
            console.error('❌ Unexpected Error:', error);
            setError('An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className='p-4 border rounded-lg bg-blue-500 hover:bg-blue-600 cursor-pointer text-white text-center transition-all' onClick={() => setOpenDialog(true)}>
                <h2 className='text-lg font-semibold'>+ Add New</h2>
            </div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogContent className="max-w-2xl bg-gray-100 p-6 rounded-lg shadow-lg">
                    <form onSubmit={onSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold mb-4">Tell us more about your job interview</DialogTitle>
                            <DialogDescription asChild>
                                <div className='space-y-4'>
                                    <div className='my-3'>
                                        <label className="block mb-2 text-sm font-medium">Job Role/Job Position</label>
                                        <Input 
                                            placeholder='Ex. Full Stack Developer, Software Developer' 
                                            required 
                                            className="w-full p-2 border rounded" 
                                            value={jobPosition} 
                                            onChange={(event) => setJobPosition(event.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className='my-3'>
                                        <label className="block mb-2 text-sm font-medium">Job Description/Tech Stack (In Short)</label>
                                        <TextareaAutosize 
                                            placeholder='Ex. Angular, React, Node.js, MySQL etc.' 
                                            required 
                                            className="w-full p-2 border rounded font-semibold" 
                                            value={jobDescription} 
                                            onChange={(event) => setJobDescription(event.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className='my-3'>
                                        <label className="block mb-2 text-sm font-medium">Years of experience</label>
                                        <Input 
                                            placeholder='Ex. 5' 
                                            type="number" 
                                            required 
                                            className="w-full p-2 border rounded" 
                                            value={jobExperience} 
                                            onChange={(event) => setJobExperience(event.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                    {error && (
                                        <div className='p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
                                            {error}
                                        </div>
                                    )}
                                </div>
                            </DialogDescription>
                        </DialogHeader>
                        <div className='flex gap-4 justify-end mt-6'>
                            <Button 
                                type="button" 
                                variant="outlined" 
                                onClick={() => {
                                    setOpenDialog(false);
                                    setError('');
                                }}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={loading} 
                                variant="contained" 
                                color="primary"
                            >
                                {loading ? '⏳ Generating from AI...' : '🎯 Start Interview'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default AddNewInterview;