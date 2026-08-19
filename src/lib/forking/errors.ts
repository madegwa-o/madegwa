/** Thrown for any "this fork isn't allowed" case — not-found, not-PUBLIC, no WRITE on target, etc. */
export class ForkNotAllowedError extends Error {}