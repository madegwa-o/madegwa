// app/api/projects/[projectId]/members/[memberId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { connectToDatabase } from "@/lib/db"
import { Project } from "@/models"

export async function PATCH(
    req: NextRequest,
    { params }: { params: { projectId: string; memberId: string } }
) {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectToDatabase()

    const project = await Project.findById(params.projectId)
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    if (project.ownerId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const member = project.members.find((m) => m.userId === params.memberId)
    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

    const { role } = await req.json()
    if (role !== "read" && role !== "write") {
        return NextResponse.json({ error: "role must be 'read' or 'write'" }, { status: 400 })
    }

    member.role = role
    await project.save()

    return NextResponse.json({ member })
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: { projectId: string; memberId: string } }
) {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectToDatabase()

    const project = await Project.findById(params.projectId)
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    // Owner can remove anyone; a member can remove themselves
    const isOwner = project.ownerId === user.id
    const isSelf = params.memberId === user.id

    if (!isOwner && !isSelf) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    project.members = project.members.filter((m) => m.userId !== params.memberId)
    await project.save()

    return NextResponse.json({ success: true })
}