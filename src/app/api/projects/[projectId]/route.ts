// app/api/projects/[projectId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { connectToDatabase } from "@/lib/db"
import { Project } from "@/models"
import { authorizeProject } from "@/lib/services/authorizeProject"

export async function GET(
    _req: NextRequest,
    { params }: { params: { projectId: string } }
) {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectToDatabase()

    try {
        const project = await authorizeProject(params.projectId, user.id, "read", "-keys.value")
        return NextResponse.json({ project })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: err.status ?? 500 })
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { projectId: string } }
) {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectToDatabase()

    try {
        const project = await authorizeProject(params.projectId, user.id, "write")
        const body = await req.json()

        if (typeof body.name === "string") project.name = body.name
        if (body.visibility === "PUBLIC" || body.visibility === "PRIVATE") {
            project.visibility = body.visibility
        }

        await project.save()
        return NextResponse.json({ project })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: err.status ?? 500 })
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: { projectId: string } }
) {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectToDatabase()

    const project = await Project.findById(params.projectId)
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    // Only the owner can delete the whole project
    if (project.ownerId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await project.deleteOne()
    return NextResponse.json({ success: true })
}