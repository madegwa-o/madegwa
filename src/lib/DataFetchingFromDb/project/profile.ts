import { connectToDatabase } from "@/lib/db";
import { Project } from "@/models/project";

const SELECTABLE_FIELDS = [
    "_id",
    "name",
    "ownerId",
    "ownerEmail",
    "visibility",
    "members",
    "keyCount",
    "forkedFrom",
    "forkCount",
    "createdAt",
    "updatedAt",
] as const;

export type ProjectField = (typeof SELECTABLE_FIELDS)[number];

function buildProjection(fields?: readonly ProjectField[]): string {
    if (!fields || fields.length === 0) return SELECTABLE_FIELDS.join(" ");
    const safe = fields.filter((f) => (SELECTABLE_FIELDS as readonly string[]).includes(f));
    return safe.length ? safe.join(" ") : "_id";
}

interface SearchArgs {
    filter?: Record<string, unknown>;
    fields?: ProjectField[];
    limit?: number;
}

export async function getProjects({ filter = {}, fields, limit = 100 }: SearchArgs) {
    await connectToDatabase();
    return Project.find(filter).select(buildProjection(fields)).limit(limit).lean();
}

export async function getProjectById(id: string, fields?: ProjectField[]) {
    await connectToDatabase();
    return Project.findById(id).select(buildProjection(fields)).lean();
}