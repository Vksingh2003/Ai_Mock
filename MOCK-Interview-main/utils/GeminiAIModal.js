import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not defined in environment variables');
}

if (!apiKey.startsWith('AIza')) {
    console.warn('⚠️ Warning: API key format may be incorrect. Google API keys typically start with "AIza"');
}

const genAI = new GoogleGenerativeAI(apiKey);

// Use gemini-2.5-flash - latest stable model with excellent performance
// Available in 2026: gemini-2.5-flash, gemini-2.5-pro, gemini-2-flash
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
});

const generationConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

// Helper function to delay execution with exponential backoff
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to validate API key format
const validateApiKey = (key) => {
    if (!key || typeof key !== 'string' || key.trim().length === 0) {
        throw new Error('Invalid API key: API key is empty or not a string');
    }
    return true;
};

const sendMessage = async (input, retries = MAX_RETRIES) => {
    try {
        console.log('🤖 Sending message to Gemini (gemini-2.5-flash)...');
        
        // Validate API key
        validateApiKey(apiKey);

        // Validate input
        if (!input || typeof input !== 'string' || input.trim().length === 0) {
            throw new Error('Invalid input: Input message is empty or not a string');
        }

        console.log('📤 Request details: Model=gemini-2.5-flash, Input length=' + input.length);
        const result = await model.generateContent(input);
        
        if (!result || !result.response) {
            throw new Error('No response from Gemini API');
        }

        const responseText = result.response.text();
        
        if (!responseText) {
            throw new Error('Empty response from Gemini API');
        }

        console.log('✅ Response received successfully');
        return responseText;

    } catch (error) {
        console.error('❌ Error:', error.message);

        // Handle specific error types
        if (error.message?.includes('API key') || error.message?.includes('permission denied')) {
            throw new Error('🔑 API key error: Please check your NEXT_PUBLIC_GEMINI_API_KEY in .env.local');
        }

        if (error.message?.includes('404') || error.message?.includes('not found') || error.message?.includes('MODEL_NOT_FOUND')) {
            throw new Error('❌ Model gemini-2.5-flash not available: This is the latest Gemini model (2026). If you see this error, please verify your API key has access. Visit https://ai.google.dev to enable the model.');
        }

        if (error.message?.includes('quota') || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
            if (retries > 0) {
                const waitTime = (MAX_RETRIES - retries + 1) * RETRY_DELAY;
                console.log(`⏳ Quota exceeded. Retrying in ${waitTime}ms... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
                await delay(waitTime);
                return sendMessage(input, retries - 1);
            }
            throw new Error('⚠️ API quota exceeded: Please wait a few minutes and try again.');
        }

        if (error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('ECONNREFUSED') || error.message?.includes('Failed to fetch')) {
            if (retries > 0) {
                const waitTime = (MAX_RETRIES - retries + 1) * RETRY_DELAY;
                console.log(`🌐 Network error. Retrying in ${waitTime}ms... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
                await delay(waitTime);
                return sendMessage(input, retries - 1);
            }
            throw new Error('🌐 Network error: Please check your internet connection.');
        }

        if (error.message?.includes('403') || error.message?.includes('permission')) {
            throw new Error('🚫 API access denied: Please verify your API key has the correct permissions.');
        }

        // Re-throw with original message
        throw error;
    }
};

export { sendMessage };