import { sendEmail } from '../emails';

export async function sendPasswordResetEmail(email: string, rawToken: string) {
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    
    console.log("[Password Reset Email] Preparing to send", {
        email,
        nextAuthUrl: nextAuthUrl ? "✓" : "✗ MISSING",
        timestamp: new Date().toISOString(),
    });

    const resetUrl = `${nextAuthUrl}/auth/reset-password?token=${rawToken}`;

    console.log("[Password Reset Email] URL generated:", {
        url: resetUrl,
        timestamp: new Date().toISOString(),
    });

    try {
        const result = await sendEmail({
            to: email,
            subject: "Reset your password - Coseke Intelligence",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Reset Your Password</h2>
                    <p>We received a request to reset your password. Click the link below to set a new password.</p>
                    <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
                    <p style="color: #666; font-size: 12px;">This link expires in 24 hours.</p>
                    <p style="color: #666; font-size: 12px;">If you didn&apos;t request a password reset, you can ignore this email.</p>
                </div>
            `,
        });

        if (!result.success) {
            console.error("[Password Reset Email] ✗ Send failed", {
                email,
                error: result.error,
                timestamp: new Date().toISOString(),
            });
            throw new Error(`Email send failed: ${result.error}`);
        }

        console.log("[Password Reset Email] ✓ Sent successfully", {
            email,
            messageId: result.messageId,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[Password Reset Email] ✗ Exception occurred:", {
            email,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
        });
        throw error;
    }
}
