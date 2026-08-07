// app/api/notifications/email/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getUserByEmail } from "@/lib/users";
import { Role } from "@/models/user";
import { sendEmail, sendBulkEmails } from "@/lib/emails";

// Helper function to check if user is admin
async function isAdmin(): Promise<boolean> {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) return false;

        const user = await getUserByEmail(session.user.email);
        if (!user) return false;

        return user.roles?.includes(Role.ADMIN) ?? false;
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

export async function POST(req: NextRequest) {
    console.log("[Email Send API] Request received at", new Date().toISOString());

    try {
        // Check admin authorization
        console.log("[Email Send API] Checking admin authorization");
        if (!(await isAdmin())) {
            console.error("[Email Send API] ✗ Unauthorized - user is not admin");
            return NextResponse.json(
                { error: "Unauthorized. Admin access required." },
                { status: 403 }
            );
        }
        console.log("[Email Send API] ✓ User is admin");

        const body = await req.json();
        const { recipients, subject, text, html } = body;

        console.log("[Email Send API] Request payload", {
            recipientCount: Array.isArray(recipients) ? recipients.length : 1,
            subject: subject ? "provided" : "missing",
            hasText: !!text,
            hasHtml: !!html,
        });

        // Validation
        if (!recipients || (Array.isArray(recipients) && recipients.length === 0)) {
            console.error("[Email Send API] ✗ No recipients provided");
            return NextResponse.json(
                { error: "At least one recipient is required" },
                { status: 400 }
            );
        }

        if (!subject || !subject.trim()) {
            console.error("[Email Send API] ✗ Subject is empty");
            return NextResponse.json(
                { error: "Subject is required" },
                { status: 400 }
            );
        }

        if (!text && !html) {
            console.error("[Email Send API] ✗ No email body provided");
            return NextResponse.json(
                { error: "Email body (text or html) is required" },
                { status: 400 }
            );
        }

        // Handle single or bulk emails
        if (Array.isArray(recipients)) {
            // Bulk email
            console.log("[Email Send API] Sending bulk emails to", recipients.length, "recipients");
            const result = await sendBulkEmails({
                recipients,
                subject,
                text,
                html,
            });

            console.log("[Email Send API] ✓ Bulk send complete", {
                total: result.total,
                successful: result.successful,
                failed: result.failed,
            });

            return NextResponse.json({
                message: "Bulk emails sent",
                sent: result.successful,
                failed: result.failed,
                total: result.total,
            });
        } else {
            // Single email
            console.log("[Email Send API] Sending single email to", recipients);
            const result = await sendEmail({
                to: recipients,
                subject,
                text,
                html,
            });

            if (!result.error) {
                console.log("[Email Send API] ✓ Single email sent", {
                    to: recipients,
                    messageId: result.messageId,
                });
                return NextResponse.json({
                    message: "Email sent successfully",
                    messageId: result.messageId,
                });
            } else {
                console.error("[Email Send API] ✗ Failed to send single email", {
                    to: recipients,
                    error: result.error,
                });
                return NextResponse.json(
                    { error: "Failed to send email", details: result.error },
                    { status: 500 }
                );
            }
        }
    } catch (error) {
        console.error("[Email Send API] ✗ Exception occurred:", {
            message: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
        });
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
