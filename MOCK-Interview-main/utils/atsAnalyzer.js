// utils/atsAnalyzer.js
import { sendMessage } from './GeminiAIModal';

/**
 * Main ATS Analysis function
 * @param {string} resumeText - Extracted resume text
 * @param {string} jobDescription - Target job description
 * @returns {Promise<Object>} - Analysis results
 */
export async function analyzeResume(resumeText, jobDescription) {
    try {
        console.log('🔍 Starting ATS analysis...');
        
        // Step 1: Basic keyword analysis (fast, no AI)
        const basicAnalysis = performBasicAnalysis(resumeText, jobDescription);
        
        // Step 2: AI-powered deep analysis
        const aiAnalysis = await performAIAnalysis(resumeText, jobDescription);
        
        // Step 3: Combine results
        const finalScore = calculateFinalScore(basicAnalysis, aiAnalysis);
        
        return {
            atsScore: finalScore,
            basicAnalysis,
            aiAnalysis,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        console.error('❌ ATS Analysis Error:', error);
        throw new Error(`Analysis failed: ${error.message}`);
    }
}

/**
 * Perform basic keyword and format analysis
 * @param {string} resumeText - Resume text
 * @param {string} jobDescription - Job description
 * @returns {Object} - Basic analysis results
 */
export function performBasicAnalysis(resumeText, jobDescription) {
    const analysis = {
        keywordScore: 0,
        formatScore: 0,
        sectionScore: 0,
        keywordsFound: [],
        keywordsMissing: [],
        formatIssues: [],
        sections: {},
    };
    
    // 1. Extract keywords from job description
    const jobKeywords = extractKeywords(jobDescription);
    
    // 2. Check which keywords are in resume
    const resumeLower = resumeText.toLowerCase();
    jobKeywords.forEach(keyword => {
        if (resumeLower.includes(keyword.toLowerCase())) {
            analysis.keywordsFound.push(keyword);
        } else {
            analysis.keywordsMissing.push(keyword);
        }
    });
    
    // 3. Calculate keyword score
    const totalKeywords = jobKeywords.length;
    const foundKeywords = analysis.keywordsFound.length;
    analysis.keywordScore = totalKeywords > 0 
        ? Math.round((foundKeywords / totalKeywords) * 100) 
        : 0;
    
    // 4. Check format quality
    analysis.formatScore = checkFormatQuality(resumeText);
    analysis.formatIssues = getFormatIssues(resumeText);
    
    // 5. Check sections
    analysis.sections = checkSections(resumeText);
    analysis.sectionScore = calculateSectionScore(analysis.sections);
    
    return analysis;
}

/**
 * Perform AI-powered deep analysis using Gemini
 * @param {string} resumeText - Resume text
 * @param {string} jobDescription - Job description
 * @returns {Promise<Object>} - AI analysis results
 */
export async function performAIAnalysis(resumeText, jobDescription) {
    const prompt = `
You are an expert ATS (Applicant Tracking System) and resume reviewer. Analyze this resume against the job description and provide detailed feedback.

RESUME:
${resumeText.substring(0, 4000)} ${resumeText.length > 4000 ? '...(truncated)' : ''}

JOB DESCRIPTION:
${jobDescription.substring(0, 2000)} ${jobDescription.length > 2000 ? '...(truncated)' : ''}

Provide analysis in JSON format with this exact structure:
{
  "overallScore": 75,
  "experienceMatch": 80,
  "skillsMatch": 70,
  "educationMatch": 85,
  "strengths": [
    "Clear quantified achievements",
    "Strong technical skills alignment",
    "Well-structured experience section"
  ],
  "weaknesses": [
    "Missing key technologies from job description",
    "Limited leadership experience",
    "Generic summary statement"
  ],
  "improvements": [
    {
      "section": "Skills",
      "issue": "Missing Docker, Kubernetes mentioned in job description",
      "suggestion": "Add these technologies if you have experience with them",
      "priority": "high"
    },
    {
      "section": "Experience",
      "issue": "Some bullet points lack quantifiable metrics",
      "suggestion": "Add numbers: '% improvement', 'X users', 'Y systems'",
      "priority": "medium"
    }
  ],
  "missingKeywords": ["Docker", "Kubernetes", "CI/CD", "Microservices"],
  "additionalTips": [
    "Use action verbs: Led, Implemented, Optimized, Designed",
    "Tailor your summary to match the job description",
    "Remove or minimize irrelevant experience"
  ]
}

IMPORTANT: Return ONLY valid JSON, no other text.
`;

    try {
        const response = await sendMessage(prompt);
        
        // Clean and parse JSON response
        let cleanedResponse = response.trim();
        cleanedResponse = cleanedResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const aiAnalysis = JSON.parse(cleanedResponse);
        
        console.log('✅ AI analysis completed');
        return aiAnalysis;
    } catch (error) {
        console.error('❌ AI analysis failed:', error);
        
        // Return fallback analysis if AI fails
        return {
            overallScore: 60,
            experienceMatch: 60,
            skillsMatch: 60,
            educationMatch: 60,
            strengths: ['Resume uploaded successfully'],
            weaknesses: ['AI analysis unavailable - showing basic analysis only'],
            improvements: [],
            missingKeywords: [],
            additionalTips: ['Consider reviewing your resume manually'],
        };
    }
}

/**
 * Extract important keywords from job description
 * @param {string} jobDescription - Job description text
 * @returns {Array<string>} - List of keywords
 */
export function extractKeywords(jobDescription) {
    if (!jobDescription) return [];
    
    const text = jobDescription.toLowerCase();
    
    // Technical skills and tools (common in tech jobs)
    const techKeywords = [
        'react', 'angular', 'vue', 'node.js', 'python', 'java', 'javascript',
        'typescript', 'c++', 'c#', 'ruby', 'php', 'go', 'swift', 'kotlin',
        'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind',
        'mongodb', 'mysql', 'postgresql', 'redis', 'dynamodb', 'sql',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins',
        'git', 'github', 'gitlab', 'ci/cd', 'agile', 'scrum',
        'rest api', 'graphql', 'microservices', 'serverless',
        'machine learning', 'ai', 'data science', 'tensorflow', 'pytorch'
    ];
    
    // Soft skills
    const softKeywords = [
        'leadership', 'communication', 'teamwork', 'problem solving',
        'critical thinking', 'collaboration', 'management'
    ];
    
    // Find all matching keywords
    const foundKeywords = [];
    
    [...techKeywords, ...softKeywords].forEach(keyword => {
        if (text.includes(keyword)) {
            foundKeywords.push(keyword);
        }
    });
    
    // Also extract custom keywords (words that appear multiple times)
    const words = text.match(/\b[a-z]{3,}\b/g) || [];
    const wordFrequency = {};
    
    words.forEach(word => {
        if (word.length > 3 && !['the', 'and', 'for', 'with', 'this', 'that'].includes(word)) {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
    });
    
    // Add words that appear 3+ times
    Object.keys(wordFrequency).forEach(word => {
        if (wordFrequency[word] >= 3 && !foundKeywords.includes(word)) {
            foundKeywords.push(word);
        }
    });
    
    return [...new Set(foundKeywords)].slice(0, 30); // Top 30 keywords
}

/**
 * Check format quality of resume
 * @param {string} resumeText - Resume text
 * @returns {number} - Format score (0-100)
 */
export function checkFormatQuality(resumeText) {
    let score = 100;
    
    // Deduct points for common format issues
    if (resumeText.includes('\t')) score -= 5; // Tabs
    if (resumeText.split('\n').length < 10) score -= 10; // Too few lines
    if (resumeText.length < 500) score -= 20; // Too short
    if (resumeText.length > 10000) score -= 5; // Too long
    
    // Check for good formatting indicators
    if (/\b(•|●|■|\*|-)\b/.test(resumeText)) score += 5; // Bullet points
    if (/\b\d{4}\b/.test(resumeText)) score += 5; // Years (dates)
    
    return Math.max(0, Math.min(100, score));
}

/**
 * Get list of format issues
 * @param {string} resumeText - Resume text
 * @returns {Array<string>} - Format issues
 */
export function getFormatIssues(resumeText) {
    const issues = [];
    
    if (resumeText.includes('\t')) {
        issues.push('Contains tabs - use spaces for better ATS compatibility');
    }
    
    if (resumeText.length < 500) {
        issues.push('Resume is too short - aim for at least 500 words');
    }
    
    if (resumeText.length > 10000) {
        issues.push('Resume is too long - keep it under 2 pages (10,000 characters)');
    }
    
    if (!/\b\d{4}\b/.test(resumeText)) {
        issues.push('No dates found - include employment dates');
    }
    
    if (!/\b(•|●|■|\*|-)\b/.test(resumeText)) {
        issues.push('No bullet points detected - use bullets for readability');
    }
    
    return issues;
}

/**
 * Check which sections are present
 * @param {string} resumeText - Resume text
 * @returns {Object} - Sections present
 */
export function checkSections(resumeText) {
    const text = resumeText.toLowerCase();
    
    return {
        hasExperience: /\b(experience|work history|employment)\b/.test(text),
        hasEducation: /\b(education|academic|qualifications)\b/.test(text),
        hasSkills: /\b(skills|technical skills|competencies)\b/.test(text),
        hasSummary: /\b(summary|objective|profile)\b/.test(text),
        hasContact: /\b(@|email|phone|linkedin)\b/.test(text),
    };
}

/**
 * Calculate section score
 * @param {Object} sections - Sections object
 * @returns {number} - Section score (0-100)
 */
export function calculateSectionScore(sections) {
    const totalSections = Object.keys(sections).length;
    const presentSections = Object.values(sections).filter(Boolean).length;
    
    return Math.round((presentSections / totalSections) * 100);
}

/**
 * Calculate final ATS score
 * @param {Object} basicAnalysis - Basic analysis results
 * @param {Object} aiAnalysis - AI analysis results
 * @returns {number} - Final score (0-100)
 */
export function calculateFinalScore(basicAnalysis, aiAnalysis) {
    // Weighted average:
    // - Keyword match: 35%
    // - AI overall score: 30%
    // - Format quality: 20%
    // - Section quality: 15%
    
    const keywordWeight = 0.35;
    const aiWeight = 0.30;
    const formatWeight = 0.20;
    const sectionWeight = 0.15;
    
    const score = 
        (basicAnalysis.keywordScore * keywordWeight) +
        (aiAnalysis.overallScore * aiWeight) +
        (basicAnalysis.formatScore * formatWeight) +
        (basicAnalysis.sectionScore * sectionWeight);
    
    return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Generate improvement suggestions based on score
 * @param {number} score - ATS score
 * @param {Object} analysis - Full analysis object
 * @returns {Array<string>} - Priority improvements
 */
export function generatePriorityImprovements(score, analysis) {
    const improvements = [];
    
    if (score < 50) {
        improvements.push('🚨 Critical: Your resume needs significant improvement');
        improvements.push('Focus on adding relevant keywords from the job description');
        improvements.push('Ensure all standard sections are present');
    } else if (score < 70) {
        improvements.push('⚠️ Needs work: Your resume has room for improvement');
        improvements.push('Add more relevant keywords');
        improvements.push('Improve formatting and structure');
    } else if (score < 85) {
        improvements.push('✅ Good: Your resume is competitive');
        improvements.push('Polish weak areas for best results');
    } else {
        improvements.push('🎉 Excellent: Your resume is well-optimized!');
        improvements.push('Minor tweaks can make it even better');
    }
    
    return improvements;
}