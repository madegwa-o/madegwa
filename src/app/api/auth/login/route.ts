import { NextRequest, NextResponse } from "next/server";
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

    const { email } = body;

    if (!email) {
        return NextResponse.json(
            { success: false, message: "Email is required" },
            { status: 400 }
        );
    }

    try {
        await connectToDatabase();

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                emailVerified: user.emailVerified,
                authProvider: user.authProvider,
                profileCompleted: user.profileCompleted,
            },
        });
    } catch (err: unknown) {
        console.error(err instanceof Error ? err.message : 'Google registration failed');

        return NextResponse.json(
            { success: false, message: "Login check failed" },
            { status: 500 }
        );
    }
}
