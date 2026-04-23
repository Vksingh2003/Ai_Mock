import { currentUser } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const user = await currentUser();
    
    if (!user) {
      return Response.json(
        { error: "Not authenticated", success: false },
        { status: 401 }
      );
    }
    
    return Response.json({
      success: true,
      message: "Authentication working correctly",
      user: {
        id: user.id,
        email: user.emailAddresses?.[0]?.emailAddress || "No email",
        firstName: user.firstName,
        lastName: user.lastName,
      }
    });
  } catch (error) {
    return Response.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}
