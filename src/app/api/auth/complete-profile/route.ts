import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { User } from "@/models";
import { connectToDatabase } from "@/lib/db";

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { success: false, message: "Invalid JSON body" },
                { status: 400 }
            );
        }

        const { username, phone, image, password } = body;

        if (!username) {
            return NextResponse.json(
                { success: false, message: "Username is required" },
                { status: 400 }
            );
        }

        // Validate password if provided
        if (password) {
            if (password.length < 6) {
                return NextResponse.json(
                    { success: false, message: "Password must be at least 6 characters" },
                    { status: 400 }
                );
            }
        }

        await connectToDatabase();

        // Find user by session ID
        const user = await User.findById(session.user.id);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Check if username already exists (excluding current user)
        const existingUsername = await User.findOne({
            username: username.toLowerCase(),
            _id: { $ne: user._id },
        });

        if (existingUsername) {
            return NextResponse.json(
                { success: false, message: "Username already taken" },
                { status: 409 }
            );
        }

        // Update user profile
        user.username = username.toLowerCase();
        if (phone) user.phone = phone;
        if (image) user.image = image;
        if (password) {
            user.password = password;
        }
        user.profileCompleted = true;

        await user.save();

        return NextResponse.json({
            success: true,
            message: "Profile completed successfully",
            user: {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                username: user.username,
                phone: user.phone,
                image: user.image,
            },
        });
    } catch (err: unknown) {
        console.error(err instanceof Error ? err.message : 'Google registration failed');
        return NextResponse.json(
            { success: false, message: "Failed to complete profile" },
            { status: 500 }
        );
    }
}
