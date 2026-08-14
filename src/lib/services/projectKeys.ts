// lib/services/projectKeys.ts
import { Project } from "@/models"
import { encrypt, decrypt } from "@/lib/crypto"

export async function addKey(projectId: string, name: string, rawValue: string) {
    const project = await Project.findById(projectId)
    if (!project) throw new Error("Project not found")

    project.keys.push({
        name,
        value: encrypt(rawValue),
    })

    await project.save()
}

export async function getDecryptedKey(projectId: string, keyId: string): Promise<string> {
    const project = await Project.findById(projectId).select("+keys.value")
    if (!project) throw new Error("Project not found")

    const key = project.keys.id(keyId)
    if (!key) throw new Error("Key not found")

    return decrypt(key.value)
}

export async function rotateKey(projectId: string, keyId: string, newRawValue: string) {
    const project = await Project.findById(projectId).select("+keys.value")
    if (!project) throw new Error("Project not found")

    const key = project.keys.id(keyId)
    if (!key) throw new Error("Key not found")

    key.value = encrypt(newRawValue)
    key.updatedAt = new Date()

    await project.save()
}