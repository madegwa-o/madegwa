import { Schema, model, models, Types, Document } from "mongoose"
import crypto from "crypto"
import { encryptSecret, type EncryptedPayload } from "@/lib/encryption"

export interface IApiKey extends Document {
    _id: Types.ObjectId
    ownerId: Types.ObjectId
    name: string
    prefix: string
    hashedKey: string // for fast, one-way lookup during request auth — never reversed
    encrypted: EncryptedPayload // for reveal by authorized project members — reversible
    lastUsedAt?: Date | null
    expiresAt?: Date | null
    revoked: boolean
    revokedAt?: Date | null
    createdAt: Date
    updatedAt: Date
}

const EncryptedPayloadSchema = new Schema<EncryptedPayload>(
    {
        iv: { type: String, required: true },
        ciphertext: { type: String, required: true },
        authTag: { type: String, required: true },
    },
    { _id: false }
)

// NOTE: hashedKey and encrypted serve different, deliberately non-overlapping
// purposes — see /docs/DESIGN_DECISIONS.md #4:
//   - hashedKey: SHA-256, used ONLY to authenticate incoming API requests via
//     exact-match lookup. Cannot be reversed even with full DB + code access.
//   - encrypted: AES-256-GCM, used ONLY to let an authorized project member
//     reveal the raw value in the UI. Reversible — decryption requires the
//     app's master key (env var), not just DB access.
const ApiKeySchema = new Schema<IApiKey>(
    {
        ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        name: { type: String, required: true, trim: true, maxlength: 80 },
        prefix: { type: String, required: true },
        hashedKey: { type: String, required: true, unique: true, select: false },
        encrypted: { type: EncryptedPayloadSchema, required: true, select: false },
        lastUsedAt: { type: Date, default: null },
        expiresAt: { type: Date, default: null },
        revoked: { type: Boolean, default: false, index: true },
        revokedAt: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false }
)

ApiKeySchema.index({ ownerId: 1, name: 1 }, { unique: true })
ApiKeySchema.index({ ownerId: 1, createdAt: -1 })
// NOTE: no separate .index({ hashedKey: 1 }) — `unique: true` above already creates it.

export function generateApiKey() {
    const raw = crypto.randomBytes(32).toString("hex")
    const prefix = raw.slice(0, 8)
    const hashedKey = crypto.createHash("sha256").update(raw).digest("hex")
    const encrypted = encryptSecret(raw)
    return { raw, prefix, hashedKey, encrypted }
}

export const ApiKey = models.ApiKey || model<IApiKey>("ApiKey", ApiKeySchema)