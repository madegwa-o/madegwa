import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { User } from "@/models";
import { connectToDatabase } from "@/lib/db";
import { registerSchema } from "@/lib/validations/user";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail";

export async function POST(req: NextRequest) {
    console.log("[Register] Request received at", new Date().toISOString());

    // ✅ Fix 1: handle malformed JSON explicitly
    let body;
    try {
        body = await req.json();
        console.log("[Register] JSON parsed", { email: body.email || "N/A" });
    } catch {
        console.error("[Register] ✗ Invalid JSON body");
        return NextResponse.json(
            { success: false, message: "Invalid JSON body" },
            { status: 400 }
        );
    }

    try {
        console.log("[Register] Validating input schema");
        const parsed = registerSchema.safeParse(body);
        if (!parsed.success) {
            const firstIssue = parsed.error.issues[0];
            console.error("[Register] ✗ Validation failed:", firstIssue.message);
            return NextResponse.json(
                { success: false, message: firstIssue.message },
                { status: 400 }
            );
        }

        console.log("[Register] Connecting to database");
        await connectToDatabase();

        // ✅ Fix 3: generate a verification token before creating the user
        console.log("[Register] Generating verification token");
        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

        console.log("[Register] Creating user in database", { email: parsed.data.email });
        const user = await User.create({
            ...parsed.data,
            emailVerified: false,
            emailVerificationToken: hashedToken,
            emailVerificationExpires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
        });
        console.log("[Register] ✓ User created:", { userId: user._id, email: user.email });

        // Send the raw (unhashed) token in the email link — never the hashed one
        console.log("[Register] Sending verification email");
        await sendVerificationEmail(user.email, rawToken);
        console.log("[Register] ✓ Verification email sent");

        // ✅ Fix 2: strip sensitive/internal fields explicitly at the response boundary
        const safeUser = user.toObject();
        delete safeUser.password;
        delete safeUser.emailVerificationToken;
        delete safeUser.emailVerificationExpires;

        console.log("[Register] ✓ Registration successful", { email: user.email });
        return NextResponse.json(
            {
                success: true,
                message: "Registered successfully. Please check your email to verify your account.",
                user: safeUser,
            },
            { status: 201 }
        );
    } catch (err: any) {
        if (err.name === "ValidationError") {
            const firstError = Object.values(err.errors)[0] as any;
            console.error("[Register] ✗ Validation error:", firstError.message);
            return NextResponse.json(
                { success: false, message: firstError.message },
                { status: 400 }
            );
        }

        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            console.error("[Register] ✗ Duplicate field:", field);
            return NextResponse.json(
                { success: false, message: `${field} is already taken` },
                { status: 409 }
            );
        }

        console.error("[Register] ✗ Unexpected error:", {
            message: err.message,
            code: err.code,
            name: err.name,
            timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
            { success: false, message: "Registration failed" },
            { status: 500 }
        );
    }
}
