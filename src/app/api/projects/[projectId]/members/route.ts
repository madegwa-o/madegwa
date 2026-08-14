// app/api/projects/[projectId]/members/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { connectToDatabase } from "@/lib/db"
import { Project, User } from "@/models"
import { authorizeProject } from "@/lib/services/authorizeProject"

export async function GET(
    _req: NextRequest,
    { params }: { params: { projectId: string } }
) {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectToDatabase()

    try {
        const project = await authorizeProject(params.projectId, user.id, "read", "members")
        return NextResponse.json({ members: project.members })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: err.status ?? 500 })
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: { projectId: string } }
) {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectToDatabase()

    const project = await Project.findById(params.projectId)
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    // Only the owner can add members
    if (project.ownerId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { email, role } = await req.json()
    if (!email || typeof email !== "string") {
        return NextResponse.json({ error: "email is required" }, { status: 400 })
    }

    const invitee = await User.findOne({ email: email.toLowerCase() })
    if (!invitee) {
        return NextResponse.json({ error: "No user found with that email" }, { status: 404 })
    }

    const alreadyMember = project.members.some((m) => m.userId === invitee._id.toString())
    if (alreadyMember) {
        return NextResponse.json({ error: "User is already a member" }, { status: 400 })
    }

    project.members.push({
        userId: invitee._id.toString(),
        email: invitee.email,
        name: invitee.name ?? "",
        role: role === "write" ? "write" : "read",
    })

    await project.save()
    return NextResponse.json({ members: project.members }, { status: 201 })
}