import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { User } from "@/models";
import { connectToDatabase } from "@/lib/db";

export async function POST(req: NextRequest) {
    console.log("[Verify Email] Request received at", new Date().toISOString());

    let body;
    try {
        body = await req.json();
        console.log("[Verify Email] JSON parsed", { email: body.email, hasToken: !!body.token });
    } catch {
        console.error("[Verify Email] ✗ Invalid JSON body");
        return NextResponse.json(
            { success: false, message: "Invalid JSON body" },
            { status: 400 }
        );
    }

    const { token, email } = body;
    if (!token || !email) {
        console.error("[Verify Email] ✗ Missing token or email");
        return NextResponse.json(
            { success: false, message: "Token and email are required" },
            { status: 400 }
        );
    }

    try {
        console.log("[Verify Email] Connecting to database");
        await connectToDatabase();

        console.log("[Verify Email] Hashing token and searching for user", { email });
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            email,
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: new Date() },
        }).select("+emailVerificationToken +emailVerificationExpires");

        if (!user) {
            console.error("[Verify Email] ✗ Invalid or expired verification link:", { email });
            return NextResponse.json(
                { success: false, message: "Invalid or expired verification link" },
                { status: 400 }
            );
        }

        console.log("[Verify Email] ✓ User found with valid token, marking email as verified");

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        console.log("[Verify Email] ✓ Email verified successfully", { email });
        return NextResponse.json({ success: true, message: "Email verified successfully" });
    } catch (err) {
        console.error("[Verify Email] ✗ Error:", {
            message: err instanceof Error ? err.message : String(err),
            timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
            { success: false, message: "Verification failed" },
            { status: 500 }
        );
    }
}
