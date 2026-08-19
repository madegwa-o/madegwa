import { NextResponse } from "next/server";

export const ok = (data: unknown, init?: number) => NextResponse.json(data, { status: init ?? 200 });
export const badRequest = (message: string) => NextResponse.json({ error: message }, { status: 400 });
export const unauthorized = () => NextResponse.json({ error: "Not signed in" }, { status: 401 });
export const forbidden = () => NextResponse.json({ error: "You don't have access to this resource" }, { status: 403 });
export const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

/** `?fields=a,b,c` -> ["a","b","c"], or undefined if the param is absent. */
export function parseFields(req: Request): string[] | undefined {
    const raw = new URL(req.url).searchParams.get("fields");
    if (!raw) return undefined;
    return raw
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean);
}