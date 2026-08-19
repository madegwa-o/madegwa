import crypto from "crypto"

// AES-256-GCM. The master key must be a 32-byte value, base64 or hex encoded,
// held in an env var — NEVER committed, NEVER logged. In production this
// should ideally come from a KMS (AWS KMS / GCP KMS / Vault) rather than a
// raw env var, but env var is a reasonable starting point for now.
//
// Anyone who has both a DB dump AND this key can decrypt every stored API
// key. Treat this value with the same care as the keys it protects.
const MASTER_KEY = process.env.API_KEY_ENCRYPTION_SECRET

if (!MASTER_KEY) {
    throw new Error("API_KEY_ENCRYPTION_SECRET is not set in environment variables")
}

const key = Buffer.from(MASTER_KEY, "base64")
if (key.length !== 32) {
    throw new Error("API_KEY_ENCRYPTION_SECRET must decode to exactly 32 bytes (AES-256)")
}

export interface EncryptedPayload {
    iv: string // hex
    ciphertext: string // hex
    authTag: string // hex
}

export function encryptSecret(plaintext: string): EncryptedPayload {
    const iv = crypto.randomBytes(12) // 96-bit IV, standard for GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
    const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
    const authTag = cipher.getAuthTag()

    return {
        iv: iv.toString("hex"),
        ciphertext: ciphertext.toString("hex"),
        authTag: authTag.toString("hex"),
    }
}

export function decryptSecret(payload: EncryptedPayload): string {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(payload.iv, "hex"))
    decipher.setAuthTag(Buffer.from(payload.authTag, "hex"))
    const plaintext = Buffer.concat([
        decipher.update(Buffer.from(payload.ciphertext, "hex")),
        decipher.final(), // throws if authTag doesn't match — tamper/corruption detection
    ])
    return plaintext.toString("utf8")
}