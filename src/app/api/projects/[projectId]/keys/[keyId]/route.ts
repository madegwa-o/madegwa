// app/api/projects/[projectId]/keys/[keyId]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { connectToDatabase } from "@/lib/db"
import { authorizeProject } from "@/lib/services/authorizeProject"
import { encrypt, decrypt } from "@/lib/crypto"

export async function GET(
    _req: NextRequest,
    { params }: { params: { projectId: string; keyId: string } }
) {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectToDatabase()

    try {
        const project = await authorizeProject(params.projectId, user.id, "read", "+keys.value")
        const key = project.keys.id(params.keyId)
        if (!key) return NextResponse.json({ error: "Key not found" }, { status: 404 })

        return NextResponse.json({
            id: key._id,
            name: key.name,
            value: decrypt(key.value),
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: err.status ?? 500 })
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { projectId: string; keyId: string } }
) {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectToDatabase()

    try {
        const project = await authorizeProject(params.projectId, user.id, "write", "+keys.value")
        const key = project.keys.id(params.keyId)
        if (!key) return NextResponse.json({ error: "Key not found" }, { status: 404 })

        const { name, value } = await req.json()

        if (typeof name === "string" && name.trim()) key.name = name
        if (typeof value === "string" && value.trim()) {
            key.value = encrypt(value)
            key.updatedAt = new Date()
        }

        await project.save()
        return NextResponse.json({ id: key._id, name: key.name, updatedAt: key.updatedAt })
    } catch (err: any) {
        if (/Duplicate key/.test(err.message)) {
            return NextResponse.json({ error: err.message }, { status: 400 })
        }
        return NextResponse.json({ error: err.message }, { status: err.status ?? 500 })
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: { projectId: string; keyId: string } }
) {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectToDatabase()

    try {
        const project = await authorizeProject(params.projectId, user.id, "write")
        const key = project.keys.id(params.keyId)
        if (!key) return NextResponse.json({ error: "Key not found" }, { status: 404 })

        key.deleteOne()
        await project.save()

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: err.status ?? 500 })
    }
}