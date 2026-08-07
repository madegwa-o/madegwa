import NextAuth, {DefaultSession, NextAuthOptions, Session} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { User } from "@/models";
import { connectToDatabase } from "@/lib/db";
import type { JWT } from "next-auth/jwt";

import crypto from "crypto";



// Extend NextAuth types to include roles
declare module "next-auth" {
    interface Session {
        user: {
            id?: string | null
            roles?: string[]
            profileCompleted?: boolean
        } & DefaultSession["user"]
    }
    interface User {
        id: string
        roles?: string[]
        profileCompleted?: boolean
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        userId?: string
        roles?: string[]
        profileCompleted?: boolean
    }
}

// Generates a random, guaranteed-unique username for OAuth signups
async function generateUniqueUsername(): Promise<string> {
    const MAX_ATTEMPTS = 5;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        // e.g. "user_9f2a7c1b3e" - random hex, unlikely to collide, no PII
        const candidate = `user_${crypto.randomBytes(6).toString("hex")}`;

        const existing = await User.findOne({ username: candidate });
        if (!existing) {
            return candidate;
        }
    }

    // Extremely unlikely fallback: timestamp + random suffix guarantees uniqueness
    return `user_${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
}


const handler = NextAuth({
    providers: [
        // Email/Password Provider
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                identifier: { label: "Email or Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.identifier || !credentials?.password) {
                    throw new Error("Email/username and password are required");
                }

                try {
                    await connectToDatabase();

                    // Find user by email or username
                    const user = await User.findOne({
                        $or: [
                            { email: credentials.identifier.toLowerCase() },
                            { username: credentials.identifier.toLowerCase() }
                        ]
                    }).select("+password");

                    if (!user) {
                        throw new Error("Invalid email, username, or password");
                    }

                    // Check if email is verified
                    if (!user.emailVerified) {
                        throw new Error("Please verify your email before logging in");
                    }

                    // Compare password
                    const isPasswordValid = await user.comparePassword(credentials.password);
                    if (!isPasswordValid) {
                        throw new Error("Invalid email, username, or password");
                    }

                    // Update last login
                    user.lastLogin = new Date();
                    await user.save();

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        image: user.image,
                        profileCompleted: user.profileCompleted ?? false,
                    };
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : "Authentication failed";
                    throw new Error(message);
                }
            },
        }),

        // Google Provider
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
        }),
    ],

    callbacks: {
        // Handle JWT token creation/update
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.roles = user.roles;
                token.profileCompleted = user.profileCompleted;
            }

            if (account?.provider === "google" && user) {
                try {
                    await connectToDatabase();
                    let dbUser = await User.findOne({ email: user.email });

                    if (!dbUser) {
                        const username = await generateUniqueUsername();
                        dbUser = await User.create({
                            googleId: user.id,
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            username: username,
                            authProvider: "google",
                            emailVerified: true,
                            profileCompleted: false,
                        });
                    } else if (!dbUser.googleId) {
                        dbUser.googleId = user.id;
                        dbUser.authProvider = "google";
                        dbUser.image = user.image || dbUser.image;
                        await dbUser.save();
                    }

                    token.id = dbUser._id.toString();
                    token.roles = dbUser.roles;
                    token.profileCompleted = dbUser.profileCompleted;
                } catch (error) {
                    console.error("Google OAuth callback error:", error);
                }
            }

            return token;
        },

        // Update session with token data
        async session({ session, token }: { session: Session; token: JWT }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.roles = token.roles as string[];
                session.user.profileCompleted = token.profileCompleted as boolean;
            }
            return session;
        },

        // Handle sign-in event
        async signIn({ user, account }) {
            try {
                await connectToDatabase();

                if (account?.provider === "credentials") {
                    // Credentials provider: already verified in authorize callback
                    return true;
                }

                if (account?.provider === "google") {
                    // Google provider: always allow (user created/updated in JWT callback)
                    return true;
                }

                return false;
            } catch (error) {
                console.error("SignIn callback error:", error);
                return false;
            }
        },
    },

    pages: {
        signIn: "/auth/login",
        error: "/auth/error",
    },

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    jwt: {
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    secret: process.env.NEXTAUTH_SECRET,

    debug: process.env.NODE_ENV === "development",
});


export { handler as GET, handler as POST };
