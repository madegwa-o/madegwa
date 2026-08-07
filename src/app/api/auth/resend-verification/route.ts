import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { User } from "@/models";
import { connectToDatabase } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail";

export async function POST(req: NextRequest) {
    console.log("[Resend Verification] Request received at", new Date().toISOString());

    let body;
    try {
        body = await req.json();
        console.log("[Resend Verification] JSON parsed", { email: body.email ? "provided" : "missing" });
    } catch {
        console.error("[Resend Verification] ✗ Invalid JSON body");
        return NextResponse.json(
            { success: false, message: "Invalid JSON body" },
            { status: 400 }
        );
    }

    const { email } = body;

    if (!email) {
        console.error("[Resend Verification] ✗ Missing email");
        return NextResponse.json(
            { success: false, message: "Email is required" },
            { status: 400 }
        );
    }

    try {
        console.log("[Resend Verification] Connecting to database");
        await connectToDatabase();

        console.log("[Resend Verification] Searching for user", { email });
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.error("[Resend Verification] ✗ User not found:", { email });
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        if (user.emailVerified) {
            console.log("[Resend Verification] Email already verified:", { email });
            return NextResponse.json(
                { success: false, message: "Email is already verified" },
                { status: 400 }
            );
        }

        console.log("[Resend Verification] Generating new verification token", { email });

        // Generate new verification token
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
        await user.save();
        console.log("[Resend Verification] ✓ Token saved to database");

        // Send verification email
        console.log("[Resend Verification] Sending verification email");
        await sendVerificationEmail(user.email, rawToken);
        console.log("[Resend Verification] ✓ Verification email sent");

        return NextResponse.json({
            success: true,
            message: "Verification email sent successfully",
        });
    } catch (err: any) {
        console.error("[Resend Verification] ✗ Error:", {
            message: err.message,
            timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
            { success: false, message: "Failed to resend verification email" },
            { status: 500 }
        );
    }
}
