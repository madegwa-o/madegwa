// lib/crypto.ts
import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12   // recommended for GCM
const KEY_LENGTH = 32  // 256 bits

let cachedKey: Buffer | null = null

function getKey(): Buffer {
    if (cachedKey) return cachedKey

    const raw = process.env.ENCRYPTION_KEY
    if (!raw) {
        throw new Error("ENCRYPTION_KEY environment variable is not set")
    }

    const key = Buffer.from(raw, "hex")
    if (key.length !== KEY_LENGTH) {
        throw new Error(
            `ENCRYPTION_KEY must be a ${KEY_LENGTH * 2}-character hex string (${KEY_LENGTH} bytes), got ${key.length} bytes`
        )
    }

    cachedKey = key
    return key
}

/**
 * Encrypts a plaintext string. Returns a single string in the form:
 *   iv:authTag:ciphertext   (all hex-encoded)
 */
export function encrypt(plaintext: string): string {
    const key = getKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ])
    const authTag = cipher.getAuthTag()

    return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":")
}

/**
 * Decrypts a string produced by encrypt(). Throws if the payload was
 * tampered with, truncated, or encrypted with a different key.
 */
export function decrypt(payload: string): string {
    const key = getKey()
    const parts = payload.split(":")

    if (parts.length !== 3) {
        throw new Error("Invalid encrypted payload format")
    }

    const [ivHex, authTagHex, dataHex] = parts
    const iv = Buffer.from(ivHex, "hex")
    const authTag = Buffer.from(authTagHex, "hex")
    const data = Buffer.from(dataHex, "hex")

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
    return decrypted.toString("utf8")
}

/**
 * Generates a fresh key suitable for ENCRYPTION_KEY. Run this once
 * (e.g. `node -e "require('./lib/crypto').generateKey()"`) and store
 * the output in your secrets manager / .env — never commit it.
 */
export function generateKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString("hex")
}