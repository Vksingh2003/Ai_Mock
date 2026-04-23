'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, CircularProgress, LinearProgress } from '@mui/material';
import { ArrowLeft, Download, RefreshCw, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { db } from '../../../../utils/db';
import { ResumeAnalysis } from '../../../../utils/schema';
import { eq } from 'drizzle-orm';

export default function ATSReportPage({ params: paramsPromise }) {
    const params = React.use(paramsPromise);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (params?.reportId) {
            loadReport();
        }
    }, [params?.reportId]);

    const loadReport = async () => {
        try {
            setLoading(true);
            
            // Fetch report from database
            const results = await db
                .select()
                .from(ResumeAnalysis)
                .where(eq(ResumeAnalysis.reportId, params.reportId))
                .limit(1);

            if (results.length === 0) {
                setError('Report not found');
                return;
            }

            const reportData = results[0];
            
            // Parse analysis result
            const analysis = JSON.parse(reportData.analysisResult);
            
            setReport({
                ...reportData,
                analysis,
            });
        } catch (err) {
            console.error('Error loading report:', err);
            setError('Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreIcon = (score) => {
        if (score >= 80) return <CheckCircle className="w-8 h-8 text-green-600" />;
        if (score >= 60) return <AlertCircle className="w-8 h-8 text-yellow-600" />;
        return <XCircle className="w-8 h-8 text-red-600" />;
    };

    const getScoreLabel = (score) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Needs Work';
        return 'Poor';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <CircularProgress />
            </div>
        );
    }

    if (error || !report) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <p className="text-red-600 mb-4">{error || 'Report not found'}</p>
                    <Button
                        variant="contained"
                        onClick={() => router.push('/dashboard/resume-checker')}
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const { analysis, atsScore } = report;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <Button
                    startIcon={<ArrowLeft />}
                    onClick={() => router.push('/dashboard/resume-checker')}
                >
                    Back to Checker
                </Button>
                
                <div className="flex gap-2">
                    <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => window.print()}
                    >
                        Download Report
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<RefreshCw />}
                        onClick={() => router.push('/dashboard/resume-checker')}
                    >
                        Analyze Another
                    </Button>
                </div>
            </div>

            {/* Main Score Card */}
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white mb-6 shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">ATS Analysis Report</h1>
                        <p className="text-blue-100">
                            {report.jobTitle} • {report.resumeFileName}
                        </p>
                    </div>
                    <div className="text-center bg-white bg-opacity-20 rounded-xl p-6">
                        <div className="text-6xl font-bold">{atsScore}</div>
                        <div className="text-sm uppercase tracking-wide mt-1">
                            {getScoreLabel(atsScore)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <ScoreCard
                    title="Keyword Match"
                    score={analysis.basicAnalysis?.keywordScore || 0}
                />
                <ScoreCard
                    title="AI Overall"
                    score={analysis.aiAnalysis?.overallScore || 0}
                />
                <ScoreCard
                    title="Format Quality"
                    score={analysis.basicAnalysis?.formatScore || 0}
                />
                <ScoreCard
                    title="Sections"
                    score={analysis.basicAnalysis?.sectionScore || 0}
                />
            </div>

            {/* Keywords Analysis */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">🔑 Keyword Analysis</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Keywords Found ({analysis.basicAnalysis?.keywordsFound?.length || 0})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {analysis.basicAnalysis?.keywordsFound?.map((keyword, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                            <XCircle className="w-5 h-5" />
                            Missing Keywords ({analysis.basicAnalysis?.keywordsMissing?.length || 0})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {analysis.basicAnalysis?.keywordsMissing?.slice(0, 15).map((keyword, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                                >
                                    {keyword}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Strengths and Weaknesses */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4 text-green-600">💪 Strengths</h2>
                    <ul className="space-y-2">
                        {analysis.aiAnalysis?.strengths?.map((strength, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">{strength}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold mb-4 text-orange-600">⚠️ Weaknesses</h2>
                    <ul className="space-y-2">
                        {analysis.aiAnalysis?.weaknesses?.map((weakness, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">{weakness}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Improvements */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4">💡 Recommended Improvements</h2>
                <div className="space-y-4">
                    {analysis.aiAnalysis?.improvements?.map((improvement, idx) => (
                        <div
                            key={idx}
                            className="border-l-4 border-blue-500 pl-4 py-2"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-gray-800">
                                    {improvement.section}
                                </span>
                                <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                        improvement.priority === 'high'
                                            ? 'bg-red-100 text-red-700'
                                            : improvement.priority === 'medium'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-green-100 text-green-700'
                                    }`}
                                >
                                    {improvement.priority} priority
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-1">{improvement.issue}</p>
                            <p className="text-gray-800">{improvement.suggestion}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Additional Tips */}
            {analysis.aiAnalysis?.additionalTips && (
                <div className="bg-blue-50 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4 text-blue-800">📝 Additional Tips</h2>
                    <ul className="space-y-2">
                        {analysis.aiAnalysis.additionalTips.map((tip, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-blue-700">
                                <span className="text-blue-500">•</span>
                                <span>{tip}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// Score Card Component
function ScoreCard({ title, score }) {
    const getColor = (score) => {
        if (score >= 80) return 'bg-green-100 text-green-800';
        if (score >= 60) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-sm text-gray-600 mb-2">{title}</div>
            <div className={`text-3xl font-bold ${getColor(score).split(' ')[1]}`}>
                {score}
            </div>
            <LinearProgress
                variant="determinate"
                value={score}
                className="mt-2"
                sx={{
                    backgroundColor: '#e5e7eb',
                    '& .MuiLinearProgress-bar': {
                        backgroundColor: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444',
                    },
                }}
            />
        </div>
    );
}