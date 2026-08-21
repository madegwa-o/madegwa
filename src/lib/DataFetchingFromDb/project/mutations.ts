// lib/DataFetchingFromDb/project/mutations.ts
import { connectToDatabase } from "@/lib/db";
import { Project, ProjectVisibility } from "@/models/project";

interface CreateProjectArgs {
    ownerId: string;
    ownerEmail: string;
    name: string;
    visibility?: ProjectVisibility;
}

export async function createProject({ ownerId, ownerEmail, name, visibility = ProjectVisibility.PRIVATE }: CreateProjectArgs) {
    await connectToDatabase();

    const trimmed = name.trim();
    if (trimmed.length === 0) {
        throw new Error("Project name is required");
    }
    if (trimmed.length > 80) {
        throw new Error("Project name cannot exceed 80 characters");
    }

    const project = await Project.create({
        name: trimmed,
        ownerId,
        ownerEmail: ownerEmail.toLowerCase(),
        visibility,
    });

    return project.toObject();
}
