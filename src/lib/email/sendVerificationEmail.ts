import { sendEmail } from '../emails';

export async function sendVerificationEmail(email: string, rawToken: string) {
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    
    console.log("[Verification Email] Preparing to send", {
        email,
        nextAuthUrl: nextAuthUrl ? "✓" : "✗ MISSING",
        timestamp: new Date().toISOString(),
    });

    const verifyUrl = `${nextAuthUrl}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;

    console.log("[Verification Email] URL generated:", {
        url: verifyUrl,
        timestamp: new Date().toISOString(),
    });

    try {
        const result = await sendEmail({
            to: email,
            subject: "Verify your email - Coseke Intelligence",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Verify Your Email</h2>
                    <p>Thank you for signing up! Please verify your email to complete your registration.</p>
                    <p><a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a></p>
                    <p style="color: #666; font-size: 12px;">This link expires in 24 hours.</p>
                </div>
            `,
        });

        if (!result.success) {
            console.error("[Verification Email] ✗ Send failed", {
                email,
                error: result.error,
                timestamp: new Date().toISOString(),
            });
            throw new Error(`Email send failed: ${result.error}`);
        }

        console.log("[Verification Email] ✓ Sent successfully", {
            email,
            messageId: result.messageId,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("[Verification Email] ✗ Exception occurred:", {
            email,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
        });
        throw error;
    }
}
