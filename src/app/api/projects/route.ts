import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { connectToDatabase } from "@/lib/db"
import { Project } from "@/models/project"

export async function GET(request: Request) {
  const token = await getToken({ req: request as Request, secret: process.env.NEXTAUTH_SECRET })
  const userId = token?.id as string | undefined
  await connectToDatabase()
  const query = userId ? { $or: [{ ownerId: userId }, { "members.userId": userId }, { visibility: "public" }] } : { visibility: "public" }
  const projects = await Project.find(query).sort({ createdAt: -1 }).lean()
  return NextResponse.json(projects.map((project) => ({ ...project, role: project.ownerId === userId ? "admin" : project.members?.find((m: { userId: string }) => m.userId === userId)?.role ?? "public", keyCount: project.keys?.length ?? 0, keys: undefined })))
}

export async function POST(request: Request) {
  const token = await getToken({ req: request as Request, secret: process.env.NEXTAUTH_SECRET })
  const userId = token?.id as string | undefined
  const userEmail = token?.email as string | undefined
  if (!userId || !userEmail) return NextResponse.json({ error: "Sign in required" }, { status: 401 })
  const body = await request.json()
  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) return NextResponse.json({ error: "Project name is required" }, { status: 400 })
  await connectToDatabase()
  const project = await Project.create({ name, ownerId: userId, ownerEmail: userEmail, visibility: body.visibility === "public" ? "public" : "private" })
  return NextResponse.json({ id: project._id.toString() }, { status: 201 })
}
