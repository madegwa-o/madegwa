// lib/email.ts
import nodemailer from "nodemailer";

// Verify SMTP configuration on startup
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

console.log("[SMTP Config Check]", {
    host: SMTP_HOST ? "✓" : "✗ MISSING",
    port: SMTP_PORT,
    user: SMTP_USER ? "✓" : "✗ MISSING",
    pass: SMTP_PASS ? "✓" : "✗ MISSING",
});

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

export interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export interface BulkEmailOptions {
    recipients: string[];
    subject: string;
    text?: string;
    html?: string;
}

export async function sendEmail(options: EmailOptions) {
    console.log("[Email] Attempting to send email", {
        to: options.to,
        subject: options.subject,
        timestamp: new Date().toISOString(),
    });

    try {
        const info = await transporter.sendMail({
            from: `"Coseke Intelligence" <${SMTP_USER}>`,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html || options.text,
        });

        console.log("[Email] ✓ Email sent successfully", {
            to: options.to,
            messageId: info.messageId,
            timestamp: new Date().toISOString(),
        });

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("[Email] ✗ Failed to send email", {
            to: options.to,
            subject: options.subject,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
        });
        return { success: false, error };
    }
}

export async function sendBulkEmails(options: BulkEmailOptions) {
    console.log("[Email] Attempting bulk email send", {
        recipientCount: options.recipients.length,
        subject: options.subject,
        timestamp: new Date().toISOString(),
    });

    const results = await Promise.allSettled(
        options.recipients.map((recipient) =>
            sendEmail({
                to: recipient,
                subject: options.subject,
                text: options.text,
                html: options.html,
            })
        )
    );

    const successful = results.filter((r) => r.status === "fulfilled" && (r.value as any).success).length;
    const failed = results.filter((r) => r.status === "rejected" || (r.value as any).error).length;

    console.log("[Email] ✓ Bulk email send complete", {
        total: options.recipients.length,
        successful,
        failed,
        timestamp: new Date().toISOString(),
    });

    return {
        successful,
        failed,
        total: options.recipients.length,
    };
}
