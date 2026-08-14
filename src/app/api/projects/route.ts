// app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { connectToDatabase } from "@/lib/db"
import { Project } from "@/models"

export async function GET() {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectToDatabase()

    const projects = await Project.find({
        $or: [{ ownerId: user.id }, { "members.userId": user.id }],
    })
        .select("-keys.value")
        .sort({ createdAt: -1 })

    return NextResponse.json({ projects })
}

export async function POST(req: NextRequest) {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { name, visibility } = body

    if (!name || typeof name !== "string") {
        return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    await connectToDatabase()

    const project = await Project.create({
        name,
        ownerId: user.id,
        ownerEmail: user.email,
        visibility: visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE",
    })

    return NextResponse.json({ project }, { status: 201 })
}