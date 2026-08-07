import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getUserByEmail, updateUserProfile } from "@/lib/users" // adjust path to wherever these live

// GET /api/user/profile
// Returns the current user's name and phone for prefilling the account form.
export async function GET() {
    const session = await getServerSession()

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getUserByEmail(session.user.email)

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
        name: user.name ?? "",
        phone: user.phone ?? "",
    })
}

// POST /api/user/profile
// Updates the current user's name and phone.
export async function POST(request: Request) {
    const session = await getServerSession()

    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: { name?: unknown; phone?: unknown }
    try {
        body = await request.json()
    } catch {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    const { name, phone } = body

    if (name !== undefined && typeof name !== "string") {
        return NextResponse.json({ error: "Name must be a string" }, { status: 400 })
    }

    if (phone !== undefined && typeof phone !== "string") {
        return NextResponse.json({ error: "Phone must be a string" }, { status: 400 })
    }

    if (typeof name === "string" && name.trim().length === 0) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
    }

    // Basic phone sanity check — loosen/tighten as needed for your target locales.
    if (typeof phone === "string" && phone.length > 0 && !/^\+?[0-9\s()-]{7,20}$/.test(phone)) {
        return NextResponse.json({ error: "Enter a valid phone number" }, { status: 400 })
    }

    try {
        const updated = await updateUserProfile(session.user.email, {
            ...(typeof name === "string" ? { name: name.trim() } : {}),
            ...(typeof phone === "string" ? { phone } : {}),
        })

        if (!updated) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        return NextResponse.json({
            name: updated.name ?? "",
            phone: updated.phone ?? "",
        })
    } catch (error) {
        // Surface Mongoose schema validation messages (e.g. name length) instead of a generic error.
        if (error instanceof Error && error.name === "ValidationError") {
            const validationError = error as Error & { errors?: Record<string, { message: string }> }
            const firstMessage = validationError.errors
                ? Object.values(validationError.errors)[0]?.message
                : undefined

            return NextResponse.json({ error: firstMessage || error.message }, { status: 400 })
        }

        console.error("Failed to update profile:", error)
        return NextResponse.json({ error: "Failed to save profile" }, { status: 500 })
    }
}