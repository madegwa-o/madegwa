// lib/services/authorizeProject.ts
import { Project,  } from "@/models"
import type { HydratedDocument } from "mongoose"

enum AccessLevel {
    READ = "READ",
    WRITE = "WRITE",
}


export async function authorizeProject(
    projectId: string,
    userId: string,
    required: AccessLevel,
    selectExtra = ""
): Promise<HydratedDocument<ProjectDocument>> {
    const project = await Project.findById(projectId).select(selectExtra)
    if (!project) {
        throw Object.assign(new Error("Project not found"), { status: 404 })
    }

    if (project.ownerId === userId) {
        return project // owners always have full access
    }

    const member = project.members.find((m) => m.userId === userId)
    if (!member) {
        throw Object.assign(new Error("Forbidden"), { status: 403 })
    }

    if (required === AccessLevel.WRITE && member.role !== AccessLevel.WRITE) {
        throw Object.assign(new Error("Forbidden: write access required"), { status: 403 })
    }

    return project
}