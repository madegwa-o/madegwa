import type { ClientSession } from "mongoose";
import { ApiKey } from "@/models/apikey";

/**
 * `ApiKey` enforces a unique {ownerId, name} index. A forking user may
 * already own a key called "Stripe Prod" from some other project, so a
 * straight name copy can collide — append " (2)", " (3)"... until free.
 */
export async function uniqueKeyNameForOwner(ownerId: string, desiredName: string, session: ClientSession) {
    let candidate = desiredName;
    let n = 2;
    while (await ApiKey.exists({ ownerId, name: candidate }).session(session)) {
        candidate = `${desiredName} (${n})`;
        n++;
    }
    return candidate;
}