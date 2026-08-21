// app/api/user/ping/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models";

export async function POST(req: NextRequest) {
  console.log('ping called')
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token?.id) {
            return NextResponse.json({ ok: false }, { status: 401 });
        }

        await connectToDatabase();
        // Fire-and-forget style update — no need to await the full document back
        await User.updateOne({ _id: token.id }, { $set: { lastSeen: new Date() } });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Last-seen ping error:", error);
        // Never surface this as a hard failure to the client
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
