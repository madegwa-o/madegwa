import { connectToDatabase } from "./db"
import { ApiKey, AccessLevel, generateApiKey, type IApiKey } from "@/models/apikey"
import { Project } from "@/models/project"

// Shape returned to the client — never includes hashedKey (it's select:false
// anyway, but we also strip it explicitly in case a caller forgets .select()).
export interface ApiKeySummary {
    _id: string
    projectId: string
    projectName?: string
    name: string
    prefix: string
    scopes: string[]
    lastUsedAt: Date | null
    expiresAt: Date | null
    revoked: boolean
    createdAt: Date
}

function toSummary(doc: any): ApiKeySummary {
    return {
        _id: doc._id.toString(),
        projectId: doc.projectId?._id ? doc.projectId._id.toString() : doc.projectId.toString(),
        projectName: doc.projectId?.name,
        name: doc.name,
        prefix: doc.prefix,
        scopes: doc.scopes,
        lastUsedAt: doc.lastUsedAt ?? null,
        expiresAt: doc.expiresAt ?? null,
        revoked: doc.revoked,
        createdAt: doc.createdAt,
    }
}

// 🔑 All keys owned by a given user, across all their projects.
export async function getApiKeysForUser(userId: string): Promise<ApiKeySummary[]> {
    await connectToDatabase()
    const keys = await ApiKey.find({ ownerId: userId })
        .populate("projectId", "name")
        .sort({ createdAt: -1 })
        .lean()
    return keys.map(toSummary)
}

// 🔑 Keys scoped to one project (only ones the user owns, for a project-detail view).
export async function getApiKeysForProject(projectId: string, userId: string): Promise<ApiKeySummary[]> {
    await connectToDatabase()
    const keys = await ApiKey.find({ projectId, ownerId: userId }).sort({ createdAt: -1 }).lean()
    return keys.map(toSummary)
}

export async function getApiKeyById(id: string, userId: string): Promise<IApiKey | null> {
    await connectToDatabase()
    return ApiKey.findOne({ _id: id, ownerId: userId })
}

interface CreateApiKeyInput {
    projectId: string
    userId: string
    name: string
    scopes?: AccessLevel[]
    expiresAt?: Date | null
}

// The only place the raw (unhashed) key ever exists — returned once, never stored.
export interface CreatedApiKey extends ApiKeySummary {
    rawKey: string
}

export async function createApiKey(input: CreateApiKeyInput): Promise<CreatedApiKey> {
    await connectToDatabase()

    const project = await Project.findById(input.projectId)
    if (!project) {
        throw new Error("Project not found")
    }

    const isOwner = project.ownerId.toString() === input.userId
    const isWriteMember = project.members.some(
        (m: any) => m.userId?.toString() === input.userId && m.role === "WRITE"
    )
    if (!isOwner && !isWriteMember) {
        throw new Error("You do not have permission to create keys in this project")
    }

    const { raw, prefix, hashedKey } = generateApiKey()

    const doc = await ApiKey.create({
        projectId: input.projectId,
        ownerId: input.userId,
        name: input.name.trim(),
        prefix,
        hashedKey,
        scopes: input.scopes?.length ? input.scopes : [AccessLevel.READ],
        expiresAt: input.expiresAt ?? null,
    })

    await Project.updateOne({ _id: input.projectId }, { $inc: { keyCount: 1 } })

    return { ...toSummary(doc), rawKey: raw }
}