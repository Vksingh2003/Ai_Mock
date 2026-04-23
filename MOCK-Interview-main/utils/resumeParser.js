// utils/resumeParser.js
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extract text from PDF file
 * @param {File} file - PDF file
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const pdfParse = new PDFParse();
        const data = await pdfParse.parse(buffer);
        
        if (!data.text || data.text.trim().length === 0) {
            throw new Error('PDF appears to be empty or scanned (no text found)');
        }
        
        return data.text;
    } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error(`Failed to parse PDF: ${error.message}`);
    }
}

/**
 * Extract text from DOCX file
 * @param {File} file - DOCX file
 * @returns {Promise<string>} - Extracted text
 */
export async function extractTextFromDOCX(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        
        if (!result.value || result.value.trim().length === 0) {
            throw new Error('DOCX appears to be empty');
        }
        
        return result.value;
    } catch (error) {
        console.error('DOCX parsing error:', error);
        throw new Error(`Failed to parse DOCX: ${error.message}`);
    }
}

/**
 * Main function to extract text from resume
 * @param {File} file - Resume file (PDF or DOCX)
 * @returns {Promise<Object>} - { text, fileName, fileType }
 */
export async function parseResume(file) {
    // Validate file
    if (!file) {
        throw new Error('No file provided');
    }
    
    const fileName = file.name;
    const fileType = file.type;
    const fileSize = file.size;
    
    // Check file size (5MB limit)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (fileSize > MAX_SIZE) {
        throw new Error('File size exceeds 5MB limit');
    }
    
    // Check file type and extract text
    let extractedText = '';
    
    if (fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) {
        extractedText = await extractTextFromPDF(file);
    } else if (
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.toLowerCase().endsWith('.docx')
    ) {
        extractedText = await extractTextFromDOCX(file);
    } else {
        throw new Error('Unsupported file type. Please upload PDF or DOCX only.');
    }
    
    // Basic validation
    if (extractedText.length < 100) {
        throw new Error('Resume seems too short. Please ensure it contains complete information.');
    }
    
    return {
        text: extractedText,
        fileName: fileName,
        fileType: fileType,
        fileSize: fileSize,
        wordCount: extractedText.split(/\s+/).length,
    };
}

/**
 * Clean and normalize resume text
 * @param {string} text - Raw resume text
 * @returns {string} - Cleaned text
 */
export function cleanResumeText(text) {
    if (!text) return '';
    
    return text
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        // Remove special characters that might confuse ATS
        .replace(/[^\w\s\.\,\;\:\-\(\)\[\]\/\@\+\#\&]/g, '')
        // Normalize line breaks
        .replace(/\n+/g, '\n')
        .trim();
}

/**
 * Extract email from resume text
 * @param {string} text - Resume text
 * @returns {string|null} - Email or null
 */
export function extractEmail(text) {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = text.match(emailRegex);
    return matches ? matches[0] : null;
}

/**
 * Extract phone number from resume text
 * @param {string} text - Resume text
 * @returns {string|null} - Phone number or null
 */
export function extractPhone(text) {
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const matches = text.match(phoneRegex);
    return matches ? matches[0] : null;
}

/**
 * Extract sections from resume
 * @param {string} text - Resume text
 * @returns {Object} - Sections found
 */
export function extractSections(text) {
    const sections = {
        hasExperience: false,
        hasEducation: false,
        hasSkills: false,
        hasSummary: false,
    };
    
    const lowerText = text.toLowerCase();
    
    // Check for common section headers
    sections.hasExperience = /\b(experience|work history|employment|professional experience)\b/i.test(lowerText);
    sections.hasEducation = /\b(education|academic|qualifications|degrees)\b/i.test(lowerText);
    sections.hasSkills = /\b(skills|technical skills|competencies|expertise)\b/i.test(lowerText);
    sections.hasSummary = /\b(summary|objective|profile|about me)\b/i.test(lowerText);
    
    return sections;
}

/**
 * Detect file type from buffer (fallback)
 * @param {ArrayBuffer} arrayBuffer - File buffer
 * @returns {string} - File type
 */
export function detectFileType(arrayBuffer) {
    const arr = new Uint8Array(arrayBuffer).subarray(0, 4);
    let header = '';
    
    for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16);
    }
    
    // PDF signature
    if (header.startsWith('25504446')) {
        return 'application/pdf';
    }
    
    // DOCX signature (ZIP format)
    if (header.startsWith('504b0304')) {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
    
    return 'unknown';
}