'use client';
import React, { useState } from 'react';
import { useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { Button, CircularProgress, Alert } from '@mui/material';
import { Upload, FileText, Sparkles } from 'lucide-react';
import { parseResume } from '../../../utils/resumeParser';
import { analyzeResume } from '../../../utils/atsAnalyzer';
import { db } from '../../../utils/db';
import { ResumeAnalysis } from '../../../utils/schema';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

export default function ATSCheckerPage() {
    const { user } = useUser();
    const router = useRouter();
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dragActive, setDragActive] = useState(false);

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    // Validate file
    const validateAndSetFile = (file) => {
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
            setError('Please upload only PDF or DOCX files');
            return;
        }

        if (file.size > maxSize) {
            setError('File size must be less than 5MB');
            return;
        }

        setSelectedFile(file);
        setError('');
    };

    // Handle drag and drop
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    // Handle form submission
    const handleAnalyze = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate inputs
            if (!selectedFile) {
                setError('Please upload your resume');
                setLoading(false);
                return;
            }

            if (!jobDescription.trim()) {
                setError('Please paste the job description');
                setLoading(false);
                return;
            }

            if (!jobTitle.trim()) {
                setError('Please enter the job title');
                setLoading(false);
                return;
            }

            console.log('📄 Parsing resume...');

            // Step 1: Parse resume
            const parsedResume = await parseResume(selectedFile);
            console.log('✅ Resume parsed:', parsedResume.wordCount, 'words');

            // Step 2: Analyze with ATS
            console.log('🔍 Analyzing resume...');
            const analysis = await analyzeResume(parsedResume.text, jobDescription);
            console.log('✅ Analysis complete. Score:', analysis.atsScore);

            // Step 3: Save to database
            const reportId = uuidv4();
            
            await db.insert(ResumeAnalysis).values({
                reportId: reportId,
                userId: user.id,
                userEmail: user.primaryEmailAddress.emailAddress,
                resumeFileName: parsedResume.fileName,
                resumeText: parsedResume.text.substring(0, 10000), // Store first 10k chars
                jobTitle: jobTitle,
                jobDescription: jobDescription,
                atsScore: analysis.atsScore,
                analysisResult: JSON.stringify(analysis),
                createdAt: moment().format('DD-MM-YYYY HH:mm:ss'),
                updatedAt: moment().format('DD-MM-YYYY HH:mm:ss'),
            });

            console.log('✅ Analysis saved to database');

            // Redirect to results page
            router.push(`/dashboard/resume-checker/${reportId}`);

        } catch (err) {
            console.error('❌ Error:', err);
            setError(err.message || 'Failed to analyze resume. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                    📄 ATS Resume Checker
                </h1>
                <p className="text-gray-600">
                    Upload your resume and get instant feedback on how well it matches the job description
                </p>
            </div>

            {/* Main Form */}
            <form onSubmit={handleAnalyze} className="space-y-6">
                {/* Step 1: Upload Resume */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Step 1: Upload Your Resume
                    </h2>
                    
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            dragActive 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-300 hover:border-blue-400'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        
                        {selectedFile ? (
                            <div className="text-center">
                                <p className="text-green-600 font-medium mb-2">
                                    ✅ {selectedFile.name}
                                </p>
                                <p className="text-sm text-gray-500 mb-4">
                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                </p>
                                <Button
                                    variant="outlined"
                                    onClick={() => setSelectedFile(null)}
                                >
                                    Remove
                                </Button>
                            </div>
                        ) : (
                            <>
                                <p className="text-gray-600 mb-2">
                                    Drag and drop your resume here, or
                                </p>
                                <label className="cursor-pointer">
                                    <span className="text-blue-500 hover:text-blue-600 font-medium">
                                        browse files
                                    </span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.docx"
                                        onChange={handleFileChange}
                                        disabled={loading}
                                    />
                                </label>
                                <p className="text-sm text-gray-400 mt-2">
                                    Supported formats: PDF, DOCX (Max 5MB)
                                </p>
                            </>
                        )}
                    </div>
                </div>

                {/* Step 2: Job Details */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Step 2: Job Details
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                Job Title
                            </label>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Senior Software Engineer"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                Job Description
                            </label>
                            <textarea
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[200px]"
                                placeholder="Paste the full job description here, including requirements, responsibilities, and qualifications..."
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                disabled={loading}
                                required
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                {jobDescription.length} characters
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <Alert severity="error" onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* Submit Button */}
                <div className="flex justify-center">
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading || !selectedFile || !jobDescription.trim() || !jobTitle.trim()}
                        className="px-8 py-3"
                        style={{
                            backgroundColor: loading ? '#ccc' : '#2563eb',
                            fontSize: '1.1rem',
                        }}
                    >
                        {loading ? (
                            <>
                                <CircularProgress size={20} className="mr-2" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                🎯 Analyze My Resume
                            </>
                        )}
                    </Button>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">
                        💡 What you'll get:
                    </h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                        <li>✅ ATS compatibility score (0-100)</li>
                        <li>✅ Keyword match analysis</li>
                        <li>✅ Missing keywords identification</li>
                        <li>✅ Format and structure feedback</li>
                        <li>✅ Actionable improvement suggestions</li>
                        <li>✅ AI-powered detailed analysis</li>
                    </ul>
                </div>
            </form>
        </div>
    );
}