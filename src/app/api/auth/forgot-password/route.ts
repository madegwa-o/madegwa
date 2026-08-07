import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { User } from "@/models";
import { connectToDatabase } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email/sendPasswordResetEmail";

export async function POST(req: NextRequest) {
    console.log("[Forgot Password] Request received at", new Date().toISOString());

    let body;
    try {
        body = await req.json();
        console.log("[Forgot Password] JSON parsed", { identifier: body.identifier ? "provided" : "missing" });
    } catch {
        console.error("[Forgot Password] ✗ Invalid JSON body");
        return NextResponse.json(
            { success: false, message: "Invalid JSON body" },
            { status: 400 }
        );
    }

    const { identifier } = body; // Can be email or username

    if (!identifier) {
        console.error("[Forgot Password] ✗ Missing identifier");
        return NextResponse.json(
            { success: false, message: "Email or username is required" },
            { status: 400 }
        );
    }

    try {
        console.log("[Forgot Password] Connecting to database");
        await connectToDatabase();

        // Find user by email or username
        console.log("[Forgot Password] Searching for user", { identifier });
        const user = await User.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { username: identifier.toLowerCase() }
            ]
        });

        if (!user) {
            // Don't reveal if user exists or not for security
            console.log("[Forgot Password] User not found (secure response):", { identifier });
            return NextResponse.json(
                { success: true, message: "If an account exists with that email or username, a password reset link has been sent." },
                { status: 200 }
            );
        }

        console.log("[Forgot Password] User found, generating reset token", { email: user.email });

        // Generate password reset token
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

        // Save token and expiration to user
        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours
        await user.save();
        console.log("[Forgot Password] ✓ Reset token saved to database");

        // Send password reset email
        console.log("[Forgot Password] Sending password reset email");
        await sendPasswordResetEmail(user.email, rawToken);
        console.log("[Forgot Password] ✓ Password reset email sent");

        return NextResponse.json(
            { success: true, message: "If an account exists with that email or username, a password reset link has been sent." },
            { status: 200 }
        );
    } catch (err) {
        console.error("[Forgot Password] ✗ Error:", {
            message: err instanceof Error ? err.message : String(err),
            timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
            { success: false, message: "Failed to process password reset request" },
            { status: 500 }
        );
    }
}
