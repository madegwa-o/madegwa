import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { User } from "@/models";
import { connectToDatabase } from "@/lib/db";

export async function POST(req: NextRequest) {
    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { success: false, message: "Invalid JSON body" },
            { status: 400 }
        );
    }

    const { token, password } = body;

    if (!token || !password) {
        return NextResponse.json(
            { success: false, message: "Token and password are required" },
            { status: 400 }
        );
    }

    if (password.length < 6) {
        return NextResponse.json(
            { success: false, message: "Password must be at least 6 characters" },
            { status: 400 }
        );
    }

    try {
        await connectToDatabase();

        // Hash the token to compare with stored token
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() },
        }).select("+passwordResetToken +passwordResetExpires");

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Invalid or expired password reset link" },
                { status: 400 }
            );
        }

        // Update password
        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        return NextResponse.json(
            { success: true, message: "Password reset successfully. Please log in with your new password." },
            { status: 200 }
        );
    } catch (err) {
        console.error("Password reset error:", err);
        return NextResponse.json(
            { success: false, message: "Failed to reset password" },
            { status: 500 }
        );
    }
}
