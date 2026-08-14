// app/api/projects/[projectId]/keys/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { connectToDatabase } from "@/lib/db"
import { authorizeProject } from "@/lib/services/authorizeProject"
import { encrypt } from "@/lib/crypto"

export async function GET(
    _req: NextRequest,
    { params }: { params: { projectId: string } }
) {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectToDatabase()

    try {
        // never select values here — this is a listing endpoint
        const project = await authorizeProject(params.projectId, user.id, "read", "keys")
        const keys = project.keys.map((k) => ({
            id: k._id,
            name: k.name,
            createdAt: k.createdAt,
            updatedAt: k.updatedAt,
        }))
        return NextResponse.json({ keys })
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

    try {
        const project = await authorizeProject(params.projectId, user.id, "write")
        const { name, value } = await req.json()

        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "name is required" }, { status: 400 })
        }
        if (!value || typeof value !== "string") {
            return NextResponse.json({ error: "value is required" }, { status: 400 })
        }

        project.keys.push({ name, value: encrypt(value) })
        await project.save()

        const created = project.keys[project.keys.length - 1]
        return NextResponse.json(
            { key: { id: created._id, name: created.name, createdAt: created.createdAt } },
            { status: 201 }
        )
    } catch (err: any) {
        if (err.name === "ValidationError" || /Duplicate key/.test(err.message)) {
            return NextResponse.json({ error: err.message }, { status: 400 })
        }
        return NextResponse.json({ error: err.message }, { status: err.status ?? 500 })
    }
}