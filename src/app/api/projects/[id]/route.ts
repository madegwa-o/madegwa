import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { connectToDatabase } from "@/lib/db"
import { Project } from "@/models/project"
import { canRead, canWrite, getProjectRole, isAdmin } from "@/lib/project-permissions"

async function access(id: string, request: Request) {
  const token = await getToken({ req: request as never, secret: process.env.NEXTAUTH_SECRET })
  await connectToDatabase()
  const project = await Project.findById(id)
  if (!project) return { token, project: null, role: null }
  const role = getProjectRole(project, token?.id as string | undefined)
  return { token, project, role }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { project, role } = await access(id, request)
  if (!project || !canRead(role)) return NextResponse.json({ error: "Project not found" }, { status: 404 })
  return NextResponse.json({ id: project._id.toString(), name: project.name, visibility: project.visibility, ownerEmail: project.ownerEmail, createdAt: project.createdAt, updatedAt: project.updatedAt, role, keys: project.keys, members: role === "public" ? [] : project.members })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { project, role } = await access(id, request)
  if (!project || !isAdmin(role)) return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  const body = await request.json()
  if (typeof body.name === "string" && body.name.trim()) project.name = body.name.trim()
  if (body.visibility === "public" || body.visibility === "private") project.visibility = body.visibility
  await project.save()
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { project, role } = await access(id, request)
  if (!project || !isAdmin(role)) return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  await project.deleteOne()
  return NextResponse.json({ ok: true })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { project, role } = await access(id, request)
  if (!project || !canWrite(role)) return NextResponse.json({ error: "Write access required" }, { status: 403 })
  const body = await request.json()
  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name || typeof body.value !== "string") return NextResponse.json({ error: "Key name and value are required" }, { status: 400 })
  const existing = project.keys.find((key) => key.name === name)
  if (existing) { existing.value = body.value; existing.updatedAt = new Date() } else project.keys.push({ name, value: body.value, createdAt: new Date(), updatedAt: new Date() })
  await project.save()
  return NextResponse.json({ ok: true })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { project, role } = await access(id, request)
  if (!project || !isAdmin(role)) return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  const body = await request.json()
  if (!body.email || typeof body.email !== "string") return NextResponse.json({ error: "Collaborator email is required" }, { status: 400 })
  const email = body.email.trim().toLowerCase()
  const member = project.members.find((item) => item.email === email)
  if (member) member.role = body.role === "write" ? "write" : "read"
  else project.members.push({ userId: body.userId || email, email, name: body.name || "", role: body.role === "write" ? "write" : "read", createdAt: new Date() })
  await project.save()
  return NextResponse.json({ ok: true })
}

