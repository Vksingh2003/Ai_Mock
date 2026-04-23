import { sendMessage } from "@/utils/GeminiAIModal";

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    const testPrompt = prompt || "Say hello and confirm Gemini API is working";
    
    console.log('🧪 Testing Gemini API with prompt:', testPrompt);
    
    const result = await sendMessage(testPrompt);
    
    return Response.json({
      success: true,
      message: "✅ Gemini API is working correctly",
      response: result,
      model: "gemini-1.5-flash",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ AI Test Error:', error);
    return Response.json(
      {
        success: false,
        error: error.message,
        message: "❌ Gemini API test failed",
        tip: "Check your API key and quota at https://ai.google.dev/",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    message: "AI Test Endpoint",
    instructions: "Send a POST request with { prompt: 'your prompt here' }",
    example: "POST /api/test-ai with body: { prompt: 'Hello' }"
  });
}
