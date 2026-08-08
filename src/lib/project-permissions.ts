import type { ProjectDocument } from "@/models/project"

export type ProjectRole = "admin" | "write" | "read" | "public" | null

export function getProjectRole(project: ProjectDocument, userId?: string | null): ProjectRole {
  if (!userId) return project.visibility === "public" ? "public" : null
  if (project.ownerId === userId) return "admin"
  return project.members.find((member) => member.userId === userId)?.role ?? (project.visibility === "public" ? "public" : null)
}

export function canRead(role: ProjectRole) { return role !== null }
export function canWrite(role: ProjectRole) { return role === "admin" || role === "write" }
export function isAdmin(role: ProjectRole) { return role === "admin" }
